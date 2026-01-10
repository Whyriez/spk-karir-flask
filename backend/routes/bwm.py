from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Kriteria, BwmComparison, BobotKriteria, User, RoleEnum
import math

bwm_bp = Blueprint('bwm', __name__)


# --- HELPER: LOGIKA PERHITUNGAN BWM (Simple Geometric Mean) ---
def calculate_bwm_weights(criteria_codes, best_code, worst_code, best_to_others, others_to_worst):
    """
    Menerjemahkan logika dari App/Services/BwmService.php Laravel
    """
    # 1. Step A: Estimasi Bobot Jalur 1 (Best-to-Others)
    # w_j = 1 / A_Bj
    weights1 = {}
    for code in criteria_codes:
        # Jika code == best_code, nilainya 1. Jika tidak ada di input, default 9 (sangat tidak penting)
        if code == best_code:
            val = 1.0
        else:
            # Pastikan key ada dan dikonversi ke float
            val = float(best_to_others.get(str(code), 9))

        weights1[code] = 1.0 / val

    # 2. Step B: Estimasi Bobot Jalur 2 (Others-to-Worst)
    # w_j = A_jW * w_W_estimasi
    # Kita ambil w_W estimasi dari hasil Step A
    w_worst_estimasi = weights1.get(worst_code, 0.1)

    weights2 = {}
    for code in criteria_codes:
        if code == worst_code:
            val = 1.0
        else:
            val = float(others_to_worst.get(str(code), 1))

        weights2[code] = val * w_worst_estimasi

    # 3. Step C: Gabungkan (Geometric Mean)
    final_raw_weights = {}
    for code in criteria_codes:
        w1 = weights1[code]
        w2 = weights2[code]
        final_raw_weights[code] = math.sqrt(w1 * w2)

    # 4. Step D: Normalisasi (Total = 1)
    total_score = sum(final_raw_weights.values())
    normalized_weights = {}
    for code, val in final_raw_weights.items():
        normalized_weights[code] = val / total_score

    return normalized_weights


# --- ROUTE: SIMPAN & HITUNG ---
@bwm_bp.route('/save', methods=['POST'])
@jwt_required()
def save_bwm():
    claims = get_jwt()
    # Pastikan hanya Pakar atau Admin yang bisa akses
    if claims.get('role') not in ['pakar', 'admin']:
        return jsonify({'msg': 'Akses ditolak. Hanya Pakar.'}), 403

    user_id = get_jwt_identity()
    data = request.get_json()

    # Data dari Frontend
    best_id = data.get('best_criterion_id')
    worst_id = data.get('worst_criterion_id')

    # Input dictionary: {'ID_Kriteria': Nilai}
    # Contoh: {'1': 2, '3': 9}
    best_to_others_input = data.get('best_to_others', {})
    others_to_worst_input = data.get('others_to_worst', {})

    if not best_id or not worst_id:
        return jsonify({'msg': 'Kriteria Best dan Worst harus dipilih'}), 400

    try:
        # 1. Ambil semua kriteria untuk mapping ID ke Kode
        all_kriteria = Kriteria.query.all()
        kriteria_map = {str(k.id): k.kode for k in all_kriteria}  # {'1': 'C1', '2': 'C2'}
        code_to_id = {k.kode: k.id for k in all_kriteria}

        criteria_codes = list(kriteria_map.values())
        best_code = kriteria_map.get(str(best_id))
        worst_code = kriteria_map.get(str(worst_id))

        # 2. Mapping Input ID ke Input Kode (karena fungsi calc pakai kode)
        bto_mapped = {}
        otw_mapped = {}

        for kid, val in best_to_others_input.items():
            if str(kid) in kriteria_map:
                bto_mapped[kriteria_map[str(kid)]] = val

        for kid, val in others_to_worst_input.items():
            if str(kid) in kriteria_map:
                otw_mapped[kriteria_map[str(kid)]] = val

        # 3. Hitung Bobot
        final_weights = calculate_bwm_weights(
            criteria_codes, best_code, worst_code, bto_mapped, otw_mapped
        )

        # 4. Simpan ke Database
        # A. Simpan History Input (BwmComparison) - Opsional, untuk log
        # (Kita skip detail ini agar kode ringkas, langsung simpan bobot saja)

        # B. Simpan Bobot (BobotKriteria)
        # Hapus bobot lama dari user/jurusan ini (Reset)
        # Di sini kita asumsikan bobot berlaku global atau per jurusan user (sesuaikan kebutuhan)

        # Cek user pakar jurusan apa
        pakar = User.query.get(user_id)
        jurusan_id = pakar.jurusan_id  # Bisa NULL jika guru BK (Umum)

        # Hapus bobot lama untuk jurusan ini (atau null jika umum)
        if jurusan_id:
            BobotKriteria.query.filter_by(jurusan_id=jurusan_id).delete()
        else:
            # Jika Guru BK (Umum), mungkin menghapus bobot default/umum
            BobotKriteria.query.filter(BobotKriteria.jurusan_id.is_(None)).delete()

        # Insert Bobot Baru
        for code, weight_val in final_weights.items():
            k_id = code_to_id[code]
            bk = BobotKriteria(
                kriteria_id=k_id,
                jurusan_id=jurusan_id,
                nilai_bobot=weight_val
            )
            db.session.add(bk)

        db.session.commit()

        return jsonify({
            'msg': 'Perhitungan BWM selesai dan bobot disimpan!',
            'results': final_weights
        }), 200

    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'msg': 'Terjadi kesalahan perhitungan: ' + str(e)}), 500