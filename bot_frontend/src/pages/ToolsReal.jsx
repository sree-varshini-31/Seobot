import React, { useState } from 'react';
import {
    checkKeywordDifficulty,
    generateFaqSchema,
    generateArticleSchema,
    generateQaSchema,
} from '../api/client';

const TOOL_IDS = {
    kd: 'kd',
    faq: 'faq',
    article: 'article',
    qa: 'qa',
};

export default function ToolsReal() {
    const [active, setActive] = useState(TOOL_IDS.kd);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const [keywordInput, setKeywordInput] = useState('');

    const [faqQuestion, setFaqQuestion] = useState('');
    const [faqAnswer, setFaqAnswer] = useState('');

    const [articleTitle, setArticleTitle] = useState('');
    const [articleDescription, setArticleDescription] = useState('');
    const [articleAuthor, setArticleAuthor] = useState('SEO Bot AI');
    const [publishDate, setPublishDate] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const [qaQuestion, setQaQuestion] = useState('');
    const [qaAnswer, setQaAnswer] = useState('');
    const [qaAuthor, setQaAuthor] = useState('SEO Bot AI');

    const run = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            if (active === TOOL_IDS.kd) {
                const res = await checkKeywordDifficulty([keywordInput]);
                setResult(res?.results || res);
                return;
            }

            if (active === TOOL_IDS.faq) {
                const res = await generateFaqSchema([faqQuestion], [faqAnswer]);
                setResult(res?.schema || res);
                return;
            }

            if (active === TOOL_IDS.article) {
                const res = await generateArticleSchema({
                    title: articleTitle,
                    description: articleDescription,
                    author: articleAuthor,
                    publish_date: publishDate,
                    image_url: imageUrl,
                });
                setResult(res?.schema || res);
                return;
            }

            if (active === TOOL_IDS.qa) {
                const res = await generateQaSchema(qaQuestion, qaAnswer, qaAuthor);
                setResult(res?.schema || res);
                return;
            }
        } catch (e) {
            setError(e?.detail || e?.message || 'Tool execution failed.');
        } finally {
            setLoading(false);
        }
    };

    const ToolButton = ({ id, icon, label, desc }) => (
        <button
            onClick={() => {
                setActive(id);
                setError(null);
                setResult(null);
            }}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left border transition-colors ${
                active === id
                    ? 'bg-[#e0e6ff] border-[#c7d2fe] text-[#2962ff]'
                    : 'bg-surface-container-lowest border-[#eeedf5] text-on-surface'
            }`}
            type="button"
        >
            <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    active === id ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'
                }`}
            >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                </span>
            </div>
            <div>
                <div className="font-bold text-[14px]">{label}</div>
                <div className="text-[12px] text-outline font-medium mt-1">{desc}</div>
            </div>
        </button>
    );

    return (
        <div className="p-10 bg-[#faf9fd] min-h-full space-y-8">
            <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1 space-y-8">
                    <div>
                        <h1 className="text-[32px] font-extrabold text-on-surface tracking-tight leading-tight">
                            SEO Tools
                        </h1>
                        <p className="text-on-surface-variant max-w-2xl text-[15px] mt-2 leading-relaxed">
                            Run real tools using SerpAPI + Groq-backed endpoints.
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <div className="w-full lg:w-64 space-y-2">
                            <ToolButton id={TOOL_IDS.kd} icon="bar_chart" label="Keyword Difficulty" desc="Competition + difficulty score" />
                            <ToolButton id={TOOL_IDS.faq} icon="help" label="FAQ Schema" desc="Generate FAQ JSON-LD" />
                            <ToolButton id={TOOL_IDS.article} icon="description" label="Article Schema" desc="Generate Article JSON-LD" />
                            <ToolButton id={TOOL_IDS.qa} icon="forum" label="Q&A Schema" desc="Generate QAPage JSON-LD" />
                        </div>

                        <div className="flex-1 bg-surface-container-lowest border border-[#eeedf5] rounded-[24px] p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-semibold">
                                    {String(error)}
                                </div>
                            )}

                            {active === TOOL_IDS.kd && (
                                <div className="space-y-4">
                                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                                        Keyword
                                    </label>
                                    <input
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        placeholder="e.g. best SEO tools 2026"
                                        className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl text-sm focus:outline-none focus:border-primary"
                                    />
                                </div>
                            )}

                            {active === TOOL_IDS.faq && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Question</label>
                                        <input
                                            value={faqQuestion}
                                            onChange={(e) => setFaqQuestion(e.target.value)}
                                            className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl text-sm focus:outline-none focus:border-primary mt-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Answer</label>
                                        <textarea
                                            value={faqAnswer}
                                            onChange={(e) => setFaqAnswer(e.target.value)}
                                            rows={5}
                                            className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl text-sm focus:outline-none focus:border-primary mt-2 resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {active === TOOL_IDS.article && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Title</label>
                                        <input
                                            value={articleTitle}
                                            onChange={(e) => setArticleTitle(e.target.value)}
                                            className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl text-sm focus:outline-none focus:border-primary mt-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Description</label>
                                        <textarea
                                            value={articleDescription}
                                            onChange={(e) => setArticleDescription(e.target.value)}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl text-sm focus:outline-none focus:border-primary mt-2 resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Author</label>
                                            <input
                                                value={articleAuthor}
                                                onChange={(e) => setArticleAuthor(e.target.value)}
                                                className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl text-sm focus:outline-none focus:border-primary mt-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Publish Date</label>
                                            <input
                                                value={publishDate}
                                                onChange={(e) => setPublishDate(e.target.value)}
                                                placeholder="YYYY-MM-DD"
                                                className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl text-sm focus:outline-none focus:border-primary mt-2"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Image URL</label>
                                        <input
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            placeholder="https://example.com/hero.jpg"
                                            className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl text-sm focus:outline-none focus:border-primary mt-2"
                                        />
                                    </div>
                                </div>
                            )}

                            {active === TOOL_IDS.qa && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Question</label>
                                        <input
                                            value={qaQuestion}
                                            onChange={(e) => setQaQuestion(e.target.value)}
                                            className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl text-sm focus:outline-none focus:border-primary mt-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Answer</label>
                                        <textarea
                                            value={qaAnswer}
                                            onChange={(e) => setQaAnswer(e.target.value)}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl text-sm focus:outline-none focus:border-primary mt-2 resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Author</label>
                                        <input
                                            value={qaAuthor}
                                            onChange={(e) => setQaAuthor(e.target.value)}
                                            className="w-full px-4 py-3 bg-surface-container-low border-[1.5px] border-[#eeedf5] rounded-xl text-sm focus:outline-none focus:border-primary mt-2"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2 gap-4">
                                <button
                                    type="button"
                                    onClick={run}
                                    disabled={loading}
                                    className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-sm hover:bg-primary-container transition-colors disabled:opacity-60"
                                >
                                    {loading ? (
                                        <span className="inline-flex items-center gap-2">
                                            <span className="material-symbols-outlined animate-spin">progress_activity</span> Running…
                                        </span>
                                    ) : (
                                        'Run Tool'
                                    )}
                                </button>
                            </div>

                            <div>
                                {result ? (
                                    <pre className="bg-[#1e1e1e] text-white/80 rounded-[20px] p-5 overflow-auto text-sm whitespace-pre-wrap">
                                        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                                    </pre>
                                ) : (
                                    <div className="text-sm font-semibold text-on-surface-variant">
                                        Output will appear here after you run the tool.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

