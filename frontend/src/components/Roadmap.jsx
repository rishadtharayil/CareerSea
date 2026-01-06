import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Home, CheckCircle } from 'lucide-react';

const Roadmap = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const data = location.state?.data;

    // Safety check if accessed directly or no data
    if (!data || !data.suggestions || data.suggestions.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FFD700]">
                <h1 className="text-5xl font-black border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    NO MAP FOUND
                </h1>
                <button onClick={() => navigate('/')} className="neo-button">Go Home</button>
            </div>
        );
    }

    const suggestion = data.suggestions[0];

    return (
        <div className="min-h-screen bg-[#F0F4F8] p-4 md:p-8 pb-24 overflow-x-hidden">

            {/* Header Section */}
            <div className="max-w-5xl mx-auto mb-16 text-center pt-8">
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="inline-block bg-[#00FFFF] border-4 border-black px-4 py-2 mb-6 font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2"
                >
                    RECOMMENDED CAREER
                </motion.div>

                <h1 className="text-5xl md:text-7xl font-black mb-8 uppercase tracking-tighter leading-none">
                    {suggestion.title}
                </h1>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white border-4 border-black p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-8 max-w-3xl mx-auto text-left"
                >
                    <p className="text-xl md:text-2xl font-bold leading-relaxed mb-6">
                        {suggestion.description}
                    </p>
                    <div className="bg-[#FFD700] border-2 border-black p-4 font-bold text-lg">
                        <span className="block text-sm uppercase opacity-60 mb-1">Why this fits you:</span>
                        {suggestion.reasoning}
                    </div>
                </motion.div>
            </div>

            {/* Roadmap Visualization */}
            <div className="max-w-4xl mx-auto relative px-4">
                <h2 className="text-4xl font-black text-center mb-12 uppercase italic bg-black text-white inline-block px-4 py-2 transform rotate-1 mx-auto block max-w-xs">
                    Your Roadmap
                </h2>

                {/* Central Line (Desktop) / Left Line (Mobile) */}
                <div className="absolute left-[34px] md:left-1/2 top-0 bottom-0 w-3 bg-black transform md:-translate-x-1/2 z-0"></div>

                {suggestion.roadmap_steps.map((step, index) => (
                    <motion.div
                        initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        key={step.id || index}
                        className={`relative mb-16 flex ${index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'} justify-start pl-12 md:pl-0 w-full`}
                    >
                        {/* Connector Dot */}
                        <div className="absolute left-[20px] md:left-1/2 top-8 w-8 h-8 bg-[#FF69B4] border-4 border-black rounded-none z-10 transform md:-translate-x-1/2 md:-translate-y-1/2 rotate-45"></div>

                        {/* Card */}
                        <div className={`neo-box w-full md:w-[45%] p-6 relative group ${index % 2 === 0 ? 'md:mr-16 bg-[#E0E7FF]' : 'md:ml-16 bg-[#FFD700]'}`}>
                            {/* Step Number Badge */}
                            <div className="absolute -top-6 -right-6 w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl border-2 border-white shadow-lg z-20">
                                {step.order}
                            </div>

                            <h3 className="text-2xl font-black uppercase mb-3 mr-4">{step.title}</h3>
                            <p className="font-semibold text-lg mb-4">{step.description}</p>

                            <div className="flex flex-wrap gap-2 text-sm font-bold">
                                {step.duration && (
                                    <div className="flex items-center gap-1 bg-white border-2 border-black px-3 py-1">
                                        <Clock size={16} /> {step.duration}
                                    </div>
                                )}
                                {step.resources && step.resources.length > 0 && (
                                    <div className="flex items-center gap-1 bg-white border-2 border-black px-3 py-1">
                                        <BookOpen size={16} /> Resources Available
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Finish Line */}
                <div className="relative z-10 flex justify-center pt-8">
                    <div className="bg-[#00FF00] border-4 border-black p-4 text-2xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                        <CheckCircle size={32} /> GOAL ACHIEVED
                    </div>
                </div>
            </div>

            <div className="text-center mt-20">
                <button onClick={() => navigate('/')} className="neo-button accent flex items-center gap-2 mx-auto text-white">
                    <Home /> Start New Journey
                </button>
            </div>
        </div>
    );
};

export default Roadmap;
