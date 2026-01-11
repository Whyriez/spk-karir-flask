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
import {useOutletContext} from "react-router-dom";
import type {LayoutContextType} from "../../../interface/layout.ts";

// Tipe data disesuaikan dengan response backend baru
interface Kriteria {
    id: number;
    kode: string;
    nama: string;
    atribut: 'benefit' | 'cost';
    kategori: string;
    tipe_input: string;
    sumber_nilai: string;      // Baru
    penanggung_jawab: string;  // Baru
    tampil_di_siswa: boolean;  // Baru
}

export default function KriteriaIndex() {
    const [data, setData] = useState<Kriteria[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    // Form state lengkap sesuai Laravel
    const [form, setForm] = useState({
        id: 0,
        kode: '',
        nama: '',
        atribut: 'benefit',
        kategori: 'kuesioner',
        tipe_input: 'number',
        sumber_nilai: 'input_siswa',     // Default Laravel
        penanggung_jawab: 'gurubk',      // Default Laravel
        tampil_di_siswa: true            // Default Laravel
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/kriteria');
            setData(response.data.data);
        } catch (error) {
            console.error("Error fetching kriteria:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openCreateModal = () => {
        setIsEditMode(false);
        setForm({
            id: 0, kode: '', nama: '', atribut: 'benefit',
            kategori: 'kuesioner', tipe_input: 'number',
            sumber_nilai: 'input_siswa', penanggung_jawab: 'gurubk',
            tampil_di_siswa: true
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: Kriteria) => {
        setIsEditMode(true);
        setForm({
            id: item.id,
            kode: item.kode,
            nama: item.nama,
            atribut: item.atribut as 'benefit' | 'cost',
            kategori: item.kategori,
            tipe_input: item.tipe_input,
            sumber_nilai: item.sumber_nilai || 'input_siswa',
            penanggung_jawab: item.penanggung_jawab || 'gurubk',
            tampil_di_siswa: item.tampil_di_siswa
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (isEditMode) {
                await apiClient.put(`/kriteria/${form.id}`, form);
            } else {
                await apiClient.post('/kriteria', form);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
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

    const {setHeader} = useOutletContext<LayoutContextType>();
    useEffect(() => {
        setHeader(
            <h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen Kriteria</h2>
        );
    }, []);

    return (
        <div>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-700">Daftar Kriteria SPK</h3>
                            <PrimaryButton onClick={openCreateModal}>
                                + Tambah Kriteria
                            </PrimaryButton>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kriteria</th>
                                        {/* Kolom Baru Sesuai Laravel */}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sumber Nilai</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penanggung Jawab</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-4 text-center">Memuat...</td></tr>
                                    ) : (
                                        data.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{item.kode}</td>
                                                <td className="px-6 py-4 text-gray-700">{item.nama}</td>

                                                {/* Badge Sumber Nilai */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {item.sumber_nilai === 'static_jurusan' ? (
                                                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                                            Statis (Jurusan)
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200">
                                                            Input Siswa
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Badge Penanggung Jawab */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {item.penanggung_jawab === 'gurubk' && <span className="px-2 py-1 text-xs rounded-full bg-pink-100 text-pink-800">Guru BK</span>}
                                                    {item.penanggung_jawab === 'kaprodi' && <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Kaprodi</span>}
                                                    {item.penanggung_jawab === 'umum' && <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Umum</span>}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => openEditModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                                                    <button onClick={() => setConfirmDeleteId(item.id)} className="text-red-600 hover:text-red-900">Hapus</button>
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

            {/* MODAL FORM LENGKAP SESUAI LARAVEL */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        {isEditMode ? 'Edit Kriteria' : 'Tambah Kriteria Baru'}
                    </h2>

                    <div className="space-y-4">
                        {/* Kode & Nama */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Kode (C1, C2...)" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={form.kode}
                                    onChange={(e) => setForm({...form, kode: e.target.value})}
                                    disabled={isEditMode} // Biasanya kode tidak boleh edit
                                    required
                                />
                            </div>
                            <div>
                                <InputLabel value="Nama Kriteria" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={form.nama}
                                    onChange={(e) => setForm({...form, nama: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        {/* Atribut & Kategori */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Atribut" />
                                <select
                                    className="w-full border-gray-300 rounded-md shadow-sm mt-1"
                                    value={form.atribut}
                                    onChange={(e) => setForm({...form, atribut: e.target.value})}
                                >
                                    <option value="benefit">Benefit (Makin tinggi bagus)</option>
                                    <option value="cost">Cost (Makin rendah bagus)</option>
                                </select>
                            </div>
                            <div>
                                <InputLabel value="Tipe Input" />
                                <select
                                    className="w-full border-gray-300 rounded-md shadow-sm mt-1"
                                    value={form.tipe_input}
                                    onChange={(e) => setForm({...form, tipe_input: e.target.value})}
                                >
                                    <option value="number">Angka (0-100)</option>
                                    <option value="select">Pilihan (1-5)</option>
                                    <option value="likert">Skala Likert</option>
                                </select>
                            </div>
                        </div>

                        {/* SUMBER NILAI (Highlight Biru seperti Laravel) */}
                        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                            <InputLabel className="text-blue-800 font-bold" value="Sumber Nilai Dari Mana?" />
                            <select
                                className="w-full border-blue-300 rounded-md shadow-sm mt-1 focus:ring-blue-500"
                                value={form.sumber_nilai}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setForm(f => ({
                                        ...f,
                                        sumber_nilai: val,
                                        tampil_di_siswa: val === 'input_siswa' // Auto uncheck jika statis
                                    }));
                                }}
                            >
                                <option value="input_siswa">Input Siswa (Kuesioner/Rapor)</option>
                                <option value="static_jurusan">Statis (Data Jurusan)</option>
                            </select>
                            <p className="text-xs text-blue-700 mt-1">
                                Jika "Statis", nilai diisi oleh Admin pada menu Data Jurusan.
                            </p>
                        </div>

                        {/* PENANGGUNG JAWAB (Highlight Kuning seperti Laravel) */}
                        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                            <InputLabel className="text-yellow-800 font-bold" value="Siapa yang mengatur Bobot?" />
                            <select
                                className="w-full border-yellow-300 rounded-md shadow-sm mt-1 focus:ring-yellow-500"
                                value={form.penanggung_jawab}
                                onChange={(e) => setForm({...form, penanggung_jawab: e.target.value})}
                            >
                                <option value="gurubk">Guru BK (Aspek Psikologis)</option>
                                <option value="kaprodi">Kaprodi (Aspek Industri)</option>
                                <option value="umum">Semua / Umum</option>
                            </select>
                        </div>

                        {/* CHECKBOX TAMPIL */}
                        <div className={`mt-4 ${form.sumber_nilai === 'static_jurusan' ? 'opacity-50' : ''}`}>
                            <label className="flex items-center">
                                <Checkbox
                                    checked={form.tampil_di_siswa}
                                    onChange={(e) => setForm({...form, tampil_di_siswa: e.target.checked})}
                                    disabled={form.sumber_nilai === 'static_jurusan'}
                                />
                                <span className="ml-2 text-sm text-gray-600">Tampilkan Pertanyaan ini ke Siswa?</span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setIsModalOpen(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* MODAL DELETE */}
            <Modal show={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)} maxWidth="sm">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900">Hapus Kriteria?</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        HATI-HATI! Menghapus kriteria akan menghapus seluruh data nilai siswa pada kriteria ini.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setConfirmDeleteId(null)}>Batal</SecondaryButton>
                        <DangerButton onClick={handleDelete}>Ya, Hapus</DangerButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}