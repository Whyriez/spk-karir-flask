import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import PrimaryButton from '../../../components/PrimaryButton';

export default function PromotionIndex() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const fetchStats = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/promotion/summary', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (res.ok) setStats(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handlePromote = async () => {
        const msg = `PERINGATAN KERAS:\n\n` +
            `1. Siswa Kelas 12 akan diluluskan (menjadi Alumni).\n` +
            `2. Siswa Kelas 11 akan naik ke Kelas 12.\n` +
            `3. Siswa Kelas 10 akan naik ke Kelas 11.\n\n` +
            `Tindakan ini TIDAK BISA DIBATALKAN. Yakin ingin memproses?`;

        if (!confirm(msg)) return;
        if (!confirm('Apakah Anda benar-benar yakin? (Konfirmasi 2x)')) return;

        setProcessing(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('/api/promotion/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const json = await res.json();

            if (res.ok) {
                alert(`BERHASIL!\n\nDetail:\n- Lulus: ${json.details.lulus}\n- Naik ke 12: ${json.details.naik_ke_12}\n- Naik ke 11: ${json.details.naik_ke_11}`);
                fetchStats();
            } else {
                alert('Gagal: ' + json.msg);
            }
        } catch (e) {
            alert('Error koneksi');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Summary...</div>;

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800">Kenaikan Kelas</h2>}>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Fitur ini digunakan untuk memproses perpindahan tahun ajaran.
                                    Pastikan semua nilai siswa untuk periode saat ini sudah rampung sebelum melakukan eksekusi.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* CARD KELAS 10 */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-t-4 border-blue-500">
                            <div className="text-gray-500 text-sm font-medium uppercase">Kelas 10 (Sekarang)</div>
                            <div className="mt-2 flex items-baseline">
                                <span className="text-3xl font-extrabold text-gray-900">{stats?.kelas_10 || 0}</span>
                                <span className="ml-2 text-sm text-gray-500">Siswa</span>
                            </div>
                            <div className="mt-4 text-sm text-blue-600 font-medium">
                                &rarr; Akan naik ke Kelas 11
                            </div>
                        </div>

                        {/* CARD KELAS 11 */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-t-4 border-indigo-500">
                            <div className="text-gray-500 text-sm font-medium uppercase">Kelas 11 (Sekarang)</div>
                            <div className="mt-2 flex items-baseline">
                                <span className="text-3xl font-extrabold text-gray-900">{stats?.kelas_11 || 0}</span>
                                <span className="ml-2 text-sm text-gray-500">Siswa</span>
                            </div>
                            <div className="mt-4 text-sm text-indigo-600 font-medium">
                                &rarr; Akan naik ke Kelas 12
                            </div>
                        </div>

                        {/* CARD KELAS 12 */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-t-4 border-green-500">
                            <div className="text-gray-500 text-sm font-medium uppercase">Kelas 12 (Sekarang)</div>
                            <div className="mt-2 flex items-baseline">
                                <span className="text-3xl font-extrabold text-gray-900">{stats?.kelas_12 || 0}</span>
                                <span className="ml-2 text-sm text-gray-500">Siswa</span>
                            </div>
                            <div className="mt-4 text-sm text-green-600 font-medium">
                                &rarr; Lulus (Masuk Data Alumni)
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow sm:rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Eksekusi Kenaikan Kelas</h3>
                        <p className="max-w-xl text-gray-500">
                            Tombol di bawah akan memproses semua siswa secara otomatis.
                            Pastikan Anda sudah membackup database jika diperlukan.
                        </p>

                        <PrimaryButton
                            onClick={handlePromote}
                            disabled={processing || stats?.total_eligible === 0}
                            className="bg-red-600 hover:bg-red-700 focus:bg-red-700 px-8 py-3 text-lg"
                        >
                            {processing ? 'Sedang Memproses...' : 'PROSES KENAIKAN KELAS SEKARANG'}
                        </PrimaryButton>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}