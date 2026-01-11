import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import PrimaryButton from '../../../components/PrimaryButton';
import SecondaryButton from '../../../components/SecondaryButton';
import Modal from '../../../components/Modal';
import TextInput from '../../../components/TextInput';
import InputLabel from '../../../components/InputLabel';

export default function JurusanIndex() {
    const [data, setData] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ id: null, kode: '', nama: '' });
    const [processing, setProcessing] = useState(false);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/jurusan', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if(res.ok) setData(json.data);
    };

    useEffect(() => { fetchData(); }, []);

    const openModal = (item: any = null) => {
        setForm(item ? { ...item } : { id: null, kode: '', nama: '' });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        const token = localStorage.getItem('token');
        const url = form.id ? `http://localhost:5000/api/jurusan/${form.id}` : 'http://localhost:5000/api/jurusan';
        const method = form.id ? 'PUT' : 'POST';

        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(form)
        });

        setProcessing(false);
        setShowModal(false);
        fetchData();
    };

    const handleDelete = async (id: number) => {
        if(!confirm('Hapus jurusan ini?')) return;
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/jurusan/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchData();
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800">Data Jurusan</h2>}>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-lg font-bold">Daftar Kompetensi Keahlian</h3>
                            <PrimaryButton onClick={() => openModal()}>+ Tambah</PrimaryButton>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Jurusan</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4">{item.kode}</td>
                                        <td className="px-6 py-4">{item.nama}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => openModal(item)} className="text-indigo-600 mr-4">Edit</button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-600">Hapus</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="md">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-medium mb-4">{form.id ? 'Edit' : 'Tambah'} Jurusan</h2>
                    <div className="mb-4">
                        <InputLabel value="Kode Jurusan" />
                        <TextInput
                            value={form.kode}
                            onChange={(e) => setForm({...form, kode: e.target.value})}
                            className="w-full mt-1"
                            disabled={!!form.id} // Kode tidak bisa diedit
                        />
                    </div>
                    <div className="mb-4">
                        <InputLabel value="Nama Jurusan" />
                        <TextInput
                            value={form.nama}
                            onChange={(e) => setForm({...form, nama: e.target.value})}
                            className="w-full mt-1"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <SecondaryButton onClick={() => setShowModal(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>Simpan</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}