import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminGetUsers, adminUpdateUser, adminDeleteUser, getSeoReport } from '../api/client';
import { apiClient } from '../api/client';
import { downloadPDF } from '../utils/pdf';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getHostname(rawUrl) {
    try { return new URL(rawUrl).hostname; }
    catch { return (rawUrl || 'report').replace(/[^a-z0-9]/gi, '_'); }
}

// ── Mini audit renderer (hidden, used only for PDF capture) ──────────────────

function HiddenAuditReport({ data, id }) {
    if (!data) return null;

    const techChecks = (() => {
        const tech = data.technical_seo;
        return [
            { label: 'HTTPS',        ok: tech?.ssl?.https === true },
            { label: 'Favicon',      ok: tech?.favicon?.exists === true },
            { label: 'Sitemap',      ok: tech?.sitemap?.exists === true },
            { label: 'Hreflang',     ok: tech?.hreflang?.exists === true },
            { label: 'Canonical',    ok: tech?.canonical?.exists === true },
            { label: 'Open Graph',   ok: tech?.open_graph?.exists === true },
            { label: 'Robots.txt',   ok: tech?.robots_txt?.exists === true && tech?.robots_txt?.blocks_all_crawlers !== true },
            { label: 'Meta Robots',  ok: tech?.meta_robots?.is_noindex !== true },
            { label: 'Twitter Card', ok: tech?.twitter_card?.exists === true },
            { label: 'Schema',       ok: tech?.schema_markup?.exists === true },
            { label: 'Viewport',     ok: tech?.viewport_meta?.exists === true },
        ];
    })();

    const score = data.seo_score ?? 0;
    const scoreColor = score >= 80 ? '#34A853' : score >= 50 ? '#FBBC04' : '#EA4335';

    return (
        <div
            id={id}
            style={{
                position: 'fixed', top: '-9999px', left: '-9999px',
                width: '900px', background: '#fff', padding: '40px',
                fontFamily: 'Inter, system-ui, sans-serif', color: '#1f1f1f',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>SEO Audit Report</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{data.url}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Generated {new Date().toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'center', background: '#f8f9fa', borderRadius: 16, padding: '16px 28px' }}>
                    <div style={{ fontSize: 40, fontWeight: 900, color: scoreColor }}>{score}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>SEO Score</div>
                </div>
            </div>

            {/* Issues */}
            {Array.isArray(data.issues) && data.issues.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 12 }}>Issues Found</div>
                    {data.issues.slice(0, 6).map((issue, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, fontSize: 13, color: '#c5221f', fontWeight: 600 }}>
                            <span>⚠</span>
                            <span>{typeof issue === 'object' ? (issue.text || issue.message || JSON.stringify(issue)) : issue}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Technical SEO */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 12 }}>Technical SEO</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {techChecks.map(({ label, ok }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: ok ? '#e6f4ea' : '#fef7e0', border: `1px solid ${ok ? '#ceead6' : '#fdd663'}` }}>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>{label}</span>
                            <span style={{ fontSize: 11, fontWeight: 800, color: ok ? '#137333' : '#b06000' }}>{ok ? '✓ Passed' : '⚠ Needs work'}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Core Web Vitals */}
            {data.pagespeed?.core_web_vitals && (
                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 12 }}>Core Web Vitals</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                        {[
                            { label: 'LCP', value: data.pagespeed.core_web_vitals.lcp },
                            { label: 'TBT', value: data.pagespeed.core_web_vitals.total_blocking_time },
                            { label: 'CLS', value: data.pagespeed.core_web_vitals.cls },
                            { label: 'Speed Index', value: data.pagespeed.core_web_vitals.speed_index },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ background: '#f8f9fa', borderRadius: 10, padding: '12px 14px' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{value ?? 'N/A'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Content Suggestions */}
            {data.content_suggestions && (
                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 12 }}>AI Content Suggestions</div>
                    {[
                        { label: 'Title', value: data.content_suggestions.title },
                        { label: 'Meta Description', value: data.content_suggestions.meta_description },
                        { label: 'Blog Intro', value: data.content_suggestions.blog },
                    ].map(({ label, value }) => value && (
                        <div key={label} style={{ marginBottom: 12, padding: '12px 16px', background: '#f8f9fa', borderRadius: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6 }}>
                                {typeof value === 'object' ? JSON.stringify(value) : value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* SERP Snapshot */}
            {data.serp_snapshot?.organic_results?.length > 0 && (
                <div>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 12 }}>
                        Live SERP — {data.serp_snapshot.primary_query}
                    </div>
                    {data.serp_snapshot.organic_results.slice(0, 5).map((row, i) => (
                        <div key={i} style={{ borderBottom: '1px solid #eee', paddingBottom: 10, marginBottom: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#174ea6' }}>#{row.position}</div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{row.title}</div>
                            <div style={{ fontSize: 11, color: '#888' }}>{row.url}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main Admin component ──────────────────────────────────────────────────────

export default function AdminUsers() {
    const location = useLocation();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(location.state?.filter || 'all');
    const [actionLoading, setActionLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [showDeactivateModal, setShowDeactivateModal] = useState(null);
    const [sortOrder, setSortOrder] = useState('newest');

    // PDF state
    const [pdfProject, setPdfProject] = useState(null);   // project being rendered
    const [pdfData, setPdfData] = useState(null);          // fetched audit data
    const [pdfLoadingId, setPdfLoadingId] = useState(null); // which button is spinning

    useEffect(() => { fetchAll(); }, []);

    async function fetchAll() {
        setLoading(true);
        setError(null);
        try {
            const [usersRes, statsRes] = await Promise.allSettled([
                adminGetUsers(),
                apiClient('/auth/admin/stats/'),
            ]);
            const ud = usersRes.status === 'fulfilled' ? usersRes.value : null;
            const sd = statsRes.status === 'fulfilled' ? statsRes.value : null;
            setUsers(ud?.users || ud?.results || (Array.isArray(ud) ? ud : []));
            setStats(sd?.stats || null);
        } catch {
            setError('Failed to load admin data. Make sure you are an admin.');
        } finally {
            setLoading(false);
        }
    }

    async function executeDeactivation(user, reason) {
        setActionLoading(true);
        try {
            await adminUpdateUser(user.id, { is_active: false, deactivation_reason: reason });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: false, deactivation_reason: reason } : u));
            setSelected(prev => prev?.id === user.id ? { ...prev, is_active: false, deactivation_reason: reason } : prev);
            setMsg(`User ${user.username} deactivated.`);
            setShowDeactivateModal(null);
        } catch {
            setMsg('Failed to deactivate user.');
        } finally {
            setActionLoading(false);
        }
    }

    async function handleToggleActive(user) {
        if (user.is_active) { setShowDeactivateModal(user); return; }
        setActionLoading(true);
        try {
            await adminUpdateUser(user.id, { is_active: true });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: true, deactivation_reason: null } : u));
            setSelected(prev => prev?.id === user.id ? { ...prev, is_active: true, deactivation_reason: null } : prev);
            setMsg(`User ${user.username} activated.`);
        } catch {
            setMsg('Failed to update user.');
        } finally {
            setActionLoading(false);
        }
    }

    // ── PDF: fetch cached report then download without navigating ──────────────
    async function handleDownloadPdf(project) {
        if (!project?.last_score) {
            setMsg(`No audit data available for ${project?.url || project?.name}. Ask the user to run an audit first.`);
            return;
        }

        setPdfLoadingId(project.id);
        setMsg(null);

        try {
            const data = await getSeoReport(project.url, project.id);
            setPdfProject(project);
            setPdfData(data);

            // Wait for React to render the hidden div, then capture
            requestAnimationFrame(() => {
                requestAnimationFrame(async () => {
                    try {
                        const containerId = `pdf-hidden-${project.id}`;
                        await downloadPDF(
                            containerId,
                            `SEO_Report_${getHostname(project.url || project.name)}.pdf`
                        );
                    } catch (err) {
                        console.error('PDF generation failed:', err);
                        setMsg('Failed to generate PDF. Please try again.');
                    } finally {
                        setPdfProject(null);
                        setPdfData(null);
                        setPdfLoadingId(null);
                    }
                });
            });
        } catch (err) {
            console.error('Failed to fetch cached report:', err);
            setMsg(`Could not load audit data for ${project?.url || project?.name}.`);
            setPdfLoadingId(null);
        }
    }

    const scoreColor = (score) => {
        if (score === null || score === undefined) return 'text-outline';
        if (score >= 80) return 'text-green-600';
        if (score >= 50) return 'text-orange-500';
        return 'text-red-500';
    };

    const filtered = users.filter(u => {
        if (u.is_deleted) return false;
        const matchesSearch = u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        if (statusFilter === 'active') return u.is_active;
        if (statusFilter === 'inactive') return !u.is_active;
        if (statusFilter === 'admin') return u.is_staff || u.is_superuser;
        return true;
    });

    const sorted = [...filtered].sort((a, b) => {
        if (sortOrder === 'oldest') return new Date(a.date_joined) - new Date(b.date_joined);
        if (sortOrder === 'username-asc') return (a.username || '').localeCompare(b.username || '');
        if (sortOrder === 'username-desc') return (b.username || '').localeCompare(a.username || '');
        return new Date(b.date_joined) - new Date(a.date_joined);
    });

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8 pb-24">

            {/* Hidden audit report div — rendered off-screen for PDF capture */}
            {pdfProject && pdfData && (
                <HiddenAuditReport
                    data={pdfData}
                    id={`pdf-hidden-${pdfProject.id}`}
                />
            )}

            {/* Top toolbar */}
            <div className="sticky top-0 z-20 bg-surface-container shadow-sm border-b border-outline-variant/20 px-4 py-3">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-on-surface">MEMBERS LIST</h2>
                        <div className="text-xs text-outline">{filtered.length} of {users.length} members</div>
                    </div>
                    <div />
                </div>
                <div className="mt-3 flex flex-col md:flex-row items-center gap-3">
                    <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2.5 w-full md:max-w-md">
                        <span className="material-symbols-outlined text-outline text-[16px]">search</span>
                        <input
                            type="search"
                            placeholder="Search by name or email…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none placeholder:text-outline/60"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2.5 text-xs outline-none"
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="admin">Admins</option>
                        </select>
                        <select
                            value={sortOrder}
                            onChange={e => setSortOrder(e.target.value)}
                            className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2.5 text-xs outline-none"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="username-asc">Username A–Z</option>
                            <option value="username-desc">Username Z–A</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Message / Error */}
            {msg && (
                <div className="p-3 bg-secondary-fixed/30 border border-secondary/20 rounded-xl text-sm font-semibold text-on-surface flex items-center justify-between">
                    {msg}
                    <button onClick={() => setMsg(null)} className="text-outline hover:text-on-surface ml-4">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>
            )}
            {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-sm font-semibold text-error">{error}</div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Table */}
                <div className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-outline-variant/20">
                        <h2 className="text-sm font-extrabold text-on-surface mb-0">All Users</h2>
                        <p className="text-xs text-outline">Click a row to view user details</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <span className="material-symbols-outlined text-outline text-[28px] animate-spin">progress_activity</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="min-w-full text-left text-sm border-collapse">
                                <thead className="bg-surface-container-lowest sticky top-0 z-10">
                                    <tr className="border-b border-outline-variant/20">
                                        <th className="px-4 py-3 font-semibold text-xs text-outline uppercase tracking-wide whitespace-nowrap">#</th>
                                        <th className="px-4 py-3 font-semibold text-xs text-outline uppercase tracking-wide whitespace-nowrap">Username</th>
                                        <th className="px-4 py-3 font-semibold text-xs text-outline uppercase tracking-wide whitespace-nowrap">Status</th>
                                        <th className="px-4 py-3 font-semibold text-xs text-outline uppercase tracking-wide whitespace-nowrap">Reg Date</th>
                                        <th className="px-4 py-3 font-semibold text-xs text-outline uppercase tracking-wide whitespace-nowrap">Project</th>
                                        <th className="px-4 py-3 font-semibold text-xs text-outline uppercase tracking-wide whitespace-nowrap">SEO Score</th>
                                        <th className="px-4 py-3 font-semibold text-xs text-outline uppercase tracking-wide whitespace-nowrap">PDF</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-10 text-center text-xs text-outline">No users found</td>
                                        </tr>
                                    ) : (
                                        sorted.map((u, idx) => {
                                            const projects = u.projects?.length ? u.projects : null;
                                            const isSelected = selected?.id === u.id;
                                            const rowBg = isSelected ? 'bg-primary/5' : '';

                                            if (!projects) {
                                                return (
                                                    <tr
                                                        key={u.id}
                                                        onClick={() => setSelected(u)}
                                                        className={`cursor-pointer border-b border-outline-variant/10 transition-colors ${rowBg} hover:bg-surface-container-low`}
                                                    >
                                                        <td className="px-4 py-3 text-xs text-outline">{idx + 1}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-on-surface text-sm">{u.username}</div>
                                                            <div className="text-xs text-outline">{u.email || '—'}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${u.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                                                {u.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-outline whitespace-nowrap">{u.date_joined || '—'}</td>
                                                        <td className="px-4 py-3 text-xs text-outline">No projects</td>
                                                        <td className="px-4 py-3 text-xs text-outline">—</td>
                                                        <td className="px-4 py-3 text-xs text-outline">—</td>
                                                    </tr>
                                                );
                                            }

                                            return projects.map((p, pIdx) => (
                                                <tr
                                                    key={`${u.id}-${p.id ?? pIdx}`}
                                                    onClick={() => setSelected(u)}
                                                    className={`cursor-pointer transition-colors ${rowBg} hover:bg-surface-container-low ${pIdx === projects.length - 1 ? 'border-b border-outline-variant/10' : 'border-b border-outline-variant/5'}`}
                                                >
                                                    {pIdx === 0 && (
                                                        <>
                                                            <td className="px-4 py-3 text-xs text-outline align-top" rowSpan={projects.length}>{idx + 1}</td>
                                                            <td className="px-4 py-3 align-top" rowSpan={projects.length}>
                                                                <div className="font-semibold text-on-surface text-sm">{u.username}</div>
                                                                <div className="text-xs text-outline">{u.email || '—'}</div>
                                                            </td>
                                                            <td className="px-4 py-3 align-top" rowSpan={projects.length}>
                                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${u.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                                                    {u.is_active ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-xs text-outline whitespace-nowrap align-top" rowSpan={projects.length}>
                                                                {u.date_joined || '—'}
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs text-on-surface truncate block max-w-[200px]" title={p.url || p.name}>
                                                            {p.url || p.name || '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-sm font-extrabold ${scoreColor(p.last_score)}`}>
                                                            {p.last_score ?? '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            disabled={pdfLoadingId === p.id}
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDownloadPdf(p);
                                                            }}
                                                            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg btn-primary whitespace-nowrap disabled:opacity-50"
                                                            title={!p.last_score ? 'No audit data yet' : 'Download PDF'}
                                                        >
                                                            {pdfLoadingId === p.id ? (
                                                                <span className="material-symbols-outlined text-[13px] animate-spin">progress_activity</span>
                                                            ) : (
                                                                <span className="material-symbols-outlined text-[13px]">picture_as_pdf</span>
                                                            )}
                                                            {pdfLoadingId === p.id ? '...' : 'PDF'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ));
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* User detail panel */}
                {selected && (
                    <div className="w-full lg:w-72 shrink-0 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm self-start">
                        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
                            <h2 className="text-sm font-extrabold text-on-surface">User Detail</h2>
                            <button onClick={() => setSelected(null)} className="text-outline hover:text-on-surface">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="flex flex-col items-center text-center mb-5">
                                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-extrabold text-2xl mb-2">
                                    {selected.username?.[0]?.toUpperCase()}
                                </div>
                                <p className="text-sm font-bold text-on-surface">{selected.username}</p>
                                <p className="text-xs text-outline break-all">{selected.email || '—'}</p>
                            </div>

                            <div className="space-y-2 mb-5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-outline">Joined</span>
                                    <span className="font-bold">{selected.date_joined || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-outline">Websites</span>
                                    <span className="font-bold">{selected.project_count ?? selected.projects?.length ?? 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-outline">Status</span>
                                    <span className={`font-bold ${selected.is_active ? 'text-green-600' : 'text-red-500'}`}>
                                        {selected.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                {!selected.is_active && selected.deactivation_reason && (
                                    <div className="flex flex-col mt-2 p-2 bg-error/5 border border-error/10 rounded-lg">
                                        <span className="text-outline text-[10px] uppercase font-bold tracking-wider">Reason Disabled</span>
                                        <span className="font-bold text-error break-words">{selected.deactivation_reason}</span>
                                    </div>
                                )}
                                <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-2">
                                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-outline mb-2">Usage Stats</div>
                                    <div className="flex justify-between">
                                        <span className="text-outline">API Calls</span>
                                        <span className="font-bold">{selected.api_calls_used ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-outline">Sites Searched</span>
                                        <span className="font-bold">{selected.websites_searched ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-outline">Data Received</span>
                                        <span className="font-bold">
                                            {selected.data_received_bytes ? (selected.data_received_bytes / 1024).toFixed(1) + ' KB' : '0 KB'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selected.projects?.length > 0 && (
                                <div className="mb-5">
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-outline mb-2">Websites</p>
                                    <ul className="space-y-2">
                                        {selected.projects.map((p, i) => (
                                            <li key={p.id ?? i} className="bg-surface-container-low rounded-xl px-3 py-2.5 space-y-1.5">
                                                <p className="text-xs text-on-surface font-semibold truncate" title={p.url || p.name}>
                                                    {p.url || p.name || '—'}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-extrabold ${scoreColor(p.last_score)}`}>
                                                        Score: {p.last_score ?? '—'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        disabled={pdfLoadingId === p.id}
                                                        onClick={() => handleDownloadPdf(p)}
                                                        className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg btn-primary disabled:opacity-50"
                                                        title={!p.last_score ? 'No audit data yet' : 'Download PDF'}
                                                    >
                                                        {pdfLoadingId === p.id ? (
                                                            <span className="material-symbols-outlined text-[12px] animate-spin">progress_activity</span>
                                                        ) : (
                                                            <span className="material-symbols-outlined text-[12px]">picture_as_pdf</span>
                                                        )}
                                                        {pdfLoadingId === p.id ? '...' : 'PDF'}
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="space-y-2">
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => handleToggleActive(selected)}
                                    className="w-full text-xs font-bold py-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-low transition-colors disabled:opacity-60"
                                >
                                    {selected.is_active ? 'Deactivate User' : 'Activate User'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Deactivate modal */}
            {showDeactivateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
                        <h3 className="text-base font-extrabold text-on-surface mb-2">Deactivate User?</h3>
                        <p className="text-sm text-outline mb-6">
                            You are about to deactivate <strong>{showDeactivateModal.username}</strong>. They will see an automated message when they try to log in.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeactivateModal(null)}
                                className="flex-1 py-2.5 text-sm font-bold border border-outline-variant/40 rounded-xl hover:bg-surface-container-low transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => executeDeactivation(showDeactivateModal, "Your account has been deactivated by an administrator.")}
                                className="flex-1 py-2.5 text-sm font-bold bg-error text-white rounded-xl hover:bg-error/90 transition-colors disabled:opacity-60"
                            >
                                {actionLoading ? 'Saving…' : 'Deactivate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}