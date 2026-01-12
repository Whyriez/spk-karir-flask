import React, {useEffect, useState} from 'react';
import PrimaryButton from '../../../components/PrimaryButton';
import SecondaryButton from '../../../components/SecondaryButton';
import Modal from '../../../components/Modal';
import TextInput from '../../../components/TextInput';
import InputLabel from '../../../components/InputLabel';
import apiClient from "../../../lib/axios.ts";
import Header from "../../../components/Header.tsx";
import { useNavigate } from 'react-router-dom';

// Tipe Data Sederhana
interface Jurusan {
    id: number;
    kode: string;
    nama: string;
}

interface StaticItem {
    kriteria_id: number;
    kode: string;
    nama: string;
    nilai: number | string; // Bisa string saat mengetik (misal "0.")
    skala_maks: number;
    tipe_input: string;
}

export default function JurusanPakarIndex() {
    const [data, setData] = useState<Jurusan[]>([]);
    const [loading, setLoading] = useState(true);

    // State Modal Static Data
    const [showStaticModal, setShowStaticModal] = useState(false);
    const [selectedJurusan, setSelectedJurusan] = useState<Jurusan | null>(null);
    const [staticItems, setStaticItems] = useState<StaticItem[]>([]);
    const [processing, setProcessing] = useState(false);

    // Get User Data
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();

    // Proteksi Akses: Hanya untuk Kaprodi
    useEffect(() => {
        if (user.role === 'pakar' && user.jenis_pakar !== 'kaprodi') {
            alert("Akses Ditolak: Halaman ini hanya untuk Kaprodi.");
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // FETCH DATA MENGGUNAKAN ROUTING KHUSUS
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/jurusan/me');
            setData(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user.jenis_pakar === 'kaprodi') {
            fetchData();
        } else {
            setLoading(false);
        }
    }, []);

    // --- HANDLERS STATIC DATA ---

    const openStaticModal = async (item: Jurusan) => {
        setSelectedJurusan(item);
        setStaticItems([]);
        setShowStaticModal(true);

        try {
            const res = await apiClient.get(`/jurusan/${item.id}/static-values`);
            setStaticItems(res.data.values);
        } catch (error) {
            console.error(error);
            alert("Gagal mengambil data statis.");
            setShowStaticModal(false);
        }
    };

    const handleStaticChange = (index: number, val: string) => {
        const newItems = [...staticItems];

        // 1. Handle Input Kosong (Biar bisa hapus semua angka)
        if (val === '') {
            newItems[index].nilai = '';
            setStaticItems(newItems);
            return;
        }

        const numVal = parseFloat(val);
        const maxVal = newItems[index].skala_maks;

        // 2. VALIDASI KETAT (Typing)
        // Jika angka valid DAN melebihi batas maksimal -> TOLAK PERUBAHAN
        // Input tidak akan berubah (tetap angka sebelumnya)
        if (!isNaN(numVal) && numVal > maxVal) {
            // Opsional: Beri efek visual atau alert jika diperlukan
            // alert(`Nilai tidak boleh melebihi ${maxVal}`);
            return;
        }

        // 3. Validasi Min (Tidak boleh negatif)
        if (!isNaN(numVal) && numVal < 0) {
            return;
        }

        // Update state jika lolos validasi
        // Kita simpan sebagai string sementara jika diakhiri titik (untuk desimal)
        // atau simpan sebagai number jika valid
        newItems[index].nilai = val.endsWith('.') ? val : numVal;

        setStaticItems(newItems);
    };

    const handleStaticSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJurusan) return;

        // VALIDASI AKHIR SEBELUM KIRIM
        // Pastikan tidak ada nilai yang melebihi batas (double check)
        const invalidItems = staticItems.filter(item => {
            const val = Number(item.nilai);
            return val > item.skala_maks || val < 0;
        });

        if (invalidItems.length > 0) {
            alert(`Gagal Simpan: Ada nilai yang tidak valid (melebihi skala maksimal).\nPeriksa kriteria: ${invalidItems.map(i => i.kode).join(', ')}`);
            return;
        }

        setProcessing(true);

        try {
            // Bersihkan data (convert ke float murni)
            const payloadItems = staticItems.map(item => ({
                ...item,
                nilai: (item.nilai === '' || item.nilai === null) ? 0 : parseFloat(String(item.nilai))
            }));

            await apiClient.post(`/jurusan/${selectedJurusan.id}/static-values`, {
                items: payloadItems
            });
            alert("Data statis berhasil disimpan!");
            setShowStaticModal(false);
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan data statis.");
        } finally {
            setProcessing(false);
        }
    };

    if (user.jenis_pakar !== 'kaprodi') return null;

    return (
        <div>
            <Header>
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800">Data Jurusan & Nilai Static</h2>
                </div>
            </Header>

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">

                    {/* INFO BOX */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 shadow-sm">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    <strong>Area Pakar Kaprodi:</strong> Data di bawah adalah jurusan yang Anda ampu. Silakan kelola nilai kriteria statisnya.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-200">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Kode</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Jurusan</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={3} className="p-4 text-center">Memuat data jurusan Anda...</td></tr>
                                    ) : data.length === 0 ? (
                                        <tr><td colSpan={3} className="p-6 text-center text-gray-500">
                                            Anda belum ditautkan ke jurusan manapun. Hubungi Admin.
                                        </td></tr>
                                    ) : (
                                        data.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.kode}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.nama}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => openStaticModal(item)}
                                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                                        Input Nilai
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
            </div>

            {/* MODAL STATIC DATA JURUSAN */}
            <Modal show={showStaticModal} onClose={() => setShowStaticModal(false)} maxWidth="lg">
                <form onSubmit={handleStaticSubmit} className="p-6">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b">
                        <h2 className="text-lg font-bold text-gray-900">
                            Input Nilai: <span className="text-indigo-600">{selectedJurusan?.nama}</span>
                        </h2>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                            {selectedJurusan?.kode}
                        </span>
                    </div>

                    <div className="mb-6 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                        {staticItems.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded border border-dashed text-gray-500 italic">
                                Tidak ada kriteria bertipe "Static Jurusan" yang ditemukan.
                                <br/>
                                <small>Silakan hubungi Admin untuk menambahkan kriteria.</small>
                            </div>
                        ) : (
                            staticItems.map((item, index) => (
                                <div key={item.kriteria_id}>
                                    <InputLabel value={`${item.kode} - ${item.nama}`} className="mb-1" />
                                    <div className="flex items-center gap-2">
                                        <TextInput
                                            type="number"
                                            value={item.nilai}
                                            onChange={(e) => handleStaticChange(index, e.target.value)}
                                            className="w-full"
                                            placeholder="0"
                                            // --- TAMBAHAN ATTRIBUTE HTML5 ---
                                            min={0}
                                            max={item.skala_maks}
                                            step="0.01" // Support desimal
                                            // --------------------------------
                                        />
                                        <span className="text-xs text-gray-500 whitespace-nowrap font-mono bg-gray-100 px-2 py-1 rounded">
                                            Max: {item.skala_maks}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <SecondaryButton type="button" onClick={() => setShowStaticModal(false)}>
                            Tutup
                        </SecondaryButton>
                        {staticItems.length > 0 && (
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </PrimaryButton>
                        )}
                    </div>
                </form>
            </Modal>
        </div>
    );
}