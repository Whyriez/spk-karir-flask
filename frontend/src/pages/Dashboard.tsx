import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthenticatedLayout from '../Layouts/AuthenticatedLayout';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Ambil data user dari localStorage untuk cek role & nama
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('/api/dashboard/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if (res.ok) setData(json);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (!user) return null; // Redirect handled by layout
    if (loading) return <div className="p-10 text-center">Memuat Dashboard...</div>;
    if (!data) return <div className="p-10 text-center">Gagal memuat data.</div>;

    // --- TAMPILAN DASHBOARD SISWA ---
    if (data.role === 'siswa') {
        const history = data.history || [];

        const chartData = {
            labels: history.map((h: any) => h.label),
            datasets: [
                {
                    label: "Minat Studi",
                    data: history.map((h: any) => h.skor_studi),
                    borderColor: "rgb(79, 70, 229)",
                    backgroundColor: "rgba(79, 70, 229, 0.2)",
                    tension: 0.4, fill: true, pointRadius: 5
                },
                {
                    label: "Minat Kerja",
                    data: history.map((h: any) => h.skor_kerja),
                    borderColor: "rgb(16, 185, 129)",
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    tension: 0.4, fill: true, pointRadius: 5
                },
                {
                    label: "Wirausaha",
                    data: history.map((h: any) => h.skor_wirausaha),
                    borderColor: "rgb(249, 115, 22)",
                    backgroundColor: "rgba(249, 115, 22, 0.2)",
                    tension: 0.4, fill: true, pointRadius: 5
                },
            ],
        };

        const lastResult = history.length > 0 ? history[history.length - 1] : null;

        return (
            <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800">Dashboard Siswa</h2>}>
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
                        {/* WELCOME BANNER */}
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-3xl font-bold">Halo, {user.name}! 👋</h3>
                                <p className="mt-2 text-indigo-100 max-w-2xl">
                                    Pantau terus perkembangan potensimu dari tahun ke tahun untuk masa depan yang lebih cerah.
                                </p>
                                <div className="mt-6 flex gap-3">
                                    <Link to="/siswa/input" className="px-5 py-2.5 bg-white text-indigo-600 font-bold rounded-lg hover:bg-gray-100 transition shadow-sm">
                                        📝 Update Data
                                    </Link>
                                    <Link to="/siswa/result" className="px-5 py-2.5 bg-indigo-700 text-white font-semibold rounded-lg hover:bg-indigo-800 transition border border-indigo-500">
                                        📊 Lihat Hasil
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* CHART */}
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Grafik Perkembangan Minat</h3>
                                <div className="h-80">
                                    {history.length > 0 ? (
                                        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed rounded-xl">Belum ada history.</div>
                                    )}
                                </div>
                            </div>

                            {/* RINGKASAN TERAKHIR */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Status Terakhir</h3>
                                {lastResult ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                                            <div className="text-xs text-indigo-600 font-bold uppercase">Rekomendasi Utama</div>
                                            <div className="text-xl font-extrabold text-indigo-700 mt-1">{lastResult.keputusan}</div>
                                            <div className="text-xs text-indigo-500 mt-1">{lastResult.label}</div>
                                        </div>
                                        <div className="text-sm space-y-2">
                                            <div className="flex justify-between"><span>Studi</span><span className="font-bold">{lastResult.skor_studi?.toFixed(3)}</span></div>
                                            <div className="flex justify-between"><span>Kerja</span><span className="font-bold">{lastResult.skor_kerja?.toFixed(3)}</span></div>
                                            <div className="flex justify-between"><span>Wirausaha</span><span className="font-bold">{lastResult.skor_wirausaha?.toFixed(3)}</span></div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center">Data kosong.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    // --- TAMPILAN DASHBOARD ADMIN / PAKAR ---
    const { stats, chart_distribution, rekapitulasi } = data;

    const doughnutData = {
        labels: chart_distribution?.labels || [],
        datasets: [{
            data: chart_distribution?.data || [],
            backgroundColor: chart_distribution?.colors || [],
            hoverOffset: 4,
        }],
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800">Dashboard {data.role === 'admin' ? 'Admin' : 'Pakar'}</h2>}>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* STAT CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Total Siswa" value={stats.total_siswa} color="bg-blue-50" textColor="text-blue-700" />
                        <StatCard title="Sudah Dinilai" value={stats.sudah_mengisi} color="bg-green-50" textColor="text-green-700" />
                        <StatCard title="Belum Mengisi" value={stats.belum_mengisi} color="bg-red-50" textColor="text-red-700" />
                        <StatCard title="Dominasi Hasil" value={getMaxLabel(stats)} color="bg-purple-50" textColor="text-purple-700" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* PIE CHART */}
                        <div className="bg-white shadow-sm sm:rounded-lg p-6 lg:col-span-2">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Distribusi Rekomendasi Karir</h3>
                            <div className="flex flex-col sm:flex-row items-center justify-around h-64">
                                <div className="h-full w-full sm:w-1/2 flex justify-center">
                                    <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
                                </div>
                                <div className="mt-4 sm:mt-0 space-y-3 w-full sm:w-1/3">
                                    <LegendItem color="bg-indigo-600" label="Studi" value={stats.rekomendasi_studi} total={stats.sudah_mengisi} />
                                    <LegendItem color="bg-emerald-500" label="Bekerja" value={stats.rekomendasi_kerja} total={stats.sudah_mengisi} />
                                    <LegendItem color="bg-orange-500" label="Wirausaha" value={stats.rekomendasi_wirausaha} total={stats.sudah_mengisi} />
                                </div>
                            </div>
                        </div>

                        {/* QUICK ACTIONS */}
                        <div className="bg-white shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Tindak Lanjut</h3>
                            {stats.belum_mengisi > 0 && (
                                <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                    <p className="text-sm text-yellow-700">
                                        Ada <span className="font-bold">{stats.belum_mengisi} siswa</span> belum mengisi.
                                    </p>
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-2">
                                {data.role === 'admin' ? (
                                    <>
                                        <button className="block w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">Monitoring Siswa</button>
                                        <button className="block w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">Pengaturan Sistem</button>
                                    </>
                                ) : (
                                    <Link to="/pakar/bwm" className="block text-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                                        Input Bobot (BWM)
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* TABLE REKAP */}
                    <div className="bg-white shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Aktifitas Penilaian Terbaru</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Siswa</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jurusan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nilai Optima</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keputusan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {rekapitulasi.length === 0 ? (
                                        <tr><td colSpan={5} className="p-4 text-center text-gray-500">Belum ada data.</td></tr>
                                    ) : rekapitulasi.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nama}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jurusan}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.nilai_optima.toFixed(4)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 text-xs font-semibold rounded-full ${
                                                    item.keputusan === 'Melanjutkan Studi' ? 'bg-indigo-100 text-indigo-800' :
                                                    item.keputusan === 'Bekerja' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {item.keputusan}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(item.tanggal).toLocaleDateString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// --- SUB COMPONENTS ---
function StatCard({ title, value, color, textColor }: any) {
    return (
        <div className={`p-6 rounded-lg shadow-sm border border-gray-100 ${color} bg-opacity-30`}>
            <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</p>
        </div>
    );
}

function LegendItem({ color, label, value, total }: any) {
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="flex items-center justify-between text-sm w-full">
            <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${color}`}></span>
                <span className="text-gray-600">{label}</span>
            </div>
            <div className="font-semibold text-gray-800">
                {value} <span className="text-xs text-gray-400">({percent}%)</span>
            </div>
        </div>
    );
}

function getMaxLabel(stats: any) {
    const maxVal = Math.max(stats.rekomendasi_studi, stats.rekomendasi_kerja, stats.rekomendasi_wirausaha);
    if (maxVal === 0) return "-";
    if (maxVal === stats.rekomendasi_studi) return "Studi";
    if (maxVal === stats.rekomendasi_kerja) return "Kerja";
    return "Wirausaha";
}