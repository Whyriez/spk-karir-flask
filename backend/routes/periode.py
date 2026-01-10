from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Periode, Setting, HasilRekomendasi
from sqlalchemy import desc

periode_bp = Blueprint('periode', __name__)


# --- GET ALL DATA (Periods + Settings) ---
@periode_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def index():
    # Cek Role Admin
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'msg': 'Akses ditolak'}), 403

    # 1. Ambil Setting Auto Pilot
    setting_auto = Setting.query.filter_by(key='auto_periode').first()
    is_auto = setting_auto.value == 'true' if setting_auto else False

    # 2. Ambil Semua Periode (Terbaru diatas)
    periodes = Periode.query.order_by(desc(Periode.created_at)).all()

    data = []
    for p in periodes:
        # Hitung jumlah siswa yang sudah dinilai di periode ini (Optional, untuk info)
        count = HasilRekomendasi.query.filter_by(periode_id=p.id).count()
        data.append({
            'id': p.id,
            'nama_periode': p.nama_periode,
            'is_active': p.is_active,
            'jumlah_siswa': count
        })

    return jsonify({
        'periodes': data,
        'auto_setting': is_auto
    })


# --- STORE (Tambah Periode) ---
@periode_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def store():
    claims = get_jwt()
    if claims.get('role') != 'admin': return jsonify({'msg': 'Akses ditolak'}), 403

    data = request.get_json()
    nama = data.get('nama_periode')

    if not nama:
        return jsonify({'msg': 'Nama periode wajib diisi'}), 400

    # Cek duplikat
    if Periode.query.filter_by(nama_periode=nama).first():
        return jsonify({'msg': 'Nama periode sudah ada'}), 400

    try:
        new_p = Periode(nama_periode=nama, is_active=False)
        db.session.add(new_p)
        db.session.commit()
        return jsonify({'msg': 'Periode berhasil dibuat'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': str(e)}), 500


# --- UPDATE (Edit Nama) ---
@periode_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update(id):
    claims = get_jwt()
    if claims.get('role') != 'admin': return jsonify({'msg': 'Akses ditolak'}), 403

    data = request.get_json()
    periode = Periode.query.get_or_404(id)
    nama_baru = data.get('nama_periode')

    # Validasi Unik (kecuali diri sendiri)
    cek = Periode.query.filter(Periode.nama_periode == nama_baru, Periode.id != id).first()
    if cek:
        return jsonify({'msg': 'Nama periode sudah digunakan'}), 400

    periode.nama_periode = nama_baru
    db.session.commit()
    return jsonify({'msg': 'Periode diperbarui'}), 200


# --- ACTIVATE (Set Aktif) ---
@periode_bp.route('/<int:id>/activate', methods=['POST'])
@jwt_required()
def activate(id):
    claims = get_jwt()
    if claims.get('role') != 'admin': return jsonify({'msg': 'Akses ditolak'}), 403

    try:
        # 1. Matikan semua periode
        Periode.query.update({Periode.is_active: False})

        # 2. Aktifkan yang dipilih
        periode = Periode.query.get_or_404(id)
        periode.is_active = True

        db.session.commit()
        return jsonify({'msg': f'Periode {periode.nama_periode} telah diaktifkan'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': str(e)}), 500


# --- DELETE ---
@periode_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def destroy(id):
    claims = get_jwt()
    if claims.get('role') != 'admin': return jsonify({'msg': 'Akses ditolak'}), 403

    periode = Periode.query.get_or_404(id)

    if periode.is_active:
        return jsonify({'msg': 'Tidak bisa menghapus periode yang sedang aktif!'}), 400

    db.session.delete(periode)
    db.session.commit()
    return jsonify({'msg': 'Periode dihapus'}), 200


# --- TOGGLE AUTO SETTING ---
@periode_bp.route('/toggle-auto', methods=['POST'])
@jwt_required()
def toggle_auto():
    claims = get_jwt()
    if claims.get('role') != 'admin': return jsonify({'msg': 'Akses ditolak'}), 403

    data = request.get_json()
    is_active = data.get('active')  # true/false

    # Update or Create Setting
    setting = Setting.query.filter_by(key='auto_periode').first()
    val_str = 'true' if is_active else 'false'

    if setting:
        setting.value = val_str
    else:
        new_s = Setting(key='auto_periode', value=val_str, type='boolean')
        db.session.add(new_s)

    db.session.commit()
    return jsonify({'msg': f'Otomatisasi periode {"diaktifkan" if is_active else "dimatikan"}'}), 200