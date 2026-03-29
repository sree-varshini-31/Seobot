import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await apiClient('/auth/login/', { method: 'POST', body: formData });
            const access = data?.tokens?.access;
            const refresh = data?.tokens?.refresh;
            const user = data?.user;   // 👈 from backend
            
            if (access) {
                login({ access, refresh, user });
            }
        } catch (err) {
            setError(err?.error || err?.detail || 'Invalid username or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-login-gradient min-h-screen flex items-center justify-center p-6 selection:bg-primary-fixed selection:text-primary">
            <div className="w-full max-w-[400px] bg-surface-container-lowest p-8 rounded-[14px] border-[1.5px] border-[#eeedf5] shadow-[0_10px_20px_rgba(91,71,224,0.04)] flex flex-col items-center">
                <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                </div>
                
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-extrabold tracking-tighter text-on-background">
                        SEO<span className="text-primary">bot</span>
                    </h1>
                    <p className="text-on-surface-variant text-sm font-medium mt-1">Your autonomous SEO agent</p>
                </div>

                {error && (
                    <div className="w-full mb-4 p-3 bg-error/10 border border-error/20 rounded-xl flex items-start gap-2 text-error">
                        <span className="material-symbols-outlined text-lg">error</span>
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase px-1" htmlFor="username">Username</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg group-focus-within:text-primary transition-colors">person</span>
                            <input 
                                type="text" 
                                id="username"
                                className="w-full bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" 
                                placeholder="Enter your username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required 
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase" htmlFor="password">Password</label>
                            <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot?</a>
                        </div>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg group-focus-within:text-primary transition-colors">lock</span>
                            <input 
                                type="password" 
                                id="password"
                                className="w-full bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" 
                                placeholder="••••••••" 
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 mt-2 disabled:opacity-70 disabled:hover:scale-100"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t-[1.5px] border-[#eeedf5] w-full text-center">
                    <p className="text-sm text-on-surface-variant font-medium">
                        Don't have an account? 
                        <Link to="/register" className="text-primary font-bold hover:underline ml-1">Register</Link>
                    </p>
                </div>
            </div>

            <div className="fixed bottom-8 text-on-surface-variant/40 flex items-center gap-6">
                <span className="text-xs font-bold tracking-widest uppercase">Privacy</span>
                <span className="text-xs font-bold tracking-widest uppercase">Terms</span>
                <span className="text-xs font-bold tracking-widest uppercase">Contact</span>
            </div>
            <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary-container to-secondary opacity-20"></div>
        </div>
    );
}
