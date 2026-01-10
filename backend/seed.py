from app import app
from models import (
    db, User, Jurusan, Kriteria, Setting,
    RoleEnum, KelasEnum, TipeInputEnum, AtributEnum,
    KategoriEnum, SumberNilaiEnum
)
from werkzeug.security import generate_password_hash
import json
from datetime import datetime


def seed_jurusan():
    print("🌱 Seeding Jurusan...")
    jurusan_data = [
        {'kode': 'TKJ', 'nama': 'Teknik Komputer dan Jaringan'},
        {'kode': 'RPL', 'nama': 'Rekayasa Perangkat Lunak'},
        {'kode': 'MM', 'nama': 'Multimedia'},
        {'kode': 'AKL', 'nama': 'Akuntansi dan Keuangan Lembaga'},
        {'kode': 'OTKP', 'nama': 'Otomatisasi Tata Kelola Perkantoran'},
    ]

    for data in jurusan_data:
        if not Jurusan.query.filter_by(kode_jurusan=data['kode']).first():
            new_jurusan = Jurusan(
                kode_jurusan=data['kode'],
                nama_jurusan=data['nama']
            )
            db.session.add(new_jurusan)
    db.session.commit()


def seed_kriteria():
    print("🌱 Seeding Kriteria...")

    # Data opsi untuk C4 (Ekonomi)
    opsi_ekonomi = [
        {'val': 1, 'label': 'Kurang Mampu (< 1 Juta)'},
        {'val': 2, 'label': 'Cukup (1 - 3 Juta)'},
        {'val': 3, 'label': 'Sedang (3 - 5 Juta)'},
        {'val': 4, 'label': 'Mampu (5 - 10 Juta)'},
        {'val': 5, 'label': 'Sangat Mampu (> 10 Juta)'}
    ]

    kriteria_list = [
        # C1: Nilai Akademik
        {
            'kode': 'C1', 'nama': 'Nilai Akademik',
            'pertanyaan': 'Masukkan nilai rata-rata rapor Anda (Skala 0-100).',
            'tipe_input': TipeInputEnum.number,
            'opsi_pilihan': None,
            'kategori': KategoriEnum.akademik,
            'sumber_nilai': SumberNilaiEnum.input_siswa,
            'atribut': AtributEnum.benefit
        },
        # C4: Kondisi Ekonomi
        {
            'kode': 'C4', 'nama': 'Kondisi Ekonomi',
            'pertanyaan': 'Pilih rentang penghasilan orang tua per bulan.',
            'tipe_input': TipeInputEnum.select,
            'opsi_pilihan': opsi_ekonomi,  # List of dicts, SQLAlchemy converts to JSON automatically
            'kategori': KategoriEnum.akademik,
            'sumber_nilai': SumberNilaiEnum.input_siswa,
            'atribut': AtributEnum.benefit
        },
        # C6: Ketersediaan Lapangan Kerja
        {
            'kode': 'C6', 'nama': 'Ketersediaan Lapangan Kerja',
            'pertanyaan': None,
            'tipe_input': TipeInputEnum.number,
            'opsi_pilihan': None,
            'kategori': KategoriEnum.akademik,
            'sumber_nilai': SumberNilaiEnum.static_jurusan,
            'atribut': AtributEnum.benefit
        },
        # C2: Minat Lanjut Studi
        {
            'kode': 'C2', 'nama': 'Minat Lanjut Studi',
            'pertanyaan': 'Seberapa besar keinginan dan rencana Anda untuk melanjutkan pendidikan ke Perguruan Tinggi (Kuliah)?',
            'tipe_input': TipeInputEnum.likert,
            'opsi_pilihan': None,
            'kategori': KategoriEnum.kuesioner,
            'sumber_nilai': SumberNilaiEnum.input_siswa,
            'atribut': AtributEnum.benefit
        },
        # C3: Minat Lanjut Kerja
        {
            'kode': 'C3', 'nama': 'Minat Lanjut Kerja',
            'pertanyaan': 'Seberapa siap Anda secara mental dan skill untuk langsung bekerja di dunia industri setelah lulus?',
            'tipe_input': TipeInputEnum.likert,
            'opsi_pilihan': None,
            'kategori': KategoriEnum.kuesioner,
            'sumber_nilai': SumberNilaiEnum.input_siswa,
            'atribut': AtributEnum.benefit
        },
        # C5: Motivasi & Dukungan Ortu
        {
            'kode': 'C5', 'nama': 'Motivasi & Dukungan Ortu',
            'pertanyaan': 'Seberapa besar dukungan orang tua dan motivasi diri Anda terhadap pilihan karir yang akan diambil?',
            'tipe_input': TipeInputEnum.likert,
            'opsi_pilihan': None,
            'kategori': KategoriEnum.kuesioner,
            'sumber_nilai': SumberNilaiEnum.input_siswa,
            'atribut': AtributEnum.benefit
        },
        # C7: Minat Wirausaha
        {
            'kode': 'C7', 'nama': 'Minat Wirausaha',
            'pertanyaan': 'Seberapa besar ketertarikan Anda untuk memulai dan mengelola bisnis/usaha sendiri?',
            'tipe_input': TipeInputEnum.likert,
            'opsi_pilihan': None,
            'kategori': KategoriEnum.kuesioner,
            'sumber_nilai': SumberNilaiEnum.input_siswa,
            'atribut': AtributEnum.benefit
        },
        # C8: Ketersediaan Modal/Aset
        {
            'kode': 'C8', 'nama': 'Ketersediaan Modal/Aset',
            'pertanyaan': 'Seberapa siap ketersediaan modal atau aset awal (tempat/alat) jika Anda memutuskan untuk berwirausaha?',
            'tipe_input': TipeInputEnum.likert,
            'opsi_pilihan': None,
            'kategori': KategoriEnum.kuesioner,
            'sumber_nilai': SumberNilaiEnum.input_siswa,
            'atribut': AtributEnum.benefit
        }
    ]

    for k in kriteria_list:
        if not Kriteria.query.filter_by(kode=k['kode']).first():
            new_kriteria = Kriteria(
                kode=k['kode'],
                nama=k['nama'],
                pertanyaan=k['pertanyaan'],
                tipe_input=k['tipe_input'],
                opsi_pilihan=k['opsi_pilihan'],
                kategori=k['kategori'],
                sumber_nilai=k['sumber_nilai'],
                atribut=k['atribut'],
                tampil_di_siswa=True,  # Default seeding
                penanggung_jawab=RoleEnum.admin  # Default
            )
            db.session.add(new_kriteria)
    db.session.commit()


def seed_users():
    print("🌱 Seeding Users...")

    # Helper to get Jurusan ID (assuming TKJ is id 1 usually, but let's query to be safe)
    jurusan_tkj = Jurusan.query.filter_by(kode_jurusan='TKJ').first()
    tkj_id = jurusan_tkj.id if jurusan_tkj else None

    users_data = [
        # 1. Admin
        {
            'name': 'Administrator Sistem',
            'email': 'admin@smk.id',
            'username': 'admin',
            'role': RoleEnum.admin,
            'jenis_pakar': None,
            'jurusan_id': None,
            'kelas': KelasEnum.kelas_10,  # Default filler
            'nisn': None
        },
        # 2. Pakar: Guru BK
        {
            'name': 'Ibu Guru BK',
            'email': 'gurubk@smk.id',
            'username': 'gurubk',
            'role': RoleEnum.pakar,
            'jenis_pakar': 'gurubk',
            'jurusan_id': None,
            'kelas': KelasEnum.kelas_10,
            'nisn': None
        },
        # 3. Pakar: Kaprodi
        {
            'name': 'Bapak Kaprodi TKJ',
            'email': 'kaprodi@smk.id',
            'username': 'kaprodi',
            'role': RoleEnum.pakar,
            'jenis_pakar': 'kaprodi',
            'jurusan_id': tkj_id,
            'kelas': KelasEnum.kelas_10,
            'nisn': None
        },
        # 4. Siswa Kls 12
        {
            'name': 'Alim Suma (Kls 12)',
            'email': 'alim@student.ung.ac.id',
            'username': 'siswa12',
            'role': RoleEnum.siswa,
            'jenis_pakar': None,
            'jurusan_id': tkj_id,
            'kelas': KelasEnum.kelas_12,
            'nisn': '531422058'
        },
        # 5. Siswa Kls 10
        {
            'name': 'Budi Santoso (Kls 10)',
            'email': 'budi@smk.id',
            'username': 'siswa10',
            'role': RoleEnum.siswa,
            'jenis_pakar': None,
            'jurusan_id': tkj_id,
            'kelas': KelasEnum.kelas_10,
            'nisn': '123456789'
        }
    ]

    for u in users_data:
        if not User.query.filter_by(username=u['username']).first():
            new_user = User(
                name=u['name'],
                email=u['email'],
                username=u['username'],
                password=generate_password_hash('123'),  # Default password '123' hashed
                role=u['role'],
                jenis_pakar=u['jenis_pakar'],
                jurusan_id=u['jurusan_id'],
                kelas_saat_ini=u['kelas'],
                nisn=u['nisn']
            )
            db.session.add(new_user)
    db.session.commit()


def seed_settings():
    print("🌱 Seeding Settings...")

    settings = [
        {'key': 'nama_sekolah', 'value': 'SMKN 1 Gorontalo'},
        {'key': 'auto_periode', 'value': 'false'}
    ]

    for s in settings:
        existing = Setting.query.filter_by(key=s['key']).first()
        if not existing:
            new_setting = Setting(key=s['key'], value=s['value'])
            db.session.add(new_setting)
        else:
            existing.value = s['value']  # UpdateOrcreate logic

    db.session.commit()


if __name__ == '__main__':
    with app.app_context():
        print("🚀 Starting Database Seeding...")
        seed_jurusan()
        seed_kriteria()
        seed_users()
        seed_settings()
        print("✅ Database Seeding Completed!")