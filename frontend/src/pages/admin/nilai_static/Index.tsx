import React, { useEffect, useState } from 'react';
import PrimaryButton from '../../../components/PrimaryButton';
import SecondaryButton from '../../../components/SecondaryButton';
import Modal from '../../../components/Modal';
import TextInput from '../../../components/TextInput';
import InputLabel from '../../../components/InputLabel';
import apiClient from "../../../lib/axios";
import Header from "../../../components/Header";

interface KriteriaStatic {
    id: number;
    kode: string;
    nama: string;
}

interface JurusanNilai {
    id: number;
    nama_jurusan: string;
    nilai: Record<string, number>; // Contoh: { "C6": 80 }
}

export default function NilaiStaticIndex() {
    const [data, setData] = useState<JurusanNilai[]>([]);
    const [kriteriaList, setKriteriaList] = useState<KriteriaStatic[]>([]);
    const [loading, setLoading] = useState(true);

    // State Modal
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedJurusan, setSelectedJurusan] = useState<JurusanNilai | null>(null);
    const [formValues, setFormValues] = useState<Record<string, number>>({});

    // 1. Fetch Data dari API
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/nilai-static');
            setData(res.data.data);
            setKriteriaList(res.data.kriteria_static);
        } catch (err) {
            console.error("Gagal mengambil data nilai static:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 2. Handle Buka Modal Edit
    const handleEdit = (item: JurusanNilai) => {
        setSelectedJurusan(item);
        // Copy nilai yang ada ke form state
        setFormValues({ ...item.nilai });
        setShowModal(true);
    };

    // 3. Handle Perubahan Input di Modal
    const handleInputChange = (kode: string, val: string) => {
        setFormValues(prev => ({
            ...prev,
            [kode]: parseFloat(val) || 0
        }));
    };

    // 4. Submit Data ke Backend
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJurusan) return;

        setProcessing(true);
        try {
            await apiClient.post('/nilai-static/save', {
                jurusan_id: selectedJurusan.id,
                nilai: formValues
            });

            // Refresh data & tutup modal
            await fetchData();
            setShowModal(false);
        } catch (err) {
            console.error("Gagal menyimpan:", err);
            alert("Terjadi kesalahan saat menyimpan data.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div>
            <Header>
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Data Nilai Statis Jurusan (C6)
                </h2>
            </Header>

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">

                        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                            <p className="text-sm">
                                <strong>Info:</strong> Halaman ini digunakan untuk mengisi nilai kriteria yang bersifat tetap per jurusan (contoh: <strong>Ketersediaan Lapangan Kerja</strong>). Nilai ini akan otomatis digunakan saat siswa dari jurusan tersebut melakukan penilaian.
                            </p>
                        </div>

                        {/* TABEL DATA */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Jurusan</th>
                                        {/* Render Header Kolom Dinamis sesuai Kriteria Statis */}
                                        {kriteriaList.map(k => (
                                            <th key={k.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {k.nama} ({k.kode})
                                            </th>
                                        ))}
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={3 + kriteriaList.length} className="text-center py-4">Memuat data...</td>
                                        </tr>
                                    ) : data.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{idx + 1}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {item.nama_jurusan}
                                            </td>
                                            {/* Render Cell Nilai Dinamis */}
                                            {kriteriaList.map(k => (
                                                <td key={k.id} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                                    <span className="bg-gray-100 px-2 py-1 rounded border">
                                                        {item.nilai[k.kode] || 0}
                                                    </span>
                                                </td>
                                            ))}
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="text-indigo-600 hover:text-indigo-900 font-bold"
                                                >
                                                    Edit Nilai
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>

            {/* MODAL EDIT NILAI */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="md">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Edit Nilai Jurusan: {selectedJurusan?.nama_jurusan}
                    </h2>

                    <div className="space-y-4">
                        {kriteriaList.map((k) => (
                            <div key={k.id}>
                                <InputLabel value={`${k.nama} (${k.kode})`} />
                                <p className="text-xs text-gray-500 mb-1">Masukkan nilai skala 1-5 (1=Sangat Rendah, 5=Sangat Tinggi)</p>
                                <TextInput
                                    type="number"
                                    min="1"
                                    max="5" // Asumsi skala likert 1-5, sesuaikan jika 1-100
                                    step="0.1"
                                    value={formValues[k.kode] || ''}
                                    onChange={(e) => handleInputChange(k.kode, e.target.value)}
                                    className="w-full mt-1"
                                    required
                                />
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowModal(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </div>
    );
}