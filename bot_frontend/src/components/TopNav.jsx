import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TopNav({ onMenuClick }) {
    const navigate = useNavigate();
    const { user, logout, defaultAvatar } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const avatarSrc = user?.avatar || defaultAvatar;
    const displayName = user?.name || user?.username || 'Guest';

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
        <header className="min-h-14 sm:h-16 sticky top-0 z-30 bg-[#fafafa]/95 backdrop-blur-md border-b-[1.5px] border-outline-variant/30 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 lg:px-10 py-2 sm:py-0 w-full">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <button
                    type="button"
                    className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#f1f3f4] text-on-surface shrink-0"
                    aria-label="Open menu"
                    onClick={onMenuClick}
                >
                    <span className="material-symbols-outlined text-[24px]">menu</span>
                </button>


            </div>

            <div className="relative flex items-center gap-2 shrink-0 ml-auto" ref={dropdownRef}>
                <div className="hidden sm:block text-right max-w-[140px] lg:max-w-[200px] mr-1">
                    <p className="text-xs sm:text-sm font-bold text-on-surface truncate">{displayName}</p>
                    <p className="text-[10px] text-outline uppercase font-semibold truncate">{user?.plan || 'Free'}</p>
                </div>

                <button
                    type="button"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="focus:outline-none ring-2 ring-transparent focus:ring-primary/30 rounded-full"
                    aria-label="Account menu"
                    aria-expanded={dropdownOpen}
                >
                    <img src={avatarSrc} alt="" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-outline-variant/40" />
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[min(288px,calc(100vw-1.5rem))] bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 z-50 overflow-hidden">
                        <div className="flex flex-col items-center gap-2 px-5 py-4 bg-[#f8f9fa] border-b border-outline-variant/30">
                            <img src={avatarSrc} alt="" className="w-11 h-11 rounded-full object-cover border border-outline-variant/40" />
                            <div className="text-center">
                                <p className="text-sm font-bold text-on-surface">{displayName}</p>
                                <p className="text-xs text-outline mt-0.5 break-all">{user?.email || ''}</p>
                            </div>
                        </div>

                        <nav className="py-1.5">
                            <button
                                type="button"
                                onClick={() => {
                                    closeMenu();
                                    navigate('/profile');
                                }}
                                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                            >
                                <span className="material-symbols-outlined text-outline text-[18px]">folder_open</span>
                                Projects
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    closeMenu();
                                    navigate('/settings');
                                }}
                                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                            >
                                <span className="material-symbols-outlined text-outline text-[18px]">manage_accounts</span>
                                Settings
                            </button>

                            <div className="border-t border-outline-variant/30 my-1" />

                            <button
                                type="button"
                                onClick={() => {
                                    closeMenu();
                                    logout();
                                }}
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