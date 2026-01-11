import React, {useEffect, useState} from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import PrimaryButton from '../../../components/PrimaryButton';
import SecondaryButton from '../../../components/SecondaryButton';
import Modal from '../../../components/Modal';
import TextInput from '../../../components/TextInput';
import InputLabel from '../../../components/InputLabel';
import apiClient from "../../../lib/axios.ts";
import {useOutletContext} from "react-router-dom";
import type {LayoutContextType} from "../../../interface/layout.ts";

export default function PeriodeIndex() {
    const [periodes, setPeriodes] = useState<any[]>([]);
    const [autoSetting, setAutoSetting] = useState(false);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [formName, setFormName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    // --- FETCH DATA ---
    const fetchData = async () => {
        setLoading(true)

        try {
            const res = await apiClient.get('/periode')

            setPeriodes(res.data.periodes)
            setAutoSetting(res.data.auto_setting)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        fetchData();
    }, []);

    // --- HANDLERS ---
    const handleToggleAuto = async (newVal) => {
        // optimistic UI
        setAutoSetting(newVal)

        try {
            await apiClient.post('/periode/toggle-auto', {active: newVal})
            fetchData()
        } catch (err) {
            alert('Gagal mengubah setting')
            fetchData() // rollback UI
        }
    }


    const handleActivate = async (id) => {
        if (!confirm('Aktifkan periode ini? Periode lain akan dinonaktifkan.')) return

        try {
            await apiClient.post(`/periode/${id}/activate`)
            alert('Periode berhasil diaktifkan!')
            fetchData()
        } catch (err) {
            alert('Gagal mengaktifkan periode')
        }
    }


    const handleDelete = async (id) => {
        if (!confirm('Yakin hapus periode ini? Data history terkait mungkin akan hilang.')) return

        try {
            await apiClient.delete(`/periode/${id}`)
            fetchData()
        } catch (err) {
            if (err.response?.data?.msg) {
                alert(err.response.data.msg)
            } else {
                alert('Gagal menghapus')
            }
        }
    }


    const openModal = (item?: any) => {
        setFormName(item ? item.nama_periode : '');
        setEditingId(item ? item.id : null);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault()
        setProcessing(true)

        try {
            if (editingId) {
                await apiClient.put(`/periode/${editingId}`, {
                    nama_periode: formName
                })
            } else {
                await apiClient.post('/periode', {
                    nama_periode: formName
                })
            }

            setShowModal(false)
            fetchData()
        } catch (err) {
            if (err.response?.data?.msg) {
                alert(err.response.data.msg)
            } else {
                alert('Gagal menyimpan periode')
            }
        } finally {
            setProcessing(false)
        }
    }

    const {setHeader} = useOutletContext<LayoutContextType>();
    useEffect(() => {
        setHeader(
            <h2 className="font-semibold text-xl text-gray-800">Manajemen Periode</h2>
        );
    }, []);
    return (
        <div>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* CARD PENGATURAN AUTO */}
                    <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Otomatisasi Periode</h3>
                            <p className="text-sm text-gray-500">Jika aktif, sistem akan otomatis membuat periode baru
                                setiap tanggal 1 Juli.</p>
                        </div>
                        <div className="flex items-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={autoSetting}
                                    onChange={(e) => handleToggleAuto(e.target.checked)}
                                />
                                <div
                                    className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                <span
                                    className="ml-3 text-sm font-medium text-gray-900">{autoSetting ? 'Aktif' : 'Nonaktif'}</span>
                            </label>
                        </div>
                    </div>

                    {/* CARD TABEL DATA */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Daftar Tahun Ajaran</h3>
                            <PrimaryButton onClick={() => openModal()}>+ Tambah Periode</PrimaryButton>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama
                                        Periode
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data
                                        Siswa
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {periodes.map((item) => (
                                    <tr key={item.id} className={item.is_active ? 'bg-indigo-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            {item.nama_periode}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.is_active ? (
                                                <span
                                                    className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Aktif (Sedang Berjalan)
                                                    </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleActivate(item.id)}
                                                    className="text-xs text-indigo-600 hover:text-indigo-900 underline"
                                                >
                                                    Set Aktif
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.jumlah_siswa} Siswa
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openModal(item)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-3">Edit
                                            </button>
                                            {!item.is_active && (
                                                <button onClick={() => handleDelete(item.id)}
                                                        className="text-red-600 hover:text-red-900">Hapus</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL FORM */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="md">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        {editingId ? 'Edit Periode' : 'Tambah Periode Baru'}
                    </h2>

                    <div className="mb-4">
                        <InputLabel value="Nama Periode"/>
                        <TextInput
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full mt-1"
                            placeholder="Contoh: TA 2025/2026"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setShowModal(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>Simpan</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </div>
    );
}