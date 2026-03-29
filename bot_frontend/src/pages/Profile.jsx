import React, { useEffect, useState } from 'react';
import { getProfileInsights } from '../api/client';

function ScoreSparkline({ points }) {
    if (!points?.length) {
        return <p className="text-xs text-outline">Run audits on this URL to see progress over time.</p>;
    }
    const scores = points.map((p) => p.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const span = max - min || 1;
    const w = 280;
    const h = 72;
    const pad = 6;
    const path = points
        .map((p, i) => {
            const x = pad + (i / Math.max(points.length - 1, 1)) * (w - 2 * pad);
            const y = h - pad - ((p.score - min) / span) * (h - 2 * pad);
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
        })
        .join(' ');
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[280px] h-16" preserveAspectRatio="none">
            <path d={path} fill="none" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function Profile() {
    const [insights, setInsights] = useState(null);
    const [insightsErr, setInsightsErr] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getProfileInsights();
                if (!cancelled && data?.projects) setInsights(data.projects);
            } catch {
                if (!cancelled) setInsightsErr('Could not load project history.');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="px-4 py-6 sm:p-8 lg:p-10 max-w-4xl mx-auto w-full space-y-6 pb-24">
            <div>
                <h1 className="text-2xl sm:text-[28px] font-extrabold text-on-surface tracking-tight">Projects</h1>
                <p className="text-on-surface-variant mt-1 text-sm sm:text-base">
                    Sites you have audited and stored SEO scores over time.
                </p>
            </div>

            <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-[24px] p-5 sm:p-8 shadow-sm">
                {insightsErr && <p className="text-sm text-error">{insightsErr}</p>}
                {!insights && !insightsErr && <p className="text-sm text-outline">Loading…</p>}
                {insights?.length === 0 && (
                    <p className="text-sm text-on-surface-variant">No sites yet. Run an SEO audit to create a project.</p>
                )}
                <div className="space-y-6">
                    {insights?.map((p) => (
                        <div
                            key={p.id}
                            className="border border-outline-variant/30 rounded-2xl p-4 sm:p-5 bg-[#fafafa]"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="font-extrabold text-on-surface truncate">{p.name}</div>
                                    <div className="text-xs sm:text-sm text-primary break-all">{p.url}</div>
                                </div>
                                <div className="text-right text-xs text-on-surface-variant shrink-0">
                                    {p.latest_score != null && (
                                        <span className="font-extrabold text-[#137333] text-lg">{p.latest_score}</span>
                                    )}
                                    <div>latest score</div>
                                </div>
                            </div>
                            {p.last_analyzed_at && (
                                <p className="text-xs text-outline mt-2">
                                    Last audit: {new Date(p.last_analyzed_at).toLocaleString()}
                                </p>
                            )}
                            <div className="mt-4">
                                <div className="text-[10px] font-extrabold uppercase tracking-widest text-outline mb-1">
                                    Score trend (stored audits)
                                </div>
                                <ScoreSparkline points={p.audit_timeline} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
