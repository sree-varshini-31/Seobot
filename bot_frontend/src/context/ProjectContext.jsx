import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
    const { token } = useAuth();

    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(
        localStorage.getItem('seobot_project') || ''
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const refreshProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient('/data/?page=1&limit=50');
            const list = Array.isArray(res) ? res : res?.projects ?? res?.results ?? [];

            setProjects(Array.isArray(list) ? list : []);

            const wanted = String(localStorage.getItem('seobot_project') || '');
            const ids = new Set((Array.isArray(list) ? list : []).map((p) => String(p.id)));

            if (wanted && ids.has(wanted)) {
                setSelectedProjectId(wanted);
                return;
            }

            const first = Array.isArray(list) && list.length > 0 ? String(list[0].id) : '';
            if (first) {
                setSelectedProjectId(first);
                localStorage.setItem('seobot_project', first);
            } else {
                setSelectedProjectId('');
                localStorage.removeItem('seobot_project');
            }
        } catch (e) {
            setError(e?.detail || e?.message || 'Failed to load projects');
            setProjects([]);
            setSelectedProjectId('');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        refreshProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const value = useMemo(
        () => ({
            projects,
            selectedProjectId,
            setSelectedProjectId: (id) => {
                const next = String(id || '');
                setSelectedProjectId(next);
                if (next) localStorage.setItem('seobot_project', next);
                else localStorage.removeItem('seobot_project');
            },
            refreshProjects,
            loading,
            error,
        }),
        [projects, selectedProjectId, loading, error]
    );

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
    const ctx = useContext(ProjectContext);
    if (!ctx) throw new Error('useProjects must be used inside ProjectProvider');
    return ctx;
}

