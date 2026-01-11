from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Kriteria, AtributEnum, TipeInputEnum, KategoriEnum, SumberNilaiEnum, RoleEnum

kriteria_bp = Blueprint('kriteria', __name__)


# --- FIX: Tambahkan Route '/' juga untuk handle trailing slash ---
@kriteria_bp.route('', methods=['GET'], strict_slashes=False)
@kriteria_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_kriteria():
    kriterias = Kriteria.query.order_by(Kriteria.kode.asc()).all()

    data = []
    for k in kriterias:
        data.append({
            'id': k.id,
            'kode': k.kode,
            'nama': k.nama,
            'pertanyaan': k.pertanyaan,
            # Pastikan konversi Enum ke string aman
            'tipe_input': k.tipe_input.value if hasattr(k.tipe_input, 'value') else str(k.tipe_input),
            'atribut': k.atribut.value if hasattr(k.atribut, 'value') else str(k.atribut),
            'kategori': k.kategori.value if hasattr(k.kategori, 'value') else str(k.kategori),

            # TAMBAHAN PENTING (Agar kolom tabel frontend muncul):
            'sumber_nilai': k.sumber_nilai.value if hasattr(k.sumber_nilai, 'value') else str(k.sumber_nilai),
            'penanggung_jawab': k.penanggung_jawab.value if hasattr(k.penanggung_jawab, 'value') else str(
                k.penanggung_jawab),
            'tampil_di_siswa': k.tampil_di_siswa
        })

    return jsonify({'data': data})


@kriteria_bp.route('', methods=['POST'], strict_slashes=False)
@kriteria_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def store():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'msg': 'Akses ditolak'}), 403

    data = request.get_json()

    try:
        new_kriteria = Kriteria(
            kode=data['kode'],
            nama=data['nama'],
            # Optional fields
            pertanyaan=data.get('pertanyaan', ''),
            tipe_input=data.get('tipe_input', 'number'),
            atribut=data.get('atribut', 'benefit'),
            kategori=data.get('kategori', 'kuesioner'),

            # FIELD BARU (Penting untuk UI):
            sumber_nilai=data.get('sumber_nilai', 'input_siswa'),
            penanggung_jawab=data.get('penanggung_jawab', 'gurubk'),
            tampil_di_siswa=bool(data.get('tampil_di_siswa', True))
        )
        db.session.add(new_kriteria)
        db.session.commit()
        return jsonify({'msg': 'Kriteria berhasil ditambah'}), 201
    except Exception as e:
        db.session.rollback()
        print("Error Create Kriteria:", str(e))
        return jsonify({'msg': f'Gagal menyimpan: {str(e)}'}), 400


@kriteria_bp.route('/<int:id>', methods=['PUT'], strict_slashes=False)
@jwt_required()
def update(id):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'msg': 'Akses ditolak'}), 403

    kriteria = Kriteria.query.get_or_404(id)
    data = request.get_json()

    try:
        # Update field jika ada di request
        if 'kode' in data: kriteria.kode = data['kode']
        if 'nama' in data: kriteria.nama = data['nama']
        if 'pertanyaan' in data: kriteria.pertanyaan = data['pertanyaan']
        if 'tipe_input' in data: kriteria.tipe_input = data['tipe_input']
        if 'atribut' in data: kriteria.atribut = data['atribut']
        if 'kategori' in data: kriteria.kategori = data['kategori']

        # UPDATE FIELD BARU:
        if 'sumber_nilai' in data: kriteria.sumber_nilai = data['sumber_nilai']
        if 'penanggung_jawab' in data: kriteria.penanggung_jawab = data['penanggung_jawab']
        if 'tampil_di_siswa' in data: kriteria.tampil_di_siswa = bool(data['tampil_di_siswa'])

        db.session.commit()
        return jsonify({'msg': 'Kriteria berhasil diupdate'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': str(e)}), 400


@kriteria_bp.route('/<int:id>', methods=['DELETE'], strict_slashes=False)
@jwt_required()
def destroy(id):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'msg': 'Akses ditolak'}), 403

    kriteria = Kriteria.query.get_or_404(id)
    try:
        db.session.delete(kriteria)
        db.session.commit()
        return jsonify({'msg': 'Kriteria dihapus'}), 200
    except Exception as e:
        return jsonify({'msg': 'Gagal menghapus data'}), 400