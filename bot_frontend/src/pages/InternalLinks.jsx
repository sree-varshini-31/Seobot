import React, { useState } from 'react';

export default function InternalLinks() {
    const [suggestions, setSuggestions] = useState([
        {
            sourcePath: '/BLOG/SEO-BASICS/',
            sourceTitle: 'What is SEO? A Complete Guide',
            sourceDesc: 'In this article, we cover the fundamentals of search engine optimizatio...',
            targetTitle: 'Advanced Keyword Research Strategies',
            targetDesc: 'Move beyond basic keywords to find high-intent commercial terms wi...',
            anchorText: 'keyword research techniques'
        },
        {
            sourcePath: '/CASE-STUDIES/CLIENT-A/',
            sourceTitle: 'Increasing Organic Traffic by 300%',
            sourceDesc: 'A deep dive into how we transformed the digital presence of a major retail brand...',
            targetTitle: 'Our Managed SEO Services',
            targetDesc: 'Learn more about how our expert team can scale your business with custom SEO plans...',
            anchorText: 'managed SEO services'
        }
    ]);

    return (
        <div className="p-10 space-y-8 bg-[#faf9fd] min-h-full">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-[32px] font-extrabold text-on-surface tracking-tight leading-tight">Internal Links</h1>
                    <p className="text-on-surface-variant max-w-2xl text-[15px]">
                        Optimize your site structure with AI-driven contextual linking suggestions.
                    </p>
                </div>
                <div className="bg-surface-container-lowest border border-[#eeedf5] p-3 rounded-2xl flex items-center justify-between gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] xl:w-80">
                    <div className="pl-2">
                        <span className="text-[10px] font-extrabold uppercase text-outline tracking-widest block mb-0.5">STATUS</span>
                        <div className="flex items-center gap-1.5 object-contain">
                            <span className="text-sm font-bold text-on-surface">Link Graph Ready</span>
                            <span className="material-symbols-outlined text-[14px] text-on-surface" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                    </div>
                    <button className="bg-primary hover:bg-primary-container transition-colors text-white px-6 py-3 rounded-xl font-bold shadow-sm shadow-primary/20 whitespace-nowrap">
                        Analyze Links
                    </button>
                </div>
            </div>

            {/* 4 Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-surface-container-lowest border border-[#eeedf5] p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-3">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-outline">TOTAL LINKS</h3>
                    <div className="text-[32px] font-extrabold text-on-surface leading-none">1,284</div>
                    <div className="text-[11px] font-bold text-on-surface-variant"><span className="text-on-surface">+12%</span> vs last month</div>
                </div>
                <div className="bg-surface-container-lowest border border-[#eeedf5] p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-3">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-outline">ORPHAN PAGES</h3>
                    <div className="text-[32px] font-extrabold text-error leading-none">14</div>
                    <div className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span> Critical attention needed</div>
                </div>
                <div className="bg-surface-container-lowest border border-[#eeedf5] p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-3">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-outline">LINK DEPTH</h3>
                    <div className="text-[32px] font-extrabold text-on-surface leading-none">2.4</div>
                    <div className="text-[11px] font-bold text-on-surface-variant"><span className="text-primary">Optimal</span> structure detected</div>
                </div>
                <div className="bg-surface-container-lowest border border-[#eeedf5] p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-3 flex flex-col justify-between">
                    <div>
                        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-outline mb-3">INTERNAL PR</h3>
                        <div className="text-[32px] font-extrabold text-on-surface leading-none">82/100</div>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '82%' }}></div>
                    </div>
                </div>
            </div>

            {/* Linking Suggestions */}
            <div className="bg-surface-container-lowest border border-[#eeedf5] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-[20px] font-bold text-on-surface">Linking Suggestions</h2>
                    <div className="flex gap-3">
                        <button className="px-5 py-2.5 bg-surface-container-lowest border border-[#eeedf5] rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors shadow-sm">
                            Export CSV
                        </button>
                        <button className="px-5 py-2.5 bg-[#e0e6ff] text-[#2962ff] rounded-xl text-sm font-bold hover:bg-[#d4cfff] transition-colors shadow-sm">
                            Apply All
                        </button>
                    </div>
                </div>

                <div className="space-y-8">
                    {suggestions.map((s, i) => (
                        <div key={i} className="space-y-4">
                            <div className="flex items-center gap-2 text-outline">
                                <span className="material-symbols-outlined text-[18px]">folder</span>
                                <span className="text-[11px] font-extrabold tracking-widest uppercase">SOURCE: {s.sourcePath}</span>
                            </div>
                            
                            <div className="flex flex-col lg:flex-row gap-4 items-center">
                                {/* Left/Source Article */}
                                <div className="flex-1 bg-surface-container-low/50 border border-[#eeedf5] rounded-2xl p-5 relative w-full">
                                    <h3 className="text-[15px] font-bold text-on-surface pr-6">{s.sourceTitle}</h3>
                                    <p className="text-[13px] text-on-surface-variant mt-1.5 leading-relaxed">{s.sourceDesc}</p>
                                    <button className="absolute top-5 right-5 text-outline hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    </button>
                                </div>

                                {/* Arrow */}
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 rotate-90 lg:rotate-0">
                                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                </div>

                                {/* Right/Target Article */}
                                <div className="flex-1 bg-white border border-primary/20 rounded-2xl p-5 relative ring-1 ring-primary/5 shadow-[0_0_15px_rgba(66,40,200,0.05)] w-full">
                                    <h3 className="text-[15px] font-bold text-primary pr-6">{s.targetTitle}</h3>
                                    <p className="text-[13px] text-on-surface-variant mt-1.5 leading-relaxed">{s.targetDesc}</p>
                                    <button className="absolute top-5 right-5 text-primary hover:text-primary-container transition-colors">
                                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    </button>
                                </div>
                            </div>

                            {/* Bottom action row */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between pt-2">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <span className="text-[11px] font-extrabold text-outline tracking-widest uppercase whitespace-nowrap">ANCHOR TEXT</span>
                                    <div className="px-3 py-1.5 bg-surface-container-low border border-[#eeedf5] rounded-lg text-[12px] font-mono text-primary font-bold">
                                        {s.anchorText}
                                    </div>
                                    <div className="hidden lg:block flex-1 h-px bg-[#eeedf5] ml-4 min-w-[100px]"></div>
                                </div>
                                <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                                    <button className="text-[13px] font-bold text-primary hover:text-primary-container transition-colors">Approve Link</button>
                                    <button className="text-[13px] font-bold text-outline hover:text-on-surface transition-colors">Dismiss</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-[#eeedf5] text-center">
                    <button className="text-[13px] font-bold text-primary hover:text-primary-container transition-colors flex items-center justify-center gap-1 mx-auto">
                        View 28 More Suggestions <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                    </button>
                </div>
            </div>

            {/* Bottom 2 Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface-container-lowest border border-[#eeedf5] p-8 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] min-h-[250px] flex flex-col">
                    <h3 className="text-[18px] font-bold text-on-surface mb-auto">Internal Link Distribution</h3>
                    {/* Placeholder for chart */}
                    <div className="flex justify-between items-end h-32 mt-8 px-4 border-b border-[#eeedf5] pb-2 text-[10px] font-extrabold text-outline uppercase tracking-widest">
                        <span>Blog</span>
                        <span>Product</span>
                        <span>Guides</span>
                        <span>Case Studies</span>
                        <span>Resources</span>
                    </div>
                </div>
                
                <div className="lg:col-span-1 space-y-6 flex flex-col">
                    <div className="flex-1 bg-primary rounded-[24px] p-8 text-white relative overflow-hidden shadow-lg shadow-primary/20">
                        <div className="relative z-10 space-y-4">
                            <h3 className="text-[20px] font-bold">Architecture Health</h3>
                            <p className="text-[14px] text-white/80 leading-relaxed font-medium">
                                Your siloing strategy is currently 88% effective. Improving links to /products can boost overall rankings.
                            </p>
                            <button className="mt-4 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-[13px] font-bold transition-colors">
                                Generate Report
                            </button>
                        </div>
                        <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-[180px] text-white/5" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
                    </div>
                    <div className="bg-surface-container-lowest border border-[#eeedf5] p-6 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-extrabold text-outline uppercase tracking-widest block mb-1">NEXT CRAWL</span>
                            <span className="text-[15px] font-bold text-on-surface">In 4 hours, 12 mins</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}