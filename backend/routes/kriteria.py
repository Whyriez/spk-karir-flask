from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Kriteria

kriteria_bp = Blueprint('kriteria', __name__)


# --- GET ALL (Tambahkan strict_slashes=False) ---
@kriteria_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def index():
    # Ambil parameter query string
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')

    # Query dasar
    query = Kriteria.query

    # Filter search jika ada
    if search:
        query = query.filter(Kriteria.nama.ilike(f'%{search}%') | Kriteria.kode.ilike(f'%{search}%'))

    # Eksekusi Pagination
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    data = []
    for k in pagination.items:
        data.append({
            'id': k.id,
            'kode': k.kode,
            'nama': k.nama,
            'pertanyaan': k.pertanyaan,  # Tambahkan ini agar bisa diedit nanti
            'atribut': k.atribut.value,
            'bobot': 0,
            'kategori': k.kategori.value,
            'tipe_input': k.tipe_input.value
        })

    return jsonify({
        'data': data,
        'meta': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })


# --- CREATE (Tambahkan strict_slashes=False) ---
@kriteria_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def store():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'msg': 'Akses ditolak. Hanya Admin yang boleh.'}), 403

    data = request.get_json()

    if not data.get('kode') or not data.get('nama'):
        return jsonify({'msg': 'Kode dan Nama wajib diisi'}), 400

    if Kriteria.query.filter_by(kode=data['kode']).first():
        return jsonify({'msg': 'Kode kriteria sudah ada'}), 400

    try:
        kriteria = Kriteria(
            kode=data['kode'],
            nama=data['nama'],
            pertanyaan=data.get('pertanyaan'),
            tipe_input=data.get('tipe_input', 'likert'),
            atribut=data.get('atribut', 'benefit'),
            kategori=data.get('kategori', 'kuesioner'),
            sumber_nilai=data.get('sumber_nilai', 'input_siswa'),
        )
        db.session.add(kriteria)
        db.session.commit()
        return jsonify({'msg': 'Kriteria berhasil ditambahkan'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': str(e)}), 500


# --- UPDATE (ID route tidak butuh strict_slashes karena pasti spesifik) ---
@kriteria_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update(id):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'msg': 'Akses ditolak'}), 403

    kriteria = Kriteria.query.get_or_404(id)
    data = request.get_json()

    try:
        kriteria.nama = data.get('nama', kriteria.nama)
        kriteria.pertanyaan = data.get('pertanyaan', kriteria.pertanyaan)
        # Update enum fields perlu handling khusus jika dikirim string
        if data.get('atribut'): kriteria.atribut = data.get('atribut')
        if data.get('kategori'): kriteria.kategori = data.get('kategori')
        if data.get('tipe_input'): kriteria.tipe_input = data.get('tipe_input')

        db.session.commit()
        return jsonify({'msg': 'Kriteria berhasil diupdate'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': str(e)}), 500


# --- DELETE ---
@kriteria_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def destroy(id):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'msg': 'Akses ditolak'}), 403

    kriteria = Kriteria.query.get_or_404(id)
    db.session.delete(kriteria)
    db.session.commit()
    return jsonify({'msg': 'Kriteria berhasil dihapus'}), 200