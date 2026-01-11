import {createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback} from 'react';
import apiClient from '@/lib/axios';

interface User {
    name: string;
    role: string;
    email?: string;
}

interface LayoutContextType {
    schoolName: string;
    user: User | null;
    isLoaded: boolean;
    refreshUser: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({children}: { children: ReactNode }) {
    const [schoolName, setSchoolName] = useState('SMK Negeri 1 Gorontalo');
    const [isLoaded, setIsLoaded] = useState(false);
    const [user, setUser] = useState<User | null>(() => {
        const userString = localStorage.getItem('user');
        return userString ? JSON.parse(userString) : null;
    });
    const hasFetched = useRef(false);

    // Method untuk refresh user dari localStorage
    const refreshUser = useCallback(() => {
        const userString = localStorage.getItem('user');
        const newUser = userString ? JSON.parse(userString) : null;
        setUser(newUser);
    }, []);

    // Fetch settings HANYA SEKALI
    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        let mounted = true;

        apiClient.get('/settings')
            .then(res => {
                if (mounted && res.data.nama_sekolah) {
                    setSchoolName(res.data.nama_sekolah);
                    console.log('✅ School name loaded:', res.data.nama_sekolah);
                }
            })
            .catch(err => console.error("❌ Gagal memuat pengaturan sekolah", err))
            .finally(() => {
                if (mounted) {
                    setIsLoaded(true);
                    console.log('✅ Layout context ready');
                }
            });

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <LayoutContext.Provider value={{schoolName, user, isLoaded, refreshUser}}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
}