import React, { useEffect, useMemo, useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { apiClient, generateArticle, getArticles, getArticle } from '../api/client';
import { useProjects } from '../context/ProjectContext';

function formatApiError(e) {
    if (!e) return 'Something went wrong.';
    if (typeof e === 'string') return e;
    if (e.detail) return Array.isArray(e.detail) ? e.detail.map((d) => d || '').join(' ') : String(e.detail);
    if (e.error) return Array.isArray(e.error) ? e.error.join(' ') : String(e.error);
    return e.message || 'Request failed.';
}

function sanitizeArticleHtml(html) {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
        ADD_ATTR: ['target', 'rel'],
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'style'],
    });
}

function StatusBadge({ status }) {
    const s = (status || '').toLowerCase();
    const map = {
        published: { dot: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', label: 'Published' },
        draft: { dot: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', label: 'Draft' },
        generating: { dot: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Generating' },
        review: { dot: 'bg-purple-500', text: 'text-purple-600', bg: 'bg-purple-50', label: 'Review' },
        approved: { dot: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', label: 'Approved' },
        failed: { dot: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', label: 'Failed' },
    };
    const v = map[s] || map.draft;
    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${v.bg} ${v.text} rounded-full`}>
            <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
            <span className="text-[10px] font-bold uppercase tracking-tight">{v.label}</span>
        </div>
    );
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
}

export default function ArticlesReal() {
    const { selectedProjectId, projects, loading: projectsLoading } = useProjects();

    const [keyword, setKeyword] = useState('');
    const [templateType, setTemplateType] = useState('blog');
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState(null);

    const [loadingArticles, setLoadingArticles] = useState(true);
    const [articles, setArticles] = useState([]);
    const [artError, setArtError] = useState(null);
    const [preview, setPreview] = useState(null);
    const [showAllProjects, setShowAllProjects] = useState(false);

    // FIX 1: fetchArticles has no dependencies — stable reference, never re-created.
    // selectedProjectId and showAllProjects are passed as arguments instead,
    // preventing useCallback from producing a new function reference on every
    // project/toggle change, which was the root cause of the duplicate API call.
    const fetchArticles = useCallback(async (projectId, allProjects) => {
        setLoadingArticles(true);
        setArtError(null);
        try {
            const projectParam = allProjects ? undefined : projectId || undefined;
            const res = await getArticles(projectParam);
            const list = Array.isArray(res) ? res : res?.results ?? [];
            setArticles(Array.isArray(list) ? list : []);
        } catch (e) {
            setArtError(formatApiError(e));
            setArticles([]);
        } finally {
            setLoadingArticles(false);
        }
    }, []); // stable — no deps needed

    // FIX 2: Effect depends on the actual values that should trigger a re-fetch,
    // not on a function reference. This fires exactly once when projects finish
    // loading, and again only when selectedProjectId or showAllProjects truly change.
    useEffect(() => {
        if (projectsLoading) return;
        fetchArticles(selectedProjectId, showAllProjects);
    }, [selectedProjectId, showAllProjects, projectsLoading, fetchArticles]);

    // FIX 3: Removed the redundant client-side useMemo filter.
    // The backend already filters by project via the projectParam argument above,
    // so re-filtering the response here was duplicating logic unnecessarily.
    // We keep the articles list as-is from the API response.
    const displayedArticles = articles;

    const handleGenerate = async () => {
        if (!selectedProjectId) {
            setGenError('Select a site in the top bar first (or run an SEO audit to create one).');
            return;
        }
        if (!keyword.trim()) return;
        setGenerating(true);
        setGenError(null);
        setPreview(null);
        try {
            const res = await generateArticle({
                projectId: Number(selectedProjectId),
                keyword: keyword.trim(),
                template_type: templateType,
                youtube_url: '',
            });
            // Pass current values explicitly — no dependency on stale closure state
            await fetchArticles(selectedProjectId, showAllProjects);
            const aid = res?.article_id;
            if (aid) {
                try {
                    const full = await getArticle(aid);
                    setPreview(full);
                } catch {
                    setPreview(null);
                }
            }
            setKeyword('');
        } catch (e) {
            setGenError(formatApiError(e));
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this article?')) return;
        try {
            await apiClient(`/generator/articles/${id}/`, { method: 'DELETE' });
            setArticles((prev) => prev.filter((a) => a.id !== id));
            if (preview?.id === id) setPreview(null);
        } catch (e) {
            // FIX 4: Use artError state for delete errors instead of alert(),
            // keeping error presentation consistent across the component.
            setArtError(formatApiError(e));
        }
    };

    const openPreview = async (article) => {
        if (!article?.id) return;
        try {
            const full = await getArticle(article.id);
            setPreview(full);
        } catch {
            setPreview(article);
        }
    };

    const previewHtml = preview ? sanitizeArticleHtml(preview.content || '') : '';

    return (
        <div className="px-4 py-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full pb-24 overflow-y-auto">
            <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start">
                <div className="w-full xl:w-[420px] shrink-0 bg-surface-container-lowest border-[1.5px] border-outline-variant/40 rounded-[14px] p-5 sm:p-6">
                    <h3 className="text-base font-bold text-on-background mb-4">New article</h3>

                    {genError && (
                        <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-semibold mb-4">
                            {String(genError)}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Target keyword</label>
                            <input
                                type="text"
                                placeholder="e.g. seo strategy"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Template</label>
                            <select
                                value={templateType}
                                onChange={(e) => setTemplateType(e.target.value)}
                                className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                            >
                                {['blog', 'news', 'howto', 'listicle', 'comparison', 'youtube'].map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            disabled={generating || !selectedProjectId || !keyword.trim()}
                            onClick={handleGenerate}
                            className="w-full py-3.5 sm:py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[0.99] transition-transform flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
                        >
                            {generating ? (
                                <>
                                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                    Generating…
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        auto_awesome
                                    </span>
                                    Generate draft
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex-1 w-full bg-surface-container-lowest border-[1.5px] border-outline-variant/40 rounded-[14px] flex flex-col min-h-[360px] xl:h-[580px] xl:min-h-0 overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/50">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-primary text-xl shrink-0">visibility</span>
                            <span className="text-sm font-bold text-on-background truncate">Preview</span>
                        </div>
                        <div className="text-[10px] font-bold text-outline uppercase tracking-wider shrink-0">
                            +{preview ? 'Selected' : 'None'}
                        </div>
                    </div>

                    <div className="flex-1 p-4 sm:p-8 overflow-y-auto overflow-x-hidden">
                        {!preview && !generating ? (
                            <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-outline gap-4 text-center px-2">
                                <span className="material-symbols-outlined text-5xl opacity-30">edit_note</span>
                                <p className="text-sm">Generate a new article or open one from the list below.</p>
                            </div>
                        ) : preview ? (
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="space-y-3">
                                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface leading-tight break-words">
                                        {preview.title || ''}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-outline">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-base">person</span>
                                            <span>You</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-base">calendar_today</span>
                                            <span>{formatDate(preview.created_at)}</span>
                                        </div>
                                        {preview.primary_keyword && (
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                {preview.primary_keyword}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="article-preview max-w-none text-on-surface-variant leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1"
                                    dangerouslySetInnerHTML={{
                                        __html: previewHtml || '<p class="text-outline">No HTML body yet.</p>',
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-outline gap-4">
                                <span className="material-symbols-outlined text-5xl opacity-50 animate-spin">progress_activity</span>
                                <p className="text-sm">Generating…</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-surface-container-lowest border-[1.5px] border-outline-variant/40 rounded-[14px] overflow-hidden">
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-on-background flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">article</span>
                        Articles
                        {displayedArticles.length > 0 && (
                            <span className="ml-2 text-xs font-bold text-outline bg-surface-container px-2 py-0.5 rounded-full">
                                {displayedArticles.length}
                            </span>
                        )}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-on-surface-variant select-none">
                            <input
                                type="checkbox"
                                className="rounded border-outline-variant text-primary focus:ring-primary"
                                checked={showAllProjects}
                                onChange={(e) => setShowAllProjects(e.target.checked)}
                            />
                            All sites
                        </label>
                        <button
                            type="button"
                            onClick={() => fetchArticles(selectedProjectId, showAllProjects)}
                            className="px-4 py-2 text-sm font-semibold bg-primary-container/10 text-primary rounded-lg hover:bg-primary-container/20 transition-colors flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            Refresh
                        </button>
                    </div>
                </div>

                {artError && (
                    <div className="px-4 sm:px-8 py-4 text-sm text-error font-semibold">
                        {String(artError)}
                    </div>
                )}
                {!selectedProjectId && projects.length === 0 && !projectsLoading && (
                    <div className="px-4 py-6 text-sm text-on-surface-variant">Run an SEO audit first to add a site, then pick it above.</div>
                )}

                <div className="overflow-x-auto -mx-px">
                    <table className="w-full text-left min-w-[min(100%,720px)]">
                        <thead className="bg-surface-container-low/30 border-b border-outline-variant/30">
                            <tr>
                                {['Title', ...(showAllProjects ? ['Site'] : []), 'Keyword', 'Words', 'Status', 'Date', 'Actions'].map((h, i, arr) => {
                                    const last = i === arr.length - 1;
                                    const center = h === 'Words';
                                    return (
                                        <th
                                            key={h + i}
                                            className={`px-4 sm:px-6 py-3 sm:py-4 text-[10px] font-extrabold text-outline uppercase tracking-widest ${
                                                center ? 'text-center' : last ? 'text-right' : ''
                                            }`}
                                        >
                                            {h}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                            {loadingArticles ? (
                                <tr>
                                    <td colSpan={showAllProjects ? 7 : 6} className="px-8 py-10 text-center text-outline text-sm">
                                        Loading…
                                    </td>
                                </tr>
                            ) : displayedArticles.length === 0 ? (
                                <tr>
                                    <td colSpan={showAllProjects ? 7 : 6} className="px-8 py-12 text-center">
                                        <span className="material-symbols-outlined text-4xl opacity-30 text-outline">article</span>
                                        <p className="text-sm text-outline mt-2">No articles for this site yet.</p>
                                    </td>
                                </tr>
                            ) : (
                                displayedArticles.map((article) => (
                                    <tr key={article.id} className="hover:bg-surface-container-low/50 transition-colors group">
                                        <td className="px-4 sm:px-6 py-4 max-w-[220px]">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                                                    {article.title}
                                                </span>
                                                <span className="text-[11px] text-outline truncate">
                                                    {article.slug ? `/blog/${article.slug}` : ''}
                                                </span>
                                            </div>
                                        </td>
                                        {showAllProjects && (
                                            <td className="px-4 py-4 max-w-[140px]">
                                                <span className="text-xs font-semibold text-on-surface-variant line-clamp-2">
                                                    {article.project_name || '—'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-4 py-4">
                                            <span className="text-xs font-semibold px-2 py-1 bg-surface-container rounded text-on-surface-variant">
                                                {article.primary_keyword ||
                                                    (Array.isArray(article.keywords) ? article.keywords[0] : '—')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-sm font-medium">
                                                {article.word_count != null ? Number(article.word_count).toLocaleString() : '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <StatusBadge status={article.status} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-outline whitespace-nowrap">{formatDate(article.created_at)}</span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                                                <button
                                                    type="button"
                                                    className="p-2 hover:bg-white rounded-lg text-outline hover:text-primary shadow-sm border border-transparent hover:border-outline-variant/40 transition-all"
                                                    title="Preview"
                                                    onClick={() => openPreview(article)}
                                                >
                                                    <span className="material-symbols-outlined text-lg">visibility</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="p-2 hover:bg-white rounded-lg text-outline hover:text-error shadow-sm border border-transparent hover:border-outline-variant/40 transition-all"
                                                    title="Delete"
                                                    onClick={() => handleDelete(article.id)}
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}