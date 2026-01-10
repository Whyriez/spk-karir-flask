from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Alumni

alumni_bp = Blueprint('alumni', __name__)


@alumni_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def index():
    # Pagination & Search
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')

    query = Alumni.query
    if search:
        query = query.filter(Alumni.name.ilike(f'%{search}%'))

    pagination = query.order_by(Alumni.batch.desc()).paginate(page=page, per_page=10, error_out=False)

    data = []
    for a in pagination.items:
        data.append({
            'id': a.id,
            'name': a.name,
            'status': a.status,
            'batch': a.batch,
            'major': a.major
        })

    return jsonify({
        'data': data,
        'meta': {
            'page': page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })


@alumni_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def store():
    claims = get_jwt()
    if claims.get('role') != 'admin': return jsonify({'msg': 'Akses ditolak'}), 403

    data = request.get_json()
    try:
        new_a = Alumni(
            name=data['name'],
            status=data['status'],  # Kuliah / Kerja / Wirausaha
            batch=data['batch'],  # Tahun Lulus
            major=data['major']  # Nama Jurusan (String)
        )
        db.session.add(new_a)
        db.session.commit()
        return jsonify({'msg': 'Data alumni ditambah'}), 201
    except Exception as e:
        return jsonify({'msg': str(e)}), 400


@alumni_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update(id):
    claims = get_jwt()
    if claims.get('role') != 'admin': return jsonify({'msg': 'Akses ditolak'}), 403

    alumni = Alumni.query.get_or_404(id)
    data = request.get_json()

    alumni.name = data.get('name', alumni.name)
    alumni.status = data.get('status', alumni.status)
    alumni.batch = data.get('batch', alumni.batch)
    alumni.major = data.get('major', alumni.major)

    db.session.commit()
    return jsonify({'msg': 'Data alumni diperbarui'}), 200


@alumni_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def destroy(id):
    claims = get_jwt()
    if claims.get('role') != 'admin': return jsonify({'msg': 'Akses ditolak'}), 403

    alumni = Alumni.query.get_or_404(id)
    db.session.delete(alumni)
    db.session.commit()
    return jsonify({'msg': 'Data alumni dihapus'}), 200