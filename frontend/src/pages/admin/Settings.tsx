import React from 'react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

export default function Settings() {
    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800">Pengaturan Sistem</h2>}>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4">Informasi Aplikasi</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded bg-gray-50">
                                <label className="block text-xs text-gray-500 uppercase">Nama Sekolah</label>
                                <div className="font-semibold text-gray-800">SMK Negeri 1 Gorontalo</div>
                            </div>
                            <div className="p-4 border rounded bg-gray-50">
                                <label className="block text-xs text-gray-500 uppercase">Versi Sistem</label>
                                <div className="font-semibold text-gray-800">v2.0 (Python Flask + React)</div>
                            </div>
                        </div>

                        <div className="mt-8 border-t pt-6">
                            <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
                            <p className="text-sm text-gray-500 mb-4">Reset database akan menghapus semua data transaksi (nilai siswa, hasil rekomendasi) tapi menyisakan data master.</p>
                            <button
                                onClick={() => alert('Fitur reset dinonaktifkan demi keamanan demo.')}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-semibold text-sm"
                            >
                                Reset Database Transaksi
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}