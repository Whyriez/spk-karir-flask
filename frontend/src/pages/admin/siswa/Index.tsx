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

interface Siswa {
    id: number;
    username: string;
    name: string;
    kelas_saat_ini: string;
    jurusan_nama: string;
    jurusan_id?: number;
}

interface Jurusan {
    id: number;
    nama: string;
}

export default function AdminSiswaIndex() {
    const [data, setData] = useState<Siswa[]>([]);
    const [jurusans, setJurusans] = useState<Jurusan[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    // Form State
    const initialForm = {
        id: null,
        username: '', // NISN
        name: '',
        kelas: '10', // Default Kelas 10
        jurusan_id: '',
        reset_password: false
    };
    const [form, setForm] = useState(initialForm);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resSiswa, resJurusan] = await Promise.all([
                apiClient.get('/admin/siswa'),
                apiClient.get('/jurusan')
            ]);
            setData(resSiswa.data.data);
            setJurusans(resJurusan.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openModal = (item: any = null) => {
        setProcessing(false);
        if (item) {
            setIsEditMode(true);
            setForm({
                ...initialForm,
                ...item,
                kelas: item.kelas_saat_ini || '10',
                jurusan_id: item.jurusan_id || '',
                reset_password: false
            });
        } else {
            setIsEditMode(false);
            setForm(initialForm);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        try {
            if (isEditMode && form.id) {
                await apiClient.put(`/admin/siswa/${form.id}`, form);
            } else {
                await apiClient.post('/admin/siswa', form);
            }
            fetchData();
            setIsModalOpen(false);
            alert(isEditMode ? 'Data diperbarui' : 'Siswa berhasil ditambahkan');
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.msg || 'Terjadi kesalahan');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await apiClient.delete(`/admin/siswa/${confirmDeleteId}`);
            setConfirmDeleteId(null);
            fetchData();
        } catch (err) {
            alert('Gagal menghapus');
        }
    };

    return (
        <div>
            <Header>
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen Data Siswa</h2>
                    <PrimaryButton onClick={() => openModal()} className="bg-indigo-600">
                        + Tambah Siswa
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
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">NISN</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Kelas</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jurusan</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-4 text-center">Memuat...</td></tr>
                                    ) : data.length === 0 ? (
                                        <tr><td colSpan={5} className="p-6 text-center text-gray-500">Belum ada data siswa.</td></tr>
                                    ) : (
                                        data.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm font-mono text-gray-600">{item.username}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.name}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                                                        {item.kelas_saat_ini || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">{item.jurusan_nama}</td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900 text-sm font-bold">Edit</button>
                                                    <button onClick={() => setConfirmDeleteId(item.id)} className="text-red-600 hover:text-red-900 text-sm">Hapus</button>
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

            {/* MODAL FORM */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        {isEditMode ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel value="NISN" required />
                            <TextInput
                                value={form.username}
                                onChange={e => setForm({...form, username: e.target.value})}
                                className="w-full mt-1 font-mono"
                                placeholder="Nomor Induk Siswa Nasional"
                                required
                            />
                        </div>

                        <div>
                            <InputLabel value="Nama Lengkap" required />
                            <TextInput
                                value={form.name}
                                onChange={e => setForm({...form, name: e.target.value})}
                                className="w-full mt-1"
                                placeholder="Nama Siswa"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Kelas" required />
                                <select
                                    className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={form.kelas}
                                    onChange={e => setForm({...form, kelas: e.target.value})}
                                    required
                                >
                                    <option value="10">Kelas 10</option>
                                    <option value="11">Kelas 11</option>
                                    <option value="12">Kelas 12</option>
                                </select>
                            </div>

                            <div>
                                <InputLabel value="Jurusan" required />
                                <select
                                    className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={form.jurusan_id}
                                    onChange={e => setForm({...form, jurusan_id: e.target.value})}
                                    required
                                >
                                    <option value="">-- Pilih --</option>
                                    {jurusans.map(j => (
                                        <option key={j.id} value={j.id}>{j.nama}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {isEditMode && (
                            <div className="pt-2">
                                <label className="flex items-center space-x-2">
                                    <Checkbox
                                        checked={form.reset_password}
                                        onChange={e => setForm({...form, reset_password: e.target.checked})}
                                    />
                                    <span className="text-sm text-gray-600">Reset Password ke default (123456)</span>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                        <SecondaryButton type="button" onClick={() => setIsModalOpen(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>Simpan</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* MODAL DELETE */}
            <Modal show={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)} maxWidth="sm">
                <div className="p-6 text-center">
                    <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus</h3>
                    <p className="text-sm text-gray-500 mt-2">Menghapus siswa juga akan menghapus riwayat nilai dan rekomendasi mereka.</p>
                    <div className="mt-6 flex justify-center gap-3">
                        <SecondaryButton onClick={() => setConfirmDeleteId(null)}>Batal</SecondaryButton>
                        <DangerButton onClick={handleDelete}>Hapus Permanen</DangerButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}