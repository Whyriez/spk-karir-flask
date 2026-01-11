import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'; // Tambah Outlet
import ApplicationLogo from '@/components/ApplicationLogo';
import Dropdown from '@/components/Dropdown';
import NavLink from '@/components/NavLink';
import ResponsiveNavLink from '@/components/ResponsiveNavLink';
import apiClient from '@/lib/axios';

// Hapus props 'children' dan 'header' dari argumen fungsi
export default function AuthenticatedLayout() {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [schoolName, setSchoolName] = useState('SMK Negeri 1 Gorontalo');

    // State untuk Header Dinamis
    const [header, setHeader] = useState<ReactNode>(null);

    const location = useLocation();
    const navigate = useNavigate();

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    // Fetch Settings hanya sekali saat Layout pertama kali dimuat
    useEffect(() => {
        apiClient.get('/settings')
            .then(res => {
                if (res.data.nama_sekolah) {
                    setSchoolName(res.data.nama_sekolah);
                }
            })
            .catch(err => console.error("Gagal memuat pengaturan sekolah", err));
    }, []);

    if (!user) return null; // Logic redirect ada di ProtectedRoute atau App.tsx

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const routeIsActive = (path: string) => location.pathname.startsWith(path);

    const getMenus = (role: string) => {
        // ... (Kode getMenus biarkan sama persis seperti sebelumnya) ...
        // Agar ringkas, saya persingkat di sini. Gunakan kode lama Anda.
        switch (role) {
            case "admin":
                 return [
                    { label: "Dashboard", to: "/dashboard", type: "link" },
                    {
                        label: "Kesiswaan",
                        type: "dropdown",
                        items: [
                            { label: "Monitoring Siswa", to: "/admin/monitoring" },
                            { label: "Kenaikan Kelas", to: "/admin/promotion" },
                            { label: "Data Alumni", to: "/admin/alumni" },
                        ]
                    },
                    {
                        label: "Master Data",
                        type: "dropdown",
                        items: [
                            { label: "Data Jurusan", to: "/admin/jurusan" },
                            { label: "Data Kriteria", to: "/admin/kriteria" },
                            { label: "Periode Aktif", to: "/admin/periode" },
                            { label: "Pengaturan BWM", to: "/admin/bwm/setting" },
                        ]
                    },
                    { label: "Pengaturan", to: "/admin/settings", type: "link" },
                ];
            case "pakar":
                return [
                    { label: "Dashboard", to: "/dashboard", type: "link" },
                    { label: "Input Bobot (BWM)", to: "/pakar/bwm", type: "link" },
                    { label: "Validasi Kriteria", to: "/pakar/kriteria", type: "link" },
                ];
            case "siswa":
                return [
                    { label: "Dashboard", to: "/dashboard", type: "link" },
                    { label: "Isi Penilaian", to: "/siswa/input", type: "link" },
                    { label: "Hasil Rekomendasi", to: "/siswa/result", type: "link" },
                ];
            default: return [];
        }
    };

    const menus = getMenus(user.role);

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="border-b border-gray-100 bg-white">
                {/* ... (Kode Navbar biarkan sama persis) ... */}
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center gap-3">
                                <Link to="/dashboard">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                                </Link>
                                <Link to="/dashboard" className="hidden font-bold text-lg text-gray-700 sm:block hover:text-indigo-600 transition">
                                    {schoolName}
                                </Link>
                            </div>
                            <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                                {menus.map((menu: any, index) => {
                                    if (menu.type === 'dropdown') {
                                        return (
                                            <div key={index} className="hidden sm:flex sm:items-center">
                                                <Dropdown>
                                                    <Dropdown.Trigger>
                                                        <span className="inline-flex rounded-md">
                                                            <button className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none">
                                                                {menu.label}
                                                                <svg className="-mr-0.5 ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </span>
                                                    </Dropdown.Trigger>
                                                    <Dropdown.Content>
                                                        {menu.items.map((subItem: any, subIdx: number) => (
                                                            <Dropdown.Link key={subIdx} to={subItem.to}>
                                                                {subItem.label}
                                                            </Dropdown.Link>
                                                        ))}
                                                    </Dropdown.Content>
                                                </Dropdown>
                                            </div>
                                        );
                                    }
                                    return (
                                        <NavLink key={index} to={menu.to} active={routeIsActive(menu.to)}>
                                            {menu.label}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            <div className="relative ml-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button type="button" className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none">
                                                {user.name} ({user.role})
                                                <svg className="-mr-0.5 ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <button onClick={handleLogout} className="block w-full px-4 py-2 text-left text-sm leading-5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition duration-150 ease-in-out">
                                            Log Out
                                        </button>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>
                        <div className="-mr-2 flex items-center sm:hidden">
                            <button onClick={() => setShowingNavigationDropdown((previousState) => !previousState)} className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none">
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    <path className={showingNavigationDropdown ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu (Biarkan sama) */}
                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden'}>
                     {/* ... Copy paste kode mobile menu lama ... */}
                </div>
            </nav>

            {/* HEADER DINAMIS DARI ANAK */}
            {header && (
                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>
                {/* Disini halaman-halaman akan dirender TANPA refresh Layout */}
                {/* Kita kirim fungsi setHeader ke anak agar anak bisa ubah judul */}
                <Outlet context={{ setHeader }} />
            </main>
        </div>
    );
}