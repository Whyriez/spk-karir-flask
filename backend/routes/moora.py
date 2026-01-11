from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, NilaiSiswa, Kriteria, BobotKriteria, HasilRekomendasi, Periode, Alumni, NilaiStaticJurusan
from sqlalchemy import func
import math

moora_bp = Blueprint('moora', __name__)


def ensure_static_values(user_id, periode_id):
    """
    Fungsi ini memastikan jika ada kriteria bertipe 'static_jurusan' (misal C6),
    nilainya otomatis diambil dari tabel NilaiStaticJurusan dan dimasukkan ke NilaiSiswa.
    """
    user = User.query.get(user_id)
    if not user or not user.jurusan_id:
        return

    # Ambil semua kriteria statis
    static_kriterias = Kriteria.query.filter_by(sumber_nilai='static_jurusan').all()

    for k in static_kriterias:
        # Cek apakah sudah ada nilai untuk periode ini
        existing = NilaiSiswa.query.filter_by(
            siswa_id=user_id,
            kriteria_id=k.id,
            periode_id=periode_id
        ).first()

        if not existing:
            # Ambil nilai default dari settingan admin
            setting_nilai = NilaiStaticJurusan.query.filter_by(
                jurusan_id=user.jurusan_id,
                kriteria_id=k.id
            ).first()

            nilai_final = setting_nilai.nilai if setting_nilai else 0

            new_nilai = NilaiSiswa(
                siswa_id=user_id,
                kriteria_id=k.id,
                periode_id=periode_id,
                nilai_input=nilai_final
            )
            db.session.add(new_nilai)

    db.session.commit()


def calculate_ranking(periode_id, user_id=None):
    """
    Core Logic MOORA:
    1. Gabung Bobot (BK + Kaprodi)
    2. Normalisasi Vector (Sqrt sum squares)
    3. Hitung Skor (Benefit - Cost)
    """

    # Jika user_id spesifik, pastikan nilai statisnya ada dulu
    if user_id:
        ensure_static_values(user_id, periode_id)

    # 1. Ambil Data Nilai Siswa pada Periode Ini
    query = NilaiSiswa.query.filter_by(periode_id=periode_id)
    if user_id:
        query = query.filter_by(siswa_id=user_id)

    all_nilai = query.all()
    if not all_nilai: return []

    # Mapping Siswa ID yang terlibat
    siswa_ids = list(set([n.siswa_id for n in all_nilai]))

    # 2. Persiapan Kriteria & Bobot
    # Logika Bobot: Default ambil Global (jurusan_id NULL), lalu timpa dengan Lokal (jurusan_id User)
    # Karena user bisa beda jurusan, kita harus hitung bobot per user (agak berat, tapi akurat)

    # Pre-fetch data kriteria
    all_kriteria = Kriteria.query.all()
    kriteria_map = {k.id: k for k in all_kriteria}

    # Pre-fetch semua bobot
    all_bobot = BobotKriteria.query.all()

    # Pre-fetch divisors (Pembagi Normalisasi)
    # Rumus Divisor: Sqrt(Sum(X^2)) per kriteria
    divisors = {}
    for k in all_kriteria:
        # Ambil semua nilai untuk kriteria ini di periode ini
        nilai_k_ini = [n.nilai_input for n in all_nilai if n.kriteria_id == k.id]

        # Tambahkan Virtual Max & Min (Agar pembagi tidak 0 dan range stabil)
        v_max = 100 if k.tipe_input.value == 'number' else 5
        v_min = 0 if k.tipe_input.value == 'number' else 1

        sum_sq = sum([x ** 2 for x in nilai_k_ini]) + (v_max ** 2) + (v_min ** 2)
        divisors[k.id] = math.sqrt(sum_sq)

    results = []

    for s_id in siswa_ids:
        siswa = User.query.get(s_id)
        if not siswa: continue

        # A. Racik Bobot untuk Siswa Ini
        # 1. Bobot Global
        user_weights = {b.kriteria_id: b.nilai_bobot for b in all_bobot if b.jurusan_id is None}
        # 2. Bobot Lokal (Timpa jika ada)
        if siswa.jurusan_id:
            lokal = {b.kriteria_id: b.nilai_bobot for b in all_bobot if b.jurusan_id == siswa.jurusan_id}
            user_weights.update(lokal)

        # 3. Normalisasi Bobot (Total harus 1)
        total_bobot = sum(user_weights.values())
        final_weights = {k: v / total_bobot for k, v in user_weights.items()} if total_bobot > 0 else user_weights

        # B. Hitung Skor
        y_studi, y_kerja, y_wirausaha = 0, 0, 0
        nilai_siswa_ini = [n for n in all_nilai if n.siswa_id == s_id]

        for n in nilai_siswa_ini:
            k_id = n.kriteria_id
            if k_id not in final_weights: continue

            kriteria_obj = kriteria_map.get(k_id)
            if not kriteria_obj: continue

            divisor = divisors.get(k_id, 1)
            if divisor == 0: divisor = 1

            # Rumus MOORA: (Nilai / Divisor) * Bobot
            normalized = (n.nilai_input / divisor) * final_weights[k_id]

            # Mapping Kode ke Keputusan (Hardcoded sesuai Rules Bisnis)
            kode = kriteria_obj.kode
            if kode in ['C1', 'C2', 'C4', 'C5', 'C6']: y_studi += normalized
            if kode in ['C1', 'C3', 'C5', 'C6']: y_kerja += normalized
            if kode in ['C1', 'C4', 'C5', 'C7', 'C8']: y_wirausaha += normalized

        # C. Tentukan Terbaik
        scores = {
            'Melanjutkan Studi': y_studi,
            'Bekerja': y_kerja,
            'Berwirausaha': y_wirausaha
        }
        best_decision = max(scores, key=scores.get)

        # D. Simpan ke DB
        hasil = HasilRekomendasi.query.filter_by(siswa_id=s_id, periode_id=periode_id).first()
        if not hasil:
            hasil = HasilRekomendasi(siswa_id=s_id, periode_id=periode_id)
            db.session.add(hasil)

        hasil.skor_studi = y_studi
        hasil.skor_kerja = y_kerja
        hasil.skor_wirausaha = y_wirausaha
        hasil.keputusan_terbaik = best_decision
        hasil.tingkat_kelas = siswa.kelas_saat_ini.value if hasattr(siswa.kelas_saat_ini, 'value') else str(
            siswa.kelas_saat_ini)
        hasil.tanggal_hitung = func.now()

        results.append(hasil)

    db.session.commit()
    return results


@moora_bp.route('/result', methods=['GET'])
@jwt_required()
def get_result():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    periode = Periode.query.filter_by(is_active=True).first()

    hasil = None

    if periode:
        # Hitung realtime saat user buka halaman
        calculate_ranking(periode.id, user_id=user_id)
        hasil = HasilRekomendasi.query.filter_by(siswa_id=user_id, periode_id=periode.id).first()

    if not hasil:
        # Coba ambil history terakhir
        hasil = HasilRekomendasi.query.filter_by(siswa_id=user_id).order_by(HasilRekomendasi.id.desc()).first()

    if not hasil:
        return jsonify({'msg': 'Belum ada data.'}), 404

    # Cari Alumni Relevan
    alumni_relevan = []
    if user.jurusan and hasil.keputusan_terbaik:
        keyword = 'Kuliah' if hasil.keputusan_terbaik == 'Melanjutkan Studi' else \
            'Kerja' if hasil.keputusan_terbaik == 'Bekerja' else 'Wirausaha'

        query_alumni = Alumni.query.filter(
            Alumni.major.ilike(f'%{user.jurusan.nama_jurusan}%'),
            Alumni.status.ilike(f'%{keyword}%')
        ).limit(5).all()

        alumni_relevan = [{'name': a.name, 'status': a.status, 'batch': a.batch} for a in query_alumni]

    return jsonify({
        'hasil': {
            'keputusan': hasil.keputusan_terbaik,
            'skor': {'studi': hasil.skor_studi, 'kerja': hasil.skor_kerja, 'wirausaha': hasil.skor_wirausaha},
            'tanggal': hasil.tanggal_hitung
        },
        'alumni': alumni_relevan,
        'periode': periode.nama_periode if periode else 'History'
    })


@moora_bp.route('/input', methods=['POST'])
@jwt_required()
def store_input():
    user_id = get_jwt_identity()
    periode = Periode.query.filter_by(is_active=True).first()

    if not periode:
        return jsonify({'msg': 'Tidak ada periode aktif'}), 400

    data = request.json.get('nilai', {})  # Dictionary {kriteria_id: nilai}

    for k_id, val in data.items():
        # Upsert Nilai
        exist = NilaiSiswa.query.filter_by(siswa_id=user_id, periode_id=periode.id, kriteria_id=k_id).first()
        if exist:
            exist.nilai_input = val
        else:
            new_n = NilaiSiswa(siswa_id=user_id, periode_id=periode.id, kriteria_id=k_id, nilai_input=val)
            db.session.add(new_n)

    db.session.commit()
    return jsonify({'msg': 'Data berhasil disimpan'})