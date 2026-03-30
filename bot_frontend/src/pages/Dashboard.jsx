import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

// ─── Skeleton loader ────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
    return (
        <div
            className={`animate-pulse bg-gradient-to-r from-surface-container via-surface-container-low to-surface-container rounded-lg ${className}`}
        />
    );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, trend, loading, onClick }) {
    const isPositive = typeof trend === 'number' ? trend >= 0 : null;
    const trendLabel =
        trend === null || trend === undefined
            ? null
            : typeof trend === 'number'
                ? `${trend >= 0 ? '+' : ''}${trend}%`
                : trend;

    return (
        <div 
            onClick={onClick}
            className={`bg-surface-container-lowest ghost-border p-6 rounded-[14px] flex flex-col gap-4 ${onClick ? 'cursor-pointer hover:bg-surface-container-low transition-colors' : ''}`}>
            <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
                {loading ? (
                    <Skeleton className="w-14 h-6 rounded-full" />
                ) : trendLabel ? (
                    <div
                        className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive
                            ? 'text-success bg-success/10'
                            : 'text-error bg-error/10'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">
                            {isPositive ? 'trending_up' : 'trending_down'}
                        </span>
                        {trendLabel}
                    </div>
                ) : null}
            </div>
            <div>
                <p className="text-sm font-semibold text-outline tracking-tight uppercase">
                    {label}
                </p>
                {loading ? (
                    <Skeleton className="w-16 h-9 mt-2" />
                ) : (
                    <h3 className="text-3xl font-bold text-on-surface tracking-tighter mt-1">
                        {value ?? '—'}
                    </h3>
                )}
            </div>
        </div>
    );
}

// ─── Project row ─────────────────────────────────────────────────────────────
function ProjectRow({ proj, onClick }) {
    const statusMap = {
        active: { label: 'Active', classes: 'bg-success/10 text-success' },
        paused: { label: 'Paused', classes: 'bg-warning/10 text-warning' },
        inactive: { label: 'Inactive', classes: 'bg-error/10 text-error' },
    };
    const status = statusMap[proj.status?.toLowerCase()] ?? statusMap.active;

    return (
        <div
            className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors group cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center ghost-border group-hover:border-primary-fixed">
                    <span className="material-symbols-outlined text-outline">public</span>
                </div>
                <div>
                    <h4 className="text-sm font-bold text-on-surface">
                        {proj.name || 'Untitled Project'}
                    </h4>
                    <p className="text-xs text-outline">{proj.url || 'no url added'}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${status.classes}`}
                >
                    {status.label}
                </span>
                <button
                    className="text-outline hover:text-primary"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
            </div>
        </div>
    );
}

// ─── Greeting helper ─────────────────────────────────────────────────────────
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        projects: null,
        articles: null,
        keywords: null,
        audits: null,
    });
    const [trends, setTrends] = useState({
        projects: null,
        articles: null,
        keywords: null,
        audits: null,
    });
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [projsRes, artsRes] =
                    await Promise.allSettled([
                        apiClient('/data/'),
                        apiClient('/generator/articles/'),
                    ]);

                // ── Projects ──────────────────────────────────────────────
                const projsData =
                    projsRes.status === 'fulfilled' ? projsRes.value : null;
                console.log('projsData:', projsData); // 👈 debug

                const projectsList = Array.isArray(projsData)
                    ? projsData
                    : projsData?.projects ?? projsData?.results ?? [];

                // ── Articles ──────────────────────────────────────────────
                const artsData =
                    artsRes.status === 'fulfilled' ? artsRes.value : null;
                console.log('artsData:', artsData); // 👈 debug

                const articleCount =
                    artsData?.count ??
                    (Array.isArray(artsData)
                        ? artsData.length
                        : artsData?.results?.length ?? 0);

                // ── Keywords — derived from projects ──────────────────────
                const keywordCount = projectsList.reduce(
                    (acc, p) => acc + (p.keyword_count ?? p.keywords?.length ?? 0),
                    0
                );

                // ── Audits — projects that have been analyzed ─────────────
                const auditCount = projectsList.filter(
                    (p) => p.last_analyzed_at != null
                ).length;

                // Remove avgScore and systemHealth
                setTrends({
                    projects: null,
                    articles: null,
                    keywords: null,
                    audits: null,
                });
                setProjects(projectsList.slice(0, 5));
                setStats({
                    projects: projsData?.count ?? projectsList.length,
                    articles: articleCount,
                    keywords: keywordCount,
                    audits: auditCount,
                });
            } catch (err) {
                console.error('Dashboard fetch failed:', err);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const todayDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date());

    const statCards = [
        { key: 'projects', icon: 'folder', label: 'Projects', navigateTo: '/profile' },
        { key: 'articles', icon: 'article', label: 'Articles', navigateTo: '/articles' },
        { key: 'keywords', icon: 'key', label: 'Keywords', navigateTo: '/keywords' },
        { key: 'audits', icon: 'search_check', label: 'Audits', navigateTo: '/audit' },
    ];

    return (
        <div className="p-10 max-w-7xl mx-auto w-full space-y-10">

            {/* ── Header ───────────────────────────────────────────────── */}
            <section>
                <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
                    {getGreeting()} 
                </h2>
                <p className="text-outline font-medium mt-1">Today is {todayDate}</p>
            </section>

            {/* ── Error banner ─────────────────────────────────────────── */}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                    <button
                        className="ml-auto underline hover:no-underline"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* ── Stats Grid ───────────────────────────────────────────── */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map(({ key, icon, label, navigateTo }) => (
                    <StatCard
                        key={key}
                        icon={icon}
                        label={label}
                        value={stats[key]}
                        trend={trends[key]}
                        loading={loading}
                        onClick={() => navigate(navigateTo)}
                    />
                ))}
            </section>

            {/* ── Dual Columns ─────────────────────────────────────────── */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Recent Projects */}
                <div className="lg:col-span-2 bg-surface-container-lowest ghost-border rounded-[14px] overflow-hidden flex flex-col">
                    <div className="p-6 pb-2">
                        <h3 className="text-lg font-bold text-on-surface">Recent Projects</h3>
                        <p className="text-sm text-outline">Manage your top performing domains</p>
                    </div>

                    <div className="flex-1 px-4 pb-6">
                        {loading ? (
                            <div className="space-y-3 p-2">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                                ))}
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="p-6 text-center text-outline">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
                                    folder_open
                                </span>
                                <p>No active projects yet. Create one to get started.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {projects.map((proj, idx) => (
                                    <ProjectRow
                                        key={proj.id ?? idx}
                                        proj={proj}
                                        onClick={() => navigate('/profile')}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions + System Health */}
                <div className="bg-surface-container-lowest ghost-border rounded-[14px] p-6 flex flex-col gap-6">
                    <div>
                        <h3 className="text-lg font-bold text-on-surface">Quick Actions</h3>
                        <p className="text-sm text-outline">Launch a specialised SEO task</p>
                    </div>

                    <div className="space-y-3">
                        {[
                            { route: '/audit', icon: 'search_check', label: 'Run SEO Audit' },
                            { route: '/keywords', icon: 'key', label: 'Research Keywords' },
                            { route: '/articles', icon: 'edit_note', label: 'Generate Article' },
                            { route: '/profile', icon: 'analytics', label: 'Project history' },
                        ].map(({ route, icon, label }) => (
                            <button
                                key={route}
                                onClick={() => navigate(route)}
                                className="w-full flex items-center gap-4 p-4 rounded-xl ghost-border bg-surface hover:border-primary transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">{icon}</span>
                                </div>
                                <span className="font-bold text-on-surface">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}