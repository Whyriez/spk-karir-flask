import React, {useEffect, useState, useMemo} from 'react';
import AuthenticatedLayout from "../../../Layouts/AuthenticatedLayout";
import {useOutletContext} from "react-router-dom";
import type {LayoutContextType} from "../../../interface/layout.ts";
import Header from "../../../components/Header.tsx";

interface User {
    id: number;
    name: string;
    role: string;
    jenis_pakar?: string;
    jurusan_id?: number | null;
}

interface Kriteria {
    id: number;
    kode: string;
    nama: string;
}

export default function BwmInput() {
    // Context Data
    const [globalBest, setGlobalBest] = useState<Kriteria | null>(null);
    const [globalWorst, setGlobalWorst] = useState<Kriteria | null>(null);
    const [criteriaList, setCriteriaList] = useState<Kriteria[]>([]);
    const [userRole, setUserRole] = useState('');
    const [isReady, setIsReady] = useState(false);

    // Form Data
    const [bestToOthers, setBestToOthers] = useState<Record<string, number>>({});
    const [othersToWorst, setOthersToWorst] = useState<Record<string, number>>({});
    const [processing, setProcessing] = useState(false);

    const user: User = JSON.parse(localStorage.getItem('user') || '{}');

    // Fetch Initial Data
    useEffect(() => {
        const fetchContext = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('/api/bwm/input-context', {
                    headers: {'Authorization': `Bearer ${token}`}
                });
                const json = await res.json();

                if (json.ready) {
                    setGlobalBest(json.global_best);
                    setGlobalWorst(json.global_worst);
                    setCriteriaList(json.kriteria_list);
                    setUserRole(json.user_role);

                    setBestToOthers(json.saved_best_to_others || {});
                    setOthersToWorst(json.saved_others_to_worst || {});

                    setIsReady(true);
                } else {
                    alert(json.msg);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchContext();
    }, []);

    // --- LOGIKA SORTING (NATURAL SORT) MIRIP LARAVEL ---
    const sortedKriteriaList = useMemo(() => {
        return [...criteriaList].sort((a, b) => {
            const numA = parseInt(a.kode.replace(/\D/g, '') || '0');
            const numB = parseInt(b.kode.replace(/\D/g, '') || '0');
            return numA - numB;
        });
    }, [criteriaList]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/bwm/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    best_to_others: bestToOthers,
                    others_to_worst: othersToWorst
                })
            });

            const json = await res.json();
            if (res.ok) {
                alert("Bobot penilaian berhasil disimpan!");
                console.log(json.results);
            } else {
                alert(json.msg || "Mohon lengkapi perbandingan.");
            }
        } catch (e) {
            alert('Error network');
        } finally {
            setProcessing(false);
        }
    };

    const handleComparisonChange = (type: "best" | "others", targetId: number, value: string) => {
        const valInt = parseInt(value);
        if (type === "best") {
            setBestToOthers(prev => ({...prev, [targetId]: valInt}));
        } else {
            setOthersToWorst(prev => ({...prev, [targetId]: valInt}));
        }
    };

    const scaleOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    if (!isReady) return <div className="p-10 text-center text-gray-500">Loading Context...</div>;

    return (
        <>
            <Header>
                <h2 className="font-semibold text-xl text-gray-800">Input BWM (Sesuai FGD)</h2>
            </Header>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">

                    {/* INFO ROLE */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                        <p className="text-sm text-blue-700">
                            Login sebagai: <strong>{userRole === 'gurubk' ? 'Guru BK' : 'Kaprodi'}</strong>. <br/>
                            Di bawah ini adalah kriteria yang menjadi tanggung jawab Anda untuk dibandingkan terhadap
                            referensi FGD.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* --- TAMPILAN STATIS BEST & WORST --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* KOTAK BEST */}
                            <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200 text-center shadow-sm">
                                <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Reference Best (FGD)</span>
                                <div className="text-2xl font-extrabold text-green-800 mt-2">
                                    {globalBest?.nama}
                                </div>
                                <div className="text-sm text-green-600 font-mono mt-1">Kode: {globalBest?.kode}</div>
                            </div>

                            {/* KOTAK WORST */}
                            <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200 text-center shadow-sm">
                                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Reference Worst (FGD)</span>
                                <div className="text-2xl font-extrabold text-red-800 mt-2">
                                    {globalWorst?.nama}
                                </div>
                                <div className="text-sm text-red-600 font-mono mt-1">Kode: {globalWorst?.kode}</div>
                            </div>
                        </div>

                        {/* --- FORM PERBANDINGAN --- */}

                        {/* 1. BEST VS LAINNYA */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                                Seberapa lebih penting <u>BEST ({globalBest?.nama})</u> dibanding kriteria Anda?
                            </h3>
                            <div className="space-y-3">
                                {sortedKriteriaList.map((k) => {
                                    if (k.id === globalBest?.id) return null;

                                    return (
                                        <div key={k.id}
                                             className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                            <span className="text-gray-700 font-medium w-1/2">
                                                Best ➔ {k.nama} ({k.kode})
                                            </span>
                                            <select
                                                className="w-32 border-gray-300 rounded-md shadow-sm text-sm focus:ring-green-500"
                                                onChange={(e) => handleComparisonChange("best", k.id, e.target.value)}
                                                value={bestToOthers[k.id] || ""}
                                                required
                                            >
                                                <option value="">Pilih...</option>
                                                {scaleOptions.map((val) => (
                                                    <option key={val} value={val}>{val}</option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. LAINNYA VS WORST */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                                Seberapa lebih penting kriteria Anda dibanding <u>WORST ({globalWorst?.nama})</u>?
                            </h3>
                            <div className="space-y-3">
                                {sortedKriteriaList.map((k) => {
                                    if (k.id === globalWorst?.id) return null;

                                    return (
                                        <div key={k.id}
                                             className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                            <span className="text-gray-700 font-medium w-1/2">
                                                {k.nama} ({k.kode}) ➔ Worst
                                            </span>
                                            <select
                                                className="w-32 border-gray-300 rounded-md shadow-sm text-sm focus:ring-red-500"
                                                onChange={(e) => handleComparisonChange("others", k.id, e.target.value)}
                                                value={othersToWorst[k.id] || ""}
                                                required
                                            >
                                                <option value="">Pilih...</option>
                                                {scaleOptions.map((val) => (
                                                    <option key={val} value={val}>{val}</option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* TOMBOL SUBMIT */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-bold shadow-lg transition disabled:opacity-50"
                            >
                                {processing ? "Menyimpan..." : "Simpan Bobot"}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </>

    );
}