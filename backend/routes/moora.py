from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, NilaiSiswa, Kriteria, BobotKriteria, HasilRekomendasi, Periode, Alumni, Jurusan
from sqlalchemy import func
import math
from datetime import datetime

moora_bp = Blueprint('moora', __name__)


# --- HELPER: HITUNG RANKING (CORE LOGIC) ---
def calculate_ranking(periode_id, tingkat_kelas, user_jurusan_id):
    """
    Logika perhitungan MOORA persis seperti di Laravel MooraController.php
    """
    # 1. Ambil semua Nilai Siswa di periode & kelas ini
    all_nilai = NilaiSiswa.query.filter_by(
        # Note: Di real case, kita mungkin perlu filter by periode_id di tabel NilaiSiswa
        # tapi untuk simplifikasi kita ambil semua nilai siswa yang relevan
    ).all()

    # Agar presisi, kita ambil ID siswa yang unik
    siswa_ids = db.session.query(NilaiSiswa.siswa_id).distinct().all()
    siswa_ids = [s[0] for s in siswa_ids]

    # 2. Siapkan Bobot Final (Gabungan Global & Lokal)
    # A. Bobot Global (Guru BK -> jurusan_id IS NULL)
    bobot_global = BobotKriteria.query.filter(BobotKriteria.jurusan_id.is_(None)).all()
    weights_map = {b.kriteria_id: b.nilai_bobot for b in bobot_global}

    # B. Bobot Lokal (Kaprodi -> sesuai jurusan siswa)
    if user_jurusan_id:
        bobot_lokal = BobotKriteria.query.filter_by(jurusan_id=user_jurusan_id).all()
        for b in bobot_lokal:
            weights_map[b.kriteria_id] = b.nilai_bobot  # Override/Merge

    # C. Normalisasi Ulang (Agar total = 1.0)
    total_bobot = sum(weights_map.values())
    final_weights = {}
    if total_bobot > 0:
        for k_id, val in weights_map.items():
            final_weights[k_id] = val / total_bobot
    else:
        return  # Tidak ada bobot, skip hitung

    # 3. Hitung Pembagi (Divisor) dengan VIRTUAL BASELINE
    divisors = {}
    all_kriteria = Kriteria.query.all()
    kriteria_obj_map = {k.id: k for k in all_kriteria}
    kriteria_kode_map = {k.id: k.kode for k in all_kriteria}

    for k_id in final_weights.keys():
        kriteria = kriteria_obj_map.get(k_id)
        if not kriteria: continue

        # Tentukan Virtual Max/Min
        if kriteria.tipe_input.value == 'number':  # Skala 0-100
            v_max, v_min = 100, 0
        else:  # Skala 1-5
            v_max, v_min = 5, 1

        # Ambil nilai real dari DB
        # Filter nilai hanya untuk kriteria ini
        nilai_real = [n.nilai_input for n in all_nilai if n.kriteria_id == k_id]

        # Rumus: Sum(Real^2) + Max^2 + Min^2
        sum_sq_real = sum([x ** 2 for x in nilai_real])
        sum_sq_virtual = (v_max ** 2) + (v_min ** 2)

        divisors[k_id] = math.sqrt(sum_sq_real + sum_sq_virtual)

    # 4. Loop Hitung Skor per Siswa
    results = []

    for s_id in siswa_ids:
        # Ambil nilai siswa ini
        nilai_siswa_ini = [n for n in all_nilai if n.siswa_id == s_id]
        if not nilai_siswa_ini: continue

        y_studi, y_kerja, y_wirausaha = 0, 0, 0

        for n in nilai_siswa_ini:
            k_id = n.kriteria_id
            if k_id not in final_weights or k_id not in divisors: continue

            kode = kriteria_kode_map.get(k_id, '')
            bobot = final_weights[k_id]
            divisor = divisors[k_id]

            # MOORA Normalisasi
            if divisor == 0:
                normalized_val = 0
            else:
                normalized_val = (n.nilai_input / divisor) * bobot

            # Agregasi ke Keputusan (Hardcoded Logic sesuai PHP)
            if kode in ['C1', 'C2', 'C4', 'C5', 'C6']: y_studi += normalized_val
            if kode in ['C1', 'C3', 'C5', 'C6']: y_kerja += normalized_val
            if kode in ['C1', 'C4', 'C5', 'C7', 'C8']: y_wirausaha += normalized_val

        # Tentukan Terbaik
        scores = {
            'Melanjutkan Studi': y_studi,
            'Bekerja': y_kerja,
            'Berwirausaha': y_wirausaha
        }
        best_decision = max(scores, key=scores.get)

        # Simpan ke DB HasilRekomendasi
        # Cek existing
        hasil = HasilRekomendasi.query.filter_by(
            siswa_id=s_id,
            periode_id=periode_id,
            tingkat_kelas=tingkat_kelas
        ).first()

        if not hasil:
            hasil = HasilRekomendasi(
                siswa_id=s_id, periode_id=periode_id, tingkat_kelas=tingkat_kelas
            )
            db.session.add(hasil)

        hasil.skor_studi = y_studi
        hasil.skor_kerja = y_kerja
        hasil.skor_wirausaha = y_wirausaha
        hasil.keputusan_terbaik = best_decision
        hasil.tanggal_hitung = func.now()

        results.append(hasil)

    db.session.commit()
    return results


# --- ENDPOINT: GET RESULT ---
@moora_bp.route('/result', methods=['GET'])
@jwt_required()
def get_result():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    # 1. Cari Periode Aktif
    periode = Periode.query.filter_by(is_active=True).first()
    if not periode:
        # Fallback ambil hasil terakhir
        hasil = HasilRekomendasi.query.filter_by(siswa_id=user_id).order_by(HasilRekomendasi.id.desc()).first()
    else:
        # Trigger Hitung Ulang (Real-time calculation agar data fresh)
        # Ambil semua nilai siswa (Logic simplified: select * from nilai_siswa)
        # Di production, logic calculate_ranking harus lebih efisien (tidak setiap request)
        calculate_ranking(periode.id, user.kelas_saat_ini.value, user.jurusan_id)

        hasil = HasilRekomendasi.query.filter_by(
            siswa_id=user_id,
            periode_id=periode.id
        ).first()

    if not hasil:
        return jsonify({'msg': 'Belum ada data hasil rekomendasi.'}), 404

    # 2. Cari Alumni Relevan
    alumni_relevan = []
    if user.jurusan and hasil.keputusan_terbaik:
        keyword = ''
        if hasil.keputusan_terbaik == 'Melanjutkan Studi':
            keyword = 'Kuliah'
        elif hasil.keputusan_terbaik == 'Bekerja':
            keyword = 'Kerja'
        elif hasil.keputusan_terbaik == 'Berwirausaha':
            keyword = 'Wirausaha'

        if keyword:
            # Query Alumni: Jurusan mirip & Status mengandung keyword
            alumni_query = Alumni.query.filter(
                Alumni.major.ilike(f'%{user.jurusan.nama_jurusan}%'),
                Alumni.status.ilike(f'%{keyword}%')
            ).limit(10).all()

            for a in alumni_query:
                alumni_relevan.append({
                    'name': a.name,
                    'status': a.status,
                    'batch': a.batch
                })

    return jsonify({
        'hasil': {
            'keputusan': hasil.keputusan_terbaik,
            'skor': {
                'studi': hasil.skor_studi,
                'kerja': hasil.skor_kerja,
                'wirausaha': hasil.skor_wirausaha
            },
            'tanggal': hasil.tanggal_hitung,
            'catatan': hasil.catatan_guru_bk
        },
        'alumni': alumni_relevan,
        'periode': periode.nama_periode if periode else 'History'
    })