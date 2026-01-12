import React, { useEffect, useState, FormEvent } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/components/Modal';
import SecondaryButton from '@/components/SecondaryButton';
import PrimaryButton from '@/components/PrimaryButton';
import DangerButton from '@/components/DangerButton';
import InputLabel from '@/components/InputLabel';
import TextInput from '@/components/TextInput';
import apiClient from '@/lib/axios';
import Header from "../../../components/Header.tsx";
import Checkbox from "../../../components/Checkbox.tsx";

interface Pakar {
    id: number;
    username: string;
    name: string;
    jenis_pakar: string;
    jurusan_id?: number | null;
    jurusan?: { id: number, nama: string } | null;
}

interface Jurusan {
    id: number;
    nama: string;
}

export default function PakarIndex() {
    const [data, setData] = useState<Pakar[]>([]);
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
        username: '',
        name: '',
        jenis_pakar: 'gurubk', // Default
        jurusan_id: '',
        reset_password: false
    };
    const [form, setForm] = useState(initialForm);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [resPakar, resJurusan] = await Promise.all([
                apiClient.get('/admin/pakar'),
                apiClient.get('/jurusan')
            ]);
            setData(resPakar.data.data);
            setJurusans(resJurusan.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Handlers
    const openModal = (item: any = null) => {
        setProcessing(false);
        if (item) {
            setIsEditMode(true);
            setForm({
                ...item,
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

        const payload = {
            ...form,
            jurusan_id: form.jenis_pakar === 'kaprodi' ? form.jurusan_id : null
        };

        try {
            if (isEditMode && form.id) {
                await apiClient.put(`/admin/pakar/${form.id}`, payload);
            } else {
                await apiClient.post('/admin/pakar', payload);
            }
            fetchData();
            setIsModalOpen(false);
            alert(isEditMode ? 'Data diperbarui' : 'Pakar ditambahkan');
        } catch (err: any) {
            alert(err.response?.data?.msg || 'Terjadi kesalahan');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await apiClient.delete(`/admin/pakar/${confirmDeleteId}`);
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
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen Pakar</h2>
                    <PrimaryButton onClick={() => openModal()} className="bg-indigo-600">
                        + Tambah Pakar
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
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama & NIP</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jenis Pakar</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jurusan (Kaprodi)</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={4} className="p-4 text-center">Memuat...</td></tr>
                                    ) : data.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900">{item.name}</div>
                                                <div className="text-xs text-gray-500">{item.username}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                    item.jenis_pakar === 'gurubk' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                    {item.jenis_pakar === 'gurubk' ? 'Guru BK' : 'Kaprodi'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {item.jenis_pakar === 'kaprodi' ? (item.jurusan?.nama || '-') : <span className="text-gray-400 italic">N/A</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900 text-sm font-bold">Edit</button>
                                                <button onClick={() => setConfirmDeleteId(item.id)} className="text-red-600 hover:text-red-900 text-sm">Hapus</button>
                                            </td>
                                        </tr>
                                    ))}
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
                        {isEditMode ? 'Edit Data Pakar' : 'Tambah Pakar Baru'}
                    </h2>

                    <div className="mb-4">
                        <InputLabel value="Login ID / NIP" required />
                        <TextInput
                            value={form.username}
                            onChange={e => setForm({...form, username: e.target.value})}
                            className="w-full mt-1"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <InputLabel value="Nama Lengkap" required />
                        <TextInput
                            value={form.name}
                            onChange={e => setForm({...form, name: e.target.value})}
                            className="w-full mt-1"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <InputLabel value="Jenis Pakar" required />
                        <select
                            value={form.jenis_pakar}
                            onChange={e => setForm({...form, jenis_pakar: e.target.value})}
                            className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="gurubk">Guru BK (Umum)</option>
                            <option value="kaprodi">Kaprodi (Spesifik Jurusan)</option>
                        </select>
                    </div>

                    {/* Dropdown Jurusan - Hanya Muncul Jika Kaprodi */}
                    {form.jenis_pakar === 'kaprodi' && (
                        <div className="mb-4 bg-emerald-50 p-3 rounded border border-emerald-200">
                            <InputLabel value="Pilih Jurusan yang Diampu" className="text-emerald-800" required />
                            <select
                                value={form.jurusan_id}
                                onChange={e => setForm({...form, jurusan_id: e.target.value})}
                                className="w-full mt-1 border-gray-300 rounded-md shadow-sm"
                                required
                            >
                                <option value="">-- Pilih Jurusan --</option>
                                {jurusans.map(j => (
                                    <option key={j.id} value={j.id}>{j.nama}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {isEditMode && (
                        <div className="mb-4">
                            <label className="flex items-center space-x-2">
                                <Checkbox
                                    checked={form.reset_password}
                                    onChange={e => setForm({...form, reset_password: e.target.checked})}
                                />
                                <span className="text-sm text-gray-600">Reset Password ke default (password123)</span>
                            </label>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <SecondaryButton type="button" onClick={() => setIsModalOpen(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>Simpan</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* MODAL DELETE */}
            <Modal show={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)} maxWidth="sm">
                <div className="p-6 text-center">
                    <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus</h3>
                    <p className="text-sm text-gray-500 mt-2">Apakah Anda yakin ingin menghapus pakar ini?</p>
                    <div className="mt-6 flex justify-center gap-3">
                        <SecondaryButton onClick={() => setConfirmDeleteId(null)}>Batal</SecondaryButton>
                        <DangerButton onClick={handleDelete}>Hapus</DangerButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}