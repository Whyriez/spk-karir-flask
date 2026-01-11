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
    """Logika MOORA murni sesuai Proposal Bab 3"""
    ensure_static_values(user_id)
    siswa = User.query.get(user_id)

    # 1. Ambil Nilai Siswa
    nilai_records = NilaiSiswa.query.filter_by(siswa_id=user_id).all()
    if not nilai_records:
        return None, "Belum ada data nilai. Silakan isi kuesioner."

    raw_data = {Kriteria.query.get(n.kriteria_id).kode: n.nilai_input for n in nilai_records if Kriteria.query.get(n.kriteria_id)}

    # Standarisasi C1 ke skala 1-5 jika perlu
    if 'C1' in raw_data and raw_data['C1'] > 5:
        raw_data['C1'] = 1 + (raw_data['C1'] * 0.04)

    # 2. Ambil Bobot
    bobot = get_aggregated_weights()

    # 3. Matriks Keputusan 3 Alternatif x 8 Kriteria
    alternatif_names = ['Melanjutkan Studi', 'Bekerja', 'Berwirausaha']
    kriteria_codes = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']
    matrix = np.zeros((3, 8))

    for j, code in enumerate(kriteria_codes):
        val = raw_data.get(code, 1)  # Nilai default 1 jika data kosong

        # Mapping Alternatif sesuai Proposal Hal 74-75
        if code in ['C1', 'C5']:  # Akademik & Motivasi: Relevan ke semua
            matrix[0, j] = matrix[1, j] = matrix[2, j] = val
        elif code == 'C2':  # Minat Studi: Hanya ke Studi
            matrix[0, j], matrix[1, j], matrix[2, j] = val, 1, 1
        elif code == 'C3':  # Minat Kerja: Hanya ke Kerja
            matrix[0, j], matrix[1, j], matrix[2, j] = 1, val, 1
        elif code == 'C4':  # Ekonomi: Studi & Wirausaha
            matrix[0, j], matrix[1, j], matrix[2, j] = val, 1, val
        elif code == 'C6':  # Lapangan Kerja: Studi & Kerja
            matrix[0, j], matrix[1, j], matrix[2, j] = val, val, 1
        elif code == 'C7' or code == 'C8':  # Minat Usaha & Modal: Hanya Wirausaha
            matrix[0, j], matrix[1, j], matrix[2, j] = 1, 1, val

    # 4. Normalisasi Vektor
    norm_matrix = np.zeros((3, 8))
    for j in range(8):
        denom = math.sqrt(sum(matrix[i, j] ** 2 for i in range(3)))
        for i in range(3):
            norm_matrix[i, j] = matrix[i, j] / denom if denom > 0 else 0

    # 5. Optimasi Yi (Benefit - Cost)
    y_scores = []
    for i in range(3):
        yi = sum(norm_matrix[i, j] * bobot.get(kriteria_codes[j], 0) for j in range(8))
        y_scores.append(yi)

    # 6. Simpan/Update Hasil
    hasil = HasilRekomendasi.query.filter_by(siswa_id=user_id, periode_id=periode_id).first()
    if not hasil:
        hasil = HasilRekomendasi(siswa_id=user_id, periode_id=periode_id)
        db.session.add(hasil)

    hasil.skor_studi = float(y_scores[0])
    hasil.skor_kerja = float(y_scores[1])
    hasil.skor_wirausaha = float(y_scores[2])
    hasil.keputusan_terbaik = alternatif_names[np.argmax(y_scores)]
    if hasattr(siswa.kelas_saat_ini, 'value'):
        hasil.tingkat_kelas = str(siswa.kelas_saat_ini.value)
    else:
        hasil.tingkat_kelas = str(siswa.kelas_saat_ini)

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
            'tingkat_kelas': hasil.tingkat_kelas
        },
        'alumni': alumni_list,
        'periode': periode_nama
    })