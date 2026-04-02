const BASE_URL = 'http://localhost:8000/api';

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

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

    console.log(`API Request: ${method} ${BASE_URL}${endpoint}`, body ? { body } : '');
    
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        console.log(`API Response: ${response.status} ${response.statusText}`, response);

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('API Error:', error);

            // Only auto-redirect on 401 if it's NOT an auth endpoint
            if (
                response.status === 401 &&
                !endpoint.includes('/auth/login') &&
                !endpoint.includes('/auth/register')
            ) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(new Error('Unauthorized'));
            }

            return Promise.reject(error);
        }

        if (response.status === 204) {
            return null;
        }

        const result = await response.json();
        console.log('API Success:', result);
        return result;
    } catch (fetchError) {
        console.error('Fetch failed:', {
            error: fetchError,
            message: fetchError.message,
            stack: fetchError.stack,
            endpoint: `${BASE_URL}${endpoint}`,
            method,
            body
        });
        
        // More specific error handling
        if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
            return Promise.reject(new Error('Network error: Unable to connect to the server. Please check if the backend is running on port 8000.'));
        }
        
        return Promise.reject(fetchError);
    }
};

// ─── Projects ────────────────────────────────────────────────────────────────

export const analyzeUrl = (url, refresh = false) =>
    apiClient(`/analyze/?url=${encodeURIComponent(url)}${refresh ? '&refresh=true' : ''}`);

export const getProjects = (page = 1, limit = 20) =>
    apiClient(`/data/?page=${page}&limit=${limit}`);

export const getProjectResult = (projectId) =>
    apiClient(`/data/${projectId}/`);

export const getProjectAnalytics = (projectId) =>
    apiClient(`/analytics/${projectId}/`);

// ─── Admin ───────────────────────────────────────────────────────────────────

export const adminGetUsers = () =>
    apiClient('/auth/admin/users/');

export const adminUpdateUser = (userId, data) =>
    apiClient(`/auth/admin/users/${userId}/`, { method: 'PATCH', body: data });

export const adminDeleteUser = (userId) =>
    apiClient(`/auth/admin/users/${userId}/`, { method: 'DELETE' });

export const adminGetAllProjects = (page = 1, limit = 20) =>
    apiClient(`/admin/projects/?page=${page}&limit=${limit}`);

export const adminGetAnalytics = (projectId) =>
    apiClient(`/admin/analytics/${projectId}/`);

// ─── Audit ───────────────────────────────────────────────────────────────────

export const auditWebsite = (url, refresh = false) =>
    apiClient(`/audit/website/?url=${encodeURIComponent(url)}${refresh ? '&refresh=true' : ''}`);

export const extractKeywords = (url) =>
    apiClient(`/audit/keywords/?url=${encodeURIComponent(url)}`);

export const keywordResearch = (url) =>
    apiClient(`/audit/keyword-research/?url=${encodeURIComponent(url)}`);

export const getSeoReport = (url, projectId) => {
    if (projectId) return apiClient(`/audit/report/?project_id=${projectId}`);
    return apiClient(`/audit/report/?url=${encodeURIComponent(url)}`);
};

export const competitorAnalysis = (url) =>
    apiClient(`/audit/competitors/?url=${encodeURIComponent(url)}`);

export const crawlWebsite = (url) =>
    apiClient(`/audit/crawl/?url=${encodeURIComponent(url)}`);

// ─── Generator ───────────────────────────────────────────────────────────────

export const getArticles = (projectId) => {
    const q = projectId ? `?project=${encodeURIComponent(projectId)}` : '';
    return apiClient(`/generator/articles/${q}`);
};

export const getArticle = (id) => apiClient(`/generator/articles/${id}/`);

export const generateArticle = ({ projectId, keyword, template_type = 'blog', youtube_url = '' }) =>
    apiClient('/generator/articles/generate/', {
        method: 'POST',
        body: {
            project_id: projectId,
            keyword,
            template_type,
            youtube_url,
        },
    });

export const getContentPlans = (projectId) =>
    apiClient(`/generator/content-plans/?project=${projectId}`);

export const generateContentPlan = (projectId) =>
    apiClient('/generator/content-plans/generate/', {
        method: 'POST',
        body: { project_id: projectId },
    });

export const generateInternalLinks = (projectId) =>
    apiClient('/generator/internal-links/', {
        method: 'POST',
        body: { project_id: projectId },
    });

export const getGenerationStatus = (taskId) =>
    apiClient(`/generator/generation-status/${taskId}/`);

export const bulkGenerate = (projectId, keywords, template_type = 'blog') =>
    apiClient('/generator/bulk-generate/', {
        method: 'POST',
        body: { project_id: projectId, keywords, template_type },
    });

// ─── SEO Tools ───────────────────────────────────────────────────────────────

export const checkKeywordDifficulty = (keywords) =>
    apiClient('/generator/tools/keyword-difficulty/', {
        method: 'POST',
        body: { keywords: Array.isArray(keywords) ? keywords : [keywords] },
    });

export const generateFaqSchema = (questions, answers) =>
    apiClient('/generator/tools/faq-schema/', {
        method: 'POST',
        body: { questions, answers },
    });

export const generateArticleSchema = ({ title, description, author, publish_date, image_url }) =>
    apiClient('/generator/tools/article-schema/', {
        method: 'POST',
        body: { title, description, author, publish_date, image_url },
    });

export const generateQaSchema = (question, answer, author) =>
    apiClient('/generator/tools/qa-schema/', {
        method: 'POST',
        body: { question, answer, author },
    });

// ─── Auth ────────────────────────────────────────────────────────────────────

export const login = (username, password) =>
    apiClient('/auth/login/', { method: 'POST', body: { username, password } });

export const register = (username, email, password) =>
    apiClient('/auth/register/', { method: 'POST', body: { username, email, password } });

export const logout = () =>
    apiClient('/auth/logout/', {
        method: 'POST',
        body: { refresh: localStorage.getItem('refresh_token') },
    });

export const getProfile = () =>
    apiClient('/auth/profile/');

export const getProfileInsights = () =>
    apiClient('/auth/profile/insights/');

export const patchProfile = (body) =>
    apiClient('/auth/profile/', { method: 'PATCH', body });

export const uploadAvatar = async (file) => {
    const token = localStorage.getItem('access_token');
    const fd = new FormData();
    fd.append('avatar', file);
    const response = await fetch(`${BASE_URL}/auth/profile/avatar/`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
    });
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }
        const error = await response.json().catch(() => ({}));
        return Promise.reject(error);
    }
    return response.json();
};

export const deleteAvatar = () =>
    apiClient('/auth/profile/avatar/', { method: 'DELETE' });

export const changePassword = (old_password, new_password) =>
    apiClient('/auth/profile/password/', {
        method: 'POST',
        body: { old_password, new_password },
    });

export const refreshToken = (refresh) =>
    apiClient('/token/refresh/', { method: 'POST', body: { refresh } });