import React, { useMemo, useState } from 'react';
import { generateInternalLinks } from '../api/client';
import { useProjects } from '../context/ProjectContext';

export default function InternalLinksReal() {
    const { selectedProjectId } = useProjects();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [response, setResponse] = useState(null);

    const suggestions = response?.suggestions || [];
    const flattened = useMemo(() => {
        const out = [];
        for (const group of suggestions || []) {
            const fromTitle = group?.source_title || group?.sourceTitle || 'Unknown';
            const links = group?.links_to || group?.linksTo || [];
            for (const link of links || []) {
                out.push({
                    sourceTitle: fromTitle,
                    targetTitle: link?.target_title || link?.targetTitle || 'Unknown',
                    anchorText: link?.anchor_text || link?.anchorText || '',
                    reason: link?.reason || '',
                });
            }
        }
        return out;
    }, [suggestions]);

    const totalLinks = flattened.length;
    const totalGroups = suggestions.length;

    const handleAnalyze = async () => {
        if (!selectedProjectId) {
            setError('Select a project first.');
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const res = await generateInternalLinks(selectedProjectId);
            setResponse(res);
        } catch (e) {
            setError(e?.detail || e?.message || 'Failed to generate internal links.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 space-y-8 bg-[#faf9fd] min-h-full">
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-[32px] font-extrabold text-on-surface tracking-tight leading-tight">
                        Internal Links
                    </h1>
                    <p className="text-on-surface-variant max-w-2xl text-[15px]">
                        Live AI suggestions for optimal internal linking between your project articles.
                    </p>
                </div>

                <div className="bg-surface-container-lowest border border-[#eeedf5] p-3 rounded-2xl flex items-center justify-between gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] xl:w-80">
                    <div className="pl-2">
                        <span className="text-[10px] font-extrabold uppercase text-outline tracking-widest block mb-0.5">
                            STATUS
                        </span>
                        <div className="flex items-center gap-1.5 object-contain">
                            <span className="text-sm font-bold text-on-surface">
                                {loading ? 'Analyzing…' : response ? 'Complete' : 'Ready'}
                            </span>
                            <span
                                className="material-symbols-outlined text-[14px] text-on-surface"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                check_circle
                            </span>
                        </div>
                    </div>

                    <button
                        className="bg-primary hover:bg-primary-container transition-colors text-white px-6 py-3 rounded-xl font-bold shadow-sm shadow-primary/20 whitespace-nowrap disabled:opacity-60"
                        onClick={handleAnalyze}
                        disabled={loading || !selectedProjectId}
                    >
                        Analyze Links
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-semibold">
                    {String(error)}
                </div>
            )}

            {response && (
                <div className="bg-surface-container-lowest border border-[#eeedf5] rounded-[24px] p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#fcfcff] border border-[#eeedf5] rounded-[18px] p-5">
                            <div className="text-[11px] font-extrabold uppercase tracking-widest text-outline">TOTAL LINKS</div>
                            <div className="text-[28px] font-extrabold text-on-surface leading-none mt-3">{totalLinks}</div>
                            <div className="text-[12px] font-bold text-on-surface-variant mt-2">
                                From {totalGroups} source groups
                            </div>
                        </div>
                        <div className="bg-[#fcfcff] border border-[#eeedf5] rounded-[18px] p-5">
                            <div className="text-[11px] font-extrabold uppercase tracking-widest text-outline">ORPHAN PAGES</div>
                            <div className="text-[28px] font-extrabold text-on-surface leading-none mt-3">N/A</div>
                        </div>
                        <div className="bg-[#fcfcff] border border-[#eeedf5] rounded-[18px] p-5">
                            <div className="text-[11px] font-extrabold uppercase tracking-widest text-outline">LINK DEPTH</div>
                            <div className="text-[28px] font-extrabold text-on-surface leading-none mt-3">N/A</div>
                        </div>
                    </div>

                    {flattened.length === 0 ? (
                        <div className="text-sm font-semibold text-outline/60">N/A</div>
                    ) : (
                        <div className="space-y-4">
                            {flattened.map((s, idx) => (
                                <div key={`${s.sourceTitle}-${idx}`} className="bg-[#fcfcff] border border-[#eeedf5] rounded-[18px] p-5">
                                    <div className="text-[12px] font-extrabold uppercase tracking-widest text-outline mb-3">
                                        {s.sourceTitle}
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="text-[16px] font-extrabold text-primary">{s.targetTitle}</div>
                                            {s.anchorText && (
                                                <div className="text-[12px] font-semibold text-on-surface-variant mt-2">
                                                    Anchor: <span className="text-primary font-extrabold">{s.anchorText}</span>
                                                </div>
                                            )}
                                            {s.reason && (
                                                <div className="text-[13px] font-semibold text-on-surface-variant mt-2 leading-relaxed">
                                                    {s.reason}
                                                </div>
                                            )}
                                        </div>
                                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                                            arrow_forward
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

