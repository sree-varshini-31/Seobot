import React, { useState } from 'react';

export default function ContentPlan() {
    // Mock data matching the screenshot
    const planData = [
        { month: 'January', articles: [{ title: 'Future of AI Content Generation', tags: ['#ai_writing', '#automation'], color: 'bg-[#2962ff]' }, { title: 'SEO Trends for 2024', tags: ['#seo_guide'], color: 'bg-[#2962ff]' }] },
        { month: 'February', articles: [{ title: 'Scaling SaaS with Content', tags: ['#saas_growth'], color: 'bg-[#2962ff]' }] },
        { month: 'March', special: 'Generate ideas for March', count: 5 },
        { month: 'April', articles: [{ title: 'Internal Linking Strategy', tags: [], color: 'bg-[#b45309]' }] },
        { month: 'May', articles: [{ title: 'Technical SEO Audit Guide', tags: [], color: 'bg-[#2962ff]' }], count: 6 },
        { month: 'June', articles: [{ title: 'Backlink Quality Checklist', tags: [], color: 'bg-[#dc2626]' }], count: 2 },
        { month: 'July', pending: true },
        { month: 'August', pending: true },
        { month: 'September', pending: true },
        { month: 'October', pending: true },
        { month: 'November', pending: true },
        { month: 'December', pending: true },
    ];

    return (
        <div className="p-10 space-y-8 bg-[#faf9fd] min-h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <h1 className="text-[32px] font-extrabold text-on-surface tracking-tight leading-tight">Content Plan</h1>
                    <p className="text-on-surface-variant max-w-2xl text-[15px] mt-2">
                        Strategically mapped SEO roadmap for the next 12 months. Each month is optimized for high-intent keywords.
                    </p>
                </div>
                <div className="bg-surface-container-lowest border border-[#eeedf5] p-3 rounded-2xl flex items-center justify-between gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] xl:w-[340px]">
                    <div className="pl-2">
                        <span className="text-[10px] font-extrabold uppercase text-outline tracking-widest block mb-0.5">PLAN STATUS</span>
                        <span className="text-[14px] font-bold text-on-surface">Drafting Q3-Q4 2024</span>
                    </div>
                    <button className="bg-primary hover:bg-primary-container transition-colors text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm shadow-primary/20 whitespace-nowrap">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> Generate Plan
                    </button>
                </div>
            </div>

            {/* 12 Months Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {planData.map((data, idx) => (
                    <div key={idx} className="bg-surface-container-lowest border border-[#eeedf5] rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] min-h-[280px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-[18px] font-bold ${data.pending ? 'text-outline/40' : 'text-on-surface'}`}>{data.month}</h3>
                            {data.pending ? (
                                <span className="px-3 py-1 bg-surface-container text-outline text-[10px] font-extrabold uppercase tracking-widest rounded-full opacity-60">PENDING</span>
                            ) : (
                                <span className="px-3 py-1 bg-[#e0e6ff] text-[#2962ff] text-[10px] font-extrabold uppercase tracking-widest rounded-full">
                                    {data.count || (data.articles ? data.articles.length : 0)} ARTICLES
                                </span>
                            )}
                        </div>

                        {!data.pending && (
                            <div className="space-y-3 flex-1">
                                {data.special && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#eeedf5] rounded-xl bg-[#faf9fd] group hover:border-[#d4cfff] hover:bg-[#f4f3f7] transition-all cursor-pointer">
                                        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors mb-2">auto_fix_high</span>
                                        <span className="text-[12px] font-bold text-outline group-hover:text-primary transition-colors">{data.special}</span>
                                    </div>
                                )}
                                {data.articles && data.articles.map((art, aIdx) => (
                                    <div key={aIdx} className="bg-[#fcfcff] border border-[#eeedf5] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex gap-3">
                                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${art.color}`}></div>
                                            <div>
                                                <h4 className="text-[14px] font-bold text-on-surface leading-snug">{art.title}</h4>
                                                {art.tags && art.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {art.tags.map((tag, tIdx) => (
                                                            <span key={tIdx} className="px-2 py-1 bg-surface-container-low border border-[#eeedf5] text-outline hover:text-on-surface hover:bg-surface-container transition-colors text-[10px] font-extrabold tracking-widest uppercase rounded">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Insights Footer */}
            <div className="bg-surface-container-lowest border border-[#eeedf5] rounded-[24px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col lg:flex-row shadow-sm">
                <div className="p-10 lg:w-3/5 space-y-6">
                    <h2 className="text-[22px] font-extrabold text-on-surface tracking-tight">Content Strategy Insights</h2>
                    <p className="text-[15px] text-on-surface-variant font-medium leading-relaxed my-2 max-w-xl">
                        Our AI has analyzed your domain authority and suggests a 70/30 split between informational "How-to" guides and transactional "Best tools" lists for the upcoming months.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <div className="bg-[#faf9fd] border border-[#eeedf5] p-5 rounded-2xl flex-1">
                            <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest block mb-2">TARGET AUTHORITY</span>
                            <span className="text-[24px] font-extrabold text-on-surface leading-none block">DA 45+</span>
                        </div>
                        <div className="bg-[#faf9fd] border border-[#eeedf5] p-5 rounded-2xl flex-1">
                            <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest block mb-2">EST. TRAFFIC LIFT</span>
                            <span className="text-[24px] font-extrabold text-on-surface leading-none block">+24.5k/mo</span>
                        </div>
                    </div>
                </div>
                
                {/* Visual placeholder matching the dashboard mock in screenshot */}
                <div className="lg:w-2/5 md:p-10 p-4 bg-surface-container-low flex items-center justify-center relative min-h-[250px] overflow-hidden">
                    <div className="absolute inset-0 opacity-40 bg-[rgba(41,98,255,0.15)]"></div>
                    <div className="relative w-full max-w-sm aspect-video bg-[#0f172a] rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col">
                        <div className="h-6 border-b border-white/10 flex items-center px-3 gap-1.5 bg-black/20">
                            <div className="w-2 h-2 rounded-full bg-red-500/80"></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-500/80"></div>
                            <div className="w-2 h-2 rounded-full bg-green-500/80"></div>
                        </div>
                        <div className="flex-1 p-3 flex flex-col gap-3">
                             <div className="flex justify-between gap-3">
                                 <div className="flex-1 bg-white/5 rounded-md h-12 flex items-center px-2"><div className="w-1/2 h-2 bg-white/10 rounded-full"></div></div>
                                 <div className="w-16 bg-white/5 rounded-md h-12 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#38bdf8] border-t-transparent animate-spin"></div></div>
                             </div>
                             <div className="flex-1 flex gap-3">
                                 <div className="w-1/3 bg-white/5 rounded-md"></div>
                                 <div className="flex-1 bg-white/5 rounded-md relative overflow-hidden">
                                     <svg className="absolute inset-0 w-full h-full text-[#38bdf8]/50" preserveAspectRatio="none" viewBox="0 0 100 100">
                                         <path d="M0 100 Q 25 50, 50 70 T 100 20 L 100 100 Z" fill="currentColor"></path>
                                     </svg>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}