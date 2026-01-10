import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KriteriaIndex from "./pages/admin/kriteria";
import BwmInput from './pages/pakar/bwm/Input';
import InputDataSiswa from "./pages/siswa/InputData.tsx";
import Result from "./pages/siswa/Result.tsx";
import PeriodeIndex from "./pages/admin/periode";
import JurusanIndex from "./pages/admin/jurusan";
import AlumniIndex from "./pages/admin/alumni";
import MonitoringIndex from "./pages/admin/monitoring";
import PromotionIndex from "./pages/admin/promotion";
import Settings from "./pages/admin/Settings.tsx";

// Komponen Pembungkus untuk Halaman yang Butuh Login (Protected Route)
const ProtectedRoute = ({children}: { children: JSX.Element }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        // Jika tidak ada token, paksa ke halaman login
        return <Navigate to="/login" replace/>;
    }

    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Route Login */}
                <Route path="/login" element={<Login/>}/>

                {/* Route Dashboard (Diproteksi) */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/kriteria"
                    element={
                        <ProtectedRoute>
                            <KriteriaIndex/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pakar/bwm"
                    element={
                        <ProtectedRoute>
                            <BwmInput/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/siswa/input"
                    element={
                        <ProtectedRoute>
                            <InputDataSiswa/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/siswa/result"
                    element={
                        <ProtectedRoute>
                            <Result/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/periode"
                    element={
                        <ProtectedRoute>
                            <PeriodeIndex/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/jurusan"
                    element={
                        <ProtectedRoute>
                            <JurusanIndex/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/alumni"
                    element={
                        <ProtectedRoute>
                            <AlumniIndex/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/monitoring"
                    element={
                        <ProtectedRoute>
                            <MonitoringIndex/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/promotion"
                    element={
                        <ProtectedRoute>
                            <PromotionIndex/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/settings"
                    element={
                        <ProtectedRoute>
                            <Settings/>
                        </ProtectedRoute>
                    }
                />


                {/* Route Default: Redirect root '/' ke login */}
                <Route path="/" element={<Navigate to="/login" replace/>}/>

                {/* Fallback 404 (Opsional) */}
                <Route path="*" element={<div className="p-10">404 - Halaman tidak ditemukan</div>}/>
            </Routes>
        </Router>
    );
}

export default App;