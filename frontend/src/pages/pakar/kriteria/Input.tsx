import React, { useEffect, useState, FormEvent } from 'react';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import PrimaryButton from '@/components/PrimaryButton';
import SecondaryButton from '@/components/SecondaryButton';
import DangerButton from '@/components/DangerButton'; // Import DangerButton untuk hapus
import InputLabel from '@/components/InputLabel';
import apiClient from '@/lib/axios';

// --- TIPE DATA DIPERBARUI ---
interface PertanyaanItem {
    id: number;
    teks: string;
}

interface Kriteria {
    id: number;
    kode: string;
    nama: string;
    // Backend sekarang mengirim list_pertanyaan, bukan string pertanyaan tunggal
    list_pertanyaan: PertanyaanItem[];
    tipe_input: string;
}

export default function ManajemenPertanyaanPakar() {
    const [data, setData] = useState<Kriteria[]>([]);
    const [loading, setLoading] = useState(true);

    // State Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingKriteria, setEditingKriteria] = useState<Kriteria | null>(null);

    // State Form: Kita simpan array string untuk diedit di modal
    const [formQuestions, setFormQuestions] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);

    // 1. Fetch Data
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

        // Ambil teks dari list_pertanyaan backend, atau inisialisasi array kosong
        if (item.list_pertanyaan && item.list_pertanyaan.length > 0) {
            setFormQuestions(item.list_pertanyaan.map(p => p.teks));
        } else {
            setFormQuestions(['']); // Default 1 input kosong
        }

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingKriteria(null);
        setFormQuestions([]);
    };

    // --- FORM DYNAMIC HANDLERS ---

    // Mengubah teks pertanyaan pada index tertentu
    const handleQuestionChange = (index: number, value: string) => {
        const newQuestions = [...formQuestions];
        newQuestions[index] = value;
        setFormQuestions(newQuestions);
    };

    // Menambah input baru
    const addQuestionField = () => {
        setFormQuestions([...formQuestions, '']);
    };

    // Menghapus input
    const removeQuestionField = (index: number) => {
        const newQuestions = formQuestions.filter((_, i) => i !== index);
        setFormQuestions(newQuestions);
    };

    // 3. Submit Update
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingKriteria) return;

        setProcessing(true);
        try {
            // Filter pertanyaan yang kosong sebelum dikirim
            const cleanQuestions = formQuestions.filter(q => q.trim() !== "");

            // Kirim array string ke backend
            // Backend harus siap menerima 'list_pertanyaan' (array of strings)
            await apiClient.put(`/kriteria/${editingKriteria.id}`, {
                list_pertanyaan: cleanQuestions
            });

            // Refresh data agar mendapatkan ID pertanyaan yang baru digenerate backend
            await fetchData();

            closeModal();
            alert('Daftar pertanyaan berhasil diperbarui');
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
                                <strong>Panduan Pakar:</strong> Anda dapat menambahkan lebih dari satu pertanyaan untuk setiap kriteria (Multi-item).
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Kode</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Kriteria</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Tipe Input</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daftar Pertanyaan</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-4 text-center">Memuat data...</td></tr>
                                    ) : (
                                        data.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 valign-top">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 align-top">
                                                    {item.kode}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 align-top">
                                                    {item.nama}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm align-top">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        {item.tipe_input}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 align-top">
                                                    {item.list_pertanyaan && item.list_pertanyaan.length > 0 ? (
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {item.list_pertanyaan.map((p) => (
                                                                <li key={p.id} className="text-gray-800">
                                                                    {p.teks}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-red-400 italic text-xs">Belum ada pertanyaan</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md transition hover:bg-indigo-100"
                                                    >
                                                        Kelola Soal
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

            {/* MODAL EDIT PERTANYAAN (DYNAMIC FORM) */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-lg font-bold text-gray-900">
                            Edit Pertanyaan: <span className="text-indigo-600">{editingKriteria?.nama}</span>
                        </h2>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                            Kode: {editingKriteria?.kode}
                        </span>
                    </div>

                    <div className="mb-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <InputLabel value="Daftar Pertanyaan (Siswa akan menjawab tiap butir ini)" />

                        {formQuestions.map((q, index) => (
                            <div key={index} className="flex gap-2 items-start group">
                                <div className="mt-2 text-xs text-gray-400 font-mono w-6 text-right">
                                    #{index + 1}
                                </div>
                                <textarea
                                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                                    rows={2}
                                    value={q}
                                    onChange={(e) => handleQuestionChange(index, e.target.value)}
                                    placeholder="Tulis pertanyaan disini..."
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => removeQuestionField(index)}
                                    className="mt-2 text-gray-400 hover:text-red-600 transition p-1 rounded hover:bg-red-50"
                                    title="Hapus baris ini"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}

                        {formQuestions.length === 0 && (
                            <div className="text-center py-4 text-gray-400 italic bg-gray-50 rounded border border-dashed">
                                Belum ada pertanyaan. Klik tombol di bawah untuk menambah.
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={addQuestionField}
                            className="flex items-center gap-1 text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            Tambah Pertanyaan Lain
                        </button>

                        <div className="flex gap-3">
                            <SecondaryButton type="button" onClick={closeModal}>
                                Batal
                            </SecondaryButton>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </Modal>
        </>
    );
}