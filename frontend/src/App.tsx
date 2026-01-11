import React, {JSX, useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate, useLocation} from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Admin Pages
import KriteriaIndex from "./pages/admin/kriteria/Index";
import PeriodeIndex from "./pages/admin/periode/Index";
import JurusanIndex from "./pages/admin/jurusan/Index";
import AlumniIndex from "./pages/admin/alumni/Index";
import MonitoringIndex from "./pages/admin/monitoring/Index";
import PromotionIndex from "./pages/admin/promotion/Index";
import Settings from "./pages/admin/Settings";

// Pakar Pages
import BwmInput from './pages/pakar/bwm/Input';
import KriteriaPakar from './pages/pakar/kriteria/Input';

// Siswa Pages
import InputDataSiswa from "./pages/siswa/InputData";
import ResultSiswa from "./pages/siswa/Result";
import BwmSetting from "./pages/admin/bwm/Setting.tsx";
import NProgress from "nprogress";

// --- COMPONENT PROTECTED ROUTE DENGAN ROLE ---
const ProtectedRoute = ({children, roles}: { children: JSX.Element, roles?: string[] }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role'); // Pastikan simpan role saat login
    const location = useLocation();

    useEffect(() => {
        // Start dan Done dipanggil cepat untuk memberi efek "loading sekejap" saat pindah halaman
        NProgress.start();
        NProgress.done();
    }, [location]);

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace/>;
    }

    // Jika butuh role spesifik dan user tidak punya role itu
    if (roles && userRole && !roles.includes(userRole)) {
        return <Navigate to="/dashboard" replace/>;
    }

    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login/>}/>

                {/* Dashboard (Semua Role Bisa) */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>

                {/* --- GROUP ADMIN --- */}
                <Route path="/admin/kriteria" element={<ProtectedRoute roles={['admin']}><KriteriaIndex/></ProtectedRoute>}/>
                <Route path="/admin/periode" element={<ProtectedRoute roles={['admin']}><PeriodeIndex/></ProtectedRoute>}/>
                <Route path="/admin/jurusan" element={<ProtectedRoute roles={['admin']}><JurusanIndex/></ProtectedRoute>}/>
                <Route path="/admin/alumni" element={<ProtectedRoute roles={['admin']}><AlumniIndex/></ProtectedRoute>}/>
                <Route path="/admin/monitoring" element={<ProtectedRoute roles={['admin']}><MonitoringIndex/></ProtectedRoute>}/>
                <Route path="/admin/promotion" element={<ProtectedRoute roles={['admin']}><PromotionIndex/></ProtectedRoute>}/>
                <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><Settings/></ProtectedRoute>}/>
                <Route path="/admin/bwm/setting" element={<BwmSetting />} />

                {/* --- GROUP PAKAR --- */}
                <Route path="/pakar/bwm" element={<ProtectedRoute roles={['pakar']}><BwmInput/></ProtectedRoute>}/>
                <Route path="/pakar/kriteria" element={<ProtectedRoute roles={['pakar']}><KriteriaPakar/></ProtectedRoute>}/>

                {/* --- GROUP SISWA --- */}
                <Route path="/siswa/input" element={<ProtectedRoute roles={['siswa']}><InputDataSiswa/></ProtectedRoute>}/>
                <Route path="/siswa/result" element={<ProtectedRoute roles={['siswa']}><ResultSiswa/></ProtectedRoute>}/>

                {/* Default */}
                <Route path="/" element={<Navigate to="/login" replace/>}/>
                <Route path="*" element={<div className="p-10 text-center">404 | Not Found</div>}/>
            </Routes>
        </Router>
    );
}

export default App;