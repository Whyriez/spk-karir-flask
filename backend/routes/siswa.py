from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Kriteria, NilaiSiswa, User, Jurusan
import json

siswa_bp = Blueprint('siswa', __name__)


# --- GET FORM DATA (Kriteria & Existing Values) ---
@siswa_bp.route('/form', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_form():
    current_user_id = get_jwt_identity()

    # Ambil kriteria yang aktif & tampil di siswa
    kriterias = Kriteria.query.filter_by(
        sumber_nilai='input_siswa',
        tampil_di_siswa=True
    ).order_by(Kriteria.kode.asc()).all()

    # Ambil nilai lama jika ada (untuk edit)
    nilai_lama = NilaiSiswa.query.filter_by(siswa_id=current_user_id).all()
    nilai_dict = {n.kriteria_id: n.nilai_input for n in nilai_lama}

    data = []
    for k in kriterias:
        # Parsing JSON opsi_pilihan jika berupa string (safety check)
        opsi = k.opsi_pilihan
        if isinstance(opsi, str):
            try:
                opsi = json.loads(opsi)
            except:
                opsi = []

        data.append({
            'id': k.id,
            'kode': k.kode,
            'nama': k.nama,
            'pertanyaan': k.pertanyaan,
            'tipe_input': k.tipe_input.value,
            'kategori': k.kategori.value,
            'opsi_pilihan': opsi,  # <--- PENTING: Kirim list opsi
            'value': nilai_dict.get(k.id, '')
        })

    return jsonify({'data': data})


# --- SAVE VALUES ---
@siswa_bp.route('/save', methods=['POST'])
@jwt_required()
def save_nilai():
    user_id = get_jwt_identity()
    data = request.get_json()

    # Data berupa dict: {'1': 85, '2': 5, ...} (Key=KriteriaID, Val=Nilai)
    input_values = data.get('values', {})

    if not input_values:
        return jsonify({'msg': 'Tidak ada data yang dikirim'}), 400

    try:
        # Kita gunakan strategi "Delete All Insert New" atau "Update or Create"
        # Agar simpel dan aman, kita loop update/insert

        for k_id, val in input_values.items():
            # Pastikan val tidak kosong
            if val is None or val == '':
                continue

            nilai_float = float(val)

            # Cek apakah sudah ada
            existing = NilaiSiswa.query.filter_by(siswa_id=user_id, kriteria_id=k_id).first()

            if existing:
                existing.nilai_input = nilai_float
            else:
                new_nilai = NilaiSiswa(
                    siswa_id=user_id,
                    kriteria_id=k_id,
                    nilai_input=nilai_float
                )
                db.session.add(new_nilai)

        db.session.commit()
        return jsonify({'msg': 'Data berhasil disimpan!'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Gagal menyimpan: ' + str(e)}), 500