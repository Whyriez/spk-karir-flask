import React, { ReactNode } from 'react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}: {
    children: ReactNode;
    show: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    closeable?: boolean;
    onClose?: () => void;
}) {
    if (!show) return null;

    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
    }[maxWidth];

    return (
        <div className="fixed inset-0 overflow-y-auto px-4 py-6 sm:px-0 z-50 flex items-center justify-center">
            {/* Backdrop Gelap */}
            {/* Kita biarkan fixed agar selalu menutup layar meski di-scroll */}
            <div className="fixed inset-0 transform transition-all" onClick={close}>
                <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>

            {/* Konten Modal */}
            {/* PERBAIKAN: Tambahkan 'relative z-50' agar konten memaksa tampil di atas backdrop */}
            <div
                className={`mb-6 bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:w-full sm:mx-auto ${maxWidthClass} relative z-50`}
            >
                {children}
            </div>
        </div>
    );
}