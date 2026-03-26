import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { logout } = useAuth();
    
    // Indigo Helix precise styling for NavLink
    const linkClasses = ({ isActive }) => 
        isActive 
            ? "flex items-center gap-3 px-3 py-2.5 bg-[#e4dfff] text-[#4228c8] font-bold rounded-lg transition-colors duration-200"
            : "flex items-center gap-3 px-3 py-2.5 text-[#1a1c1e]/70 hover:bg-[#eeedf5] hover:text-[#4228c8] rounded-lg transition-colors duration-200";

    const iconStyles = { fontVariationSettings: "'FILL' 0" };
    const activeIconStyles = { fontVariationSettings: "'FILL' 1" };

    return (
        <aside className="w-[220px] h-screen sticky top-0 left-0 border-r-[1.5px] border-[#eeedf5] bg-[#f4f3f7] flex flex-col p-4 gap-y-2 font-['Plus_Jakarta_Sans'] text-sm font-semibold tracking-tight shrink-0">
            <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tighter text-[#1a1c1e]">SEObot</h1>
                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold">AI SEO Agent</p>
                </div>
            </div>
            
            <nav className="flex-1 flex flex-col gap-y-1">
                <NavLink to="/dashboard" className={linkClasses}>
                    {({ isActive }) => (
                        <>
                            <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>dashboard</span>
                            <span>Dashboard</span>
                        </>
                    )}
                </NavLink>
                <NavLink to="/audit" className={linkClasses}>
                    {({ isActive }) => (
                        <>
                            <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>search_check</span>
                            <span>SEO Audit</span>
                        </>
                    )}
                </NavLink>
                <NavLink to="/keywords" className={linkClasses}>
                    {({ isActive }) => (
                        <>
                            <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>key</span>
                            <span>Keywords</span>
                        </>
                    )}
                </NavLink>
                <NavLink to="/articles" className={linkClasses}>
                    {({ isActive }) => (
                        <>
                            <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>article</span>
                            <span>Articles</span>
                        </>
                    )}
                </NavLink>
                <NavLink to="/plan" className={linkClasses}>
                    {({ isActive }) => (
                        <>
                            <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>calendar_today</span>
                            <span>Content Plan</span>
                        </>
                    )}
                </NavLink>
                <NavLink to="/links" className={linkClasses}>
                    {({ isActive }) => (
                        <>
                            <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>link</span>
                            <span>Internal Links</span>
                        </>
                    )}
                </NavLink>
                <NavLink to="/tools" className={linkClasses}>
                    {({ isActive }) => (
                        <>
                            <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>construction</span>
                            <span>SEO Tools</span>
                        </>
                    )}
                </NavLink>
                <NavLink to="/projects" className={linkClasses}>
                    {({ isActive }) => (
                        <>
                            <span className="material-symbols-outlined" style={isActive ? activeIconStyles : iconStyles}>folder_shared</span>
                            <span>Projects</span>
                        </>
                    )}
                </NavLink>
            </nav>
            
            <div className="mt-auto pt-4 border-t border-[#eeedf5]">
                <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                    <span className="text-xs text-primary font-bold">Agent active</span>
                </div>
                <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-[#1a1c1e]/70 hover:bg-[#eeedf5] hover:text-[#4228c8] rounded-lg transition-colors duration-200"
                >
                    <span className="material-symbols-outlined">logout</span>
                    Sign out
                </button>
            </div>
        </aside>
    );
}
