import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }, [token]);

    const login = (newToken) => {
        setToken(newToken);
        navigate('/dashboard');
    };

    const logout = async () => {
        try {
            // Optional: Call /auth/logout/ to blacklist
            await fetch('http://127.0.0.1:8000/api/auth/logout/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (e) {
            // ignore network errors on logout
        } finally {
            setToken(null);
            navigate('/login');
        }
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
