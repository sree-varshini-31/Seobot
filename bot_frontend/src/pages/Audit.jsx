import React, { useState } from 'react';
import { apiClient } from '../api/client';

export default function Audit() {
    const [url, setUrl] = useState('https://w3schools.com');
    const [loading, setLoading] = useState(false);
    const [auditData, setAuditData] = useState(null);
    const [error, setError] = useState(null);

    // Initial mock data matching the screenshot
    const [displayData, setDisplayData] = useState({
        score: 80,
        urlAnalyzed: 'https://w3schools.com',
        dateStr: 'Analysis complete - 26/03/2026',
        checks: [
            { name: 'Ssl', status: 'warning' },
            { name: 'Favicon', status: 'warning' },
            { name: 'Sitemap', status: 'warning' },
            { name: 'Hreflang', status: 'warning' },
            { name: 'Canonical', status: 'warning' },
            { name: 'Open Graph', status: 'warning' },
            { name: 'RobotsTxt', status: 'warning' },
        ],
        readability: {
            value: '47.8',
            label: 'Difficult'
        },
        keywordDensity: {
            value: '0%',
            label: 'Too low - use keyword more'
        }
    });

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!url) return;
        setLoading(true);
        setError(null);
        try {
            // Simulated API mapping
            // const data = await apiClient('/audit/analyze/', { method: 'POST', body: { url } });
            // setAuditData(data.data || data);

            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (err) {
            setError(err?.detail || err?.message || 'Audit failed. Please check the URL and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-[#f8f9fa] min-h-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[28px] font-bold text-[#1f2937] mb-1">SEO Audit</h1>
                <p className="text-[#6b7280] text-[14px]">Deep technical analysis with PageSpeed, Core Web Vitals & readability</p>
            </div>

            {/* Input Form Box */}
            <form onSubmit={handleAnalyze} className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full border border-gray-200 rounded-lg bg-white overflow-hidden flex items-center pr-2">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 text-[14px] text-gray-800 focus:outline-none"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !url}
                    className="w-full sm:w-auto px-6 py-3 bg-[#2962ff] hover:bg-[#1c4ede] text-white font-medium rounded-lg text-[14px] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:bg-[#2962ff]"
                >
                    {loading ? (
                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    ) : (
                        <span className="material-symbols-outlined text-[18px]">search</span>
                    )}
                    Analyze
                </button>
            </form>

            {error && (
                <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Score Box */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-6 flex items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                    {/* Ring Chart */}
                    <div className="relative w-20 h-20">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="40" cy="40" r="36" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                            {/* Dash array = 2 * PI * r = ~226 */}
                            <circle 
                                cx="40" cy="40" r="36" fill="transparent" stroke="#10b981" strokeWidth="6"
                                strokeDasharray="226.19" strokeDashoffset={226.19 - (226.19 * displayData.score) / 100} 
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[20px] font-bold text-[#10b981]">{displayData.score}</span>
                        </div>
                    </div>
                    <span className="text-[11px] text-[#9ca3af] font-medium">SEO Score</span>
                </div>
                <div className="flex-1">
                    <h2 className="text-[18px] font-bold text-[#1f2937] leading-tight">{displayData.urlAnalyzed}</h2>
                    <p className="text-[13px] text-[#9ca3af] mt-1">{displayData.dateStr}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Technical Checks */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                        <h3 className="text-[15px] font-bold text-[#1f2937] mb-6">Technical Checks</h3>
                        <div className="space-y-4">
                            {displayData.checks.map((check, i) => (
                                <div key={i} className="flex justify-between items-center group">
                                    <span className="text-[14px] text-[#4b5563]">{check.name}</span>
                                    {check.status === 'warning' && (
                                        <span className="text-[#f59e0b] font-bold text-[16px] leading-none">-</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Readability & Keyword Density */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h4 className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide mb-2">READABILITY</h4>
                        <div className="text-[28px] font-bold text-[#10b981] leading-none mb-2">{displayData.readability.value}</div>
                        <p className="text-[13px] text-[#9ca3af]">{displayData.readability.label}</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h4 className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide mb-2">KEYWORD DENSITY</h4>
                        <div className="text-[28px] font-bold text-[#2962ff] leading-none mb-2">{displayData.keywordDensity.value}</div>
                        <p className="text-[13px] text-[#9ca3af]">{displayData.keywordDensity.label}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}