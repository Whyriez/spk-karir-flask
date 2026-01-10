import React, {useEffect, useState, FormEventHandler} from 'react';
import PrimaryButton from '../../components/PrimaryButton';
import TextInput from '../../components/TextInput';
import InputLabel from '../../components/InputLabel';
import AuthenticatedLayout from "../../Layouts/AuthenticatedLayout.tsx";

interface FormItem {
    id: number;
    kode: string;
    nama: string;
    pertanyaan: string;
    tipe_input: 'number' | 'select' | 'likert';
    kategori: string;
    options: { val: number; label: string }[];
    value: string | number;
}

export default function InputDataSiswa() {
    const [formData, setFormData] = useState<FormItem[]>([]);
    const [values, setValues] = useState<Record<string, string | number>>({});
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Fetch Form Structure & Existing Data
    useEffect(() => {
        const fetchForm = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('http://localhost:5000/api/siswa/form', {
                    headers: {'Authorization': `Bearer ${token}`}
                });
                const json = await res.json();
                if (res.ok) {
                    setFormData(json.data);

                    // Populate initial values
                    const initialValues: Record<string, any> = {};
                    json.data.forEach((item: FormItem) => {
                        if (item.value !== '') initialValues[item.id] = item.value;
                    });
                    setValues(initialValues);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchForm();
    }, []);

    const handleChange = (id: number, val: string | number) => {
        setValues(prev => ({...prev, [id]: val}));
    };

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost:5000/api/siswa/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({values: values})
            });
            const json = await res.json();
            if (res.ok) {
                alert('Data berhasil disimpan! Sistem siap menghitung rekomendasi.');
                // Bisa redirect ke halaman hasil (Step berikutnya)
            } else {
                alert(json.msg || 'Gagal menyimpan.');
            }
        } catch (error) {
            alert('Error koneksi.');
        } finally {
            setProcessing(false);
        }
    };

    // Helper Render Input per Tipe
    const renderInput = (item: FormItem) => {
        // 1. SELECT (Dropdown)
        if (item.tipe_input === 'select') {
            return (
                <select
                    className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                    value={values[item.id] || ''}
                    onChange={(e) => handleChange(item.id, e.target.value)}
                    required
                >
                    <option value="">-- Pilih Opsi --</option>
                    {item.options.map((opt, idx) => (
                        <option key={idx} value={opt.val}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        // 2. LIKERT (Radio Button 1-5)
        if (item.tipe_input === 'likert') {
            return (
                <div className="flex gap-4 mt-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <label key={num} className="flex flex-col items-center cursor-pointer">
                            <input
                                type="radio"
                                name={`likert_${item.id}`}
                                value={num}
                                checked={String(values[item.id]) === String(num)}
                                onChange={() => handleChange(item.id, num)}
                                className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <span className="text-xs mt-1 font-medium text-gray-600">{num}</span>
                        </label>
                    ))}
                    <div className="ml-2 text-xs text-gray-400 self-center">
                        (1=Sangat Rendah ... 5=Sangat Tinggi)
                    </div>
                </div>
            );
        }

        // 3. NUMBER (Default)
        return (
            <TextInput
                type="number"
                className="w-full"
                value={values[item.id] || ''}
                onChange={(e) => handleChange(item.id, e.target.value)}
                placeholder="0 - 100"
                required
            />
        );
    };

    if (loading) return <div className="p-10 text-center">Loading Form...</div>;

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800">Input Data Penilaian Diri</h2>}>
            <div className="p-6 bg-gray-100 min-h-screen">
                <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-800">Input Data Penilaian Diri</h1>
                        <p className="text-gray-600 text-sm mt-1">
                            Isilah data berikut dengan jujur agar rekomendasi karir akurat.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
                        {/* Render Group by Kategori (Optional, kita render flat dulu) */}
                        {formData.map((item) => (
                            <div key={item.id} className="p-4 bg-gray-50 rounded border border-gray-100">
                                <InputLabel className="text-base mb-1">
                                    {item.kode} - {item.nama}
                                </InputLabel>

                                {item.pertanyaan && (
                                    <p className="text-sm text-gray-500 mb-3 italic">"{item.pertanyaan}"</p>
                                )}

                                {renderInput(item)}
                            </div>
                        ))}

                        <div className="pt-4 flex justify-end">
                            <PrimaryButton className="px-6 py-3 text-lg" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan & Hitung'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>

    );
}