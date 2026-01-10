import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import PrimaryButton from '../../../components/PrimaryButton';
import SecondaryButton from '../../../components/SecondaryButton';
import Modal from '../../../components/Modal';
import TextInput from '../../../components/TextInput';
import InputLabel from '../../../components/InputLabel';

export default function AlumniIndex() {
    const [data, setData] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ id: null, name: '', status: 'Kuliah', batch: '', major: '' });
    const [processing, setProcessing] = useState(false);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/alumni', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if(res.ok) setData(json.data);
    };

    useEffect(() => { fetchData(); }, []);

    const openModal = (item: any = null) => {
        setForm(item ? { ...item } : { id: null, name: '', status: 'Kuliah', batch: new Date().getFullYear().toString(), major: '' });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        const token = localStorage.getItem('token');
        const url = form.id ? `http://localhost:5000/api/alumni/${form.id}` : 'http://localhost:5000/api/alumni';
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
        if(!confirm('Hapus data ini?')) return;
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/alumni/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchData();
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800">Data Alumni</h2>}>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-lg font-bold">Jejak Alumni</h3>
                            <PrimaryButton onClick={() => openModal()}>+ Tambah Alumni</PrimaryButton>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tahun</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jurusan Asal</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4">{item.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 text-xs rounded-full ${
                                                    item.status.includes('Kuliah') ? 'bg-blue-100 text-blue-800' : 
                                                    item.status.includes('Kerja') ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                                }`}>{item.status}</span>
                                            </td>
                                            <td className="px-6 py-4">{item.batch}</td>
                                            <td className="px-6 py-4">{item.major}</td>
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
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="md">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-medium mb-4">{form.id ? 'Edit' : 'Tambah'} Alumni</h2>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <InputLabel value="Nama Lengkap" />
                            <TextInput value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full mt-1" required />
                        </div>
                        <div>
                            <InputLabel value="Status Saat Ini" />
                            <select
                                value={form.status}
                                onChange={(e) => setForm({...form, status: e.target.value})}
                                className="w-full mt-1 border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="Kuliah">Kuliah</option>
                                <option value="Bekerja">Bekerja</option>
                                <option value="Wirausaha">Wirausaha</option>
                                <option value="Mencari Kerja">Mencari Kerja</option>
                            </select>
                        </div>
                        <div>
                            <InputLabel value="Tahun Lulus (Batch)" />
                            <TextInput type="number" value={form.batch} onChange={(e) => setForm({...form, batch: e.target.value})} className="w-full mt-1" required />
                        </div>
                        <div>
                            <InputLabel value="Jurusan Asal (String)" />
                            <TextInput value={form.major} onChange={(e) => setForm({...form, major: e.target.value})} className="w-full mt-1" placeholder="Misal: TKJ" required />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <SecondaryButton onClick={() => setShowModal(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>Simpan</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}