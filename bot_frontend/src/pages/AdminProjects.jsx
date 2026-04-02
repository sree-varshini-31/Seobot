import React, { useEffect, useState } from 'react';
import { adminGetAllProjects, getSeoReport } from '../api/client';
import { downloadPDF } from '../utils/pdf';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getHostname(rawUrl) {
    try { return new URL(rawUrl).hostname; }
    catch { return (rawUrl || 'report').replace(/[^a-z0-9]/gi, '_'); }
}

const scoreColor = (score) => {
    if (score === null || score === undefined) return 'text-outline';
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
};

// ── Hidden audit renderer for PDF (similar to AdminUsers) ───────────────────
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
    const pColor = score >= 80 ? '#34A853' : score >= 50 ? '#FBBC04' : '#EA4335';
    return (
        <div id={id} style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '900px', background: '#fff', padding: '40px', fontFamily: 'Inter, system-ui, sans-serif', color: '#1f1f1f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>SEO Audit Report</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{data.url}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Generated {new Date().toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'center', background: '#f8f9fa', borderRadius: 16, padding: '16px 28px' }}>
                    <div style={{ fontSize: 40, fontWeight: 900, color: pColor }}>{score}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>SEO Score</div>
                </div>
            </div>
            {Array.isArray(data.issues) && data.issues.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 12 }}>Issues Found</div>
                    {data.issues.slice(0, 6).map((issue, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, fontSize: 13, color: '#c5221f', fontWeight: 600 }}>
                            <span>⚠</span> <span>{typeof issue === 'object' ? (issue.text || issue.message || JSON.stringify(issue)) : issue}</span>
                        </div>
                    ))}
                </div>
            )}
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
        </div>
    );
}

export default function AdminProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [msg, setMsg] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // PDF state
    const [pdfProject, setPdfProject] = useState(null);
    const [pdfData, setPdfData] = useState(null);
    const [pdfLoadingId, setPdfLoadingId] = useState(null);

    useEffect(() => {
        fetchProjects(page);
    }, [page]);

    async function fetchProjects(pageUrl) {
        setLoading(true);
        setError(null);
        try {
            const data = await adminGetAllProjects(pageUrl, 20);
            setProjects(data.projects || []);
            setTotalPages(data.total_pages || 1);
            setTotalCount(data.count || 0);
        } catch {
            setError('Failed to load projects table.');
        } finally {
            setLoading(false);
        }
    }

    async function handleDownloadPdf(project) {
        if (!project?.latest_score) {
            setMsg(`No audit data available for ${project?.url || project?.name}.`);
            return;
        }

        setPdfLoadingId(project.id);
        setMsg(null);

        try {
            const data = await getSeoReport(project.url, project.id);
            setPdfProject(project);
            setPdfData(data);

            requestAnimationFrame(() => {
                requestAnimationFrame(async () => {
                    try {
                        const containerId = `pdf-hidden-${project.id}`;
                        await downloadPDF(containerId, `SEO_Report_${getHostname(project.url || project.name)}.pdf`);
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

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8 pb-24">
            {/* Hidden audit report */}
            {pdfProject && pdfData && (
                <HiddenAuditReport data={pdfData} id={`pdf-hidden-${pdfProject.id}`} />
            )}

            {/* Top toolbar */}
            <div className="sticky top-0 z-20 bg-surface-container shadow-sm border-b border-outline-variant/20 px-4 py-3">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-on-surface">ALL PROJECTS</h2>
                        <div className="text-xs text-outline">Total {totalCount} projects platform-wide</div>
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

            <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-outline-variant/20">
                    <h2 className="text-sm font-extrabold text-on-surface mb-0">Platform Projects</h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <span className="material-symbols-outlined text-outline text-[28px] animate-spin">progress_activity</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="min-w-full text-left text-sm border-collapse">
                            <thead className="bg-surface-container-lowest">
                                <tr className="border-b border-outline-variant/20">
                                    <th className="px-4 py-3 font-semibold text-xs text-outline uppercase tracking-wide whitespace-nowrap">ID</th>
                                    <th className="px-4 py-3 font-semibold text-xs text-outline uppercase tracking-wide whitespace-nowrap">Project URL</th>
                                    <th className="px-4 py-3 font-semibold text-xs text-outline uppercase tracking-wide whitespace-nowrap">Owner</th>
                                    <th className="px-4 py-3 font-semibold text-xs text-outline uppercase tracking-wide whitespace-nowrap">Last Analyzed</th>
                                    <th className="px-4 py-3 font-semibold text-xs text-outline uppercase tracking-wide whitespace-nowrap">SEO Score</th>
                                    <th className="px-4 py-3 font-semibold text-xs text-outline uppercase tracking-wide whitespace-nowrap">PDF</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-xs text-outline">No projects found</td>
                                    </tr>
                                ) : (
                                    projects.map((p) => (
                                        <tr key={p.id} className="border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors">
                                            <td className="px-4 py-3 text-xs text-outline">{p.id}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-on-surface text-sm max-w-sm truncate" title={p.url || p.name}>
                                                    {p.url || p.name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-semibold text-primary">{p.owner}</div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-outline">
                                                {p.last_analyzed_at ? p.last_analyzed_at.replace('T', ' ').substring(0, 16) : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-sm font-extrabold ${scoreColor(p.latest_score)}`}>
                                                    {p.latest_score ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    disabled={pdfLoadingId === p.id}
                                                    onClick={() => handleDownloadPdf(p)}
                                                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg btn-primary disabled:opacity-50"
                                                    title={!p.latest_score ? 'No audit data yet' : 'Download PDF'}
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-outline-variant/20 flex justify-between items-center">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="px-3 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low disabled:opacity-50 text-xs font-semibold"
                        >
                            Previous
                        </button>
                        <span className="text-xs text-outline font-semibold">Page {page} of {totalPages}</span>
                        <button 
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className="px-3 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low disabled:opacity-50 text-xs font-semibold"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
