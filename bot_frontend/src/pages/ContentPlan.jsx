import React, { useMemo, useState } from 'react';
import { generateContentPlan } from '../api/client';
import { useProjects } from '../context/ProjectContext';

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

export default function ContentPlan() {
    const { selectedProjectId } = useProjects();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [plan, setPlan] = useState(null);

    const monthCards = useMemo(() => {
        const monthlyTopics = plan?.monthly_topics || [];
        return MONTHS.map((name, idx) => {
            const monthNum = idx + 1;
            const item =
                Array.isArray(monthlyTopics) &&
                monthlyTopics.find((m) => Number(m?.month) === monthNum);
            return {
                name,
                theme: item?.theme || null,
                articles: Array.isArray(item?.articles) ? item.articles : [],
            };
        });
    }, [plan]);

    const handleGenerate = async () => {
        if (!selectedProjectId) {
            setError('Select a project first.');
            return;
        }
        setLoading(true);
        setError(null);
        setPlan(null);
        try {
            const res = await generateContentPlan(selectedProjectId);
            setPlan(res);
        } catch (e) {
            setError(e?.detail || e?.message || 'Failed to generate plan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 space-y-8 bg-[#faf9fd] min-h-full">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <h1 className="text-[32px] font-extrabold text-on-surface tracking-tight leading-tight">
                        Content Plan
                    </h1>
                    <p className="text-on-surface-variant max-w-2xl text-[15px] mt-2">
                        Real Groq-generated 12-month editorial calendar for your selected project.
                    </p>
                </div>

                <div className="bg-surface-container-lowest border border-[#eeedf5] p-3 rounded-2xl flex items-center justify-between gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] xl:w-[340px]">
                    <div className="pl-2">
                        <span className="text-[10px] font-extrabold uppercase text-outline tracking-widest block mb-0.5">
                            PLAN STATUS
                        </span>
                        <span className="text-[14px] font-bold text-on-surface">
                            {loading ? 'Generating…' : plan ? 'Ready' : 'Idle'}
                        </span>
                    </div>
                    <button
                        className="bg-primary hover:bg-primary-container transition-colors text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm shadow-primary/20 whitespace-nowrap disabled:opacity-60"
                        onClick={handleGenerate}
                        disabled={loading || !selectedProjectId}
                    >
                        <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            auto_awesome
                        </span>{' '}
                        Generate Plan
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-semibold">
                    {String(error)}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {monthCards.map((data) => (
                    <div
                        key={data.name}
                        className="bg-surface-container-lowest border border-[#eeedf5] rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] min-h-[280px] flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[18px] font-bold text-on-surface">{data.name}</h3>
                            <span className="px-3 py-1 bg-[#e0e6ff] text-[#2962ff] text-[10px] font-extrabold uppercase tracking-widest rounded-full">
                                {data.articles.length} ARTICLES
                            </span>
                        </div>

                        <div className="space-y-3 flex-1">
                            {data.theme && (
                                <div className="text-[12px] font-bold text-outline/80 leading-relaxed">
                                    Theme: {data.theme}
                                </div>
                            )}

                            {data.articles.length === 0 ? (
                                <div className="text-sm font-semibold text-outline/60 mt-6">N/A</div>
                            ) : (
                                data.articles.slice(0, 4).map((a, aIdx) => (
                                    <div
                                        key={`${data.name}-${aIdx}`}
                                        className="bg-[#fcfcff] border border-[#eeedf5] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex gap-3">
                                            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-primary" />
                                            <div>
                                                <h4 className="text-[14px] font-bold text-on-surface leading-snug">
                                                    {a.title || a.name || 'Untitled'}
                                                </h4>
                                                {a.keyword && (
                                                    <div className="text-[11px] text-outline mt-2">
                                                        Keyword: {a.keyword}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}