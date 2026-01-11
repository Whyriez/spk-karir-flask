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

    // State untuk Import
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/alumni', {
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

    const handleImport = async () => {
        if(!importFile) return alert("Pilih file Excel dulu!");

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', importFile);

        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/alumni/import', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }, // No Content-Type for FormData
            body: formData
        });

        const json = await res.json();
        alert(json.msg);
        setIsImporting(false);
        setImportFile(null);
        fetchData();
    }

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800">Data Alumni</h2>}>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">

                        {/* Header & Tools */}
                        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                            <h3 className="text-lg font-bold my-auto">Jejak Alumni</h3>

                            <div className="flex gap-2 items-center bg-gray-50 p-2 rounded border">
                                <span className="text-sm text-gray-600">Import Excel:</span>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                                    className="text-sm text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <button
                                    onClick={handleImport}
                                    disabled={!importFile || isImporting}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isImporting ? 'Loading...' : 'Upload'}
                                </button>
                            </div>

                            <PrimaryButton onClick={() => openModal()}>+ Tambah Manual</PrimaryButton>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tahun</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jurusan</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-4 text-gray-500">Belum ada data alumni.</td></tr>
                                    ) : data.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4">{item.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                    item.status.includes('Kuliah') ? 'bg-blue-100 text-blue-800' : 
                                                    item.status.includes('Kerja') ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                                }`}>{item.status}</span>
                                            </td>
                                            <td className="px-6 py-4">{item.batch}</td>
                                            <td className="px-6 py-4">{item.major}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Hapus</button>
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
                    <div className="space-y-4">
                        <div>
                            <InputLabel value="Nama Lengkap" />
                            <TextInput value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full mt-1" required />
                        </div>
                        <div>
                            <InputLabel value="Status Saat Ini" />
                            <select
                                value={form.status}
                                onChange={(e) => setForm({...form, status: e.target.value})}
                                className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="Kuliah">Kuliah</option>
                                <option value="Bekerja">Bekerja</option>
                                <option value="Wirausaha">Wirausaha</option>
                                <option value="Mencari Kerja">Mencari Kerja</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Tahun Lulus" />
                                <TextInput type="number" value={form.batch} onChange={(e) => setForm({...form, batch: e.target.value})} className="w-full mt-1" required />
                            </div>
                            <div>
                                <InputLabel value="Jurusan Asal" />
                                <TextInput value={form.major} onChange={(e) => setForm({...form, major: e.target.value})} className="w-full mt-1" placeholder="RPL/TKJ" required />
                            </div>
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