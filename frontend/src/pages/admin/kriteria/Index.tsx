import React, {useEffect, useState, FormEventHandler} from 'react';
import PrimaryButton from '../../../components/PrimaryButton';
import SecondaryButton from '../../../components/SecondaryButton';
import Modal from '../../../components/Modal';
import TextInput from '../../../components/TextInput';
import InputLabel from '../../../components/InputLabel';
import AuthenticatedLayout from "../../../Layouts/AuthenticatedLayout.tsx";

interface Kriteria {
    id?: number;
    kode: string;
    nama: string;
    pertanyaan: string;
    atribut: string;
    kategori: string;
    tipe_input: string;
}

export default function KriteriaIndex() {
    const [data, setData] = useState<Kriteria[]>([]);
    const [loading, setLoading] = useState(true);

    // State Modal & Form
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Initial State Form
    const initialFormState: Kriteria = {
        kode: '',
        nama: '',
        pertanyaan: '',
        atribut: 'benefit',
        kategori: 'kuesioner',
        tipe_input: 'likert'
    };
    const [form, setForm] = useState<Kriteria>(initialFormState);

    // --- FETCH DATA ---
    const fetchData = async () => {
        const token = localStorage.getItem('token');
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/kriteria', {
                headers: {'Authorization': `Bearer ${token}`}
            });
            const json = await res.json();
            if (res.ok) setData(json.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- HANDLERS ---
    const openModalAdd = () => {
        setForm(initialFormState);
        setIsEditing(false);
        setShowModal(true);
    };

    const openModalEdit = (item: Kriteria) => {
        setForm(item); // Load data item ke form
        setIsEditing(true);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setForm(initialFormState);
    };

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        const token = localStorage.getItem('token');

        try {
            const url = isEditing
                ? `http://localhost:5000/api/kriteria/${form.id}`
                : 'http://localhost:5000/api/kriteria';

            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            const json = await res.json();

            if (res.ok) {
                alert(json.msg || 'Berhasil disimpan!');
                closeModal();
                fetchData(); // Refresh data
            } else {
                alert(json.msg || 'Gagal menyimpan data.');
            }
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan sistem.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Yakin ingin menghapus data ini?')) return;
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/kriteria/${id}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        });
        fetchData();
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800">Manajemen Kriteria</h2>}>
            <div className="p-6 bg-gray-100 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Manajemen Kriteria</h1>
                        <PrimaryButton onClick={openModalAdd}>+ Tambah Kriteria</PrimaryButton>
                    </div>

                    {/* TABEL DATA */}
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atribut</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe
                                    Input
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center">Loading...</td>
                                </tr>
                            ) : data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold text-gray-900">{item.kode}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{item.nama}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-xs">{item.pertanyaan}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                                            item.atribut === 'benefit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {item.atribut}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {item.tipe_input} ({item.kategori})
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <button onClick={() => openModalEdit(item)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4">Edit
                                        </button>
                                        <button onClick={() => item.id && handleDelete(item.id)}
                                                className="text-red-600 hover:text-red-900">Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL FORM */}
                <Modal show={showModal} onClose={closeModal}>
                    <form onSubmit={handleSubmit} className="p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">
                            {isEditing ? 'Edit Kriteria' : 'Tambah Kriteria Baru'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Kode */}
                            <div>
                                <InputLabel value="Kode Kriteria"/>
                                <TextInput
                                    value={form.kode}
                                    onChange={(e) => setForm({...form, kode: e.target.value})}
                                    className="w-full mt-1"
                                    placeholder="C1, C2..."
                                    disabled={isEditing} // Kode tidak boleh diganti saat edit
                                />
                            </div>

                            {/* Nama */}
                            <div>
                                <InputLabel value="Nama Kriteria"/>
                                <TextInput
                                    value={form.nama}
                                    onChange={(e) => setForm({...form, nama: e.target.value})}
                                    className="w-full mt-1"
                                    placeholder="Contoh: Nilai Akademik"
                                />
                            </div>

                            {/* Atribut */}
                            <div>
                                <InputLabel value="Atribut (Benefit/Cost)"/>
                                <select
                                    value={form.atribut}
                                    onChange={(e) => setForm({...form, atribut: e.target.value})}
                                    className="w-full mt-1 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    <option value="benefit">Benefit (Semakin besar semakin baik)</option>
                                    <option value="cost">Cost (Semakin kecil semakin baik)</option>
                                </select>
                            </div>

                            {/* Kategori */}
                            <div>
                                <InputLabel value="Kategori"/>
                                <select
                                    value={form.kategori}
                                    onChange={(e) => setForm({...form, kategori: e.target.value})}
                                    className="w-full mt-1 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    <option value="kuesioner">Kuesioner (Input Subjektif)</option>
                                    <option value="akademik">Data Akademik (Nilai Rapor)</option>
                                </select>
                            </div>

                            {/* Tipe Input */}
                            <div>
                                <InputLabel value="Tipe Input Siswa"/>
                                <select
                                    value={form.tipe_input}
                                    onChange={(e) => setForm({...form, tipe_input: e.target.value})}
                                    className="w-full mt-1 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    <option value="likert">Skala Likert (1-5)</option>
                                    <option value="number">Angka Bebas (0-100)</option>
                                    <option value="select">Pilihan Ganda (Dropdown)</option>
                                </select>
                            </div>
                        </div>

                        {/* Pertanyaan */}
                        <div className="mt-4">
                            <InputLabel value="Pertanyaan (Untuk Kuesioner)"/>
                            <textarea
                                className="w-full mt-1 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                rows={3}
                                value={form.pertanyaan || ''}
                                onChange={(e) => setForm({...form, pertanyaan: e.target.value})}
                            ></textarea>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="mt-6 flex justify-end gap-3">
                            <SecondaryButton onClick={closeModal} disabled={processing}>
                                Batal
                            </SecondaryButton>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Data'}
                            </PrimaryButton>
                        </div>
                    </form>
                </Modal>
            </div>
        </AuthenticatedLayout>

    );
}