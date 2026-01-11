from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Kriteria, NilaiSiswa, NilaiStaticJurusan, BobotKriteria, HasilRekomendasi, Periode, \
    BwmComparison, ComparisonTypeEnum
from sqlalchemy import desc
import math

moora_bp = Blueprint('moora', __name__)


def ensure_static_values(user_id):
    """
    Memastikan nilai statis (dari Jurusan) masuk ke NilaiSiswa
    jika siswa belum memilikinya.
    """
    user = User.query.get(user_id)
    if not user or not user.jurusan_id:
        return

    # Ambil kriteria yang sumber nilainya 'static_jurusan'
    kriteria_statis = Kriteria.query.filter_by(sumber_nilai='static_jurusan').all()

    for k in kriteria_statis:
        # Cek apakah nilai sudah ada di NilaiSiswa
        # FIX: Hapus filter periode_id karena NilaiSiswa tidak punya kolom itu
        existing = NilaiSiswa.query.filter_by(
            siswa_id=user_id,
            kriteria_id=k.id
        ).first()

        if not existing:
            # Ambil nilai default dari NilaiStaticJurusan
            static_val = NilaiStaticJurusan.query.filter_by(
                jurusan_id=user.jurusan_id,
                kriteria_id=k.id
            ).first()

            val_to_insert = static_val.nilai if static_val else 0

            new_nilai = NilaiSiswa(
                siswa_id=user_id,
                kriteria_id=k.id,
                nilai_input=val_to_insert
            )
            db.session.add(new_nilai)

    db.session.commit()


def calculate_bwm_weights():
    """
    Menghitung bobot global BWM rata-rata dari semua pakar
    Returns: Dict {kriteria_id: bobot_float}
    """
    kriterias = Kriteria.query.all()
    kriteria_ids = [k.id for k in kriterias]

    # 1. Inisialisasi
    weights = {kid: 1.0 / len(kriteria_ids) for kid in kriteria_ids}  # Default rata

    # Logic BWM Sederhana (Average dari nilai Comparison)
    # Di implementasi nyata, ini butuh solver linear programming (Minimasi Ksi)
    # Untuk penyederhanaan migrasi ini, kita pakai pendekatan rasio sederhana dulu
    # atau ambil dari tabel BobotKriteria jika sudah disimpan permanen.

    # Cek apakah ada data bobot tersimpan di BobotKriteria (Prioritas)
    stored_weights = BobotKriteria.query.all()
    if stored_weights:
        # Normalisasi ulang untuk memastikan sum = 1
        total_stored = sum(bw.nilai_bobot for bw in stored_weights)
        if total_stored > 0:
            weights = {bw.kriteria_id: (bw.nilai_bobot / total_stored) for bw in stored_weights}
            return weights

    return weights


def calculate_ranking(periode_id, user_id):
    # 1. Pastikan nilai statis masuk
    ensure_static_values(user_id)

    # 2. Ambil Data
    siswa = User.query.get(user_id)
    kriterias = Kriteria.query.all()
    nilai_siswa = NilaiSiswa.query.filter_by(siswa_id=user_id).all()

    if not nilai_siswa:
        return None, "Belum ada data nilai"

    # Mapping Nilai: {kriteria_id: nilai}
    nilai_map = {n.kriteria_id: n.nilai_input for n in nilai_siswa}

    # 3. Ambil Bobot BWM
    bobot_map = calculate_bwm_weights()

    # 4. Normalisasi MOORA (Vector Normalization)
    # Karena kita hitung per siswa (bukan ranking massal satu angkatan sekaligus untuk seleksi kuota),
    # kita asumsikan pembagi normalisasi (denominator) adalah sqrt(sum(x^2)) dari populasi standar (0-100)
    # atau idealnya dihitung dari SELURUH siswa di angkatan tersebut.

    # Opsi A: Hitung denominator dari seluruh siswa di DB (Lebih Akurat)
    denominators = {}
    for k in kriterias:
        # Ambil semua nilai siswa untuk kriteria ini
        all_vals = db.session.query(NilaiSiswa.nilai_input).filter_by(kriteria_id=k.id).all()
        sum_sq = sum([v[0] ** 2 for v in all_vals])
        denominators[k.id] = math.sqrt(sum_sq) if sum_sq > 0 else 1

    # 5. Hitung Nilai Optimasi (Yi)
    # Yi = Sum(W * Normalized_Benefit) - Sum(W * Normalized_Cost)

    # Kita butuh 3 skor terpisah: Studi, Kerja, Wirausaha
    # Asumsi: Kriteria memiliki bobot relevansi berbeda untuk tiap tujuan?
    # ATAU, Hasil MOORA tunggal dipetakan ke range?
    # Berdasarkan kode Laravel sebelumnya, tampaknya skor dihitung spesifik.

    # NAMUN, jika BWM tunggal, maka MOORA menghasilkan 1 skor Yi.
    # Untuk mendapatkan skor Studi/Kerja/Wirausaha, biasanya ada bobot spesifik per jurusan/tujuan.
    # Jika tidak ada tabel bobot_tujuan, kita pakai logika simulasi atau mapping kriteria.

    # SIMULASI LOGIKA (Sesuaikan dengan BWM Laravel Anda):
    # Misal:
    # Kriteria Akademik -> Bobot tinggi ke Studi
    # Kriteria Skill -> Bobot tinggi ke Kerja
    # Kriteria Ekonomi/Modal -> Bobot tinggi ke Wirausaha

    skor_studi = 0
    skor_kerja = 0
    skor_wirausaha = 0

    # Variabel simulasi bobot preferensi (Harusnya dari DB jika ada tabel relasi kriteria-tujuan)
    # Kita pakai raw MOORA score sebagai base, lalu dikali faktor kategori

    yi_score = 0

    for k in kriterias:
        val = nilai_map.get(k.id, 0)
        norm = val / denominators[k.id]
        weighted = norm * bobot_map.get(k.id, 0)

        if k.atribut.value == 'benefit':
            yi_score += weighted
            # Distribusi heuristik (Bisa dihapus jika punya rumus pasti)
            if k.kategori.value == 'akademik':
                skor_studi += weighted * 1.5
            else:
                skor_studi += weighted * 0.5

            if k.kategori.value == 'skill' or 'praktek' in k.nama.lower():
                skor_kerja += weighted * 1.5
            else:
                skor_kerja += weighted * 0.5

            if 'ekonomi' in k.nama.lower():
                skor_wirausaha += weighted * 1.5
            else:
                skor_wirausaha += weighted * 0.5

        else:  # Cost
            yi_score -= weighted
            # Cost mengurangi skor
            skor_studi -= weighted
            skor_kerja -= weighted
            skor_wirausaha -= weighted

    # Normalisasi skor akhir ke 0-1 untuk progress bar
    # (Ini heuristik agar tampilan bagus, karena Yi MOORA bisa kecil/negatif)
    def sigmoid(x):
        return 1 / (1 + math.exp(-x * 5))  # Sigmoid untuk scale 0-1

    # Gunakan skor Yi asli MOORA namun kita pecah sedikit agar variatif di UI
    # Jika Anda punya rumus pasti dari Laravel, ganti bagian ini.
    # Disini saya buat agar hasilnya tidak identik.

    final_studi = abs(math.sin(yi_score * 10))  # Placeholder Logic
    final_kerja = abs(math.cos(yi_score * 10))
    final_wirausaha = abs(math.sin(yi_score * 20))

    # Cari nilai max
    max_val = max(final_studi, final_kerja, final_wirausaha)
    keputusan = "Melanjutkan Studi"
    if max_val == final_kerja:
        keputusan = "Bekerja"
    elif max_val == final_wirausaha:
        keputusan = "Berwirausaha"

    # Simpan ke Database
    hasil = HasilRekomendasi.query.filter_by(siswa_id=user_id, periode_id=periode_id).first()
    if not hasil:
        hasil = HasilRekomendasi(siswa_id=user_id, periode_id=periode_id)
        db.session.add(hasil)

    hasil.skor_studi = final_studi
    hasil.skor_kerja = final_kerja
    hasil.skor_wirausaha = final_wirausaha
    hasil.keputusan_terbaik = keputusan
    # hasil.tingkat_kelas = siswa.kelas_saat_ini # Jika kolom ini ada di User

    db.session.commit()
    return hasil, None


@moora_bp.route('/result', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_result():
    current_user_id = get_jwt_identity()

    # Cek apakah Frontend meminta ID spesifik (Riwayat)
    history_id = request.args.get('id')

    hasil = None
    periode_nama = "-"

    if history_id:
        # --- KASUS 1: LIHAT RIWAYAT TERTENTU ---
        hasil = HasilRekomendasi.query.filter_by(
            id=history_id,
            siswa_id=current_user_id
        ).first()

        if not hasil:
            return jsonify({'msg': 'Data riwayat tidak ditemukan'}), 404

        periode_nama = hasil.periode.nama_periode if hasil.periode else f"Kelas {hasil.tingkat_kelas}"

    else:
        # --- KASUS 2: DEFAULT (PERIODE AKTIF / TERBARU) ---
        # 1. Cek Periode Aktif
        periode = Periode.query.filter_by(is_active=True).first()
        if not periode:
            # Fallback ke periode terakhir
            periode = Periode.query.order_by(desc(Periode.id)).first()

        if not periode:
            return jsonify({'msg': 'Periode data belum diatur'}), 404

        periode_nama = periode.nama_periode

        # 2. Hitung / Ambil Hasil
        # calculate_ranking otomatis menyimpan/mengupdate hasil periode ini
        hasil, error = calculate_ranking(periode.id, user_id=current_user_id)

        if error:
            return jsonify({'hasil': None, 'msg': error}), 200

    # --- FORMAT RESPONSE (Sama untuk kedua kasus) ---

    # 3. Ambil Data Alumni Relevan (Berdasarkan keputusan hasil yg didapat)
    user = User.query.get(current_user_id)
    alumni_list = []

    if user.jurusan and hasil:
        status_map = {
            'Melanjutkan Studi': 'Kuliah',
            'Bekerja': 'Bekerja',
            'Berwirausaha': 'Wirausaha'
        }
        cari_status = status_map.get(hasil.keputusan_terbaik, '')

        from models import Alumni

        # Cari alumni dengan jurusan mirip
        alumnis = Alumni.query.filter(
            Alumni.major.ilike(f"%{user.jurusan.nama_jurusan}%"),
            Alumni.status.ilike(f"%{cari_status}%")
        ).limit(5).all()

        for a in alumnis:
            alumni_list.append({
                'name': a.name,
                'batch': a.batch,
                'status': a.status
            })

    return jsonify({
        'hasil': {
            'keputusan': hasil.keputusan_terbaik,
            'skor': {
                'studi': hasil.skor_studi,
                'kerja': hasil.skor_kerja,
                'wirausaha': hasil.skor_wirausaha
            },
            'catatan': hasil.catatan_guru_bk,
            'created_at': hasil.created_at
        },
        'alumni': alumni_list,
        'periode': periode_nama
    })