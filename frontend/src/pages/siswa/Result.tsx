import React, {useEffect, useState} from 'react';
import {Link, useNavigate, useOutletContext, useSearchParams} from 'react-router-dom';
import Modal from '@/components/Modal';
import SecondaryButton from '@/components/SecondaryButton';
import apiClient from '@/lib/axios';
import type {LayoutContextType} from "../../interface/layout.ts";

export default function ResultSiswa() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAlumniModalOpen, setIsAlumniModalOpen] = useState(false);
    const navigate = useNavigate();

      const {setHeader} = useOutletContext<LayoutContextType>();
    useEffect(() => {
        setHeader(
            <h2 className="font-semibold text-xl text-gray-800 leading-tight">Laporan Hasil Analisis Karir</h2>
        );
    }, []);

    const [searchParams] = useSearchParams();
    const historyId = searchParams.get('id');

    // 1. Fetch Data dari Backend
    useEffect(() => {
        const fetchResult = async () => {
            setLoading(true); // Set loading true setiap kali ID berubah
            try {
                // Jika ada ID di URL, kirim sebagai query param
                const url = historyId ? `/moora/result?id=${historyId}` : '/moora/result';

                const res = await apiClient.get(url);
                setData(res.data);
            } catch (err) {
                console.error("Gagal mengambil hasil:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [historyId]);

    // 2. Loading State
    if (loading) {
        return (
            <div className="py-20 text-center text-gray-500">Memuat analisis data...</div>
        );
    }

    // 3. Handle Jika Belum Ada Data (Mirip Laravel)
    if (!data || !data.hasil) {
        return (
            <div className="py-20 text-center px-4">
                <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Data Penilaian Belum Tersedia</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Anda belum memiliki data hasil analisis untuk periode aktif saat ini. Silakan isi kuesioner terlebih
                    dahulu.
                </p>
                <Link to="/siswa/input"
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold inline-block">
                    Mulai Input Data
                </Link>
            </div>
        );
    }

    const {hasil, alumni, periode} = data;
    const alumni_relevan = alumni || [];

    // 4. Tentukan Warna & Deskripsi Dinamis
    let themeClass = 'border-gray-500 text-gray-700';
    let bgClass = 'bg-gray-50';
    let description = '';

    const keputusan = hasil.keputusan || '';

    if (keputusan.includes('Studi')) {
        themeClass = 'border-indigo-500 text-indigo-700';
        bgClass = 'bg-indigo-50';
        description = 'Berdasarkan analisis potensi akademik dan minat studi Anda yang dominan, sistem sangat menyarankan Anda untuk melanjutkan pendidikan ke jenjang Perguruan Tinggi.';
    } else if (keputusan.includes('Kerja') || keputusan.includes('Bekerja')) {
        themeClass = 'border-emerald-500 text-emerald-700';
        bgClass = 'bg-emerald-50';
        description = 'Analisis menunjukkan kesiapan kerja praktis dan orientasi karir industri Anda sangat kuat. Memasuki dunia kerja langsung setelah lulus adalah pilihan strategis.';
    } else if (keputusan.includes('Berwirausaha')) {
        themeClass = 'border-orange-500 text-orange-700';
        bgClass = 'bg-orange-50';
        description = 'Profil Anda menunjukkan jiwa entrepreneurship yang tinggi didukung dengan modal/aset yang memadai. Merintis usaha mandiri adalah potensi terbaik Anda.';
    }



    return (
        <div>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">

                    {/* HEADER INFO PERIODE */}
                    <div
                        className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <span
                                className="text-xs font-bold text-blue-500 uppercase tracking-wide">Periode Penilaian</span>
                            <h3 className="text-lg font-bold text-gray-800">
                                {periode}
                            </h3>
                            {/* Jika backend kirim tanggal_hitung, tampilkan */}
                            {hasil.created_at && (
                                <p className="text-sm text-gray-500">
                                    Dihitung pada: {new Date(hasil.created_at).toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                                </p>
                            )}
                        </div>
                        <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-800 underline">
                            Lihat Riwayat Lain
                        </Link>
                    </div>

                    {/* GRID UTAMA */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* KOLOM KIRI (2/3): DETAIL HASIL */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* KARTU KEPUTUSAN UTAMA */}
                            <div
                                className={`bg-white overflow-hidden shadow-lg rounded-xl border-t-8 ${themeClass.split(' ')[0]}`}>
                                <div className="p-8 text-center">
                                    <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-3">
                                        Rekomendasi Terbaik Sistem
                                    </h3>
                                    <div
                                        className={`text-3xl md:text-5xl font-extrabold mb-4 py-4 px-6 rounded-xl inline-block ${bgClass} ${themeClass}`}>
                                        {keputusan.toUpperCase()}
                                    </div>
                                    <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
                                        {description}
                                    </p>
                                </div>
                            </div>

                            {/* --- REKOMENDASI ALUMNI --- */}
                            {alumni_relevan.length > 0 && (
                                <div
                                    className="bg-white overflow-hidden shadow-sm sm:rounded-xl p-6 border border-gray-100">
                                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                <svg className="w-5 h-5 text-indigo-500" fill="none"
                                                     stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                                </svg>
                                                Jejak Alumni
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Kakak kelas jurusanmu yang sukses di jalur <b>{keputusan}</b>
                                            </p>
                                        </div>

                                        {alumni_relevan.length > 3 && (
                                            <button
                                                onClick={() => setIsAlumniModalOpen(true)}
                                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline mt-2 sm:mt-0"
                                            >
                                                Lihat Semua ({alumni_relevan.length})
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {/* Tampilkan hanya 3 alumni pertama */}
                                        {alumni_relevan.slice(0, 3).map((a: any, idx: number) => (
                                            <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <div className="font-bold text-gray-800 truncate">{a.name}</div>
                                                <div className="text-xs text-gray-500 mb-1">Angkatan {a.batch}</div>
                                                <div className="text-sm text-indigo-700 font-medium line-clamp-2">
                                                    {a.status}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CATATAN GURU BK */}
                            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                                    </svg>
                                    <h3 className="font-bold text-gray-800">Catatan & Validasi Guru BK</h3>
                                </div>
                                <div className="p-6">
                                    {hasil.catatan ? (
                                        <div className="prose text-gray-700">
                                            <p className="italic border-l-4 border-gray-300 pl-4 py-2 bg-gray-50 rounded-r">
                                                "{hasil.catatan}"
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2 text-right">
                                                — Diverifikasi oleh Tim Bimbingan Konseling
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400 py-4 italic">
                                            Belum ada catatan dari Guru BK untuk hasil ini.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* KOLOM KANAN (1/3): STATISTIK SKOR */}
                        <div className="space-y-6">
                            <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-6 pb-2 border-b">Detail Skor MOORA</h3>
                                <div className="space-y-6">
                                    {/* Item Studi */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-600">Minat Studi</span>
                                            <span
                                                className="font-bold text-indigo-600">{hasil.skor.studi?.toFixed(4)}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-1000"
                                                 style={{width: `${Math.min(hasil.skor.studi * 100, 100)}%`}}></div>
                                        </div>
                                    </div>

                                    {/* Item Kerja */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-600">Minat Kerja</span>
                                            <span
                                                className="font-bold text-emerald-600">{hasil.skor.kerja?.toFixed(4)}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                                                style={{width: `${Math.min(hasil.skor.kerja * 100, 100)}%`}}></div>
                                        </div>
                                    </div>

                                    {/* Item Wirausaha */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-600">Minat Wirausaha</span>
                                            <span
                                                className="font-bold text-orange-600">{hasil.skor.wirausaha?.toFixed(4)}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                                                 style={{width: `${Math.min(hasil.skor.wirausaha * 100, 100)}%`}}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <button onClick={() => window.print()}
                                            className="w-full py-2 flex items-center justify-center gap-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                                        </svg>
                                        Cetak Laporan (PDF)
                                    </button>
                                </div>
                            </div>

                            {/* Info Bantuan */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h4 className="font-bold text-blue-800 text-sm mb-2">Butuh Konsultasi Lebih Lanjut?</h4>
                                <p className="text-xs text-blue-700 mb-3">
                                    Jika Anda masih ragu dengan hasil rekomendasi ini, silakan temui Guru BK di ruang
                                    konseling untuk diskusi mendalam.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* --- MODAL DETAIL ALUMNI --- */}
            <Modal show={isAlumniModalOpen} onClose={() => setIsAlumniModalOpen(false)}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-900">
                            Daftar Alumni - {keputusan}
                        </h2>
                        <button onClick={() => setIsAlumniModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    <p className="text-sm text-gray-500 mb-4">
                        Berikut adalah data alumni jurusan Anda yang memilih jalur karir ini:
                    </p>

                    <div className="overflow-y-auto max-h-[60vh]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Angkatan</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Detail
                                    Status
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {alumni_relevan.map((a: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{a.batch}</td>
                                    <td className="px-4 py-3 text-sm text-indigo-600">{a.status}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={() => setIsAlumniModalOpen(false)}>
                            Tutup
                        </SecondaryButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}