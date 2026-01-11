from flask import Blueprint, request, jsonify, url_for
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import or_, and_, desc, asc
from models import db, User, HasilRekomendasi, Periode, Jurusan, RoleEnum

monitoring_bp = Blueprint('monitoring', __name__)




def paginate_response(pagination, endpoint, **kwargs):
    """
    Helper untuk membuat format pagination mirip Laravel
    """
    links = []
    # Link Previous
    links.append({
        'url': url_for(endpoint, page=pagination.prev_num, **kwargs) if pagination.has_prev else None,
        'label': '&laquo; Previous',
        'active': False
    })

    # Simple Links (1, 2, 3...)
    for page_num in pagination.iter_pages(left_edge=1, right_edge=1, left_current=1, right_current=2):
        if page_num:
            links.append({
                'url': url_for(endpoint, page=page_num, **kwargs),
                'label': str(page_num),
                'active': page_num == pagination.page
            })
        else:
            links.append({'url': None, 'label': '...', 'active': False})

    # Link Next
    links.append({
        'url': url_for(endpoint, page=pagination.next_num, **kwargs) if pagination.has_next else None,
        'label': 'Next &raquo;',
        'active': False
    })

    return {
        'current_page': pagination.page,
        'last_page': pagination.pages,
        'per_page': pagination.per_page,
        'total': pagination.total,
        'from': (pagination.page - 1) * pagination.per_page + 1,
        'to': min(pagination.page * pagination.per_page, pagination.total),
        'links': links
    }

@monitoring_bp.route('/chart-data', methods=['GET'])
@jwt_required()
def get_chart_data():
    claims = get_jwt()
    current_user_id = claims.get('id')

    # Ambil semua riwayat hasil urut berdasarkan periode
    history = HasilRekomendasi.query.filter_by(siswa_id=current_user_id) \
        .join(Periode) \
        .order_by(asc(Periode.id)).all()

    labels = []
    studi_scores = []
    kerja_scores = []
    wirausaha_scores = []

    for h in history:
        # Gunakan nama periode atau tingkat kelas sebagai label X-axis
        labels.append(h.periode.nama_periode if h.periode else f"Kelas {h.tingkat_kelas}")
        studi_scores.append(round(h.skor_studi, 4))
        kerja_scores.append(round(h.skor_kerja, 4))
        wirausaha_scores.append(round(h.skor_wirausaha, 4))

    return jsonify({
        'labels': labels,
        'datasets': [
            {'label': 'Melanjutkan Studi', 'data': studi_scores, 'color': '#3b82f6'},
            {'label': 'Bekerja', 'data': kerja_scores, 'color': '#10b981'},
            {'label': 'Berwirausaha', 'data': wirausaha_scores, 'color': '#f59e0b'}
        ]
    })

@monitoring_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def index():
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'pakar']:
        return jsonify({'msg': 'Akses ditolak'}), 403

    # 1. Ambil Parameter
    search = request.args.get('search', '')
    status = request.args.get('status', 'sudah')  # Default 'sudah'
    periode_id = request.args.get('periode_id')
    page = request.args.get('page', 1, type=int)

    # 2. Tentukan Periode
    if periode_id:
        periode = Periode.query.get(periode_id)
    else:
        periode = Periode.query.filter_by(is_active=True).first()
        # Jika tidak ada yang aktif, ambil yang terakhir dibuat
        if not periode:
            periode = Periode.query.order_by(desc(Periode.id)).first()

    current_periode_id = periode.id if periode else None

    # 3. Query Data
    data_items = []
    pagination = None

    if status == 'sudah':
        # --- QUERY HASIL REKOMENDASI (Siswa yang sudah mengisi) ---
        query = HasilRekomendasi.query.join(User).join(Jurusan, User.jurusan_id == Jurusan.id)

        if current_periode_id:
            query = query.filter(HasilRekomendasi.periode_id == current_periode_id)

        if search:
            query = query.filter(or_(
                User.name.ilike(f'%{search}%'),
                User.nisn.ilike(f'%{search}%')
            ))

        # Urutkan berdasarkan nilai tertinggi
        pagination = query.order_by(desc(HasilRekomendasi.created_at)) \
            .paginate(page=page, per_page=10, error_out=False)

        for item in pagination.items:
            data_items.append({
                'id': item.id,
                'user': {
                    'name': item.siswa.name,
                    'nisn': item.siswa.nisn,
                    'jurusan': {
                        'nama_jurusan': item.siswa.jurusan.nama_jurusan if item.siswa.jurusan else '-'
                    }
                },
                'tingkat_kelas': item.siswa.kelas_saat_ini.value if hasattr(item.siswa.kelas_saat_ini,
                                                                            'value') else str(
                    item.siswa.kelas_saat_ini),
                'keputusan_terbaik': item.keputusan_terbaik,
                'skor_studi': item.skor_studi,
                'skor_kerja': item.skor_kerja,
                'skor_wirausaha': item.skor_wirausaha,
                'catatan_guru_bk': item.catatan_guru_bk
            })

    else:
        # --- QUERY USER SISWA (Siswa yang BELUM mengisi) ---
        # Subquery: Ambil ID siswa yang SUDAH mengisi di periode ini
        subquery = db.session.query(HasilRekomendasi.siswa_id) \
            .filter(HasilRekomendasi.periode_id == current_periode_id)

        query = User.query.filter(User.role == RoleEnum.siswa) \
            .filter(~User.id.in_(subquery))  # NOT IN subquery

        if search:
            query = query.filter(or_(
                User.name.ilike(f'%{search}%'),
                User.nisn.ilike(f'%{search}%')
            ))

        pagination = query.order_by(User.name.asc()) \
            .paginate(page=page, per_page=10, error_out=False)

        for user in pagination.items:
            data_items.append({
                'id': user.id,
                'name': user.name,
                'nisn': user.nisn,
                'jurusan': {
                    'nama_jurusan': user.jurusan.nama_jurusan if user.jurusan else '-'
                },
                'kelas': user.kelas_saat_ini.value if hasattr(user.kelas_saat_ini, 'value') else str(
                    user.kelas_saat_ini),
                'status': 'Belum Mengisi'
            })

    # 4. Format Pagination Response
    # Kita kirim params filter kembali agar link pagination valid
    response_results = paginate_response(pagination, 'monitoring.index', search=search, status=status,
                                         periode_id=current_periode_id)
    response_results['data'] = data_items

    # 5. List Periode untuk Dropdown
    all_periodes = Periode.query.order_by(desc(Periode.is_active), desc(Periode.nama_periode)).all()
    periodes_data = [{'id': p.id, 'nama_periode': p.nama_periode, 'is_active': p.is_active} for p in all_periodes]

    return jsonify({
        'results': response_results,
        'periodes': periodes_data
    })


# --- UPDATE CATATAN (Sesuai URL Frontend) ---
@monitoring_bp.route('/<int:id>/catatan', methods=['POST'], strict_slashes=False)
@jwt_required()
def update_catatan(id):
    """
    id: ID dari HasilRekomendasi (bukan User ID)
    """
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'pakar']:
        return jsonify({'msg': 'Akses ditolak'}), 403

    data = request.get_json()
    catatan = data.get('catatan_guru_bk')

    hasil = HasilRekomendasi.query.get_or_404(id)
    hasil.catatan_guru_bk = catatan

    db.session.commit()

    return jsonify({'msg': 'Catatan berhasil diperbarui', 'data': {
        'id': hasil.id,
        'catatan': hasil.catatan_guru_bk
    }}), 200