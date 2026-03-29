import React, { useState } from 'react';
import { checkKeywordDifficulty } from '../api/client';

function difficultyLabel(difficulty) {
    if (difficulty >= 60) return 'Hard';
    if (difficulty >= 30) return 'Med';
    return 'Easy';
}

function getDiffColorClass(difficulty) {
    if (difficulty < 30) return 'bg-green-500';
    if (difficulty < 60) return 'bg-yellow-500';
    return 'bg-red-500';
}

export default function KeywordsReal() {
    const [seedKeyword, setSeedKeyword] = useState('');
    const [researching, setResearching] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);

    const handleResearch = async () => {
        if (!seedKeyword.trim()) return;
        setResearching(true);
        setError(null);
        setResults([]);
        try {
            const res = await checkKeywordDifficulty([seedKeyword.trim()]);
            setResults(res?.results || []);
        } catch (e) {
            setError(e?.detail || e?.message || 'Research failed.');
        } finally {
            setResearching(false);
        }
    };

    return (
        <div className="p-10 space-y-10 overflow-y-auto">
            <div className="space-y-2">
                <h1 className="text-[28px] font-extrabold text-on-surface tracking-tight">
                    Keyword Research
                </h1>
                <p className="text-on-surface-variant max-w-2xl leading-relaxed text-[15px]">
                    Live keyword difficulty + competition powered by SerpAPI (and AI-enhanced heuristics).
                </p>
            </div>

            <div className="bg-surface-container-lowest border border-[#eeedf5] p-6 lg:p-8 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 group w-full">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/60 text-[20px] group-focus-within:text-primary transition-colors">
                            search
                        </span>
                        <input
                            type="text"
                            value={seedKeyword}
                            onChange={(e) => setSeedKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                            placeholder="Enter a seed keyword (e.g., sustainable coffee)"
                            className="w-full bg-surface-container-low border-none rounded-[14px] py-4 pl-12 pr-4 text-[15px] font-medium text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <button
                        onClick={handleResearch}
                        disabled={researching || !seedKeyword.trim()}
                        className="w-full md:w-auto px-8 py-4 bg-primary text-white font-bold rounded-[14px] shadow-sm shadow-primary/20 hover:bg-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:bg-primary"
                    >
                        {researching ? (
                            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                                auto_awesome
                            </span>
                        )}
                        Research
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-semibold">
                    {String(error)}
                </div>
            )}

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-on-surface tracking-tight">
                        Keyword Analysis Results
                    </h2>
                    {results.length > 0 ? (
                        <div className="text-sm font-bold text-on-surface-variant">{results.length} result(s)</div>
                    ) : null}
                </div>

                <div className="bg-surface-container-lowest border border-[#eeedf5] rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#fcfcff]">
                                <tr>
                                    <th className="px-8 py-5 text-[11px] font-extrabold text-outline uppercase tracking-widest border-b border-[#eeedf5]">
                                        Keyword
                                    </th>
                                    <th className="px-6 py-5 text-[11px] font-extrabold text-outline uppercase tracking-widest border-b border-[#eeedf5]">
                                        Difficulty
                                    </th>
                                    <th className="px-6 py-5 text-[11px] font-extrabold text-outline uppercase tracking-widest border-b border-[#eeedf5]">
                                        Competition
                                    </th>
                                    <th className="px-6 py-5 text-[11px] font-extrabold text-outline uppercase tracking-widest border-b border-[#eeedf5]">
                                        SERP Results
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eeedf5] bg-white">
                                {results.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-12 text-center text-outline text-sm font-semibold">
                                            Run a search to see results.
                                        </td>
                                    </tr>
                                ) : (
                                    results.map((row, i) => (
                                        <tr key={i} className="hover:bg-[#faf9fd] transition-colors group">
                                            <td className="px-8 py-5">
                                                <span className="text-[14px] font-bold text-on-surface group-hover:text-primary transition-colors cursor-pointer">
                                                    {row.keyword}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4 w-32">
                                                    <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${getDiffColorClass(row.difficulty)}`}
                                                            style={{ width: `${row.difficulty}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[13px] font-medium text-outline w-16 whitespace-nowrap">
                                                        {row.difficulty} ({difficultyLabel(row.difficulty)})
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[14px] font-bold text-primary">
                                                    {row.competition || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[14px] font-bold text-on-surface">
                                                    {row.serp_results_found ?? '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

