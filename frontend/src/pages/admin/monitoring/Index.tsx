import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import PrimaryButton from '../../../components/PrimaryButton';
import SecondaryButton from '../../../components/SecondaryButton';
import Modal from '../../../components/Modal';
import InputLabel from '../../../components/InputLabel';
import TextInput from '../../../components/TextInput';

export default function MonitoringIndex() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [filterKelas, setFilterKelas] = useState('');

    // Modal Catatan
    const [showModal, setShowModal] = useState(false);
    const [selectedHasil, setSelectedHasil] = useState<any>(null);
    const [catatan, setCatatan] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Build Query Params
        const params = new URLSearchParams();
        if(search) params.append('search', search);
        if(filterKelas) params.append('kelas', filterKelas);

        try {
            const res = await fetch(`/api/monitoring?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if(res.ok) setData(json.data);
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search / effect filter
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, filterKelas]);

    const openModal = (item: any) => {
        if (!item.hasil) return alert("Siswa ini belum memiliki hasil penilaian.");
        setSelectedHasil(item.hasil);
        setCatatan(item.hasil.catatan || '');
        setShowModal(true);
    };

    const handleSaveCatatan = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        const token = localStorage.getItem('token');

        const res = await fetch('http://localhost:5000/api/monitoring/catatan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                hasil_id: selectedHasil.id,
                catatan: catatan
            })
        });

        if(res.ok) {
            alert('Catatan tersimpan');
            setShowModal(false);
            fetchData(); // Refresh list
        } else {
            alert('Gagal menyimpan');
        }
        setProcessing(false);
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800">Monitoring Siswa</h2>}>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white shadow-sm sm:rounded-lg p-6">

                        {/* FILTER BAR */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                            <div className="flex gap-4">
                                <select
                                    className="border-gray-300 rounded-md shadow-sm"
                                    value={filterKelas}
                                    onChange={(e) => setFilterKelas(e.target.value)}
                                >
                                    <option value="">Semua Kelas</option>
                                    <option value="10">Kelas 10</option>
                                    <option value="11">Kelas 11</option>
                                    <option value="12">Kelas 12</option>
                                </select>
                            </div>
                            <div className="w-full md:w-1/3">
                                <TextInput
                                    placeholder="Cari Nama / NISN..."
                                    className="w-full"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Siswa</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas/Jurusan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hasil</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                                    ) : data.length === 0 ? (
                                        <tr><td colSpan={5} className="p-4 text-center">Tidak ada data.</td></tr>
                                    ) : data.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{item.name}</div>
                                                <div className="text-xs text-gray-500">{item.nisn}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {item.kelas} - {item.jurusan}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    item.status === 'Sudah Dinilai' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {item.hasil ? (
                                                    <div>
                                                        <div className="font-bold text-indigo-700">{item.hasil.keputusan}</div>
                                                        <div className="text-xs text-gray-500">Skor: {item.hasil.skor_tertinggi.toFixed(3)}</div>
                                                        {item.hasil.catatan && (
                                                            <div className="mt-1 text-xs bg-yellow-50 p-1 rounded border border-yellow-200 text-yellow-700 truncate max-w-xs">
                                                                📝 {item.hasil.catatan}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {item.hasil && (
                                                    <button
                                                        onClick={() => openModal(item)}
                                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                                    >
                                                        Beri Catatan
                                                    </button>
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

            {/* MODAL CATATAN */}
            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <form onSubmit={handleSaveCatatan} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Catatan Guru BK</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Berikan masukan atau rekomendasi manual untuk siswa ini berdasarkan hasil sistem.
                    </p>

                    <div className="mb-4">
                        <InputLabel value="Isi Catatan" />
                        <textarea
                            className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            rows={5}
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                            placeholder="Contoh: Disarankan mengambil jurusan Teknik Informatika karena nilai matematika tinggi..."
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-2">
                        <SecondaryButton onClick={() => setShowModal(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>Simpan Catatan</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}