from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Kriteria, NilaiSiswa, User, Jurusan
import json

siswa_bp = Blueprint('siswa', __name__)


# --- GET FORM DATA (Kriteria & Existing Values) ---
@siswa_bp.route('/form', methods=['GET'])
@jwt_required()
def get_form():
    user_id = get_jwt_identity()

    # 1. Ambil semua kriteria yang aktif (tampil_di_siswa=True)
    # Urutkan berdasarkan kategori agar rapi (Akademik dulu, baru Kuesioner)
    kriterias = Kriteria.query.filter_by(tampil_di_siswa=True).order_by(Kriteria.kategori.asc(),
                                                                        Kriteria.id.asc()).all()

    # 2. Ambil nilai yang SUDAH pernah diisi siswa (jika ada, untuk edit mode)
    existing_nilai = NilaiSiswa.query.filter_by(siswa_id=user_id).all()
    nilai_map = {str(n.kriteria_id): n.nilai_input for n in existing_nilai}  # {'1': 80, '2': 5}

    form_data = []
    for k in kriterias:
        # Skip kriteria statis (seperti Lapangan Kerja yang diambil dari DB Jurusan)
        if k.sumber_nilai == 'static_jurusan':
            continue

        # Parsing Opsi Pilihan (JSON)
        options = []
        if k.opsi_pilihan:
            try:
                if isinstance(k.opsi_pilihan, str):
                    options = json.loads(k.opsi_pilihan)
                else:
                    options = k.opsi_pilihan  # Sudah object/dict
            except:
                options = []

        form_data.append({
            'id': k.id,
            'kode': k.kode,
            'nama': k.nama,
            'pertanyaan': k.pertanyaan,
            'tipe_input': k.tipe_input.value,  # number, select, likert
            'kategori': k.kategori.value,
            'options': options,
            'value': nilai_map.get(str(k.id), '')  # Isi nilai lama jika ada
        })

    return jsonify({
        'data': form_data
    })


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