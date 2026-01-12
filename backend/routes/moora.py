from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Kriteria, NilaiSiswa, NilaiStaticJurusan, BobotKriteria, HasilRekomendasi, Periode, Alumni
from sqlalchemy import desc
import math
import numpy as np

moora_bp = Blueprint('moora', __name__)


# --- FUNGSI HELPER (LOGIKA BARU) ---

def ensure_static_values(user_id):
    """Memastikan nilai ketersediaan lapangan kerja (C6) masuk ke NilaiSiswa"""
    user = User.query.get(user_id)
    if not user or not user.jurusan_id:
        return
    kriteria_statis = Kriteria.query.filter_by(sumber_nilai='static_jurusan').all()
    for k in kriteria_statis:
        existing = NilaiSiswa.query.filter_by(siswa_id=user_id, kriteria_id=k.id).first()
        if not existing:
            static_val = NilaiStaticJurusan.query.filter_by(jurusan_id=user.jurusan_id, kriteria_id=k.id).first()
            val_to_insert = static_val.nilai if static_val else 3  # Default 3 (Cukup)
            db.session.add(NilaiSiswa(siswa_id=user_id, kriteria_id=k.id, nilai_input=val_to_insert))
    db.session.commit()


def get_aggregated_weights():
    """Mengambil bobot BWM optimal dari tabel BobotKriteria"""
    kriterias = Kriteria.query.all()
    weights = {}
    for k in kriterias:
        stored = BobotKriteria.query.filter_by(kriteria_id=k.id).all()
        if stored:
            # Rata-rata bobot jika ada lebih dari 1 pakar
            weights[k.kode] = sum(s.nilai_bobot for s in stored) / len(stored)
        else:
            weights[k.kode] = 1.0 / len(kriterias)
    return weights


def calculate_ranking(periode_id, user_id):
    ensure_static_values(user_id)
    siswa = User.query.get(user_id)

    # 1. Ambil Kriteria & Config dari DB
    all_kriteria = Kriteria.query.order_by(Kriteria.kode).all()
    num_kriteria = len(all_kriteria)

    # Ambil Nilai Siswa
    nilai_records = NilaiSiswa.query.filter_by(siswa_id=user_id).all()
    raw_data = {}
    for n in nilai_records:
        k_obj = Kriteria.query.get(n.kriteria_id)
        if k_obj:
            raw_data[k_obj.kode] = n.nilai_input

    # 2. Ambil Bobot
    bobot_map = get_aggregated_weights()

    # 3. Bentuk Matriks Keputusan (3 Alternatif x N Kriteria)
    alternatif_names = ['Melanjutkan Studi', 'Bekerja', 'Berwirausaha']
    # Mapping index baris: 0=Studi, 1=Kerja, 2=Wirausaha
    matrix = np.zeros((3, num_kriteria))

    for j, k in enumerate(all_kriteria):
        val = raw_data.get(k.kode, 1)  # Nilai default 1

        # Baca Config Dinamis dari Database
        targets = (k.target_jalur or '').lower()
        reverses = (k.jalur_reverse or '').lower()
        max_scale = k.skala_maks  # Misal 100 utk C1, 5 utk C4

        # Fungsi helper untuk menentukan nilai sel matriks
        def get_val_for_jalur(jalur_name):
            # 1. Cek apakah kriteria ini relevan untuk jalur ini?
            if 'all' in targets or jalur_name in targets:
                # 2. Cek apakah nilainya harus dibalik? (Misal Ekonomi utk Kerja)
                if jalur_name in reverses:
                    # Rumus Inversi: (Max + 1) - Val. Contoh skala 5: (6 - 1) = 5
                    return (max_scale + 1) - val
                return val
            return 1  # Nilai default jika tidak relevan (Netral di MOORA Benefit)

        # Isi Matriks
        matrix[0, j] = get_val_for_jalur('studi')
        matrix[1, j] = get_val_for_jalur('kerja')
        matrix[2, j] = get_val_for_jalur('wirausaha')

        # CATATAN: Isu normalisasi skala beda (0-100 vs 1-5)
        # SUDAH otomatis ditangani oleh rumus MOORA (Vector Normalization) di bawah.
        # Jadi kita TIDAK PERLU codingan khusus pembagi skala.

    # 4. Normalisasi Vektor (Otomatis menangani skala 100 vs 5)
    norm_matrix = np.zeros((3, num_kriteria))
    for j in range(num_kriteria):
        # Rumus: x / sqrt(sum(x^2))
        denom = math.sqrt(sum(matrix[i, j] ** 2 for i in range(3)))
        for i in range(3):
            norm_matrix[i, j] = matrix[i, j] / denom if denom > 0 else 0

    # 5. Optimasi Yi (Benefit - Cost)
    y_scores = []
    for i in range(3):
        yi = 0
        for j in range(num_kriteria):
            code = all_kriteria[j].kode
            weight = bobot_map.get(code, 0)

            # Cek atribut (Benefit/Cost) dari DB
            if all_kriteria[j].atribut.value == 'benefit':
                yi += norm_matrix[i, j] * weight
            else:
                yi -= norm_matrix[i, j] * weight
        y_scores.append(yi)

    # 6. Simpan Hasil
    hasil = HasilRekomendasi.query.filter_by(siswa_id=user_id, periode_id=periode_id).first()
    if not hasil:
        hasil = HasilRekomendasi(siswa_id=user_id, periode_id=periode_id)
        db.session.add(hasil)

    hasil.skor_studi = float(y_scores[0])
    hasil.skor_kerja = float(y_scores[1])
    hasil.skor_wirausaha = float(y_scores[2])

    hasil.keputusan_terbaik = alternatif_names[np.argmax(y_scores)]

    kelas_val = siswa.kelas_saat_ini
    if hasattr(kelas_val, 'value'): kelas_val = kelas_val.value
    hasil.tingkat_kelas = str(kelas_val)

    db.session.commit()
    return hasil, None


# --- ROUTE HANDLER UNTUK FRONTEND ---

@moora_bp.route('/result', methods=['GET'])
@jwt_required()
def get_result():
    current_user_id = get_jwt_identity()
    history_id = request.args.get('id')
    hasil = None
    periode_nama = "-"

    if history_id:
        hasil = HasilRekomendasi.query.filter_by(id=history_id, siswa_id=current_user_id).first()
        if not hasil: return jsonify({'msg': 'Riwayat tidak ditemukan'}), 404
        periode_nama = hasil.periode.nama_periode if hasil.periode else f"Kelas {hasil.tingkat_kelas}"
    else:
        periode = Periode.query.filter_by(is_active=True).first() or Periode.query.order_by(desc(Periode.id)).first()
        if not periode: return jsonify({'msg': 'Periode belum diatur'}), 404

        periode_nama = periode.nama_periode
        hasil, error = calculate_ranking(periode.id, current_user_id)
        if error: return jsonify({'hasil': None, 'msg': error}), 200

    # Cari Alumni Relevan
    alumni_list = []
    user = User.query.get(current_user_id)
    if user.jurusan and hasil:
        status_keyword = 'Kuliah' if 'Studi' in hasil.keputusan_terbaik else (
            'Bekerja' if 'Kerja' in hasil.keputusan_terbaik else 'Wirausaha')
        alumnis = Alumni.query.filter(Alumni.major.ilike(f"%{user.jurusan.nama_jurusan}%"),
                                      Alumni.status.ilike(f"%{status_keyword}%")).limit(5).all()
        alumni_list = [{'name': a.name, 'batch': a.batch, 'status': a.status} for a in alumnis]

    return jsonify({
        'hasil': {
            'keputusan': hasil.keputusan_terbaik,
            'skor': {'studi': hasil.skor_studi, 'kerja': hasil.skor_kerja, 'wirausaha': hasil.skor_wirausaha},
            'catatan': hasil.catatan_guru_bk,
            'created_at': hasil.created_at,
            'tingkat_kelas': hasil.tingkat_kelas,
            'riwayat_jawaban': hasil.detail_snapshot or []
        },
        'alumni': alumni_list,
        'periode': periode_nama
    })