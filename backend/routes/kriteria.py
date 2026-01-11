# backend/routes/kriteria.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Kriteria

kriteria_bp = Blueprint('kriteria', __name__)


# --- GET ALL (Untuk Index) ---
@kriteria_bp.route('', methods=['GET'])
@jwt_required()
def get_kriteria():
    data = Kriteria.query.all()
    # Sort by ID or Kode
    data.sort(key=lambda x: x.id)

    return jsonify({'data': [{
        'id': k.id,
        'kode': k.kode,
        'nama': k.nama,
        'pertanyaan': k.pertanyaan,
        'tipe_input': k.tipe_input.value if hasattr(k.tipe_input, 'value') else str(k.tipe_input),
        'atribut': k.atribut.value if hasattr(k.atribut, 'value') else str(k.atribut),
        'kategori': k.kategori.value if hasattr(k.kategori, 'value') else str(k.kategori)
    } for k in data]})


# --- GET SINGLE (Untuk Form Edit) ---
@kriteria_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def show_kriteria(id):
    k = Kriteria.query.get(id)
    if not k:
        return jsonify({'msg': 'Kriteria not found'}), 404

    return jsonify({'data': {
        'id': k.id,
        'kode': k.kode,
        'nama': k.nama,
        'pertanyaan': k.pertanyaan,
        'tipe_input': k.tipe_input.value if hasattr(k.tipe_input, 'value') else str(k.tipe_input),
        'atribut': k.atribut.value if hasattr(k.atribut, 'value') else str(k.atribut),
        'kategori': k.kategori.value if hasattr(k.kategori, 'value') else str(k.kategori),
        'sumber_nilai': k.sumber_nilai.value if hasattr(k.sumber_nilai, 'value') else str(k.sumber_nilai)
    }})


# --- UPDATE (Proses Simpan) ---
@kriteria_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_kriteria(id):
    k = Kriteria.query.get(id)
    if not k:
        return jsonify({'msg': 'Kriteria not found'}), 404

    data = request.json

    # Pakar biasanya hanya update pertanyaan, tipe, dll.
    # Kode dan Nama sebaiknya dijaga (opsional, tergantung logic)
    if 'pertanyaan' in data: k.pertanyaan = data['pertanyaan']
    if 'tipe_input' in data: k.tipe_input = data['tipe_input']
    if 'atribut' in data: k.atribut = data['atribut']
    if 'nama' in data: k.nama = data['nama']  # Optional

    try:
        db.session.commit()
        return jsonify({'msg': 'Kriteria berhasil diupdate'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': str(e)}), 500