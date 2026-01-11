import React, {useEffect, useState} from 'react';
// @ts-ignore
import PrimaryButton from '../../components/PrimaryButton';
import {useNavigate} from 'react-router-dom';
import AuthenticatedLayout from "../../Layouts/AuthenticatedLayout.tsx";

export default function Result() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchResult = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('/api/moora/result', {
                    headers: {'Authorization': `Bearer ${token}`}
                });
                const json = await res.json();
                if (res.ok) {
                    setData(json);
                } else {
                    // Jika belum ada hasil, mungkin belum input?
                    // alert(json.msg);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, []);

    if (loading) return <div className="p-10 text-center">Menghitung Rekomendasi...</div>;

    if (!data) return (
        <div className="p-10 text-center">
            <h2 className="text-xl font-bold mb-4">Belum Ada Hasil</h2>
            <p className="mb-4">Anda belum mengisi data penilaian diri untuk periode ini.</p>
            <PrimaryButton onClick={() => navigate('/siswa/input')}>Isi Data Sekarang</PrimaryButton>
        </div>
    );

    const {hasil, alumni, periode} = data;

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800">Hasil Perhitungan SPK (Metode MOORA)</h2>}>
            <div className="p-6 bg-gray-100 min-h-screen">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Header Hasil */}
                    <div
                        className="bg-white shadow-xl rounded-2xl overflow-hidden text-center p-8 border-t-4 border-indigo-500">
                        <h2 className="text-gray-500 uppercase tracking-widest text-xs font-bold mb-2">
                            Hasil Perhitungan SPK (Metode MOORA)
                        </h2>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                            {hasil.keputusan}
                        </h1>
                        <p className="text-gray-600 text-sm">
                            Periode: <span className="font-semibold">{periode}</span>
                        </p>

                        {/* Progress Bars */}
                        <div className="mt-8 space-y-4 max-w-lg mx-auto">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Minat Studi (Kuliah)</span>
                                    <span>{hasil.skor.studi.toFixed(4)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full"
                                         style={{width: `${hasil.skor.studi * 100}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Minat Bekerja</span>
                                    <span>{hasil.skor.kerja.toFixed(4)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-green-600 h-2.5 rounded-full"
                                         style={{width: `${hasil.skor.kerja * 100}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Minat Wirausaha</span>
                                    <span>{hasil.skor.wirausaha.toFixed(4)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-yellow-500 h-2.5 rounded-full"
                                         style={{width: `${hasil.skor.wirausaha * 100}%`}}></div>
                                </div>
                            </div>
                        </div>

                        {hasil.catatan && (
                            <div
                                className="mt-6 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
                                <strong>Catatan Guru BK:</strong><br/>
                                "{hasil.catatan}"
                            </div>
                        )}
                    </div>

                    {/* Alumni Section */}
                    {alumni.length > 0 && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">
                                Jejak Alumni ({hasil.keputusan})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {alumni.map((a: any, idx: number) => (
                                    <div key={idx}
                                         className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50">
                                        <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor"
                                                 viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{a.name}</p>
                                            <p className="text-xs text-gray-500">{a.status} • Angkatan {a.batch}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="text-center">
                        <PrimaryButton onClick={() => navigate('/siswa/input')} className="bg-gray-500">
                            Isi Ulang Data (Revisi)
                        </PrimaryButton>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>

    );
}