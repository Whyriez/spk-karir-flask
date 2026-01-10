import React, { useState, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Dropdown from '../components/Dropdown';
import NavLink from '../components/NavLink';
import PrimaryButton from '../components/PrimaryButton';

export default function AuthenticatedLayout({ header, children }: { header?: ReactNode, children: ReactNode }) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Ambil user dari localStorage
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    if (!user) {
        navigate('/login');
        return null;
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // --- DEFINISI MENU BERDASARKAN ROLE ---
    const getMenus = (role: string) => {
        switch (role) {
            case "admin":
                return [
                    { label: "Dashboard", to: "/dashboard", type: "link" },
                    {
                        label: "Data Master",
                        type: "dropdown",
                        items: [
                            { label: "Manajemen Kriteria", to: "/admin/kriteria" },
                            { label: "Data Jurusan", to: "/admin/jurusan" },
                            { label: "Data Alumni", to: "/admin/alumni" }, // Baru
                        ],
                    },
                    { label: "Monitoring Siswa", to: "/admin/monitoring", type: "link" }, // Baru
                    {
                        label: "Konfigurasi",
                        type: "dropdown",
                        items: [
                            { label: "Manajemen Periode", to: "/admin/periode" },
                            { label: "Kenaikan Kelas", to: "/admin/promotion" }, // Baru
                            { label: "Pengaturan", to: "/admin/settings" }, // Baru
                        ],
                    },
                ];
            case "pakar":
                return [
                    { label: "Dashboard", to: "/dashboard", type: "link" },
                    { label: "Input Bobot (BWM)", to: "/pakar/bwm", type: "link" },
                    { label: "Monitoring Siswa", to: "/admin/monitoring", type: "link" }, // Baru (Pakar akses monitoring)
                ];
            case "siswa":
                return [
                    { label: "Dashboard", to: "/dashboard", type: "link" },
                    { label: "Input Data & Minat", to: "/siswa/input", type: "link" },
                    { label: "Hasil Rekomendasi", to: "/siswa/result", type: "link" },
                ];
            default:
                return [];
        }
    };

    const menus = getMenus(user.role);

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            {/* Logo */}
                            <div className="shrink-0 flex items-center">
                                <Link to="/dashboard">
                                    <div className="font-bold text-2xl text-indigo-600 tracking-tighter">
                                        SPK <span className="text-gray-800">SMK</span>
                                    </div>
                                </Link>
                            </div>

                            {/* Desktop Menu */}
                            <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                                {menus.map((menu: any, index: number) => {
                                    if (menu.type === "dropdown") {
                                        return (
                                            <div key={index} className="inline-flex items-center h-full">
                                                <Dropdown>
                                                    <Dropdown.Trigger>
                                                        <button type="button" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                                                            {menu.label}
                                                            <svg className="ml-2 -mr-0.5 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </Dropdown.Trigger>
                                                    <Dropdown.Content>
                                                        {menu.items.map((child: any, idx: number) => (
                                                            <Dropdown.Link key={idx} to={child.to}>
                                                                {child.label}
                                                            </Dropdown.Link>
                                                        ))}
                                                    </Dropdown.Content>
                                                </Dropdown>
                                            </div>
                                        );
                                    }
                                    return (
                                        <NavLink key={index} to={menu.to} active={location.pathname.startsWith(menu.to)}>
                                            {menu.label}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>

                        {/* User Profile Dropdown */}
                        <div className="hidden sm:flex sm:items-center sm:ml-6">
                            <div className="ml-3 relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button type="button" className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150">
                                                {user.name} ({user.role})
                                                <svg className="ml-2 -mr-0.5 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <div className="block px-4 py-2 text-xs text-gray-400">
                                            Manage Account
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm leading-5 text-gray-700 hover:bg-gray-100 focus:outline-none transition duration-150 ease-in-out"
                                        >
                                            Log Out
                                        </button>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Hamburger Button (Mobile) */}
                        <div className="-mr-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((prev) => !prev)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Content */}
                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden'}>
                    <div className="pt-2 pb-3 space-y-1">
                        {menus.map((menu: any, index: number) => {
                             if (menu.type === "dropdown") {
                                return (
                                    <div key={index} className="border-t border-gray-200 pt-2">
                                        <div className="px-4 text-xs font-semibold text-gray-400 uppercase">{menu.label}</div>
                                        {menu.items.map((child:any, idx:number) => (
                                            <Link key={idx} to={child.to} className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition duration-150 ease-in-out">
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                )
                             }
                             return (
                                <Link key={index} to={menu.to} className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition duration-150 ease-in-out">
                                    {menu.label}
                                </Link>
                             )
                        })}
                    </div>
                    <div className="pt-4 pb-1 border-t border-gray-200">
                        <div className="px-4">
                            <div className="font-medium text-base text-gray-800">{user.name}</div>
                            <div className="font-medium text-sm text-gray-500">{user.email}</div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <button onClick={handleLogout} className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition duration-150 ease-in-out">
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}