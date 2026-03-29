const BASE_URL = 'http://127.0.0.1:8000/api';

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

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(new Error('Unauthorized'));
        }
        const error = await response.json().catch(() => ({}));
        return Promise.reject(error);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};

// ─── Projects ────────────────────────────────────────────────────────────────

// GET or POST — backend accepts both
export const analyzeUrl = (url, refresh = false) =>
    apiClient(`/analyze/?url=${encodeURIComponent(url)}${refresh ? '&refresh=true' : ''}`);

// GET /api/data/?page=1&limit=20
export const getProjects = (page = 1, limit = 20) =>
    apiClient(`/data/?page=${page}&limit=${limit}`);

// GET /api/data/<project_id>/
export const getProjectResult = (projectId) =>
    apiClient(`/data/${projectId}/`);

// GET /api/analytics/<project_id>/
export const getProjectAnalytics = (projectId) =>
    apiClient(`/analytics/${projectId}/`);

// ─── Admin ───────────────────────────────────────────────────────────────────

// GET /api/admin/projects/
export const adminGetAllProjects = (page = 1, limit = 20) =>
    apiClient(`/admin/projects/?page=${page}&limit=${limit}`);

// GET /api/admin/analytics/<project_id>/
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

// FIX: backend needs { project_id, keyword, template_type } — not title/tone/wordCount
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

// FIX: backend only needs { project_id } — not keywords
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

// NEW: these were missing from original client.js
export const getGenerationStatus = (taskId) =>
    apiClient(`/generator/generation-status/${taskId}/`);

export const bulkGenerate = (projectId, keywords, template_type = 'blog') =>
    apiClient('/generator/bulk-generate/', {
        method: 'POST',
        body: { project_id: projectId, keywords, template_type },
    });

// ─── SEO Tools ───────────────────────────────────────────────────────────────

// FIX: backend expects POST with { keywords: [...] } — was GET before
export const checkKeywordDifficulty = (keywords) =>
    apiClient('/generator/tools/keyword-difficulty/', {
        method: 'POST',
        body: { keywords: Array.isArray(keywords) ? keywords : [keywords] },
    });

// FIX: backend expects POST with { questions, answers } — was GET before
export const generateFaqSchema = (questions, answers) =>
    apiClient('/generator/tools/faq-schema/', {
        method: 'POST',
        body: { questions, answers },
    });

// FIX: backend expects POST with { title, description, ... } — was GET before
export const generateArticleSchema = ({ title, description, author, publish_date, image_url }) =>
    apiClient('/generator/tools/article-schema/', {
        method: 'POST',
        body: { title, description, author, publish_date, image_url },
    });

// NEW: Q&A schema was missing from original client.js
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

// /api/token/refresh/ — registered in main urls.py under api/token/
export const refreshToken = (refresh) =>
    apiClient('/token/refresh/', { method: 'POST', body: { refresh } });