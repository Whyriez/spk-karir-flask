import React, {useEffect, useState, FormEvent} from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/components/Modal';
import SecondaryButton from '@/components/SecondaryButton';
import PrimaryButton from '@/components/PrimaryButton';
import DangerButton from '@/components/DangerButton';
import InputLabel from '@/components/InputLabel';
import TextInput from '@/components/TextInput';
import apiClient from '@/lib/axios';
import Header from '@/components/Header';

interface SiswaData {
    id: number;
    username: string; // NIS
    // name: string;
    // jenis_kelamin: string;
    kelas: string;
}

export default function AdminSiswaIndex() {
    const [data, setData] = useState<SiswaData[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    // Form State
    const initialForm = {
        username: '',
        name: '',
        // jenis_kelamin: 'L',
        // kelas: '',
        reset_password: false // Opsi khusus edit
    };
    const [form, setForm] = useState(initialForm);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/siswa');
            setData(response.data.data);
        } catch (error) {
            console.error("Error fetching siswa:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handlers
    const handleOpenModal = () => {
        setForm(initialForm);
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleEdit = (item: SiswaData) => {
        setForm({
            username: item.username,
            name: item.name,
            // jenis_kelamin: item.jenis_kelamin || 'L',
            // kelas: item.kelas || '',
            reset_password: false
        });
        setEditId(item.id);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await apiClient.delete(`/admin/siswa/${confirmDeleteId}`);
            fetchData();
            setConfirmDeleteId(null);
            alert("Siswa berhasil dihapus");
        } catch (error) {
            console.error(error);
            alert("Gagal menghapus siswa");
        }
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (isEditMode && editId) {
                await apiClient.put(`/admin/siswa/${editId}`, form);
                alert(form.reset_password ? 'Data diperbarui & Password direset ke 123456' : 'Data berhasil diperbarui');
            } else {
                await apiClient.post('/admin/siswa', form);
                alert('Siswa berhasil ditambahkan! Password default: 123456');
            }
            fetchData();
            setIsModalOpen(false);
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.msg || "Terjadi kesalahan.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div>
            <Header>
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Manajemen Data Siswa
                </h2>
            </Header>

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">

                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                            <div className="text-gray-600 text-sm">
                                Kelola data akun siswa. Menambahkan siswa akan otomatis membuat akun dengan
                                password: <b>123456</b>
                            </div>
                            <PrimaryButton onClick={handleOpenModal}>
                                + Tambah Siswa
                            </PrimaryButton>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS
                                        / Username
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama
                                        Lengkap
                                    </th>
                                    {/*<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L/P</th>*/}
                                    {/*<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>*/}
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center">Memuat data...</td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-gray-500">Belum ada data
                                            siswa.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.name}</td>
                                            {/*<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.jenis_kelamin}</td>*/}
                                            {/*<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.kelas}</td>*/}
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleEdit(item)}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold">Edit
                                                </button>
                                                <button onClick={() => setConfirmDeleteId(item.id)}
                                                        className="text-red-600 hover:text-red-900">Hapus
                                                </button>
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
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        {isEditMode ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                    </h2>

                    <div className="space-y-4">
                        <div>
    <InputLabel htmlFor="username" value="NIS / Username" />
    <TextInput
        id="username"
        type="text"
        name="username"
        value={form.username}
        onChange={(e) => setForm({...form, username: e.target.value})}
        required
        placeholder="Contoh: 12345"
        className="mt-1 block w-full"
    />
</div>


                        <div>
                            <InputLabel htmlFor="name" value="Nama Lengkap"/>
                            <TextInput
                                id="name"
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={(e) => setForm({...form, name: e.target.value})}
                                required
                                placeholder="Nama Siswa"
                                className="mt-1 block w-full"
                            />
                        </div>

                        {/*<div className="grid grid-cols-2 gap-4">*/}
                        {/*    <div>*/}
                        {/*        <InputLabel value="Jenis Kelamin" />*/}
                        {/*        <select*/}
                        {/*            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"*/}
                        {/*            value={form.jenis_kelamin}*/}
                        {/*            onChange={(e) => setForm({...form, jenis_kelamin: e.target.value})}*/}
                        {/*        >*/}
                        {/*            <option value="L">Laki-laki</option>*/}
                        {/*            <option value="P">Perempuan</option>*/}
                        {/*        </select>*/}
                        {/*    </div>*/}
                        {/*    <div>*/}
                        {/*        <InputLabel value="Kelas" />*/}
                        {/*        <TextInput*/}
                        {/*            value={form.kelas}*/}
                        {/*            handleChange={(e) => setForm({...form, kelas: e.target.value})}*/}
                        {/*            placeholder="Cth: 12 IPA 1"*/}
                        {/*            className="mt-1 block w-full"*/}
                        {/*        />*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        {/* Opsi Reset Password hanya muncul saat Edit */}
                        {isEditMode && (
                            <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                        checked={form.reset_password}
                                        onChange={(e) => setForm({...form, reset_password: e.target.checked})}
                                    />
                                    <span
                                        className="text-sm text-gray-700 font-medium">Reset Password ke "123456"?</span>
                                </label>
                            </div>
                        )}

                        {!isEditMode && (
                            <p className="text-xs text-gray-500 italic mt-2">
                                *Password default untuk akun baru adalah <b>123456</b>. Siswa dapat mengubahnya setelah
                                login.
                            </p>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setIsModalOpen(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* MODAL HAPUS */}
            <Modal show={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)} maxWidth="sm">
                <div className="p-6 text-center">
                    <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Apakah Anda yakin ingin menghapus siswa ini? Semua data nilai dan riwayat akan ikut terhapus.
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                        <SecondaryButton onClick={() => setConfirmDeleteId(null)}>Batal</SecondaryButton>
                        <DangerButton onClick={handleDelete}>Ya, Hapus</DangerButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}