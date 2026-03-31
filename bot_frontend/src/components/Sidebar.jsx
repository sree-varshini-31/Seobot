import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ mobileOpen, onNavigate }) {
    const { user, logout } = useAuth();

    // Support both role string and is_staff/is_superuser flags
    const isAdmin = user?.role === 'admin' || user?.is_staff || user?.is_superuser;

    const linkClasses = ({ isActive }) =>
        isActive
            ? 'flex items-center gap-3 px-3 py-2.5 bg-[#e8f0fe] text-[#1a73e8] font-bold rounded-lg transition-colors duration-200 border border-[#dadce0] shadow-sm'
            : 'flex items-center gap-3 px-3 py-2.5 text-[#1a1c1e]/70 hover:bg-[#f1f3f4] hover:text-[#1a73e8] rounded-lg transition-colors duration-200';

    const iconStyles = { fontVariationSettings: "'FILL' 0" };
    const activeIconStyles = { fontVariationSettings: "'FILL' 1" };

    const close = () => onNavigate?.();

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                aria-hidden={!mobileOpen}
                onClick={close}
            />

            <aside
                className={`fixed md:static inset-y-0 left-0 z-50 w-[min(280px,88vw)] md:w-[220px] h-screen border-r-[1.5px] border-[#dadce0] bg-[#f8f9fa] flex flex-col p-4 gap-y-2 font-['Plus_Jakarta_Sans'] text-sm font-semibold tracking-tight shrink-0 transition-transform duration-200 ease-out md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-2 mb-6 mt-2">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                            smart_toy
                        </span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tighter text-[#1a1c1e]">SEObot</h1>
                        <p className="text-[10px] uppercase tracking-widest text-primary font-bold">AI SEO</p>
                    </div>
                </div>

                {/* Nav links */}
                <nav className="flex-1 flex flex-col gap-y-1">
                    {/* User links - hidden for admins */}
                    {!isAdmin && (
                        <>
                            <NavLink to="/dashboard" onClick={close} className={linkClasses}>
                                {({ isActive }) => (
                                    <>
                                        <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>dashboard</span>
                                        <span>Dashboard</span>
                                    </>
                                )}
                            </NavLink>

                            <NavLink to="/audit" onClick={close} className={linkClasses}>
                                {({ isActive }) => (
                                    <>
                                        <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>search_check</span>
                                        <span>SEO Audit</span>
                                    </>
                                )}
                            </NavLink>

                            <NavLink to="/keywords" onClick={close} className={linkClasses}>
                                {({ isActive }) => (
                                    <>
                                        <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>key</span>
                                        <span>Keywords</span>
                                    </>
                                )}
                            </NavLink>

                            <NavLink to="/articles" onClick={close} className={linkClasses}>
                                {({ isActive }) => (
                                    <>
                                        <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>article</span>
                                        <span>Articles</span>
                                    </>
                                )}
                            </NavLink>
                        </>
                    )}

                    {/* Admin only */}
                    {isAdmin && (
                        <NavLink to="/admin" onClick={close} className={linkClasses}>
                            {({ isActive }) => (
                                <>
                                    <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>admin_panel_settings</span>
                                    <span>Admin Panel</span>
                                </>
                            )}
                        </NavLink>
                    )}
                </nav>

                {/* Bottom links */}
                <div className="mt-auto pt-4 border-t border-[#dadce0] space-y-1">
                    <NavLink to="/profile" onClick={close} className={linkClasses}>
                        {({ isActive }) => (
                            <>
                                <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>person</span>
                                <span>Profile</span>
                            </>
                        )}
                    </NavLink>
                    <NavLink to="/settings" onClick={close} className={linkClasses}>
                        {({ isActive }) => (
                            <>
                                <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>settings</span>
                                <span>Settings</span>
                            </>
                        )}
                    </NavLink>
                    <button
                        type="button"
                        onClick={() => { close(); logout(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-[#1a1c1e]/70 hover:bg-[#f1f3f4] hover:text-red-500 rounded-lg transition-colors duration-200"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Sign out
                    </button>
                </div>
            </aside>
        </>
    );
}