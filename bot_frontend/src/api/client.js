const BASE_URL = 'http://127.0.0.1:8000/api';

export const apiClient = async (endpoint, { body, method = 'GET', ...customConfig } = {}) => {
    const token = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json' };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
        ...customConfig,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
            return Promise.reject(new Error('Unauthorized'));
        }
        const error = await response.json().catch(() => ({}));
        return Promise.reject(error);
    }

    // Some endpoints may not return JSON (like 204 No Content for DELETE)
    if (response.status === 204) {
        return null;
    }
    return response.json();
};
