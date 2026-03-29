import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../api/client';

const AuthContext = createContext(null);

const DEFAULT_AVATAR = '/default-avatar.png';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem('user')) || null
    );

    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }, [token]);

    const refreshUser = useCallback(async () => {
        if (!localStorage.getItem('access_token')) return;
        try {
            const data = await getProfile();
            if (data?.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
            }
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        if (token) refreshUser();
    }, [token, refreshUser]);

    const login = (data) => {
        const access = data?.access;
        const refresh = data?.refresh;
        const userData = data?.user;

        if (access) {
            localStorage.setItem('access_token', access);
            setToken(access);
        }

        if (refresh) {
            localStorage.setItem('refresh_token', refresh);
        }

        if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        }

        navigate('/dashboard');
    };

    const updateUser = (partial) => {
        setUser((prev) => {
            const next = { ...prev, ...partial };
            localStorage.setItem('user', JSON.stringify(next));
            return next;
        });
    };

    const logout = async () => {
        try {
            const refresh = localStorage.getItem('refresh_token');

            await fetch('http://127.0.0.1:8000/api/auth/logout/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ refresh }),
            });
        } catch (e) {}

        setToken(null);
        setUser(null);
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        navigate('/login');
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                login,
                logout,
                updateUser,
                refreshUser,
                defaultAvatar: DEFAULT_AVATAR,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
