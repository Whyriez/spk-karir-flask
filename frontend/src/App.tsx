import React, {JSX} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate, useLocation} from 'react-router-dom';
import {LayoutProvider} from '@/contexts/LayoutContext';
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
import Welcome from "./pages/Welcome.tsx";
import AuthenticatedLayout from "./Layouts/AuthenticatedLayout.tsx";
import NilaiStaticIndex from "./pages/admin/nilai_static/Index.tsx";
import AdminSiswaIndex from "./pages/admin/siswa";

// Protected Route Component
const ProtectedRoute = ({children, roles}: { children: JSX.Element, roles?: string[] }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace/>;
    }

    if (roles && userRole && !roles.includes(userRole)) {
        return <Navigate to="/dashboard" replace/>;
    }

    return children;
};

function App() {
    return (
        <Router>
            {/* SINGLE LayoutProvider untuk SEMUA routes */}
            <LayoutProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Welcome />} />
                    <Route path="/login" element={<Login />} />

                    {/* Authenticated routes with Layout */}
                    <Route element={<AuthenticatedLayout />}>
                        {/* Dashboard */}
                        <Route path="/dashboard" element={
                            <ProtectedRoute><Dashboard /></ProtectedRoute>
                        } />

                        {/* ADMIN ROUTES */}
                        <Route path="/admin/kriteria" element={<ProtectedRoute roles={['admin']}><KriteriaIndex /></ProtectedRoute>} />
                        <Route path="/admin/periode" element={<ProtectedRoute roles={['admin']}><PeriodeIndex /></ProtectedRoute>} />
                        <Route path="/admin/jurusan" element={<ProtectedRoute roles={['admin']}><JurusanIndex /></ProtectedRoute>} />
                        <Route path="/admin/alumni" element={<ProtectedRoute roles={['admin']}><AlumniIndex /></ProtectedRoute>} />
                        <Route path="/admin/monitoring" element={<ProtectedRoute roles={['admin']}><MonitoringIndex /></ProtectedRoute>} />
                        <Route path="/admin/promotion" element={<ProtectedRoute roles={['admin']}><PromotionIndex /></ProtectedRoute>} />
                        <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
                        <Route path="/admin/bwm/setting" element={<ProtectedRoute roles={['admin']}><BwmSetting /></ProtectedRoute>} />
                        <Route path="/admin/nilai-static" element={<ProtectedRoute roles={['admin']}><NilaiStaticIndex /></ProtectedRoute>} />
                        <Route path="/admin/siswa" element={<ProtectedRoute roles={['admin']}><AdminSiswaIndex /></ProtectedRoute>} />

                        {/* PAKAR ROUTES */}
                        <Route path="/pakar/bwm" element={<ProtectedRoute roles={['pakar']}><BwmInput /></ProtectedRoute>} />
                        <Route path="/pakar/kriteria" element={<ProtectedRoute roles={['pakar']}><KriteriaPakar /></ProtectedRoute>} />

                        {/* SISWA ROUTES */}
                        <Route path="/siswa/input" element={<ProtectedRoute roles={['siswa']}><InputDataSiswa /></ProtectedRoute>} />
                        <Route path="/siswa/result" element={<ProtectedRoute roles={['siswa']}><ResultSiswa /></ProtectedRoute>} />
                    </Route>

                    <Route path="*" element={<div className="p-10 text-center">404 | Not Found</div>}/>
                </Routes>
            </LayoutProvider>
        </Router>
    );
}

export default App;