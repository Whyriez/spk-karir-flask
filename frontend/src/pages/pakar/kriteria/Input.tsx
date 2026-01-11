import React, { useEffect, useState, FormEvent } from 'react';
import Header from '@/components/Header'; // Pakai Header Komponen (Anti Glitch)
import Modal from '@/components/Modal';
import PrimaryButton from '@/components/PrimaryButton';
import SecondaryButton from '@/components/SecondaryButton';
import InputLabel from '@/components/InputLabel';
import apiClient from '@/lib/axios';

// Tipe Data
interface Kriteria {
    id: number;
    kode: string;
    nama: string;
    pertanyaan: string;
    tipe_input: string;
}

export default function ManajemenPertanyaanPakar() {
    const [data, setData] = useState<Kriteria[]>([]);
    const [loading, setLoading] = useState(true);

    // State Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingKriteria, setEditingKriteria] = useState<Kriteria | null>(null);
    const [pertanyaan, setPertanyaan] = useState('');
    const [processing, setProcessing] = useState(false);

    // 1. Fetch Data Kriteria
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

    // 2. Handlers Modal
    const openEditModal = (item: Kriteria) => {
        setEditingKriteria(item);
        setPertanyaan(item.pertanyaan || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingKriteria(null);
        setPertanyaan('');
    };

    // 3. Submit Update
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingKriteria) return;

        setProcessing(true);
        try {
            await apiClient.put(`/kriteria/${editingKriteria.id}`, {
                pertanyaan: pertanyaan // Kirim update pertanyaan saja
            });

            // Update data di tabel lokal tanpa fetch ulang (Optimistic UI)
            setData(prev => prev.map(item =>
                item.id === editingKriteria.id ? { ...item, pertanyaan: pertanyaan } : item
            ));

            closeModal();
            alert('Pertanyaan berhasil diperbarui');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan pertanyaan.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Header>
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Manajemen Pertanyaan Kriteria
                </h2>
            </Header>

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">

                        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                            <p className="text-sm text-blue-700">
                                <strong>Panduan Pakar:</strong> Silakan atur pertanyaan untuk setiap kriteria.
                                Pertanyaan ini yang akan muncul saat siswa mengisi kuesioner.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kriteria</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe Input</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Pertanyaan Saat Ini</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-4 text-center">Memuat data...</td></tr>
                                    ) : (
                                        data.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    {item.kode}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {item.nama}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        {item.tipe_input}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {item.pertanyaan ? (
                                                        <span className="text-gray-800">{item.pertanyaan}</span>
                                                    ) : (
                                                        <span className="text-red-400 italic text-xs">Belum diatur</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md transition hover:bg-indigo-100"
                                                    >
                                                        Edit Soal
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

            {/* MODAL EDIT PERTANYAAN */}
            <Modal show={isModalOpen} onClose={closeModal}>
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Edit Pertanyaan: <span className="text-indigo-600">{editingKriteria?.nama}</span>
                    </h2>

                    <div className="mb-4">
                        <InputLabel value="Teks Pertanyaan Kuesioner" />
                        <textarea
                            className="w-full mt-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3"
                            rows={5}
                            value={pertanyaan}
                            onChange={(e) => setPertanyaan(e.target.value)}
                            placeholder="Contoh: Seberapa besar minat Anda dalam bidang matematika?"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            *Pertanyaan ini akan dibaca langsung oleh siswa. Gunakan bahasa yang mudah dipahami.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton type="button" onClick={closeModal}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Pertanyaan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </>
    );
}