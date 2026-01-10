from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, User, HasilRekomendasi, Periode, Jurusan, RoleEnum
from sqlalchemy import desc

monitoring_bp = Blueprint('monitoring', __name__)


@monitoring_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def index():
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'pakar']:  # Pakar (Guru BK) juga boleh akses
        return jsonify({'msg': 'Akses ditolak'}), 403

    # Filter Params
    jurusan_id = request.args.get('jurusan_id')
    kelas = request.args.get('kelas')  # 10, 11, 12
    search = request.args.get('search', '')

    # Query User Siswa
    query = User.query.filter_by(role=RoleEnum.siswa)

    if jurusan_id:
        query = query.filter_by(jurusan_id=jurusan_id)
    if kelas:
        query = query.filter_by(kelas_saat_ini=kelas)
    if search:
        query = query.filter(User.name.ilike(f'%{search}%'))

    # Pagination
    page = request.args.get('page', 1, type=int)
    pagination = query.paginate(page=page, per_page=10, error_out=False)

    # Ambil Periode Aktif untuk konteks data
    periode_aktif = Periode.query.filter_by(is_active=True).first()

    data = []
    for siswa in pagination.items:
        # Cek apakah sudah ada hasil di periode aktif (atau hasil terakhir jika tidak ada periode aktif)
        hasil = None
        if periode_aktif:
            hasil = HasilRekomendasi.query.filter_by(
                siswa_id=siswa.id,
                periode_id=periode_aktif.id
            ).first()
        else:
            # Fallback ambil yang paling baru
            hasil = HasilRekomendasi.query.filter_by(siswa_id=siswa.id).order_by(
                desc(HasilRekomendasi.created_at)).first()

        data.append({
            'id': siswa.id,
            'nisn': siswa.nisn,
            'name': siswa.name,
            'kelas': siswa.kelas_saat_ini.value,
            'jurusan': siswa.jurusan.nama_jurusan if siswa.jurusan else '-',
            'status': 'Sudah Dinilai' if hasil else 'Belum Mengisi',
            'hasil': {
                'id': hasil.id if hasil else None,
                'keputusan': hasil.keputusan_terbaik if hasil else '-',
                'skor_tertinggi': max(hasil.skor_studi, hasil.skor_kerja, hasil.skor_wirausaha) if hasil else 0,
                'catatan': hasil.catatan_guru_bk if hasil else ''
            } if hasil else None
        })

    return jsonify({
        'data': data,
        'meta': {
            'page': page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })


# --- SIMPAN CATATAN BK ---
@monitoring_bp.route('/catatan', methods=['POST'], strict_slashes=False)
@jwt_required()
def save_note():
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'pakar']:
        return jsonify({'msg': 'Akses ditolak'}), 403

    data = request.get_json()
    hasil_id = data.get('hasil_id')
    catatan = data.get('catatan')

    if not hasil_id:
        return jsonify({'msg': 'ID Hasil tidak valid'}), 400

    hasil = HasilRekomendasi.query.get_or_404(hasil_id)
    hasil.catatan_guru_bk = catatan

    db.session.commit()

    return jsonify({'msg': 'Catatan Guru BK berhasil disimpan!'}), 200