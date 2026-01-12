import React, { useEffect, useState, FormEvent } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/components/Modal';
import SecondaryButton from '@/components/SecondaryButton';
import PrimaryButton from '@/components/PrimaryButton';
import DangerButton from '@/components/DangerButton';
import InputLabel from '@/components/InputLabel';
import TextInput from '@/components/TextInput';
import Checkbox from '@/components/Checkbox';
import apiClient from '@/lib/axios';
import Header from "../../../components/Header.tsx";

// Tipe Data
interface Kriteria {
    id: number;
    kode: string;
    nama: string;
    atribut: string;
    kategori: string;
    tipe_input: string;
    sumber_nilai: string;
    penanggung_jawab: string;
    tampil_di_siswa: boolean;
    target_jalur: string;
    skala_maks: number;
    jalur_reverse: string | null;
}

export default function KriteriaIndex() {
    const [data, setData] = useState<Kriteria[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    // Initial Form State
    const initialForm = {
        id: null,
        kode: '',
        nama: '',
        atribut: 'benefit', // Default Benefit
        kategori: 'kuesioner',
        tipe_input: 'likert',
        sumber_nilai: 'input_siswa',
        penanggung_jawab: 'gurubk',
        tampil_di_siswa: true,
        target_jalur: 'all',
        skala_maks: 5,
        jalur_reverse: ''
    };

    const [form, setForm] = useState(initialForm);

    // State untuk Checkbox Target
    const [targets, setTargets] = useState({
        studi: true,
        kerja: true,
        wirausaha: true
    });

    const fetchData = async () => {
        try {
            const res = await apiClient.get('/kriteria');
            setData(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Sinkronisasi Checkbox dengan String Database
    useEffect(() => {
        const active = [];
        if (targets.studi) active.push('studi');
        if (targets.kerja) active.push('kerja');
        if (targets.wirausaha) active.push('wirausaha');

        const val = (active.length === 3) ? 'all' : active.join(',');
        setForm(f => ({ ...f, target_jalur: val }));
    }, [targets]);

    const openModal = (item: any = null) => {
        setProcessing(false);
        if (item) {
            setIsEditMode(true);
            setForm({
                ...initialForm,
                ...item,
                jalur_reverse: item.jalur_reverse || ''
            });
            const t = item.target_jalur || 'all';
            setTargets({
                studi: t.includes('all') || t.includes('studi'),
                kerja: t.includes('all') || t.includes('kerja'),
                wirausaha: t.includes('all') || t.includes('wirausaha'),
            });
        } else {
            setIsEditMode(false);
            setForm(initialForm);
            setTargets({ studi: true, kerja: true, wirausaha: true });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (isEditMode && form.id) {
                await apiClient.put(`/kriteria/${form.id}`, form);
            } else {
                await apiClient.post('/kriteria', form);
            }
            fetchData();
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
            alert('Gagal menyimpan data.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await apiClient.delete(`/kriteria/${confirmDeleteId}`);
            setConfirmDeleteId(null);
            fetchData();
        } catch (error) {
            alert('Gagal menghapus kriteria.');
        }
    };

    return (
        <div>
            <Header>
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen Kriteria</h2>
                    <PrimaryButton onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm px-4 py-2">
                        + Tambah Kriteria Baru
                    </PrimaryButton>
                </div>
            </Header>

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16">Kode</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Kriteria</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jalur Karir</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Sifat</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">Sedang memuat data...</td></tr>
                                    ) : data.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">Belum ada kriteria yang dibuat.</td></tr>
                                    ) : (
                                        data.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 align-top">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-700">
                                                        {item.kode}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="text-sm font-bold text-gray-900">{item.nama}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        PJ: <span className="uppercase font-semibold">{item.penanggung_jawab === 'gurubk' ? 'Guru BK' : item.penanggung_jawab}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.target_jalur === 'all' ? (
                                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase px-2 py-1 rounded-full font-bold tracking-wide">
                                                                Semua Jalur
                                                            </span>
                                                        ) : (
                                                            item.target_jalur.split(',').map(t => (
                                                                <span key={t} className="bg-gray-100 text-gray-600 text-[10px] uppercase px-2 py-1 rounded-full border border-gray-300 font-medium">
                                                                    {t}
                                                                </span>
                                                            ))
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center align-top">
                                                    <span className={`text-[10px] px-2 py-1 rounded border uppercase font-bold ${item.atribut === 'benefit' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                                        {item.atribut === 'benefit' ? 'Benefit' : 'Cost'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-medium align-top">
                                                    <div className="flex justify-end gap-3">
                                                        <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900 font-bold">Edit</button>
                                                        <button onClick={() => setConfirmDeleteId(item.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL FORM --- */}
            {/* maxWidth="2xl" agar tidak terlalu lebar tapi cukup untuk 2 kolom */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="2xl">
                <form onSubmit={handleSubmit} className="p-8">

                    {/* Header Modal */}
                    <div className="flex items-center justify-between border-b pb-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditMode ? 'Edit Kriteria' : 'Tambah Kriteria Baru'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Silakan lengkapi informasi kriteria penilaian di bawah ini.</p>
                        </div>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-8">

                        {/* BAGIAN KIRI: Info Dasar */}
                        <div className="space-y-6">
                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                                    1. Informasi Dasar
                                </h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="col-span-1">
                                            <InputLabel value="Kode" required />
                                            <TextInput
                                                value={form.kode}
                                                onChange={e => setForm({...form, kode: e.target.value})}
                                                className="w-full mt-1 text-center font-bold uppercase bg-white"
                                                placeholder="C1"
                                                disabled={isEditMode}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <InputLabel value="Nama Kriteria" required />
                                            <TextInput
                                                value={form.nama}
                                                onChange={e => setForm({...form, nama: e.target.value})}
                                                className="w-full mt-1 bg-white"
                                                placeholder="Contoh: Nilai Akademik"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel value="Cara Input Data" />
                                            <select
                                                className="w-full mt-1 border-gray-300 rounded-lg shadow-sm text-sm bg-white"
                                                value={form.tipe_input}
                                                onChange={e => setForm({...form, tipe_input: e.target.value})}
                                            >
                                                <option value="likert">Pilihan Skala (Sangat Setuju dll)</option>
                                                <option value="number">Angka Langsung (0-100)</option>
                                                <option value="select">Pilihan Ganda (A/B/C)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <InputLabel value="Siapa Penanggung Jawab?" />
                                            <select
                                                className="w-full mt-1 border-gray-300 rounded-lg shadow-sm text-sm bg-white"
                                                value={form.penanggung_jawab}
                                                onChange={e => setForm({...form, penanggung_jawab: e.target.value})}
                                            >
                                                <option value="gurubk">Guru BK (Kuesioner)</option>
                                                <option value="kaprodi">Kaprodi (Keahlian)</option>
                                                <option value="umum">Umum (Data Sekolah)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BAGIAN KANAN: Logika Sistem */}
                        <div className="space-y-6">
                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 h-full">
                                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                                    2. Pengaturan Sistem
                                </h3>

                                <div className="space-y-5">
                                    {/* --- DITAMBAHKAN: Setting Benefit / Cost --- */}
                                    <div className="border-b border-emerald-200 pb-4">
                                        <InputLabel value="Sifat Nilai (Benefit/Cost)" className="text-emerald-900 mb-1 block font-semibold" />
                                        <select
                                            className="w-full mt-1 border-emerald-300 rounded-lg shadow-sm text-sm bg-white focus:ring-emerald-500"
                                            value={form.atribut}
                                            onChange={e => setForm({...form, atribut: e.target.value})}
                                        >
                                            <option value="benefit">Makin TINGGI nilainya, makin BAGUS (Benefit)</option>
                                            <option value="cost">Makin KECIL nilainya, makin BAGUS (Cost)</option>
                                        </select>
                                        <p className="text-[11px] text-gray-500 mt-1 italic">
                                            *Contoh Cost: Jarak Rumah (Makin dekat/kecil angka km-nya, makin bagus).
                                        </p>
                                    </div>
                                    {/* --------------------------------------------- */}

                                    {/* Target Jalur */}
                                    <div>
                                        <InputLabel value="Kriteria ini dinilai untuk siapa?" className="text-emerald-900 mb-2 block" />
                                        <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-2">
                                            <label className="flex items-center space-x-3 cursor-pointer">
                                                <Checkbox checked={targets.studi} onChange={(e) => setTargets({...targets, studi: e.target.checked})} />
                                                <span className="text-sm text-gray-700">Siswa yang ingin <b>Kuliah</b></span>
                                            </label>
                                            <label className="flex items-center space-x-3 cursor-pointer">
                                                <Checkbox checked={targets.kerja} onChange={(e) => setTargets({...targets, kerja: e.target.checked})} />
                                                <span className="text-sm text-gray-700">Siswa yang ingin <b>Bekerja</b></span>
                                            </label>
                                            <label className="flex items-center space-x-3 cursor-pointer">
                                                <Checkbox checked={targets.wirausaha} onChange={(e) => setTargets({...targets, wirausaha: e.target.checked})} />
                                                <span className="text-sm text-gray-700">Siswa yang ingin <b>Berwirausaha</b></span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Skala Nilai */}
                                    <div>
                                        <InputLabel value="Rentang Nilai Maksimal" className="text-emerald-900" />
                                        <div className="flex items-center gap-3 mt-1">
                                            <TextInput
                                                type="number"
                                                value={form.skala_maks}
                                                onChange={e => setForm({...form, skala_maks: parseFloat(e.target.value)})}
                                                className="w-24 text-center font-bold bg-white"
                                            />
                                            <div className="text-xs text-gray-500 leading-tight">
                                                <p>Isi <b>5</b> jika inputnya berupa Pilihan (Sangat Baik s/d Buruk).</p>
                                                <p>Isi <b>100</b> jika inputnya berupa Nilai Rapor/Angka.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Advanced Logic (Reverse) */}
                                    <div className="pt-2 border-t border-emerald-200">
                                        <InputLabel value="Kasus Khusus: Apakah Nilai KECIL justru BAGUS?" className="text-emerald-900" />
                                        <select
                                            className="w-full mt-2 border-emerald-300 rounded-lg shadow-sm text-sm bg-white focus:ring-emerald-500"
                                            value={form.jalur_reverse}
                                            onChange={e => setForm({...form, jalur_reverse: e.target.value})}
                                        >
                                            <option value="">Tidak (Normal: Nilai Besar = Bagus)</option>
                                            <option value="kerja">Ya, Khusus untuk Jalur KERJA</option>
                                            <option value="studi">Ya, Khusus untuk Jalur KULIAH</option>
                                            <option value="wirausaha">Ya, Khusus untuk Jalur WIRAUSAHA</option>
                                        </select>
                                        <div className="mt-2 bg-yellow-50 text-yellow-800 text-[11px] p-2 rounded border border-yellow-200">
                                            <strong>Contoh Penggunaan:</strong> Pada kriteria "Penghasilan Orang Tua", nilai kecil (Kurang Mampu) justru dianggap <b>Sangat Bagus</b> untuk rekomendasi jalur <b>Kerja</b>.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-gray-100">
                        <SecondaryButton type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2">
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={processing} className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md font-bold transition-all">
                            {processing ? 'Menyimpan...' : 'Simpan Kriteria'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* MODAL HAPUS */}
            <Modal show={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)} maxWidth="sm">
                <div className="p-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4">
                        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Yakin Hapus Kriteria?</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        Semua data nilai siswa yang berhubungan dengan kriteria ini akan ikut terhapus.
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                        <SecondaryButton onClick={() => setConfirmDeleteId(null)}>Batal</SecondaryButton>
                        <DangerButton onClick={handleDelete}>Ya, Hapus Permanen</DangerButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}