from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.security import generate_password_hash
from models import db, User, RoleEnum

admin_siswa_bp = Blueprint('admin_siswa', __name__)


# --- LIST SISWA ---
@admin_siswa_bp.route('', methods=['GET'], strict_slashes=False)
@admin_siswa_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_siswa():
    # Cek Role Admin
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'msg': 'Akses ditolak'}), 403

    # Ambil user dengan role 'siswa'
    # Menggunakan RoleEnum.siswa jika menggunakan Enum, atau string 'siswa'
    siswas = User.query.filter_by(role='siswa').order_by(User.username.asc()).all()

    data = []
    for s in siswas:
        data.append({
            'id': s.id,
            'username': s.username,  # Kita anggap ini NIS/NISN
            'name': s.name,
            # 'jenis_kelamin': s.jenis_kelamin,
            # 'kelas': s.kelas,
            'created_at': s.created_at
        })

    return jsonify({'data': data})


# --- TAMBAH SISWA (DEFAULT PASSWORD) ---
@admin_siswa_bp.route('', methods=['POST'], strict_slashes=False)
@jwt_required()
def store_siswa():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'msg': 'Akses ditolak'}), 403

    data = request.get_json()

    # Validasi
    if not data.get('username') or not data.get('name'):
        return jsonify({'msg': 'NIS (Username) dan Nama wajib diisi'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'msg': 'NIS/Username sudah digunakan'}), 400

    try:
        # DEFAULT PASSWORD: "123456"
        hashed_password = generate_password_hash("123456")

        new_siswa = User(
            username=data['username'],
            password=hashed_password,
            name=data['name'],
            role='siswa',  # Set otomatis jadi siswa

            # Field tambahan (Pastikan model User mendukung ini, jika tidak, hapus baris ini)
            # jenis_kelamin=data.get('jenis_kelamin'),
            # kelas=data.get('kelas')
        )

        db.session.add(new_siswa)
        db.session.commit()

        return jsonify({'msg': 'Siswa berhasil ditambahkan. Password default: 123456'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': str(e)}), 400


# --- EDIT SISWA ---
@admin_siswa_bp.route('/<int:id>', methods=['PUT'], strict_slashes=False)
@jwt_required()
def update_siswa(id):
    claims = get_jwt()
    if claims.get('role') != 'admin': return jsonify({'msg': 'Akses ditolak'}), 403

    siswa = User.query.get(id)
    if not siswa: return jsonify({'msg': 'Siswa tidak ditemukan'}), 404

    data = request.get_json()

    try:
        siswa.name = data.get('name', siswa.name)
        siswa.username = data.get('username', siswa.username)
        # siswa.jenis_kelamin = data.get('jenis_kelamin', siswa.jenis_kelamin)
        # siswa.kelas = data.get('kelas', siswa.kelas)

        # Opsi: Reset Password
        if data.get('reset_password') == True:
            siswa.password = generate_password_hash("123456")

        db.session.commit()
        return jsonify({'msg': 'Data siswa berhasil diperbarui'}), 200
    except Exception as e:
        return jsonify({'msg': str(e)}), 400


# --- HAPUS SISWA ---
@admin_siswa_bp.route('/<int:id>', methods=['DELETE'], strict_slashes=False)
@jwt_required()
def delete_siswa(id):
    claims = get_jwt()
    if claims.get('role') != 'admin': return jsonify({'msg': 'Akses ditolak'}), 403

    siswa = User.query.get(id)
    if not siswa: return jsonify({'msg': 'User tidak ditemukan'}), 404

    try:
        db.session.delete(siswa)
        db.session.commit()
        return jsonify({'msg': 'Siswa berhasil dihapus'}), 200
    except Exception as e:
        return jsonify({'msg': 'Gagal menghapus siswa. Mungkin ada data terkait.'}), 400