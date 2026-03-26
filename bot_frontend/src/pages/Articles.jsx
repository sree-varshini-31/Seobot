import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

function StatusBadge({ status }) {
    const map = {
        published: { dot: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', label: 'Published' },
        draft: { dot: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', label: 'Draft' },
        generating: { dot: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Generating' },
        failed: { dot: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', label: 'Failed' },
    };
    const s = map[status?.toLowerCase()] ?? map.draft;
    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${s.bg} ${s.text} rounded-full`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
            <span className="text-[10px] font-bold uppercase tracking-tight">{s.label}</span>
        </div>
    );
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
}

// ─── Main Component ───────────────────────────────────────────────────────────
const TONES = ['Professional', 'Witty', 'Academic', 'Direct'];

export default function Articles() {
    const [wordCount, setWordCount] = useState(1200);
    const [tone, setTone] = useState('Professional');
    const [title, setTitle] = useState('');
    const [keyword, setKeyword] = useState('');
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState(null);
    const [preview, setPreview] = useState(null);   // { title, content, word_count }

    const [articles, setArticles] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [artError, setArtError] = useState(null);

    const slug = slugify(title);

    // ── Fetch articles list ────────────────────────────────────────────────
    const fetchArticles = async () => {
        setLoadingArticles(true);
        setArtError(null);
        try {
            const res = await apiClient('/generator/articles/');
            const list = Array.isArray(res) ? res : res?.results ?? [];
            setArticles(list);
        } catch {
            setArtError('Failed to load articles.');
        } finally {
            setLoadingArticles(false);
        }
    };

    useEffect(() => { fetchArticles(); }, []);

    // ── Generate Draft ─────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!title || !keyword) return;
        setGenerating(true);
        setGenError(null);
        setPreview(null);
        try {
            const data = await apiClient('/generator/generate/', {
                method: 'POST',
                body: { title, keyword, tone, word_count: wordCount, slug },
            });
            setPreview(data);
            fetchArticles(); // refresh table
        } catch (err) {
            setGenError(err?.detail || err?.message || 'Generation failed. Try again.');
        } finally {
            setGenerating(false);
        }
    };

    // ── Delete article ─────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this article?')) return;
        try {
            await apiClient(`/generator/articles/${id}/`, { method: 'DELETE' });
            setArticles(prev => prev.filter(a => a.id !== id));
        } catch {
            alert('Delete failed.');
        }
    };

    const liveWordCount = preview?.word_count ?? preview?.content?.split(/\s+/).filter(Boolean).length ?? 0;

    return (
        <div className="p-10 space-y-10 overflow-y-auto">
            {/* Top Split: Form + Preview */}
            <div className="flex flex-col xl:flex-row gap-8 items-start">
                {/* LEFT: Form */}
                <div className="w-full xl:w-[400px] flex-shrink-0 bg-surface-container-lowest border-[1.5px] border-[#eeedf5] rounded-[14px] p-6">
                    <h3 className="text-base font-bold text-on-background mb-6">New Article</h3>
                    <div className="space-y-5">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Master SEO in 2024"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        {/* Keyword */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Target Keyword</label>
                            <input
                                type="text"
                                placeholder="seo strategy"
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                                className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        {/* URL Slug (auto-generated) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">URL Slug</label>
                            <div className="flex items-center px-4 py-3 bg-surface-container border-[1.5px] border-[#eeedf5] rounded-xl text-sm text-outline cursor-not-allowed overflow-hidden">
                                <span className="shrink-0">seobot.ai/blog/</span>
                                <span className="text-on-surface ml-1 truncate">{slug || '…'}</span>
                            </div>
                        </div>

                        {/* Tone */}
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tone</label>
                            <div className="flex flex-wrap gap-2">
                                {TONES.map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setTone(t)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${tone === t
                                                ? 'bg-primary text-on-primary shadow-sm'
                                                : 'bg-surface-container-low text-on-surface-variant border-[1.5px] border-[#eeedf5] hover:bg-[#eeedf5]'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Word Count */}
                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Word Count</label>
                                <span className="text-sm font-bold text-primary">{wordCount} words</span>
                            </div>
                            <input
                                type="range"
                                min="500" max="3000" step="100"
                                value={wordCount}
                                onChange={e => setWordCount(Number(e.target.value))}
                                className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        {/* Error */}
                        {genError && (
                            <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-semibold">
                                {genError}
                            </div>
                        )}

                        {/* Generate Button */}
                        <button
                            type="button"
                            disabled={generating || !title || !keyword}
                            onClick={handleGenerate}
                            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
                        >
                            {generating ? (
                                <>
                                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                    Generating…
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                    Generate Draft
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* RIGHT: Preview */}
                <div className="flex-1 bg-surface-container-lowest border-[1.5px] border-[#eeedf5] rounded-[14px] flex flex-col h-[580px] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#eeedf5] flex items-center justify-between bg-surface-container-low/50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">visibility</span>
                            <span className="text-sm font-bold text-on-background">Live Preview</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${generating ? 'bg-yellow-50 text-yellow-600' : preview ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                <span className="text-[10px] font-bold uppercase tracking-tight">
                                    {generating ? 'Generating' : preview ? 'Draft Ready' : 'Idle'}
                                </span>
                            </div>
                            <div className="text-[10px] font-bold text-outline uppercase tracking-wider">
                                Words: {liveWordCount} / {wordCount}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-10 overflow-y-auto">
                        {!preview && !generating ? (
                            <div className="h-full flex flex-col items-center justify-center text-outline gap-4">
                                <span className="material-symbols-outlined text-5xl opacity-30">edit_note</span>
                                <p className="text-sm">Fill in the form and click Generate Draft</p>
                            </div>
                        ) : generating ? (
                            <div className="h-full flex flex-col items-center justify-center text-outline gap-4">
                                <span className="material-symbols-outlined text-5xl opacity-50 animate-spin">progress_activity</span>
                                <p className="text-sm">Crafting your article…</p>
                            </div>
                        ) : (
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className="space-y-4">
                                    <h1 className="text-4xl font-extrabold tracking-tight text-on-surface leading-tight">
                                        {preview.title || title}
                                    </h1>
                                    <div className="flex items-center gap-4 text-sm text-outline">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-base">person</span>
                                            <span>AI Agent Alpha</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-base">calendar_today</span>
                                            <span>{formatDate(preview.created_at ?? new Date().toISOString())}</span>
                                        </div>
                                    </div>
                                </div>
                                {preview.image_url && (
                                    <div className="aspect-video rounded-2xl overflow-hidden bg-surface-container">
                                        <img src={preview.image_url} alt="Article Hero" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div
                                    className="space-y-6 text-on-surface-variant leading-relaxed prose max-w-none"
                                    dangerouslySetInnerHTML={{ __html: preview.content ?? preview.html ?? `<p>${preview.text ?? ''}</p>` }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Articles Table */}
            <div className="bg-surface-container-lowest border-[1.5px] border-[#eeedf5] rounded-[14px] overflow-hidden mt-8">
                <div className="px-8 py-6 border-b border-[#eeedf5] flex items-center justify-between">
                    <h3 className="text-base font-bold text-on-background">
                        Recent Content
                        {articles.length > 0 && (
                            <span className="ml-2 text-xs font-bold text-outline bg-surface-container px-2 py-0.5 rounded-full">
                                {articles.length}
                            </span>
                        )}
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const csv = ['Title,Keyword,Words,Status,Date']
                                    .concat(articles.map(a => `"${a.title}","${a.keyword}",${a.word_count ?? ''},${a.status},${formatDate(a.created_at)}`))
                                    .join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const href = URL.createObjectURL(blob);
                                Object.assign(document.createElement('a'), { href, download: 'articles.csv' }).click();
                            }}
                            className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={fetchArticles}
                            className="px-4 py-2 text-sm font-semibold bg-primary-container/10 text-primary rounded-lg hover:bg-primary-container/20 transition-colors flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            Refresh
                        </button>
                    </div>
                </div>

                {artError && (
                    <div className="px-8 py-4 text-sm text-error">{artError}</div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface-container-low/30 border-b border-[#eeedf5]">
                            <tr>
                                {['Title', 'Keyword', 'Words', 'Status', 'Date', 'Actions'].map((h, i) => (
                                    <th key={h} className={`px-6 py-4 text-[10px] font-extrabold text-outline uppercase tracking-widest ${i === 2 ? 'text-center' : i === 5 ? 'text-right' : ''}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eeedf5]/50">
                            {loadingArticles ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-10 text-center text-outline text-sm">
                                        Loading articles…
                                    </td>
                                </tr>
                            ) : articles.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center">
                                        <span className="material-symbols-outlined text-4xl opacity-30 text-outline">article</span>
                                        <p className="text-sm text-outline mt-2">No articles yet. Generate your first one above.</p>
                                    </td>
                                </tr>
                            ) : (
                                articles.map((article) => (
                                    <tr key={article.id} className="hover:bg-surface-container-low/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                                                    {article.title}
                                                </span>
                                                <span className="text-[11px] text-outline">{article.slug ? `/blog/${article.slug}` : ''}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-semibold px-2 py-1 bg-surface-container rounded text-on-surface-variant">
                                                {article.keyword ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-sm font-medium">
                                                {article.word_count ? article.word_count.toLocaleString() : '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <StatusBadge status={article.status} />
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-outline">{formatDate(article.created_at)}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 hover:bg-white rounded-lg text-outline hover:text-primary shadow-sm border border-transparent hover:border-[#eeedf5] transition-all">
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(article.id)}
                                                    className="p-2 hover:bg-white rounded-lg text-outline hover:text-error shadow-sm border border-transparent hover:border-[#eeedf5] transition-all"
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