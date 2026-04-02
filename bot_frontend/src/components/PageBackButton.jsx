import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PageBackButton() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const isAdmin = user?.role === 'admin' || user?.is_staff || user?.is_superuser;

    const handleBack = () => {
        navigate('/dashboard');
    };

    // Hide on home, dashboard, login, register, and all admin routes
    if (
        ['/', '/dashboard', '/login', '/register'].includes(location.pathname) ||
        location.pathname.startsWith('/admin')
    ) {
        return null;
    }

    return (
        <div className="fixed top-17 left-[236px] z-60">
            <button
                type="button"
                onClick={handleBack}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant/40 text-on-surface hover:bg-surface-container transition-colors shadow-sm"
                aria-label="Go back"
            >
                <span className="material-symbols-outlined">arrow_back</span>
            </button>
        </div>
    );
}