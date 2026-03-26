import React, { useState } from 'react';

export default function Tools() {
    return (
        <div className="p-10 bg-[#faf9fd] min-h-full">
            <div className="flex flex-col lg:flex-row gap-10">
                {/* Main Content Area (Left + Middle) */}
                <div className="flex-1 space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-[32px] font-extrabold text-on-surface tracking-tight leading-tight">SEO Tools</h1>
                        <p className="text-on-surface-variant max-w-2xl text-[15px] mt-2 leading-relaxed">
                            Generate high-converting schema markup and analyze keyword potential with AI precision.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* LEFT NAV BAR */}
                        <div className="w-full md:w-64 shrink-0 space-y-2">
                            <div className="text-[10px] font-extrabold uppercase text-outline tracking-widest pl-4 mb-4">SCHEMA GENERATORS</div>
                            <button className="w-full flex items-center gap-4 px-5 py-4 bg-surface-container-lowest border border-[#eeedf5] text-on-surface rounded-2xl shadow-sm hover:border-primary/30 transition-colors text-left">
                                <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-outline">bar_chart</span>
                                </div>
                                <div>
                                    <div className="font-bold text-[14px]">Keyword Difficulty</div>
                                    <div className="text-[12px] text-outline font-medium">Search volume & intent</div>
                                </div>
                            </button>
                            
                            <button className="w-full flex items-center gap-4 px-5 py-4 bg-[#e0e6ff] border-transparent text-[#2962ff] ring-1 ring-primary/20 rounded-2xl shadow-sm text-left">
                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-md shadow-primary/20">
                                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
                                </div>
                                <div>
                                    <div className="font-bold text-[14px]">FAQ Schema</div>
                                    <div className="text-[12px] text-[#2962ff] opacity-80 font-medium">Rich snippet generator</div>
                                </div>
                            </button>

                            <button className="w-full flex items-center gap-4 px-5 py-4 bg-surface-container-lowest border border-[#eeedf5] text-on-surface rounded-2xl shadow-sm hover:border-primary/30 transition-colors text-left">
                                <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-outline" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                                </div>
                                <div>
                                    <div className="font-bold text-[14px]">Article Schema</div>
                                    <div className="text-[12px] text-outline font-medium">News & Blog markup</div>
                                </div>
                            </button>

                            <button className="w-full flex items-center gap-4 px-5 py-4 bg-surface-container-lowest border border-[#eeedf5] text-on-surface rounded-2xl shadow-sm hover:border-primary/30 transition-colors text-left">
                                <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-outline">forum</span>
                                </div>
                                <div>
                                    <div className="font-bold text-[14px]">Q&A Schema</div>
                                    <div className="text-[12px] text-outline font-medium">Community based info</div>
                                </div>
                            </button>
                        </div>

                        {/* MIDDLE GENERATOR PANEL */}
                        <div className="flex-1 w-full space-y-6">
                            {/* Form Input Area */}
                            <div className="bg-surface-container-lowest border border-[#eeedf5] rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-sm">
                                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
                                    </div>
                                    <h2 className="text-[20px] font-bold text-on-surface">FAQ Schema Generator</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-extrabold text-outline uppercase tracking-widest block">QUESTION 1</label>
                                        <div className="bg-[#f4f3f7] rounded-xl px-5 py-4">
                                            <input type="text" defaultValue="How does SEObot improve keyword rankings?" className="bg-transparent border-none w-full text-[15px] text-on-surface font-medium focus:outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-extrabold text-outline uppercase tracking-widest block">ANSWER 1</label>
                                        <div className="bg-[#f4f3f7] rounded-xl px-5 py-4">
                                            <textarea 
                                                rows="4" 
                                                className="bg-transparent border-none w-full text-[15px] text-on-surface font-medium resize-none focus:outline-none leading-relaxed"
                                                defaultValue="SEObot uses advanced LLMs to analyze search intent and competitors, automatically generating content that addresses user queries with high precision and E-E-A-T principles."
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <button className="flex items-center gap-2 text-primary font-bold text-[14px] hover:text-primary-container transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">add_circle</span> Add another FAQ
                                    </button>
                                    <button className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-sm hover:bg-primary-container transition-colors">
                                        Run Tool
                                    </button>
                                </div>
                            </div>

                            {/* Results Area */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-on-surface">
                                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <h3 className="text-[15px] font-bold">Generation Complete</h3>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                                    {/* Visual Preview */}
                                    <div className="flex-1 bg-surface-container-lowest border border-[#eeedf5] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6">
                                        <div className="flex items-center gap-6 border-b border-[#eeedf5] pb-4 mb-6">
                                            <button className="text-[11px] font-extrabold text-primary uppercase tracking-widest border-b-2 border-primary pb-1">VISUAL PREVIEW</button>
                                            <button className="text-[11px] font-extrabold text-outline uppercase tracking-widest hover:text-on-surface transition-colors pb-1 border-b-2 border-transparent">Google Ready</button>
                                        </div>
                                        <div className="bg-[#fcfcff] border border-[#eeedf5] rounded-2xl p-6 relative ml-6">
                                            <div className="absolute top-6 -left-6 w-12 h-12 bg-[#faf9fd] border border-[#eeedf5] rounded-full flex items-center justify-center text-primary shadow-sm">
                                                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
                                            </div>
                                            <h4 className="text-[16px] font-bold text-on-surface leading-snug mb-3">How does SEObot improve keyword rankings?</h4>
                                            <ul className="text-[14px] text-on-surface-variant leading-relaxed list-disc pl-5">
                                                <li>SEObot uses advanced LLMs to analyze search intent and competitors, automatically generating content that addresses user queries with high precision and E-E-A-T principles.</li>
                                            </ul>
                                        </div>
                                    </div>
                                    
                                    {/* JSON Window */}
                                    <div className="flex-1 bg-[#1e1e1e] rounded-[24px] overflow-hidden shadow-lg border border-white/5 flex flex-col">
                                        <div className="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between border-b border-black/20">
                                            <div className="flex gap-2">
                                                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                                                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                                            </div>
                                            <div className="text-[11px] font-bold text-white/40 tracking-widest">faq_schema.json</div>
                                            <span className="material-symbols-outlined text-white/40 text-[16px]">content_copy</span>
                                        </div>
                                        <div className="p-6 font-mono text-[13px] leading-[1.8] text-white/80 overflow-auto whitespace-pre">
                                            <span className="text-[#9cdcfe]">{"{"}</span><br/>
                                            <span className="text-[#ce9178]">  "@context"</span><span className="text-[#9cdcfe]">: </span><span className="text-[#ce9178]">"https://schema.org"</span><span className="text-[#9cdcfe]">,</span><br/>
                                            <span className="text-[#ce9178]">  "@type"</span><span className="text-[#9cdcfe]">: </span><span className="text-[#ce9178]">"FAQPage"</span><span className="text-[#9cdcfe]">,</span><br/>
                                            <span className="text-[#ce9178]">  "mainEntity"</span><span className="text-[#9cdcfe]">: [{"\n"}</span>
                                            <span className="text-[#ce9178]">    {"{"}</span><br/>
                                            <span className="text-[#ce9178]">      "@type"</span><span className="text-[#9cdcfe]">: </span><span className="text-[#ce9178]">"Question"</span><span className="text-[#9cdcfe]">,</span><br/>
                                            <span className="text-[#ce9178]">      "name"</span><span className="text-[#9cdcfe]">: </span><span className="text-[#ce9178]">"How does SEObot improve keyword rankings?"</span><span className="text-[#9cdcfe]">,</span><br/>
                                            <span className="text-[#ce9178]">      "acceptedAnswer"</span><span className="text-[#9cdcfe]">: {"{"}</span><br/>
                                            <span className="text-[#ce9178]">        "@type"</span><span className="text-[#9cdcfe]">: </span><span className="text-[#ce9178]">"Answer"</span><span className="text-[#9cdcfe]">,</span><br/>
                                            <span className="text-[#ce9178]">        "text"</span><span className="text-[#9cdcfe]">: </span><span className="text-[#ce9178]">"SEObot uses advanced LLMs..."</span><br/>
                                            <span className="text-[#ce9178]">      {"}"}</span><br/>
                                            <span className="text-[#ce9178]">    {"}"}</span><br/>
                                            <span className="text-[#9cdcfe]">  ]{"\n"}{"}"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR METADATA */}
                <div className="w-full lg:w-[320px] shrink-0 space-y-6 pt-12 md:pt-0">
                    <div className="text-[11px] font-extrabold uppercase text-on-surface tracking-widest pl-2 mb-2 lg:mt-[90px]">TOOL METADATA</div>
                    
                    {/* Performance Boost Card */}
                    <div className="bg-surface-container-lowest border border-[#eeedf5] p-6 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                            <span className="text-[13px] font-bold text-on-surface">Performance Boost</span>
                        </div>
                        <p className="text-[13px] text-on-surface-variant font-medium leading-relaxed">
                            FAQ schema has a <span className="font-bold text-on-surface">22% higher CTR</span> on average in Google Search results compared to standard listings.
                        </p>
                    </div>

                    {/* Recent Generations Card */}
                    <div className="bg-surface-container-lowest border border-[#eeedf5] p-6 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-5">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">history</span>
                            <span className="text-[13px] font-bold text-on-surface">Recent Generations</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-on-surface-variant">Article: Best SEO Practices</span>
                                <span className="text-outline font-bold">2m ago</span>
                            </div>
                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-on-surface-variant">FAQ: How to bake bread</span>
                                <span className="text-outline font-bold">1h ago</span>
                            </div>
                        </div>
                    </div>

                    {/* Promo Image Placeholder */}
                    <div className="relative rounded-[24px] overflow-hidden min-h-[220px] shadow-lg flex items-end p-6 bg-[#2962ff]">
                        {/* Decorative background elements inside card */}
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                        <span className="material-symbols-outlined absolute -top-8 -right-8 text-white/10 text-[180px]">smart_toy</span>
                        
                        <p className="relative z-10 text-[13px] text-white font-medium leading-relaxed">
                            <strong className="text-white block mb-1">Advanced AI models</strong> 
                            ensure your schema passes Google's Rich Result Test every time.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}