import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export default function Keywords() {
    const [seedKeyword, setSeedKeyword] = useState('');
    const [researching, setResearching] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);

    // Mock initial data based on UI design
    const mockData = [
        { keyword: 'best dark roast coffee beans', volume: 12400, difficulty: 28, diffText: 'Easy', cpc: 2.45, intent: 'COMMERCIAL' },
        { keyword: 'how to brew espresso at home', volume: 45100, difficulty: 54, diffText: 'Med', cpc: 1.12, intent: 'INFORMATIONAL' },
        { keyword: 'buy espresso machine online', volume: 8200, difficulty: 82, diffText: 'Hard', cpc: 5.80, intent: 'TRANSACTIONAL' },
        { keyword: 'arabica vs robusta beans', volume: 22500, difficulty: 15, diffText: 'Easy', cpc: 0.85, intent: 'INFORMATIONAL' },
        { keyword: 'best budget espresso machines', volume: 15900, difficulty: 48, diffText: 'Med', cpc: 3.20, intent: 'COMMERCIAL' },
    ];

    useEffect(() => {
        // Load initial data for aesthetic presentation
        setResults(mockData);
    }, []);

    const handleResearch = async () => {
        if (!seedKeyword.trim()) return;
        setResearching(true);
        setError(null);

        try {
            // Placeholder: Link to an actual /keywords/research endpoint when ready
            // const data = await apiClient('/keywords/research/', { method: 'POST', body: { keyword: seedKeyword } });
            // setResults(data.results || data);
            
            // Simulating API call for demonstration:
            await new Promise(resolve => setTimeout(resolve, 800));
            setResults(mockData.map(m => ({ ...m, keyword: `${m.keyword} ${seedKeyword.split(' ')[0] || ''}`.trim() })));
        } catch (err) {
            setError(err?.detail || err?.message || 'Research failed.');
        } finally {
            setResearching(false);
        }
    };

    const getIntentStyle = (intent) => {
        switch (intent) {
            case 'COMMERCIAL': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'INFORMATIONAL': return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'TRANSACTIONAL': return 'bg-orange-50 text-orange-600 border-orange-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const getDiffColor = (difficulty) => {
        if (difficulty < 30) return 'bg-green-500';
        if (difficulty < 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="p-10 space-y-10 overflow-y-auto">
            {/* Header section */}
            <div className="space-y-2">
                <h1 className="text-[28px] font-extrabold text-on-surface tracking-tight">Keyword Research</h1>
                <p className="text-on-surface-variant max-w-2xl leading-relaxed text-[15px]">
                    Identify high-opportunity search terms powered by SEObot's real-time AI analysis.
                </p>
            </div>

            {/* Search Box Card */}
            <div className="bg-surface-container-lowest border border-[#eeedf5] p-6 lg:p-8 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 group w-full">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/60 text-[20px] group-focus-within:text-primary transition-colors">search</span>
                        <input
                            type="text"
                            value={seedKeyword}
                            onChange={(e) => setSeedKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                            placeholder="Enter a seed keyword (e.g., 'sustainable coffee')"
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
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        )}
                        Research
                    </button>
                </div>
                
                <div className="flex items-center gap-6 mt-2">
                    <button className="flex items-center gap-2 text-xs font-bold text-outline hover:text-on-surface transition-colors uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[16px]">public</span> WORLDWIDE
                    </button>
                    <button className="flex items-center gap-2 text-xs font-bold text-outline hover:text-on-surface transition-colors uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[16px]">language</span> ENGLISH
                    </button>
                </div>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-on-surface tracking-tight">Keyword Analysis Results</h2>
                    <div className="flex items-center gap-3">
                        <button className="px-5 py-2.5 text-sm font-bold text-on-surface bg-surface-container-lowest border border-[#eeedf5] rounded-xl hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm">
                            <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
                        </button>
                        <button className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl shadow-sm hover:bg-primary-container transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">add</span> Create Campaign
                        </button>
                    </div>
                </div>

                <div className="bg-surface-container-lowest border border-[#eeedf5] rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                    {error && (
                        <div className="p-4 bg-error/10 text-error text-sm font-semibold">{error}</div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#fcfcff]">
                                <tr>
                                    <th className="px-8 py-5 text-[11px] font-extrabold text-outline uppercase tracking-widest border-b border-[#eeedf5]">Keyword</th>
                                    <th className="px-6 py-5 text-[11px] font-extrabold text-outline uppercase tracking-widest border-b border-[#eeedf5]">Volume</th>
                                    <th className="px-6 py-5 text-[11px] font-extrabold text-outline uppercase tracking-widest border-b border-[#eeedf5]">Difficulty</th>
                                    <th className="px-6 py-5 text-[11px] font-extrabold text-outline uppercase tracking-widest border-b border-[#eeedf5]">CPC (USD)</th>
                                    <th className="px-6 py-5 text-[11px] font-extrabold text-outline uppercase tracking-widest border-b border-[#eeedf5]">Intent</th>
                                    <th className="px-8 py-5 text-[11px] font-extrabold text-outline uppercase tracking-widest border-b border-[#eeedf5] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eeedf5] bg-white">
                                {results.map((row, i) => (
                                    <tr key={i} className="hover:bg-[#faf9fd] transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="text-[14px] font-bold text-on-surface group-hover:text-primary transition-colors cursor-pointer">{row.keyword}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[14px] font-bold text-primary">{row.volume.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4 w-32">
                                                <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                                                    <div className={`h-full ${getDiffColor(row.difficulty)}`} style={{ width: `${row.difficulty}%` }} />
                                                </div>
                                                <span className="text-[13px] font-medium text-outline w-16 whitespace-nowrap">{row.difficulty} ({row.diffText})</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[14px] font-bold text-tertiary-container">${row.cpc.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${getIntentStyle(row.intent)}`}>
                                                {row.intent}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-2 text-outline hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                                                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>bookmark</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Context */}
                    <div className="px-8 py-5 border-t border-[#eeedf5] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#fcfcff]">
                        <span className="text-[13px] text-outline font-medium">Showing {results.length} of 1,284 keywords</span>
                        <div className="flex items-center gap-2">
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eeedf5] text-outline hover:bg-surface-container-low transition-colors"><span className="material-symbols-outlined text-[16px]">chevron_left</span></button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">1</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eeedf5] text-on-surface hover:bg-surface-container-low font-bold text-sm transition-colors">2</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eeedf5] text-on-surface hover:bg-surface-container-low font-bold text-sm transition-colors">3</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eeedf5] text-outline hover:bg-surface-container-low transition-colors"><span className="material-symbols-outlined text-[16px]">chevron_right</span></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}