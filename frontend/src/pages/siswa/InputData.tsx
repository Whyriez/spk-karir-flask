import React, {useEffect, useState, FormEvent} from 'react';
import {useNavigate} from 'react-router-dom';
import apiClient from '@/lib/axios';
import Header from "../../components/Header.tsx";

// Tipe Data
interface KriteriaItem {
    id: number;
    kode: string;
    nama: string;
    pertanyaan?: string;
    tipe_input: 'number' | 'select' | 'likert';
    kategori: string;
    opsi_pilihan?: { val: string | number; label: string }[];
    value?: string | number;
}


export default function InputDataSiswa() {
    const [kriterias, setKriterias] = useState<KriteriaItem[]>([]);
    const [values, setValues] = useState<Record<string, string | number>>({});
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();

    // 1. FETCH DATA
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiClient.get('/siswa/form');
                const data = response.data.data;

                setKriterias(data);

                // Inisialisasi value
                const initialValues: Record<string, any> = {};
                data.forEach((k: KriteriaItem) => {
                    initialValues[k.id] = k.value !== null && k.value !== undefined ? k.value : '';
                });
                setValues(initialValues);
            } catch (error) {
                console.error("Gagal memuat form:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 2. FILTER KATEGORI
    const listAkademik = kriterias.filter(k => k.kategori === 'akademik');
    const listKuesioner = kriterias.filter(k => k.kategori === 'kuesioner');

    // 3. HANDLERS
    const handleChange = (kriteriaId: number, value: string | number) => {
        setValues(prev => ({...prev, [kriteriaId]: value}));
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        try {
            await apiClient.post('/siswa/save', {values});
            alert('Data berhasil disimpan!');
            navigate('/siswa/result');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan data.');
        } finally {
            setProcessing(false);
        }
    };

    // 4. RENDER INPUT FIELD
    const renderInputField = (k: KriteriaItem) => {
        // A. Tipe NUMBER
        if (k.tipe_input === 'number') {
            return (
                <div className="flex items-center">
                    <input
                        type="number"
                        step="0.01"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm"
                        placeholder={`Masukkan nilai ${k.nama}`}
                        value={values[k.id]}
                        onChange={(e) => handleChange(k.id, e.target.value)}
                        required
                    />
                </div>
            );
        }

        // B. Tipe SELECT
        if (k.tipe_input === 'select') {
            let options = k.opsi_pilihan || [];
            // Fallback parsing jika backend kirim string JSON
            if (typeof options === 'string') {
                try {
                    options = JSON.parse(options);
                } catch (e) {
                    options = [];
                }
            }

            return (
                <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm"
                    value={values[k.id]}
                    onChange={(e) => handleChange(k.id, e.target.value)}
                    required
                >
                    <option value="">-- Pilih Opsi --</option>
                    {Array.isArray(options) && options.map((opt: any, idx: number) => (
                        <option key={idx} value={opt.val}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        // C. Tipe LIKERT
        if (k.tipe_input === 'likert') {
            const likertOptions = [
                {val: 1, label: 'STS'}, {val: 2, label: 'TS'},
                {val: 3, label: 'N'}, {val: 4, label: 'S'}, {val: 5, label: 'SS'}
            ];
            const currentValue = Number(values[k.id]);

            return (
                <div className="grid grid-cols-5 gap-2 mt-2 md:w-3/4">
                    {likertOptions.map(opt => (
                        <label key={opt.val} className={`
                            cursor-pointer border rounded-md p-2 text-center transition-all flex flex-col items-center justify-center
                            ${currentValue === opt.val
                            ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-300 shadow-lg transform scale-105'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                        `}>
                            <input
                                type="radio"
                                name={`k_${k.id}`}
                                value={opt.val}
                                checked={currentValue === opt.val}
                                onChange={(e) => handleChange(k.id, e.target.value)}
                                className="sr-only"
                                required
                            />
                            <div className="font-bold text-lg">{opt.val}</div>
                            <div className="text-[10px] uppercase font-semibold">{opt.label}</div>
                        </label>
                    ))}
                </div>
            );
        }
    };

    if (loading) {
        return (
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div
                        className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-10 text-center text-gray-500 flex flex-col items-center justify-center min-h-[300px]">
                        <svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg"
                             fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                    strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Memuat formulir...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Header>
                <h2 className="font-semibold text-xl text-gray-800">Input Data Siswa</h2>
            </Header>
            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="space-y-8">

                        {/* BAGIAN 1: Data Akademik (Dengan Info Box di Kanan) */}
                        {listAkademik.length > 0 && (
                            <div className="bg-white p-6 shadow-sm rounded-lg border-l-4 border-blue-500">
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* KOLOM KIRI: INPUT FORM */}
                                    <div className="flex-1 space-y-6">
                                        <h3 className="text-lg font-bold mb-4 text-gray-800 border-b border-gray-100 pb-2">
                                            1. Data Akademik & Ekonomi
                                        </h3>
                                        {listAkademik.map(k => (
                                            <div key={k.id}>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    {k.kode} - {k.nama}
                                                </label>
                                                {k.pertanyaan && (
                                                    <p className="text-xs text-gray-500 mb-2 italic">"{k.pertanyaan}"</p>
                                                )}
                                                {renderInputField(k)}
                                            </div>
                                        ))}
                                    </div>

                                    {/* KOLOM KANAN: PENJELASAN (LEGEND) */}
                                    <div className="md:w-1/3">
                                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 sticky top-4">
                                            <h4 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor"
                                                     viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                Panduan Pengisian
                                            </h4>

                                            <div className="text-xs text-blue-800 mb-4">
                                                <p className="mb-2 font-semibold">Keterangan Skala Penilaian:</p>
                                                <ul className="space-y-2 pl-1">
                                                    <li className="flex items-center gap-2">
                                                    <span
                                                        className="bg-white border border-blue-200 px-2 py-1 rounded font-bold w-10 text-center text-blue-600">STS</span>
                                                        <span>Sangat Tidak Setuju (1)</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                    <span
                                                        className="bg-white border border-blue-200 px-2 py-1 rounded font-bold w-10 text-center text-blue-600">TS</span>
                                                        <span>Tidak Setuju (2)</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                    <span
                                                        className="bg-white border border-blue-200 px-2 py-1 rounded font-bold w-10 text-center text-blue-600">N</span>
                                                        <span>Netral / Ragu-ragu (3)</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                    <span
                                                        className="bg-white border border-blue-200 px-2 py-1 rounded font-bold w-10 text-center text-blue-600">S</span>
                                                        <span>Setuju (4)</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                    <span
                                                        className="bg-white border border-blue-200 px-2 py-1 rounded font-bold w-10 text-center text-blue-600">SS</span>
                                                        <span>Sangat Setuju (5)</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div
                                                className="text-[10px] text-blue-600 border-t border-blue-200 pt-2 italic">
                                                *Gunakan panduan ini untuk mengisi bagian Kuesioner Minat di bawah.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BAGIAN 2: Kuesioner Minat */}
                        {listKuesioner.length > 0 && (
                            <div className="bg-white p-6 shadow-sm rounded-lg border-l-4 border-green-500">
                                <h3 className="text-lg font-bold mb-4 text-gray-800 border-b border-gray-100 pb-2">
                                    2. Kuesioner Minat
                                </h3>
                                <div className="space-y-8">
                                    {listKuesioner.map(k => (
                                        <div key={k.id}
                                             className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                            <label className="block text-base font-semibold text-gray-900">
                                                {k.kode} - {k.nama}
                                            </label>
                                            <p className="text-sm text-gray-600 mb-3 mt-1 italic">
                                                "{k.pertanyaan || 'Silakan isi nilai sesuai kondisi Anda'}"
                                            </p>
                                            {renderInputField(k)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TOMBOL SIMPAN */}
                        <div className="flex justify-end pt-4 pb-10">
                            <button
                                type="submit"
                                disabled={processing}
                                className={`
                                    bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-all transform hover:scale-105
                                    ${processing ? 'opacity-75 cursor-not-allowed' : 'hover:bg-indigo-700'}
                                `}
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Data'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}