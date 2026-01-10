from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, User, Alumni, KelasEnum, RoleEnum
from datetime import datetime

promotion_bp = Blueprint('promotion', __name__)


@promotion_bp.route('/summary', methods=['GET'], strict_slashes=False)
@jwt_required()
def summary():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'msg': 'Akses ditolak'}), 403

    # Hitung jumlah siswa per tingkat
    count_10 = User.query.filter_by(role=RoleEnum.siswa, kelas_saat_ini=KelasEnum.kelas_10).count()
    count_11 = User.query.filter_by(role=RoleEnum.siswa, kelas_saat_ini=KelasEnum.kelas_11).count()
    count_12 = User.query.filter_by(role=RoleEnum.siswa, kelas_saat_ini=KelasEnum.kelas_12).count()

    return jsonify({
        'kelas_10': count_10,
        'kelas_11': count_11,
        'kelas_12': count_12,
        'total_eligible': count_10 + count_11 + count_12
    })


@promotion_bp.route('/execute', methods=['POST'], strict_slashes=False)
@jwt_required()
def execute():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'msg': 'Akses ditolak'}), 403

    try:
        current_year = datetime.now().year

        # --- LANGKAH 1: PROSES KELAS 12 (LULUS) ---
        # Ambil semua siswa kelas 12
        students_12 = User.query.filter_by(role=RoleEnum.siswa, kelas_saat_ini=KelasEnum.kelas_12).all()

        migrated_count = 0
        for s in students_12:
            # 1. Buat Data Alumni
            # Cek dulu agar tidak duplikat (misal dijalankan 2x)
            cek_alumni = Alumni.query.filter_by(name=s.name, batch=current_year).first()
            if not cek_alumni:
                jurusan_name = s.jurusan.nama_jurusan if s.jurusan else 'Umum'

                new_alumni = Alumni(
                    name=s.name,
                    status='Mencari Kerja',  # Default status awal lulus
                    batch=current_year,
                    major=jurusan_name
                )
                db.session.add(new_alumni)

            # 2. Update User: Ubah status jadi Alumni (atau hapus user jika ingin hemat storage)
            # Di sini kita ubah kelasnya jadi 'alumni' (sesuai enum di models.py)
            s.kelas_saat_ini = KelasEnum.alumni
            # Opsional: Nonaktifkan login s.password = 'disabled'

            migrated_count += 1

        # --- LANGKAH 2: PROSES KELAS 11 -> 12 ---
        updated_11 = User.query.filter_by(role=RoleEnum.siswa, kelas_saat_ini=KelasEnum.kelas_11) \
            .update({User.kelas_saat_ini: KelasEnum.kelas_12}, synchronize_session=False)

        # --- LANGKAH 3: PROSES KELAS 10 -> 11 ---
        updated_10 = User.query.filter_by(role=RoleEnum.siswa, kelas_saat_ini=KelasEnum.kelas_10) \
            .update({User.kelas_saat_ini: KelasEnum.kelas_11}, synchronize_session=False)

        db.session.commit()

        return jsonify({
            'msg': 'Proses kenaikan kelas berhasil!',
            'details': {
                'lulus': migrated_count,
                'naik_ke_12': updated_11,
                'naik_ke_11': updated_10
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Terjadi kesalahan: ' + str(e)}), 500