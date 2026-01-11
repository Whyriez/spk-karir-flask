import React, {useEffect, useState} from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import apiClient from "@/lib/axios.ts";
import {useOutletContext} from "react-router-dom";
import type {LayoutContextType} from "../../../interface/layout.ts";
import Header from "../../../components/Header.tsx";

interface User {
    id: number;
    name: string;
    role: string;
    jenis_pakar?: string;
    jurusan_id?: number | null;
}// Sesuaikan lokasi type user

interface Kriteria {
    id: number;
    kode: string;
    nama: string;
}

export default function BwmSetting() {
    // Data State
    const [kriterias, setKriterias] = useState<Kriteria[]>([]);
    const [bestId, setBestId] = useState<string>('');
    const [worstId, setWorstId] = useState<string>('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Dummy User object for Layout (jika diperlukan oleh layout Anda)
    // Di aplikasi nyata, ini biasanya diambil dari Context/Redux
    const user: User = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await apiClient.get('/bwm/admin/setting')

            setKriterias(res.data.kriterias)
            if (res.data.current_best) setBestId(String(res.data.current_best))
            if (res.data.current_worst) setWorstId(String(res.data.current_worst))
        } catch (err) {
            console.error(err)
        }
    }


    const handleSubmit = async (e) => {
        e.preventDefault()
        setSuccessMsg(null)

        if (bestId && worstId && bestId === worstId) {
            alert("Kriteria Terbaik dan Terburuk tidak boleh sama!")
            return
        }

        setLoading(true)

        try {
            const res = await apiClient.post('/bwm/admin/setting', {
                best_id: bestId,
                worst_id: worstId
            })

            setSuccessMsg(res.data.msg || 'Konfigurasi FGD berhasil disimpan!')
            window.scrollTo(0, 0)
        } catch (err) {
            if (err.response?.data?.msg) {
                alert(err.response.data.msg)
            } else {
                alert('Gagal menyimpan.')
            }
        } finally {
            setLoading(false)
        }
    }


    // Helper untuk preview
    const getKriteriaName = (id: string) => kriterias.find(k => String(k.id) === id)?.nama;

    return (
        <>
            <Header>
                <h2 className="font-semibold text-xl text-gray-800">Konfigurasi BWM (Hasil FGD)</h2>
            </Header>
            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">

                    {/* Flash Message Simulation */}
                    {successMsg && (
                        <div
                            className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                            <strong className="font-bold">Sukses!</strong>
                            <span className="block sm:inline ml-2">{successMsg}</span>
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">

                            {/* Instruksi Box (Sama persis dengan Laravel) */}
                            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-lg font-medium text-yellow-800">Instruksi Admin</h3>
                                        <p className="text-sm text-yellow-700 mt-2">
                                            Halaman ini digunakan untuk menginput hasil kesepakatan <strong>FGD (Focus
                                            Group Discussion)</strong>.
                                            Kriteria yang Anda pilih di sini akan menjadi <strong>referensi
                                            terkunci</strong> bagi seluruh Pakar (Guru BK & Kaprodi).
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* PILIH BEST */}
                                    <div className="bg-green-50 p-6 rounded-xl border-2 border-green-100">
                                        <label className="block text-lg font-bold text-green-800 mb-2">
                                            🏆 Kriteria Terbaik (Best)
                                        </label>
                                        <p className="text-sm text-green-600 mb-4">
                                            Kriteria yang disepakati paling penting.
                                        </p>
                                        <select
                                            className="w-full border-green-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 text-lg"
                                            value={bestId}
                                            onChange={(e) => setBestId(e.target.value)}
                                            required
                                        >
                                            <option value="">-- Pilih Kriteria --</option>
                                            {kriterias.map((k) => (
                                                <option key={k.id} value={k.id} disabled={String(k.id) === worstId}>
                                                    ({k.kode}) {k.nama}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* PILIH WORST */}
                                    <div className="bg-red-50 p-6 rounded-xl border-2 border-red-100">
                                        <label className="block text-lg font-bold text-red-800 mb-2">
                                            🔻 Kriteria Terburuk (Worst)
                                        </label>
                                        <p className="text-sm text-red-600 mb-4">
                                            Kriteria yang disepakati paling kurang penting.
                                        </p>
                                        <select
                                            className="w-full border-red-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500 text-lg"
                                            value={worstId}
                                            onChange={(e) => setWorstId(e.target.value)}
                                            required
                                        >
                                            <option value="">-- Pilih Kriteria --</option>
                                            {kriterias.map((k) => (
                                                <option key={k.id} value={k.id} disabled={String(k.id) === bestId}>
                                                    ({k.kode}) {k.nama}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end border-t pt-6">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center px-6 py-3 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150"
                                    >
                                        {loading ? 'Menyimpan...' : 'Kunci & Simpan Hasil FGD'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>

                    {/* Preview Sederhana (Sama persis dengan Laravel) */}
                    {(bestId && worstId) && (
                        <div className="mt-8 text-center">
                            <p className="text-gray-500 text-sm uppercase tracking-wide">Preview Logika Sistem</p>
                            <div
                                className="mt-2 inline-flex items-center gap-4 text-lg font-bold text-gray-700 bg-white px-6 py-3 rounded-full shadow-sm">
                                <span>{getKriteriaName(bestId)} (Best)</span>
                                <span className="text-gray-300">➔</span>
                                <span className="text-gray-400">Kriteria Lain</span>
                                <span className="text-gray-300">➔</span>
                                <span>{getKriteriaName(worstId)} (Worst)</span>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>

    );
}