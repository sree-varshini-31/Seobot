import React, { useMemo, useState } from 'react';
import { auditWebsite } from '../api/client';

function ScoreRing({ score = 0 }) {
    const pct = Math.min(100, Math.max(0, score || 0));
    const r = 28;
    const circ = 2 * Math.PI * r;
    const color = pct >= 80 ? '#34A853' : pct >= 50 ? '#FBBC04' : '#EA4335';
    const bg = '#e8eaed';

    return (
        <div className="flex items-center gap-4">
            <div className="relative w-[74px] h-[74px]">
                <svg width="74" height="74" viewBox="0 0 74 74">
                    <circle cx="37" cy="37" r={r} fill="none" stroke={bg} strokeWidth="7" />
                    <circle
                        cx="37"
                        cy="37"
                        r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth="7"
                        strokeDasharray={`${circ * (pct / 100)} ${circ}`}
                        strokeLinecap="round"
                        transform="rotate(-90 37 37)"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <div className="text-xl font-extrabold" style={{ color }}>{pct}</div>
                    <div className="text-[10px] font-bold text-outline/70">SEO</div>
                </div>
            </div>
        </div>
    );
}

function StatusRow({ label, status }) {
    const passed = status === true;
    const pillClass = passed
        ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
        : 'bg-[#fef7e0] text-[#b06000] border-[#fdd663]';
    const icon = passed ? 'check_circle' : 'warning';
    const labelText = passed ? 'Passed' : 'Needs attention';

    return (
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant/30 py-2.5">
            <span className="text-[12px] font-bold text-on-surface-variant capitalize">{label}</span>
            <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full border ${pillClass}`}
            >
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                </span>
                {labelText}
            </span>
        </div>
    );
}

function toTechCheckStatus(tech) {
    const sslOk = tech?.ssl?.https === true;
    const sitemapOk = tech?.sitemap?.exists === true;
    const robotsOk =
        tech?.robots_txt?.exists === true &&
        tech?.robots_txt?.blocks_all_crawlers !== true;
    const canonicalOk = tech?.canonical?.exists === true;
    const metaRobotsOk = tech?.meta_robots?.is_noindex !== true;
    const schemaOk = tech?.schema_markup?.exists === true;
    const openGraphOk = tech?.open_graph?.exists === true;
    const twitterOk = tech?.twitter_card?.exists === true;
    const faviconOk = tech?.favicon?.exists === true;
    const viewportOk = tech?.viewport_meta?.exists === true;
    const hreflangOk = tech?.hreflang?.exists === true;

    return [
        { label: 'https', status: sslOk },
        { label: 'favicon', status: faviconOk },
        { label: 'sitemap', status: sitemapOk },
        { label: 'hreflang', status: hreflangOk },
        { label: 'canonical', status: canonicalOk },
        { label: 'open graph', status: openGraphOk },
        { label: 'robots txt', status: robotsOk },
        { label: 'meta robots', status: metaRobotsOk },
        { label: 'twitter card', status: twitterOk },
        { label: 'schema markup', status: schemaOk },
        { label: 'viewport meta', status: viewportOk },
    ];
}

export default function Audit() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [lastAnalyzed, setLastAnalyzed] = useState(null);

    const techChecks = useMemo(() => toTechCheckStatus(result?.technical_seo), [result]);

    const health = useMemo(() => {
        const total = techChecks.length;
        const passed = techChecks.filter((t) => t.status === true).length;
        return { total, passed, needsWork: total - passed };
    }, [techChecks]);

    const handleAnalyze = async (e) => {
        e?.preventDefault?.();
        if (!url.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);
        setLastAnalyzed(null);

        try {
            // auditWebsite hits /audit/website/ — the correct endpoint
            const data = await auditWebsite(url);
            setResult(data);
            setLastAnalyzed(new Date().toLocaleString());
        } catch (err) {
            setError(err?.error || err?.detail || err?.message || 'Failed to analyze URL');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4 py-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
            <section className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="space-y-2 sm:space-y-3">
                    <h1 className="text-2xl sm:text-[32px] font-extrabold text-on-surface tracking-tight leading-tight">
                        SEO Audit
                    </h1>
                    <p className="text-on-surface-variant max-w-2xl leading-relaxed text-sm sm:text-base">
                        Real Google SERP data (SerpAPI), your live page crawl, and Groq content ideas based on that SERP context.
                    </p>
                </div>

                <form onSubmit={handleAnalyze} className="flex flex-col w-full lg:w-auto gap-3">
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="w-full lg:min-w-[320px] lg:max-w-[520px] px-4 py-3 bg-surface-container-low border-[1.5px] border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                        inputMode="url"
                        autoCapitalize="none"
                    />
                    <button
                        type="submit"
                        className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[0.99] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
                        disabled={loading || !url.trim()}
                    >
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>search_check</span>
                        )}
                        Run audit
                    </button>
                </form>
            </section>

            {error && (
                <div className="p-4 rounded-xl bg-[#fce8e6] border border-[#f28b82] text-[#c5221f] text-sm font-semibold">
                    {String(error)}
                </div>
            )}

            {result && lastAnalyzed && (
                <p className="text-xs sm:text-sm text-on-surface-variant">
                    Last analyzed: {lastAnalyzed}
                </p>
            )}

            {!loading && !result && (
                <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-[24px] p-6 sm:p-10">
                    <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-[28px] sm:text-[32px] opacity-40 shrink-0">search</span>
                        <div>
                            <div className="text-base font-bold text-on-surface">Enter a URL to analyze</div>
                            <div className="text-sm text-on-surface-variant mt-1">Uses live Google results and your page HTML — nothing simulated.</div>
                        </div>
                    </div>
                </section>
            )}

            {result && (
                <section className="space-y-6 sm:space-y-8">

                    {/* Missing / Weak elements */}
                    {Array.isArray(result.missing_on_page) && result.missing_on_page.length > 0 && (
                        <div className="bg-[#fef7e0] border border-[#fdd663] rounded-2xl p-5 sm:p-6">
                            <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#b06000] mb-3">Missing or weak on your page</div>
                            <ul className="space-y-2 text-sm font-semibold text-[#5f4b00]">
                                {result.missing_on_page.map((m, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="text-[#b06000] shrink-0">•</span>
                                        <span>{m}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Live SERP */}
                    {result.serp_snapshot?.organic_results?.length > 0 && (
                        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-[24px] p-5 sm:p-8 overflow-x-auto">
                            <div className="text-[11px] font-extrabold uppercase text-outline tracking-widest mb-4">Live Google SERP (SerpAPI)</div>
                            <p className="text-xs text-on-surface-variant mb-4">
                                Query: <span className="font-bold text-on-surface">{result.serp_snapshot.primary_query}</span>
                                {result.keyword_search_volume && result.serp_snapshot.primary_query && (
                                    <span className="ml-2">
                                        · Est. volume:{' '}
                                        {result.keyword_search_volume[result.serp_snapshot.primary_query] ?? '—'}
                                    </span>
                                )}
                            </p>
                            <div className="space-y-3 min-w-[520px] sm:min-w-0">
                                {result.serp_snapshot.organic_results.slice(0, 8).map((row, i) => (
                                    <div key={i} className="border-b border-outline-variant/30 pb-3 last:border-0">
                                        <div className="text-xs font-extrabold text-primary">#{row.position}</div>
                                        <div className="text-sm font-bold text-on-surface line-clamp-2">{row.title}</div>
                                        <div className="text-xs text-on-surface-variant truncate">{row.url}</div>
                                        {row.snippet && <div className="text-xs text-on-surface-variant mt-1 line-clamp-2">{row.snippet}</div>}
                                    </div>
                                ))}
                            </div>
                            {result.serp_snapshot.related_searches?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-outline-variant/30">
                                    <div className="text-xs font-bold text-outline mb-2">Related searches</div>
                                    <div className="flex flex-wrap gap-2">
                                        {result.serp_snapshot.related_searches.slice(0, 10).map((q, j) => (
                                            <span key={j} className="text-xs px-2 py-1 rounded-full bg-[#e8f0fe] text-[#174ea6] font-semibold">
                                                {q}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Score + Technical audit */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-[24px] p-8 shadow-sm">
                            <div className="flex items-center justify-between gap-4 mb-5">
                                <div>
                                    <div className="text-[11px] font-extrabold uppercase text-outline tracking-widest">SEO SCORE</div>
                                    <div className="text-[28px] font-extrabold text-on-surface mt-1">{result.seo_score ?? '—'}</div>
                                    <div className="text-sm text-on-surface-variant mt-1 break-all">{result.url || url}</div>
                                </div>
                                <ScoreRing score={result.seo_score} />
                            </div>

                            {/* Google rank */}
                            {result.your_google_rank !== undefined && (
                                <div className="mb-4 px-4 py-3 bg-[#e8f0fe] border border-[#c5d8fd] rounded-xl">
                                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#174ea6]">Your Google Rank</div>
                                    <div className="text-[18px] font-extrabold text-[#174ea6] mt-1">{result.your_google_rank}</div>
                                </div>
                            )}

                            <div className="mt-2">
                                <div className="text-[11px] font-extrabold uppercase text-outline tracking-widest mb-3">Issues Found</div>
                                {Array.isArray(result.issues) && result.issues.length > 0 ? (
                                    <div className="space-y-2">
                                        {result.issues.slice(0, 6).map((issue, i) => (
                                            <div key={i} className="flex items-start gap-2 text-[13px] font-semibold text-[#c5221f]">
                                                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                                                <span className="leading-relaxed">{issue}</span>
                                            </div>
                                        ))}
                                        {result.issues.length > 6 && (
                                            <div className="text-xs font-bold text-on-surface-variant">+{result.issues.length - 6} more</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm font-bold text-[#137333]">No issues found — looks good</div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-[24px] p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-4 gap-4">
                                    <div>
                                        <div className="text-[11px] font-extrabold uppercase text-outline tracking-widest">Technical SEO Audit</div>
                                        <div className="text-base font-extrabold text-on-surface mt-2">What to fix first</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="px-4 py-2 bg-[#fef7e0] border border-[#fdd663] rounded-xl">
                                            <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#b06000]">Needs attention</div>
                                            <div className="text-[18px] font-extrabold text-[#b06000] mt-1">{health.needsWork}</div>
                                        </div>
                                        <div className="px-4 py-2 bg-[#e6f4ea] border border-[#ceead6] rounded-xl">
                                            <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#137333]">Passed</div>
                                            <div className="text-[18px] font-extrabold text-[#137333] mt-1">{health.passed}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {techChecks.map((t) => (
                                        <StatusRow key={t.label} label={t.label} status={t.status} />
                                    ))}
                                </div>
                            </div>

                            {/* Core Web Vitals + Readability */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-surface-container-lowest border border-[#eeedf5] rounded-[24px] p-8">
                                    <div className="text-[11px] font-extrabold uppercase text-outline tracking-widest mb-4">Core Web Vitals</div>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'LCP', value: result.pagespeed?.core_web_vitals?.lcp },
                                            { label: 'TBT', value: result.pagespeed?.core_web_vitals?.total_blocking_time },
                                            { label: 'CLS', value: result.pagespeed?.core_web_vitals?.cls },
                                            { label: 'Speed Index', value: result.pagespeed?.core_web_vitals?.speed_index },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-on-surface-variant">{label}</span>
                                                <span className="text-sm font-bold text-on-surface">{value ?? 'N/A'}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-[#eeedf5]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-on-surface-variant">Mobile Friendly</span>
                                            <span className="text-sm font-bold text-on-surface">
                                                {result.pagespeed?.mobile_friendly === true
                                                    ? 'Yes'
                                                    : result.pagespeed?.mobile_friendly === false
                                                        ? 'No'
                                                        : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-surface-container-lowest border border-[#eeedf5] rounded-[24px] p-8">
                                    <div className="text-[11px] font-extrabold uppercase text-outline tracking-widest mb-4">Readability + Keyword Density</div>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm font-bold text-on-surface-variant mb-1">Readability</div>
                                            <div className="text-[22px] font-extrabold text-on-surface">{result.readability?.score ?? '—'}</div>
                                            <div className="text-sm font-bold text-on-surface-variant">{result.readability?.label || ''}</div>
                                            {result.readability?.recommendation && (
                                                <div className="text-xs text-on-surface-variant mt-1">{result.readability.recommendation}</div>
                                            )}
                                        </div>
                                        <div className="pt-4 border-t border-[#eeedf5]">
                                            <div className="text-sm font-bold text-on-surface-variant mb-1">Keyword Density</div>
                                            <div className="text-[22px] font-extrabold text-primary">{result.keyword_density?.density ?? '—'}</div>
                                            <div className="text-sm font-bold text-on-surface-variant">{result.keyword_density?.recommendation || ''}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Suggestions + Backlinks */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-surface-container-lowest border border-[#eeedf5] rounded-[24px] p-8">
                            <div className="text-[11px] font-extrabold uppercase text-outline tracking-widest mb-1">AI Content Suggestions</div>
                            <div className="text-base font-extrabold text-on-surface mt-2 mb-5">What to write next</div>
                            <div className="space-y-5">
                                <div>
                                    <div className="text-sm font-bold text-on-surface-variant mb-2">Title</div>
                                    <div className="text-[16px] font-extrabold text-on-surface">{result.content_suggestions?.title || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-on-surface-variant mb-2">Meta Description</div>
                                    <div className="text-[14px] font-semibold text-on-surface-variant leading-relaxed">{result.content_suggestions?.meta_description || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-on-surface-variant mb-2">Blog Hook</div>
                                    <div className="text-[14px] font-semibold text-on-surface-variant leading-relaxed">{result.content_suggestions?.blog || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface-container-lowest border border-[#eeedf5] rounded-[24px] p-8">
                            <div className="text-[11px] font-extrabold uppercase text-outline tracking-widest mb-4">Backlink Suggestions</div>
                            {Array.isArray(result.backlink_suggestions) && result.backlink_suggestions.length > 0 ? (
                                <div className="space-y-2">
                                    {result.backlink_suggestions.slice(0, 6).map((b, i) => (
                                        <div key={i} className="text-[13px] font-semibold text-on-surface-variant flex items-start gap-2">
                                            <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
                                            <span className="leading-relaxed">{b}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm font-bold text-on-surface-variant">N/A</div>
                            )}
                        </div>
                    </div>

                    {/* Keyword Opportunities */}
                    {Array.isArray(result.keyword_opportunities) && result.keyword_opportunities.length > 0 && (
                        <div className="bg-surface-container-lowest border border-[#eeedf5] rounded-[24px] p-8">
                            <div className="text-[11px] font-extrabold uppercase text-outline tracking-widest mb-1">Keyword Opportunities</div>
                            <div className="text-base font-extrabold text-on-surface mt-2 mb-6">Actionable next steps</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {result.keyword_opportunities.slice(0, 3).map((k, i) => (
                                    <div key={i} className="bg-[#fcfcff] border border-[#eeedf5] rounded-[18px] p-5">
                                        <div className="text-[11px] font-extrabold uppercase tracking-widest text-outline">{k.keyword || 'N/A'}</div>
                                        <div className="text-sm font-extrabold text-on-surface mt-2">
                                            Position: {k.your_position ?? 'N/A'}
                                        </div>
                                        <div className="mt-3">
                                            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Suggestion</div>
                                            <div className="text-[13px] font-semibold text-on-surface-variant leading-relaxed">{k.suggestion || 'N/A'}</div>
                                        </div>
                                        <div className="mt-3">
                                            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Action</div>
                                            <div className="text-[13px] font-semibold text-on-surface-variant leading-relaxed">{k.action || 'N/A'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}