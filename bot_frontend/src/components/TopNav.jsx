import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TopNav({ onMenuClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, defaultAvatar } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const avatarSrc = user?.avatar || defaultAvatar;
    const displayName = user?.first_name || user?.name || user?.username || 'User';
    const isAdmin = user?.role === 'admin' || user?.is_staff || user?.is_superuser;

    // Determine if we are on a home/dashboard route
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const closeMenu = () => setDropdownOpen(false);

    return (
        <header className="min-h-14 sm:h-16 sticky top-0 z-50 bg-[#fafafa]/95 backdrop-blur-md border-b-[1.5px] border-outline-variant/30 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 lg:px-10 py-2 sm:py-0 w-full print-hidden">
            {/* Left — mobile menu toggle */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#f1f3f4] text-on-surface shrink-0"
                    aria-label="Open menu"
                    onClick={onMenuClick}
                >
                    <span className="material-symbols-outlined text-[24px]">menu</span>
                </button>
            </div>

            {/* Right — profile section */}
            <div className="relative flex items-center gap-3" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setDropdownOpen(prev => !prev)}
                    className="flex items-center gap-2 text-right"
                    aria-label="Account menu"
                    aria-expanded={dropdownOpen}
                >
                    <div className="hidden sm:block text-right">
                        <p className="text-xs sm:text-sm font-bold text-on-surface truncate">{displayName}</p>
                        <p className="text-[10px] text-outline uppercase font-semibold truncate">
                            {isAdmin ? 'Administrator' : (user?.plan || 'Free Plan')}
                        </p>
                    </div>
                    <img
                        src={avatarSrc}
                        alt=""
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-outline-variant/40"
                    />
                </button>


                {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[min(288px,calc(100vw-1.5rem))] bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 z-50 overflow-hidden">
                        {/* User info header */}
                        <div className="flex flex-col items-center gap-2 px-5 py-4 bg-[#f8f9fa] border-b border-outline-variant/30">
                            <img src={avatarSrc} alt="" className="w-11 h-11 rounded-full object-cover border border-outline-variant/40" />
                            <div className="text-center">
                                <p className="text-sm font-bold text-on-surface">{displayName}</p>
                                <p className="text-xs text-outline mt-0.5 break-all">{user?.email || ''}</p>
                                {isAdmin && (
                                    <span className="inline-block mt-1.5 text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                                        Administrator
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Menu items */}
                        <nav className="py-1.5">
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => { closeMenu(); navigate('/admin'); }}
                                    className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                                    Admin Panel
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => { closeMenu(); navigate('/profile'); }}
                                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                            >
                                <span className="material-symbols-outlined text-outline text-[18px]">person</span>
                                Profile
                            </button>
                            <button
                                type="button"
                                onClick={() => { closeMenu(); navigate('/settings'); }}
                                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                            >
                                <span className="material-symbols-outlined text-outline text-[18px]">settings</span>
                                Settings
                            </button>

                            <div className="border-t border-outline-variant/30 my-1" />

                            <button
                                type="button"
                                onClick={() => { closeMenu(); logout(); }}
                                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-error hover:bg-error/10 transition-colors text-left"
                            >
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                Sign out
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}