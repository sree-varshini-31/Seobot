import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ username: '', email: '', password: '', confirm: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirm) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await apiClient('/auth/register/', { 
                method: 'POST', 
                body: { username: formData.username, email: formData.email, password: formData.password } 
            });
            // According to spec, auto login after register
            const data = await apiClient('/auth/login/', { 
                method: 'POST', 
                body: { username: formData.username, password: formData.password } 
            });
            if (data.access) {
                login(data.access);
            }
        } catch (err) {
            const errorMsg = typeof err === 'object' ? Object.values(err).join(' ') : 'Registration failed.';
            setError(errorMsg);
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
                    <h1 className="text-2xl font-extrabold tracking-tighter text-on-background">Create Account</h1>
                    <p className="text-on-surface-variant text-sm font-medium mt-1">Start optimizing your site today</p>
                </div>

                {error && (
                    <div className="w-full mb-4 p-3 bg-error/10 border border-error/20 rounded-xl flex items-start gap-2 text-error">
                        <span className="material-symbols-outlined text-lg">error</span>
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase px-1" htmlFor="username">Username</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg group-focus-within:text-primary transition-colors">person</span>
                            <input 
                                type="text" 
                                id="username"
                                className="w-full bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" 
                                placeholder="Choose a username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required 
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase px-1" htmlFor="email">Email address</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg group-focus-within:text-primary transition-colors">mail</span>
                            <input 
                                type="email" 
                                id="email"
                                className="w-full bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" 
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required 
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase px-1" htmlFor="password">Password</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg group-focus-within:text-primary transition-colors">lock</span>
                            <input 
                                type="password" 
                                id="password"
                                className="w-full bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" 
                                placeholder="••••••••" 
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required 
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase px-1" htmlFor="confirm">Confirm Password</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg group-focus-within:text-primary transition-colors">lock</span>
                            <input 
                                type="password" 
                                id="confirm"
                                className="w-full bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" 
                                placeholder="••••••••" 
                                value={formData.confirm}
                                onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
                                required 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 mt-2 disabled:opacity-70 disabled:hover:scale-100"
                    >
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t-[1.5px] border-[#eeedf5] w-full text-center">
                    <p className="text-sm text-on-surface-variant font-medium">
                        Already have an account? 
                        <Link to="/login" className="text-primary font-bold hover:underline ml-1">Sign in</Link>
                    </p>
                </div>
            </div>
            <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary-container to-secondary opacity-20"></div>
        </div>
    );
}
