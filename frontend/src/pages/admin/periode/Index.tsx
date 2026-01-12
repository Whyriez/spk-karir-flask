import React, {useEffect, useState} from 'react';
import PrimaryButton from '../../../components/PrimaryButton';
import SecondaryButton from '../../../components/SecondaryButton';
import Modal from '../../../components/Modal';
import TextInput from '../../../components/TextInput';
import InputLabel from '../../../components/InputLabel';
import apiClient from "../../../lib/axios.ts";
import Header from "../../../components/Header.tsx";

export default function PeriodeIndex() {
    const [periodes, setPeriodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [formName, setFormName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    // --- FETCH DATA ---
    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await apiClient.get('/periode')
            setPeriodes(res.data.periodes)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData(); }, []);

    const activePeriodeId = periodes.find(p => p.is_active)?.id || 0;

    // --- LOGIKA AKTIVASI & KENAIKAN KELAS ---
    const handleActivate = async (id: number, nama: string) => {
        let msg = "";

        // Cek apakah Maju atau Mundur
        if (id > activePeriodeId) {
            // KASUS MAJU (Kenaikan Kelas)
            msg = `KONFIRMASI GANTI PERIODE BARU:\n\n` +
                  `Anda akan mengaktifkan "${nama}".\n` +
                  `Sistem akan otomatis memproses KENAIKAN KELAS dari periode sebelumnya.\n` +
                  `Pastikan data periode sebelumnya sudah final.\n\n` +
                  `Lanjutkan?`;
        } else {
            // KASUS MUNDUR (Hanya Switch)
            msg = `KONFIRMASI MUNDUR PERIODE:\n\n` +
                  `Anda akan kembali ke periode lampau "${nama}".\n` +
                  `Sistem TIDAK AKAN memproses kenaikan kelas (hanya pindah status aktif).\n` +
                  `Gunakan ini hanya untuk melihat/memperbaiki data lama.\n\n` +
                  `Lanjutkan?`;
        }

        if (!window.confirm(msg)) return;

        try {
            const res = await apiClient.post(`/periode/${id}/activate`);
            alert(res.data.msg);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.msg || 'Gagal mengaktifkan periode');
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Yakin hapus periode ini? Data history terkait akan hilang.')) return
        try {
            await apiClient.delete(`/periode/${id}`)
            fetchData()
        } catch (err: any) {
            alert(err.response?.data?.msg || 'Gagal menghapus')
        }
    }

    const openModal = (item?: any) => {
        setFormName(item ? item.nama_periode : '');
        setEditingId(item ? item.id : null);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setProcessing(true)
        try {
            if (editingId) {
                await apiClient.put(`/periode/${editingId}`, { nama_periode: formName })
            } else {
                await apiClient.post('/periode', { nama_periode: formName })
            }
            setShowModal(false)
            fetchData()
        } catch (err) {
            alert('Gagal menyimpan periode')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div>
             <Header>
               <h2 className="font-semibold text-xl text-gray-800">Manajemen Periode & Tahun Ajaran</h2>
            </Header>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* INFO CARD */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 shadow-sm">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    <strong>Info Kenaikan Kelas:</strong> Mengaktifkan periode baru akan otomatis memicu proses kenaikan kelas untuk seluruh siswa dari periode sebelumnya.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Daftar Tahun Ajaran</h3>
                            <PrimaryButton onClick={() => openModal()}>+ Tambah Periode</PrimaryButton>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Periode</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Siswa Terdaftar</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {periodes.map((item) => (
                                    <tr key={item.id} className={item.is_active ? 'bg-green-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            {item.nama_periode}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.is_active ? (
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 text-green-800 border border-green-200">
                                                    AKTIF SEKARANG
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleActivate(item.id, item.nama_periode)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                                >
                                                    Aktifkan & Migrasi
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.jumlah_siswa} Siswa
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                                            {!item.is_active && (
                                                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                                            )}
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
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="md">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        {editingId ? 'Edit Periode' : 'Tambah Periode Baru'}
                    </h2>
                    <div className="mb-4">
                        <InputLabel value="Nama Periode"/>
                        <TextInput
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full mt-1"
                            placeholder="Contoh: TA 2025/2026"
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setShowModal(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>Simpan</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </div>
    );
}