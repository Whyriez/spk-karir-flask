import click
import json
from flask.cli import with_appcontext
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError

from models import db, User, Jurusan, Kriteria, Setting, Periode, HasilRekomendasi, KelasEnum


@click.command(name='seed_db')
@with_appcontext
def seed_db():
    """Seed the database with initial data matching Laravel seeders."""
    print("🌱 Starting Database Seeding...")

    # 1. Seed Jurusan
    seed_jurusan()

    # 2. Seed Kriteria
    seed_kriteria()

    # 3. Seed Users (Admin, Pakar, Siswa)
    seed_users()

    # 4. Seed Settings
    seed_settings()

    # 5. Seed History/Periode (Simulasi)
    seed_history()

    print("✅ Database seeding completed successfully!")


def seed_jurusan():
    print("   ↳ Seeding Jurusan...")
    jurusan_data = [
        {'kode': 'TKJ', 'nama': 'Teknik Komputer dan Jaringan'},
        {'kode': 'RPL', 'nama': 'Rekayasa Perangkat Lunak'},
        {'kode': 'MM', 'nama': 'Multimedia'},
        {'kode': 'AKL', 'nama': 'Akuntansi dan Keuangan Lembaga'},
        {'kode': 'OTKP', 'nama': 'Otomatisasi Tata Kelola Perkantoran'},
    ]

    for item in jurusan_data:
        if not Jurusan.query.filter_by(kode_jurusan=item['kode']).first():
            j = Jurusan(kode_jurusan=item['kode'], nama_jurusan=item['nama'])
            db.session.add(j)
    db.session.commit()


def seed_kriteria():
    print("   ↳ Seeding Kriteria (8 Kriteria sesuai Proposal)...")
    kriteria_list = [
        # KELOMPOK 1: DATA AKADEMIK & EKONOMI
        {
            'kode': 'C1', 'nama': 'Nilai Akademik',
            'pertanyaan': 'Masukkan nilai rata-rata rapor Anda (Skala 0-100).',
            'tipe': 'number', 'kategori': 'akademik', 'sumber': 'input_siswa',
            'opsi': None, 'pj': 'umum'
        },
        {
            'kode': 'C4', 'nama': 'Kondisi Ekonomi',
            'pertanyaan': 'Pilih rentang penghasilan orang tua per bulan.',
            'tipe': 'select', 'kategori': 'akademik', 'sumber': 'input_siswa',
            'opsi': json.dumps([
                {'val': 1, 'label': 'Kurang Mampu (< 1 Juta)'},
                {'val': 2, 'label': 'Cukup (1 - 3 Juta)'},
                {'val': 3, 'label': 'Sedang (3 - 5 Juta)'},
                {'val': 4, 'label': 'Mampu (5 - 10 Juta)'},
                {'val': 5, 'label': 'Sangat Mampu (> 10 Juta)'}
            ]), 'pj': 'gurubk'
        },
        {
            'kode': 'C6', 'nama': 'Ketersediaan Lapangan Kerja',
            'pertanyaan': None,  # Diisi otomatis oleh sistem berdasarkan jurusan
            'tipe': 'number', 'kategori': 'akademik', 'sumber': 'static_jurusan',
            'opsi': None, 'pj': 'kaprodi'
        },
        # KELOMPOK 2: KUESIONER MINAT (GURU BK)
        {
            'kode': 'C2', 'nama': 'Minat Lanjut Studi',
            'pertanyaan': 'Seberapa besar keinginan dan rencana Anda untuk melanjutkan pendidikan ke Perguruan Tinggi (Kuliah)?',
            'tipe': 'likert', 'kategori': 'kuesioner', 'sumber': 'input_siswa',
            'opsi': None, 'pj': 'gurubk'
        },
        {
            'kode': 'C3', 'nama': 'Minat Lanjut Kerja',
            'pertanyaan': 'Seberapa siap Anda secara mental dan skill untuk langsung bekerja di dunia industri setelah lulus?',
            'tipe': 'likert', 'kategori': 'kuesioner', 'sumber': 'input_siswa',
            'opsi': None, 'pj': 'gurubk'
        },
        {
            'kode': 'C5', 'nama': 'Motivasi & Dukungan Ortu',
            'pertanyaan': 'Seberapa besar dukungan orang tua dan motivasi diri Anda terhadap pilihan karir yang akan diambil?',
            'tipe': 'likert', 'kategori': 'kuesioner', 'sumber': 'input_siswa',
            'opsi': None, 'pj': 'gurubk'
        },
        # KELOMPOK 3: KUESIONER WIRAUSAHA (KAPRODI)
        {
            'kode': 'C7', 'nama': 'Minat Wirausaha',
            'pertanyaan': 'Seberapa besar ketertarikan Anda untuk memulai dan mengelola bisnis/usaha sendiri?',
            'tipe': 'likert', 'kategori': 'kuesioner', 'sumber': 'input_siswa',
            'opsi': None, 'pj': 'kaprodi'
        },
        {
            'kode': 'C8', 'nama': 'Ketersediaan Modal/Aset',
            'pertanyaan': 'Seberapa siap ketersediaan modal atau aset awal (tempat/alat) jika Anda memutuskan untuk berwirausaha?',
            'tipe': 'likert', 'kategori': 'kuesioner', 'sumber': 'input_siswa',
            'opsi': None, 'pj': 'kaprodi'
        },
    ]

    for data in kriteria_list:
        k = Kriteria.query.filter_by(kode=data['kode']).first()
        if not k:
            k = Kriteria(kode=data['kode'])

        # Update/Set data sesuai proposal
        k.nama = data['nama']
        k.pertanyaan = data['pertanyaan']
        k.tipe_input = data['tipe']
        k.opsi_pilihan = data['opsi']
        k.kategori = data['kategori']
        k.sumber_nilai = data['sumber']
        k.penanggung_jawab = data['pj']  # Penanggung jawab untuk filter BWM
        k.atribut = 'benefit'  # Sesuai proposal Hal. 75

        db.session.add(k)

    db.session.commit()


def seed_users():
    print("   ↳ Seeding Users...")

    # Helper function
    def create_user_if_not_exists(data):
        if not User.query.filter_by(username=data['username']).first():
            u = User(**data)
            db.session.add(u)

    # 1. Admin
    create_user_if_not_exists({
        'name': 'Administrator Sistem', 'email': 'admin@smk.id', 'username': 'admin',
        'password': generate_password_hash('123'), 'role': 'admin', 'jenis_pakar': None
    })

    # 2. Pakar Guru BK
    create_user_if_not_exists({
        'name': 'Ibu Guru BK', 'email': 'gurubk@smk.id', 'username': 'gurubk',
        'password': generate_password_hash('123'), 'role': 'pakar', 'jenis_pakar': 'gurubk'
    })

    # 3. Pakar Kaprodi (Link ke Jurusan ID 1 -> TKJ)
    jurusan_tkj = Jurusan.query.filter_by(kode_jurusan='TKJ').first()
    create_user_if_not_exists({
        'name': 'Bapak Kaprodi TKJ', 'email': 'kaprodi@smk.id', 'username': 'kaprodi',
        'password': generate_password_hash('123'), 'role': 'pakar', 'jenis_pakar': 'kaprodi',
        'jurusan_id': jurusan_tkj.id if jurusan_tkj else None
    })

    # 4. Siswa Kelas 12
    create_user_if_not_exists({
        'name': 'Alim Suma (Kls 12)',
        'email': 'alim@student.ung.ac.id',
        'username': 'siswa12',
        'password': generate_password_hash('123'),
        'role': 'siswa',
        'nisn': '531422058',
        'kelas_saat_ini': '12',  # Kirim string murni saja
        'jurusan_id': jurusan_tkj.id if jurusan_tkj else None
    })

    # 5. Siswa Kelas 10
    create_user_if_not_exists({
        'name': 'Budi Santoso (Kls 10)',
        'email': 'budi@smk.id',
        'username': 'siswa10',
        'password': generate_password_hash('123'),
        'role': 'siswa',
        'nisn': '123456789',
        'kelas_saat_ini': '10',  # Kirim string murni saja
        'jurusan_id': jurusan_tkj.id if jurusan_tkj else None
    })

    db.session.commit()


def seed_settings():
    print("   ↳ Seeding Settings...")
    settings = [
        {'key': 'nama_sekolah', 'value': 'SMKN 1 Gorontalo'},
        {'key': 'auto_periode', 'value': 'false'}
    ]
    for s in settings:
        if not Setting.query.filter_by(key=s['key']).first():
            db.session.add(Setting(key=s['key'], value=s['value']))
    db.session.commit()


def seed_history():
    print("   ↳ Seeding History & Periode...")
    # 1. Buat Periode
    p_data = [
        {'nama': 'TA 2022/2023 (Kelas 10)', 'active': False},
        {'nama': 'TA 2023/2024 (Kelas 11)', 'active': False},
        {'nama': 'TA 2024/2025 (Kelas 12)', 'active': True},
    ]

    periodes = []
    for p in p_data:
        periode = Periode.query.filter_by(nama_periode=p['nama']).first()
        if not periode:
            periode = Periode(nama_periode=p['nama'], is_active=p['active'])
            db.session.add(periode)
            db.session.commit()  # Commit per create to get ID
        periodes.append(periode)

    # 2. Simulasi Hasil untuk Siswa 'siswa12'
    siswa = User.query.filter_by(username='siswa12').first()
    if siswa:
        if HasilRekomendasi.query.filter_by(siswa_id=siswa.id).count() == 0:
            # Kelas 10
            db.session.add(HasilRekomendasi(
                siswa_id=siswa.id, periode_id=periodes[0].id,
                tingkat_kelas=KelasEnum.kelas_10.value,  # TAMBAHKAN .value
                skor_studi=0.4, skor_kerja=0.4, skor_wirausaha=0.3,
                keputusan_terbaik='Bekerja'
            ))
            # Kelas 11
            db.session.add(HasilRekomendasi(
                siswa_id=siswa.id, periode_id=periodes[1].id,
                tingkat_kelas=KelasEnum.kelas_11.value,  # TAMBAHKAN .value
                skor_studi=0.6, skor_kerja=0.45, skor_wirausaha=0.35,
                keputusan_terbaik='Melanjutkan Studi'
            ))
            # Kelas 12
            db.session.add(HasilRekomendasi(
                siswa_id=siswa.id, periode_id=periodes[2].id,
                tingkat_kelas=KelasEnum.kelas_12.value,  # TAMBAHKAN .value
                skor_studi=0.85, skor_kerja=0.5, skor_wirausaha=0.4,
                keputusan_terbaik='Melanjutkan Studi',
                catatan_guru_bk='Sangat direkomendasikan masuk Teknik Informatika.'
            ))
            db.session.commit()


@click.command(name='migrate_fresh')  # Nama command dibuat mirip Laravel
@with_appcontext
def migrate_fresh():
    """Menghapus semua tabel dan membuat ulang (seperti migrate:fresh) lalu seeding."""
    print("⚠️  Warning: Dropping all tables...")
    db.drop_all()

    print("🛠️  Creating all tables from models...")
    db.create_all()

    print("🌱 Starting Database Seeding...")
    seed_jurusan()
    seed_kriteria()
    seed_users()
    seed_settings()
    seed_history()

    print("✅ Database has been reset and seeded successfully!")