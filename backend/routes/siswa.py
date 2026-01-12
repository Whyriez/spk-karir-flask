from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Kriteria, NilaiSiswa, User, Jurusan, Pertanyaan, HasilRekomendasi, Periode, RiwayatKelas
import json

siswa_bp = Blueprint('siswa', __name__)


# --- GET FORM DATA (Kriteria & Existing Values) ---
@siswa_bp.route('/form', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_form():
    current_user_id = get_jwt_identity()

    # --- CEK ELIGIBILITY (BARU) ---
    periode_aktif = Periode.query.filter_by(is_active=True).first()
    is_eligible = False
    status_message = ""

    if periode_aktif:
        riwayat = RiwayatKelas.query.filter_by(
            siswa_id=current_user_id,
            periode_id=periode_aktif.id,
            status_akhir='Aktif'
        ).first()

        if riwayat:
            is_eligible = True
        else:
            status_message = "Anda tidak terdaftar aktif di periode ini (Mungkin sudah Lulus)."
    else:
        status_message = "Sistem sedang tidak menerima penilaian (Periode Non-Aktif)."

    # Jika tidak eligible, langsung return (Hemat resource)
    if not is_eligible:
        return jsonify({
            'is_eligible': False,
            'message': status_message,
            'data': []
        })

    # Ambil kriteria yang aktif & tampil di siswa
    kriterias = Kriteria.query.filter_by(
        sumber_nilai='input_siswa',
        tampil_di_siswa=True
    ).order_by(Kriteria.kode.asc()).all()

    # Ambil nilai lama jika ada (untuk edit)
    nilai_lama = NilaiSiswa.query.filter_by(siswa_id=current_user_id).all()
    # Note: Logic ambil nilai lama mungkin perlu disesuaikan jika ingin per-pertanyaan,
    # tapi untuk sekarang kita biarkan kosong atau load logic agregat jika perlu.
    # Namun, karena frontend values sekarang berbasis ID Pertanyaan,
    # idealnya kita load history jawaban per pertanyaan (jika fitur save draft ada).
    # Untuk simpelnya, kita return form kosong/default dulu atau nilai agregat.

    # Kita siapkan data kriteria
    data = []
    for k in kriterias:
        # Parsing JSON opsi_pilihan jika berupa string (safety check)
        opsi = k.opsi_pilihan
        if isinstance(opsi, str):
            try:
                opsi = json.loads(opsi)
            except:
                opsi = []

        # Ambil daftar pertanyaan aktif
        list_pertanyaan = []
        if hasattr(k, 'list_pertanyaan'):
            for p in k.list_pertanyaan:
                if p.is_active:
                    list_pertanyaan.append({
                        'id': p.id,
                        'teks': p.teks
                    })

        data.append({
            'id': k.id,
            'kode': k.kode,
            'nama': k.nama,
            # 'pertanyaan': k.pertanyaan,  <-- HAPUS INI (Penyebab Error)
            'list_pertanyaan': list_pertanyaan,  # <-- GANTI DENGAN INI
            'tipe_input': k.tipe_input.value if hasattr(k.tipe_input, 'value') else str(k.tipe_input),
            'atribut': k.atribut.value if hasattr(k.atribut, 'value') else str(k.atribut),
            'kategori': k.kategori.value if hasattr(k.kategori, 'value') else str(k.kategori),
            'opsi_pilihan': opsi,
            'skala_maks': k.skala_maks,
            'value': None  # Placeholder
        })

    return jsonify({'is_eligible': True, 'data': data})


# --- SAVE VALUES ---
@siswa_bp.route('/save', methods=['POST'])
@jwt_required()
def save_nilai():
    user_id = get_jwt_identity()

    # --- VALIDASI STATUS SISWA (BARU) ---
    periode_aktif = Periode.query.filter_by(is_active=True).first()
    if not periode_aktif:
        return jsonify({'msg': 'Tidak ada periode tahun ajaran yang aktif.'}), 400

    # Cek apakah siswa terdaftar & aktif di periode ini?
    riwayat = RiwayatKelas.query.filter_by(
        siswa_id=user_id,
        periode_id=periode_aktif.id,
        status_akhir='Aktif'  # Hanya yang statusnya Aktif yang boleh input
    ).first()

    if not riwayat:
        # Cek apakah dia alumni (Lulus di periode sebelumnya)
        # Atau memang belum didaftarkan admin
        return jsonify({
            'msg': 'Akses ditolak. Anda tidak terdaftar sebagai siswa aktif pada periode ini atau sudah dinyatakan Lulus.'
        }), 403
    # ------------------------------------

    data = request.get_json()
    values = data.get('values', {})

    temp_scores = {}
    snapshot_data = []

    # if not input_values:
    #     return jsonify({'msg': 'Tidak ada data yang dikirim'}), 400

    try:
        # Kita gunakan strategi "Delete All Insert New" atau "Update or Create"
        # Agar simpel dan aman, kita loop update/insert

        for key, val in values.items():
            # Frontend disarankan mengirim ID pertanyaan sebagai key, misal "p_12" atau angka 12
            # Jika key adalah ID Pertanyaan (int)
            try:
                p_id = int(key)
                pertanyaan = Pertanyaan.query.get(p_id)
                if pertanyaan:
                    k_id = pertanyaan.kriteria_id

                    # Masukkan ke temp list untuk dirata-rata
                    if k_id not in temp_scores:
                        temp_scores[k_id] = []
                    temp_scores[k_id].append(float(val))

                    # Siapkan Snapshot Data (PENTING UNTUK RIWAYAT)
                    snapshot_data.append({
                        'kriteria_kode': pertanyaan.kriteria.kode,
                        'kriteria_nama': pertanyaan.kriteria.nama,
                        'pertanyaan_teks': pertanyaan.teks,
                        'jawaban_nilai': val
                    })
            except ValueError:
                continue

        for k_id, scores in temp_scores.items():
            avg_score = sum(scores) / len(scores)

            nilai_obj = NilaiSiswa.query.filter_by(siswa_id=user_id, kriteria_id=k_id).first()
            if not nilai_obj:
                nilai_obj = NilaiSiswa(siswa_id=user_id, kriteria_id=k_id)
                db.session.add(nilai_obj)

            nilai_obj.nilai_input = avg_score

        if periode_aktif:
            hasil = HasilRekomendasi.query.filter_by(siswa_id=user_id, periode_id=periode_aktif.id).first()
            if not hasil:
                hasil = HasilRekomendasi(siswa_id=user_id, periode_id=periode_aktif.id)
                db.session.add(hasil)

            hasil.detail_snapshot = snapshot_data
            hasil.tingkat_kelas = riwayat.tingkat_kelas

        db.session.commit()
        return jsonify({'msg': 'Data berhasil disimpan!'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Gagal menyimpan: ' + str(e)}), 500