// frontend/src/pages/pakar/kriteria/Input.tsx
import React, {useEffect, useState} from 'react';
import {useNavigate, useOutletContext, useParams} from 'react-router-dom';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import PrimaryButton from '../../../components/PrimaryButton';
import SecondaryButton from '../../../components/SecondaryButton';
import TextInput from '../../../components/TextInput';
import InputLabel from '../../../components/InputLabel';
import type {LayoutContextType} from "../../../interface/layout.ts";

export default function InputKriteriaPakar() {
    const navigate = useNavigate();
    const {id} = useParams(); // Ambil ID dari URL (jika mode edit)

    const [form, setForm] = useState({
        kode: '',
        nama: '',
        pertanyaan: '',
        tipe_input: 'likert', // likert / number / select
        atribut: 'benefit', // benefit / cost
        kategori: 'kuesioner',
        sumber_nilai: 'input_siswa'
    });


    const [loading, setLoading] = useState(false);

    // Fetch Data jika sedang Edit (ada ID)
    useEffect(() => {
        if (id) {
            fetchData(id);
        }
    }, [id]);

    const fetchData = async (kriteriaId: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/kriteria/${kriteriaId}`, {
                headers: {'Authorization': `Bearer ${token}`}
            });
            const json = await res.json();
            if (res.ok) {
                setForm(json.data);
            } else {
                alert("Gagal mengambil data kriteria");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        // URL & Method tergantung Edit atau Create (Pakar biasanya hanya Edit)
        const url = id
            ? `http://localhost:5000/api/kriteria/${id}`
            : `http://localhost:5000/api/kriteria`;

        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                navigate('/pakar/kriteria'); // Redirect kembali ke index
            } else {
                const json = await res.json();
                alert(json.msg || 'Terjadi kesalahan saat menyimpan.');
            }
        } catch (error) {
            console.error(error);
            alert('Gagal menghubungi server.');
        }
        setLoading(false);
    };

    const {setHeader} = useOutletContext<LayoutContextType>();
    useEffect(() => {
        setHeader(
            <h2 className="font-semibold text-xl text-gray-800">{id ? 'Edit' : 'Tambah'} Kriteria (Pakar)</h2>
        );
    }, []);

    return (
        <div className="py-12">
            <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Kode & Nama (Biasanya Readonly bagi Pakar, tapi tergantung kebijakan) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Kode Kriteria"/>
                                <TextInput
                                    value={form.kode}
                                    onChange={(e) => setForm({...form, kode: e.target.value})}
                                    className="w-full mt-1 bg-gray-100"
                                    readOnly={true} // Kunci kode agar tidak diubah sembarangan
                                />
                            </div>
                            <div>
                                <InputLabel value="Nama Kriteria"/>
                                <TextInput
                                    value={form.nama}
                                    onChange={(e) => setForm({...form, nama: e.target.value})}
                                    className="w-full mt-1 bg-gray-100"
                                    readOnly={true} // Kunci nama juga
                                />
                            </div>
                        </div>

                        {/* Pertanyaan Kuesioner (Ini yang paling penting diisi Pakar) */}
                        <div>
                            <InputLabel value="Pertanyaan Kuesioner (Untuk Siswa)"/>
                            <textarea
                                className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={4}
                                value={form.pertanyaan || ''}
                                onChange={(e) => setForm({...form, pertanyaan: e.target.value})}
                                placeholder="Contoh: Apakah Anda tertarik dengan pelajaran Matematika?"
                                required
                            />
                            <p className="text-sm text-gray-500 mt-1">Pertanyaan ini akan muncul di halaman input
                                siswa.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Tipe Input"/>
                                <select
                                    value={form.tipe_input}
                                    onChange={(e) => setForm({...form, tipe_input: e.target.value})}
                                    className="w-full mt-1 border-gray-300 rounded-md shadow-sm"
                                >
                                    <option value="likert">Skala 1-5 (Likert)</option>
                                    <option value="number">Angka (0-100)</option>
                                    <option value="select">Pilihan Ya/Tidak</option>
                                </select>
                            </div>
                            <div>
                                <InputLabel value="Atribut"/>
                                <select
                                    value={form.atribut}
                                    onChange={(e) => setForm({...form, atribut: e.target.value})}
                                    className="w-full mt-1 border-gray-300 rounded-md shadow-sm"
                                >
                                    <option value="benefit">Benefit (Makin besar makin baik)</option>
                                    <option value="cost">Cost (Makin kecil makin baik)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <SecondaryButton type="button" onClick={() => navigate('/pakar/kriteria')}>
                                Batal
                            </SecondaryButton>
                            <PrimaryButton disabled={loading}>
                                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}