from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Jurusan

jurusan_bp = Blueprint('jurusan', __name__)


@jurusan_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def index():
    # Public read (bisa dipakai saat register/form)
    data = Jurusan.query.order_by(Jurusan.kode_jurusan.asc()).all()
    res = [{'id': j.id, 'kode': j.kode_jurusan, 'nama': j.nama_jurusan} for j in data]
    return jsonify({'data': res})


@jurusan_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def store():
    claims = get_jwt()
    if claims.get('role') != 'admin': return jsonify({'msg': 'Akses ditolak'}), 403

    data = request.get_json()
    if not data.get('kode') or not data.get('nama'):
        return jsonify({'msg': 'Data tidak lengkap'}), 400

    if Jurusan.query.filter_by(kode_jurusan=data['kode']).first():
        return jsonify({'msg': 'Kode jurusan sudah ada'}), 400

    new_j = Jurusan(kode_jurusan=data['kode'], nama_jurusan=data['nama'])
    db.session.add(new_j)
    db.session.commit()
    return jsonify({'msg': 'Jurusan berhasil ditambah'}), 201


@jurusan_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update(id):
    claims = get_jwt()
    if claims.get('role') != 'admin': return jsonify({'msg': 'Akses ditolak'}), 403

    jurusan = Jurusan.query.get_or_404(id)
    data = request.get_json()

    jurusan.nama_jurusan = data.get('nama', jurusan.nama_jurusan)
    # Kode biasanya tidak diubah, tapi kalau mau diubah perlu cek unik lagi

    db.session.commit()
    return jsonify({'msg': 'Jurusan diperbarui'}), 200


@jurusan_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def destroy(id):
    claims = get_jwt()
    if claims.get('role') != 'admin': return jsonify({'msg': 'Akses ditolak'}), 403

    jurusan = Jurusan.query.get_or_404(id)
    db.session.delete(jurusan)
    db.session.commit()
    return jsonify({'msg': 'Jurusan dihapus'}), 200