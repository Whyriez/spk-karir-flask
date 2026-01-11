import React, { useEffect, useState } from 'react';
import PrimaryButton from '../../../components/PrimaryButton';
import SecondaryButton from '../../../components/SecondaryButton';
import AuthenticatedLayout from "../../../Layouts/AuthenticatedLayout.tsx";

interface Kriteria {
    id: number;
    kode: string;
    nama: string;
}

export default function BwmInput() {
    // State Data
    const [criteria, setCriteria] = useState<Kriteria[]>([]);
    const [loading, setLoading] = useState(true);

    // State Wizard
    const [step, setStep] = useState(1);

    // State Form
    const [bestId, setBestId] = useState('');
    const [worstId, setWorstId] = useState('');
    const [bestToOthers, setBestToOthers] = useState<Record<string, number>>({});
    const [othersToWorst, setOthersToWorst] = useState<Record<string, number>>({});

    const [processing, setProcessing] = useState(false);

    // 1. Fetch Kriteria saat load
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('/api/kriteria', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if(res.ok) setCriteria(json.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Helper render opsi 1-9
    const renderOptions = () => {
        const options = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        return options.map(num => (
            <option key={num} value={num}>
                {num} - {num === 1 ? 'Sama Penting' : num === 9 ? 'Mutlak Lebih Penting' : 'Lebih Penting'}
            </option>
        ));
    };

    // --- HANDLERS ---
    const handleNextStep1 = () => {
        if (!bestId || !worstId) return alert("Pilih Best dan Worst dulu!");
        if (bestId === worstId) return alert("Best dan Worst tidak boleh sama!");

        // Auto-fill nilai 1 untuk diri sendiri
        setBestToOthers(prev => ({ ...prev, [bestId]: 1 }));
        setOthersToWorst(prev => ({ ...prev, [worstId]: 1 }));

        setStep(2);
    };

    const handleSubmit = async () => {
        setProcessing(true);
        const token = localStorage.getItem('token');

        const payload = {
            best_criterion_id: bestId,
            worst_criterion_id: worstId,
            best_to_others: bestToOthers,
            others_to_worst: othersToWorst
        };

        try {
            const res = await fetch('/api/bwm/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if(res.ok) {
                alert('Berhasil! Bobot baru telah disimpan.\nCheck console untuk lihat nilai bobot.');
                console.log(json.results);
                // Redirect atau Reset
                setStep(1);
                setBestId(''); setWorstId('');
                setBestToOthers({}); setOthersToWorst({});
            } else {
                alert(json.msg || 'Gagal menyimpan.');
            }
        } catch (error) {
            alert('Error koneksi.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Kriteria...</div>;

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800">Manajemen BWM</h2>}>
            <div className="p-6 bg-gray-100 min-h-screen">
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden p-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Input Perbandingan Berpasangan (BWM)</h1>

                {/* STEP 1: PILIH BEST & WORST */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
                            <strong>Langkah 1:</strong> Tentukan kriteria mana yang paling penting (Best) dan paling tidak penting (Worst) menurut pandangan ahli Anda.
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block font-semibold text-gray-700 mb-2">Kriteria Terbaik (Best)</label>
                                <select
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={bestId}
                                    onChange={(e) => setBestId(e.target.value)}
                                >
                                    <option value="">-- Pilih Best --</option>
                                    {criteria.map(c => (
                                        <option key={c.id} value={c.id}>{c.kode} - {c.nama}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block font-semibold text-gray-700 mb-2">Kriteria Terburuk (Worst)</label>
                                <select
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={worstId}
                                    onChange={(e) => setWorstId(e.target.value)}
                                >
                                    <option value="">-- Pilih Worst --</option>
                                    {criteria.map(c => (
                                        <option key={c.id} value={c.id}>{c.kode} - {c.nama}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <PrimaryButton onClick={handleNextStep1}>Lanjut ke Langkah 2 &rarr;</PrimaryButton>
                        </div>
                    </div>
                )}

                {/* STEP 2: BEST TO OTHERS */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                            <strong>Langkah 2:</strong> Bandingkan seberapa lebih penting kriteria <strong>Best</strong> terhadap kriteria lainnya.
                            (Skala 1 = Sama Penting, 9 = Mutlak Lebih Penting).
                        </div>

                        <div className="space-y-4">
                            {criteria.filter(c => String(c.id) !== bestId).map(c => (
                                <div key={c.id} className="flex items-center justify-between border-b pb-2">
                                    <span className="font-medium w-1/3">Best vs {c.kode}</span>
                                    <select
                                        className="w-2/3 border-gray-300 rounded shadow-sm"
                                        value={bestToOthers[c.id] || ''}
                                        onChange={(e) => setBestToOthers({...bestToOthers, [c.id]: parseInt(e.target.value)})}
                                    >
                                        <option value="">-- Pilih Nilai --</option>
                                        {renderOptions()}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between pt-6">
                            <SecondaryButton onClick={() => setStep(1)}>&larr; Kembali</SecondaryButton>
                            <PrimaryButton onClick={() => setStep(3)}>Lanjut ke Langkah 3 &rarr;</PrimaryButton>
                        </div>
                    </div>
                )}

                {/* STEP 3: OTHERS TO WORST */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="p-4 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
                            <strong>Langkah 3:</strong> Bandingkan seberapa lebih penting kriteria lain terhadap kriteria <strong>Worst</strong>.
                        </div>

                        <div className="space-y-4">
                            {criteria.filter(c => String(c.id) !== worstId).map(c => (
                                <div key={c.id} className="flex items-center justify-between border-b pb-2">
                                    <span className="font-medium w-1/3">{c.kode} vs Worst</span>
                                    <select
                                        className="w-2/3 border-gray-300 rounded shadow-sm"
                                        value={othersToWorst[c.id] || ''}
                                        onChange={(e) => setOthersToWorst({...othersToWorst, [c.id]: parseInt(e.target.value)})}
                                    >
                                        <option value="">-- Pilih Nilai --</option>
                                        {renderOptions()}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between pt-6">
                            <SecondaryButton onClick={() => setStep(2)}>&larr; Kembali</SecondaryButton>
                            <PrimaryButton onClick={handleSubmit} disabled={processing}>
                                {processing ? 'Menghitung...' : 'Simpan & Hitung Bobot'}
                            </PrimaryButton>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </AuthenticatedLayout>

    );
}