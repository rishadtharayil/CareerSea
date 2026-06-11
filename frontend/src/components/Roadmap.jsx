import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, BookOpen, Home, CheckCircle, Sparkles } from 'lucide-react';
import AdSense from './AdSense';
import api from '../api';

const Roadmap = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const data = location.state?.data;

    const [activeTab, setActiveTab] = useState(0);
    const [selectedStep, setSelectedStep] = useState(null);
    const [deepDiveContent, setDeepDiveContent] = useState('');
    const [loadingDeepDive, setLoadingDeepDive] = useState(false);
    const [deepDiveError, setDeepDiveError] = useState('');

    if (!data || !data.suggestions || data.suggestions.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center gap-12 text-center px-4">
                <h1 className="pop-card text-3xl font-black uppercase">NO MAP FOUND</h1>
                <button onClick={() => navigate('/')} className="pop-button text-xl">Return Home</button>
            </div>
        );
    }

    const suggestion = data.suggestions[activeTab];

    const handleDeepDiveClick = async (step) => {
        if (selectedStep && selectedStep.id === step.id) {
            setSelectedStep(null);
            setDeepDiveContent('');
            return;
        }

        setSelectedStep(step);
        setDeepDiveContent('');
        setDeepDiveError('');
        setLoadingDeepDive(true);

        try {
            const res = await api.post(`/api/steps/${step.id}/deep-dive/`);
            setDeepDiveContent(res.data.deep_dive);
        } catch (error) {
            console.error("Failed to load deep dive", error);
            setDeepDiveError("Failed to generate study guide. Please try again.");
        } finally {
            setLoadingDeepDive(false);
        }
    };

    const parseInlineBold = (text) => {
        const parts = text.split('**');
        return parts.map((part, i) => {
            if (i % 2 === 1) {
                return <strong key={i} className="font-black text-text">{part}</strong>;
            }
            return part;
        });
    };

    const renderMarkdown = (text) => {
        if (!text) return null;
        const lines = text.split('\n');
        return lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-4" />;

            if (trimmed.startsWith('### ')) {
                return (
                    <h4 key={idx} className="text-base sm:text-lg font-black uppercase mt-6 mb-3 border-b-2 border-text pb-1">
                        {trimmed.replace('### ', '')}
                    </h4>
                );
            }
            
            if (trimmed.startsWith('## ')) {
                return (
                    <h3 key={idx} className="text-lg sm:text-xl font-black uppercase mt-8 mb-4 border-b-4 border-text pb-2">
                        {trimmed.replace('## ', '')}
                    </h3>
                );
            }

            if (trimmed.startsWith('# ')) {
                return (
                    <h2 key={idx} className="text-xl sm:text-2xl font-black uppercase mt-10 mb-6 border-b-4 border-text pb-2">
                        {trimmed.replace('# ', '')}
                    </h2>
                );
            }

            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const content = trimmed.substring(2);
                return (
                    <li key={idx} className="ml-4 list-disc font-bold text-text-light mb-2 leading-relaxed text-sm sm:text-base">
                        {parseInlineBold(content)}
                    </li>
                );
            }

            const olMatch = trimmed.match(/^(\d+)\.\s(.*)/);
            if (olMatch) {
                return (
                    <li key={idx} className="ml-4 list-decimal font-bold text-text-light mb-2 leading-relaxed text-sm sm:text-base">
                        {parseInlineBold(olMatch[2])}
                    </li>
                );
            }

            return (
                <p key={idx} className="font-bold text-text-light mb-4 leading-relaxed text-sm sm:text-base">
                    {parseInlineBold(trimmed)}
                </p>
            );
        });
    };

    return (
        <div className="max-w-[1400px] mx-auto pb-24 px-4 sm:px-6 overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-8 items-start relative w-full transition-all duration-500">
                
                {/* Left Column: The Roadmap (width changes dynamically) */}
                <motion.div 
                    layout
                    className={`transition-all duration-500 w-full ${
                        selectedStep ? 'lg:w-[58%]' : 'max-w-[1000px] mx-auto'
                    }`}
                >
                    {/* Path Selector Tabs */}
                    <div className="flex flex-wrap justify-center gap-4 mt-8 mb-12">
                        {data.suggestions.map((sug, index) => (
                            <button
                                key={sug.id || index}
                                onClick={() => {
                                    setActiveTab(index);
                                    setSelectedStep(null);
                                    setDeepDiveContent('');
                                }}
                                className={`px-6 py-3 font-black uppercase transition-transform border-4 border-text ${
                                    activeTab === index 
                                        ? 'bg-primary shadow-pop -translate-y-2' 
                                        : 'bg-surface hover:-translate-y-1 hover:shadow-pop-sm'
                                }`}
                            >
                                {sug.type || `Path ${index + 1}`}
                            </button>
                        ))}
                    </div>

                    {/* Header Section */}
                    <div className="text-center mb-20 pt-8">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="inline-block bg-tertiary border-pop border-text px-6 py-2 mb-8 font-black text-lg -rotate-2 shadow-pop"
                        >
                            RECOMMENDED CAREER
                        </motion.div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-12 uppercase leading-none tracking-tighter">
                            {suggestion.title}
                        </h1>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="pop-card text-left max-w-3xl mx-auto"
                        >
                            <p className="text-xl sm:text-2xl font-bold leading-relaxed mb-8">
                                {suggestion.description}
                            </p>
                            <div className="bg-primary border-pop border-text rounded-pop p-6 sm:p-8 font-bold text-lg">
                                <span className="block text-xs uppercase mb-2 tracking-[0.2em] opacity-60">Why this fits you:</span>
                                {suggestion.reasoning}
                            </div>
                        </motion.div>
                    </div>

                    {/* Roadmap Visualization */}
                    <div className="relative pt-12">
                        <div className="text-center mb-20">
                            <h2 className="text-2xl sm:text-3xl font-black inline-block bg-text text-bg px-8 py-3 rotate-1 shadow-pop">
                                YOUR ROADMAP
                            </h2>
                        </div>

                        {/* Central Line */}
                        <div className="absolute left-8 md:left-1/2 top-32 bottom-0 w-1 md:w-2 bg-text border-l-pop border-dashed border-text -translate-x-1/2 z-0 hidden sm:block"></div>

                        <div className="grid gap-12 md:gap-24 relative z-10">
                            {suggestion.roadmap_steps.map((step, index) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    key={step.id || index}
                                    className={`flex flex-col md:flex-row items-center w-full ${
                                        index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'
                                    }`}
                                >
                                    <div className={`w-full md:w-[45%] relative group`}>
                                        {/* Step Number Badge */}
                                        <div className={`absolute -top-6 -left-6 w-12 h-12 bg-text text-bg flex items-center justify-center font-black text-xl rounded-full border-4 border-bg z-20 shadow-pop-sm group-hover:scale-110 transition-transform`}>
                                            {step.order}
                                        </div>

                                        <div className={`pop-card w-full !p-8 ${
                                            index % 2 === 0 ? 'bg-bg' : 'bg-primary'
                                        }`}>
                                            <h3 className="text-xl sm:text-2xl font-black uppercase mb-4 leading-tight">{step.title}</h3>
                                            <p className="font-bold text-text-light mb-6 leading-relaxed text-sm sm:text-base">{step.description}</p>

                                            <div className="flex flex-col gap-4">
                                                <div className="flex flex-wrap gap-3 font-black text-xs uppercase tracking-wider">
                                                    {step.duration && (
                                                        <div className="flex items-center gap-2 bg-surface border-2 border-text px-4 py-1.5 rounded-full shadow-pop-sm">
                                                            <Clock size={16} /> {step.duration}
                                                        </div>
                                                    )}
                                                </div>

                                                {step.resources && step.resources.length > 0 && (
                                                    <div className="mt-2">
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-50 flex items-center gap-2">
                                                            <BookOpen size={12} /> Key Resources
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {step.resources.map((res, i) => (
                                                                <div key={i} className="bg-surface border-2 border-text px-3 py-1 rounded-md text-[11px] font-bold shadow-pop-sm">
                                                                    {res}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => handleDeepDiveClick(step)}
                                                    className={`w-full mt-4 py-3 px-4 font-black uppercase tracking-wider text-xs sm:text-sm border-4 border-text shadow-pop-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                                                        selectedStep && selectedStep.id === step.id
                                                            ? 'bg-tertiary -translate-y-1 shadow-pop'
                                                            : 'bg-surface hover:-translate-y-1 hover:shadow-pop'
                                                    }`}
                                                >
                                                    <Sparkles size={16} />
                                                    {selectedStep && selectedStep.id === step.id ? 'Close Guide' : 'Deep Dive Into Step'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Finish Line */}
                        <div className="relative z-20 flex justify-center mt-24">
                            <motion.div 
                                whileInView={{ scale: [1, 1.1, 1] }}
                                className="bg-secondary border-pop border-text px-8 py-4 sm:text-2xl font-black shadow-pop-hover flex items-center gap-4 uppercase tracking-tighter"
                            >
                                <CheckCircle size={32} strokeWidth={3} /> Goal Achieved
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Deep Dive Panel */}
                <AnimatePresence>
                    {selectedStep && (
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                            className="w-full lg:w-[40%] lg:sticky lg:top-24 pop-card bg-bg border-4 border-text !p-6 sm:!p-8 shadow-pop relative min-h-[500px] flex flex-col mt-8 lg:mt-0 max-h-[85vh] overflow-hidden"
                        >
                            {/* Close Button */}
                            <button 
                                onClick={() => {
                                    setSelectedStep(null);
                                    setDeepDiveContent('');
                                }}
                                className="absolute top-4 right-4 bg-tertiary hover:bg-tertiary/80 border-4 border-text px-3 py-1 font-black text-xs uppercase shadow-pop-sm hover:-translate-y-0.5 transition-all"
                            >
                                Close [X]
                            </button>

                            {/* Heading */}
                            <div className="mb-6 border-b-4 border-text pb-4 pr-16">
                                <span className="inline-block bg-primary border-2 border-text px-3 py-1 text-[10px] font-black uppercase mb-3 shadow-pop-sm">
                                    Step {selectedStep.order} Deep Dive
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black uppercase leading-tight">
                                    {selectedStep.title}
                                </h2>
                                <p className="text-[10px] font-bold text-text-light mt-2 uppercase tracking-wider">
                                    Path: {suggestion.title} ({suggestion.type})
                                </p>
                            </div>

                            {/* Deep Dive Content (loaded/loading states) */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {loadingDeepDive ? (
                                    /* Loading skeleton */
                                    <div className="flex flex-col gap-4 animate-pulse py-4">
                                        <div className="h-6 bg-surface border-2 border-text w-3/4 rounded-md"></div>
                                        <div className="h-4 bg-surface border-2 border-text w-1/2 rounded-md"></div>
                                        <div className="h-24 bg-surface border-2 border-text w-full rounded-md mt-4"></div>
                                        <div className="h-4 bg-surface border-2 border-text w-5/6 rounded-md"></div>
                                        <div className="h-4 bg-surface border-2 border-text w-2/3 rounded-md"></div>
                                        <div className="h-24 bg-surface border-2 border-text w-full rounded-md mt-4"></div>
                                    </div>
                                ) : deepDiveError ? (
                                    <div className="text-center font-bold text-red-500 py-12">
                                        {deepDiveError}
                                    </div>
                                ) : (
                                    /* Content appears here */
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4 }}
                                        className="prose prose-stone max-w-none text-left pb-8"
                                    >
                                        {renderMarkdown(deepDiveContent)}
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* AdSense Monetization */}
            <div className="max-w-2xl mx-auto px-4 mt-12">
                <AdSense adSlot="1234567890" />
            </div>

            <div className="text-center mt-24">
                <button onClick={() => navigate('/')} className="pop-button accent text-xl gap-4 group">
                    <Home size={24} className="group-hover:-translate-y-1 transition-transform" /> 
                    Start New Journey
                </button>
            </div>
        </div>
    );
};

export default Roadmap;
