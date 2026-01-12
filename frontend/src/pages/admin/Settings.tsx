import React, {useEffect, useState, FormEvent} from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/components/PrimaryButton';
import apiClient from '@/lib/axios';
import {useOutletContext} from "react-router-dom";
import type {LayoutContextType} from "../../interface/layout.ts";
import Header from "../../components/Header.tsx";
import { useLayout } from '@/contexts/LayoutContext'; // <--- IMPORT CONTEXT

export default function Settings() {
    // Ambil fungsi refreshSettings dari context
    const { refreshSettings } = useLayout();

    // State form sesuai dengan field di Laravel
    const [data, setData] = useState({
        nama_sekolah: "",
        timezone: "Asia/Jakarta",
        periode_bulan: "7", // Default Juli
        periode_tanggal: "1", // Default Tgl 1
    });

    const [processing, setProcessing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch data saat component dimuat
    useEffect(() => {
        apiClient.get('/settings')
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        try {
            await apiClient.post('/settings', data);

            // UPDATE NAVBAR SETELAH SUKSES
            refreshSettings();

            alert("Pengaturan berhasil disimpan!");
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan pengaturan.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Memuat pengaturan...</div>;

    return (
        <>
            <Header>
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Pengaturan Sekolah
                </h2>
            </Header>
            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-100">
                        {/* Judul Form */}
                        <div className="mb-6 pb-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">
                                Konfigurasi Sistem
                            </h3>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            {/* 1. NAMA SEKOLAH */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Nama Sekolah
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.nama_sekolah}
                                    onChange={(e) =>
                                        setData({...data, nama_sekolah: e.target.value})
                                    }
                                />
                            </div>

                            {/* 2. ZONA WAKTU */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Zona Waktu
                                </label>
                                <select
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.timezone}
                                    onChange={(e) =>
                                        setData({...data, timezone: e.target.value})
                                    }
                                >
                                    <option value="Asia/Jakarta">
                                        WIB (Jakarta)
                                    </option>
                                    <option value="Asia/Makassar">
                                        WITA (Makassar)
                                    </option>
                                    <option value="Asia/Jayapura">
                                        WIT (Jayapura)
                                    </option>
                                </select>
                            </div>

                            {/* --- 3. JADWAL OTOMATISASI (BARU) --- */}
                            <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100">
                                <h4 className="font-bold text-indigo-800 mb-2 text-sm">
                                    Jadwal Ganti Periode Otomatis
                                </h4>
                                <p className="text-xs text-indigo-600 mb-3">
                                    Tentukan kapan sistem harus membuat "Tahun
                                    Ajaran Baru" secara otomatis.
                                </p>

                                <div className="flex gap-4">
                                    {/* PILIH TANGGAL */}
                                    <div className="w-1/3">
                                        <label className="block text-xs font-bold text-indigo-700 mb-1">
                                            Tanggal
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={31}
                                            className="block w-full border-indigo-200 rounded-md text-sm focus:ring-indigo-500"
                                            value={data.periode_tanggal}
                                            onChange={(e) =>
                                                setData({...data, periode_tanggal: e.target.value})
                                            }
                                        />
                                    </div>

                                    {/* PILIH BULAN */}
                                    <div className="w-2/3">
                                        <label className="block text-xs font-bold text-indigo-700 mb-1">
                                            Bulan
                                        </label>
                                        <select
                                            className="block w-full border-indigo-200 rounded-md text-sm focus:ring-indigo-500"
                                            value={data.periode_bulan}
                                            onChange={(e) =>
                                                setData({...data, periode_bulan: e.target.value})
                                            }
                                        >
                                            <option value="1">Januari</option>
                                            <option value="2">Februari</option>
                                            <option value="3">Maret</option>
                                            <option value="4">April</option>
                                            <option value="5">Mei</option>
                                            <option value="6">Juni</option>
                                            <option value="7">
                                                Juli (Default)
                                            </option>
                                            <option value="8">Agustus</option>
                                            <option value="9">September</option>
                                            <option value="10">Oktober</option>
                                            <option value="11">November</option>
                                            <option value="12">Desember</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>

    );
}