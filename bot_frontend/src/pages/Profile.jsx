import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfileInsights } from '../api/client';
import { useAuth } from '../context/AuthContext';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function ScoreSparkline({ points }) {
    if (!points?.length) {
        return <p className="text-xs text-outline">Run audits on this URL to see progress over time.</p>;
    }
    
    // Format data for recharts
    const data = points.map((p, index) => {
        const dt = p.date ? p.date.split(' ')[0] : `Audit ${index + 1}`;
        return {
            name: dt,
            fullDate: p.date,
            score: p.score
        };
    });

    return (
        <div className="w-full h-[120px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{fontSize: 9, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{fontSize: 10, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                        contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#4285F4', fontWeight: 'bold' }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#4285F4" 
                        strokeWidth={3}
                        dot={{ r: 3, fill: '#4285F4', strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function Profile() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [insights, setInsights] = useState(null);
    const [insightsErr, setInsightsErr] = useState(null);

    const isAdmin = user?.role === 'admin' || user?.is_staff || user?.is_superuser;

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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl sm:text-[28px] font-extrabold text-on-surface tracking-tight">Projects</h1>
                    <p className="text-on-surface-variant mt-1 text-sm sm:text-base">
                        Sites you have audited and stored SEO scores over time.
                    </p>
                </div>
                
                {/* Usage Stats Block */}
                {user && (
                    <div className="flex bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-4 gap-6 shrink-0 shadow-sm">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-outline">API Calls</span>
                            <span className="text-lg font-extrabold text-primary">{user.api_calls_used || 0}</span>
                        </div>
                        <div className="w-[1px] bg-outline-variant/30"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-outline">Sites Searched</span>
                            <span className="text-lg font-extrabold text-primary">{user.websites_searched || 0}</span>
                        </div>
                        <div className="w-[1px] bg-outline-variant/30"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-outline">Data Received</span>
                            <span className="text-lg font-extrabold text-primary">
                                {user.data_received_bytes ? `${(user.data_received_bytes / 1024).toFixed(1)} KB` : '0 KB'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {!isAdmin && (
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
                                <div className="mt-4 pt-4 border-t border-outline-variant/30 flex justify-end">
                                    <button
                                        onClick={() => navigate('/audit', { state: { url: p.url } })}
                                        className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-fixed bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">insert_chart</span>
                                        View Full Report
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
