import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[70vh] px-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.5, ease: "backOut" }}
                className="relative"
            >
                {/* Decorative Background Elements */}
                <div className="absolute -top-10 -left-10 w-20 h-20 bg-primary border-4 border-text rounded-full -z-10 hidden md:block animate-bounce" />
                <div className="absolute -bottom-10 -right-10 w-16 h-16 bg-accent border-4 border-text -z-10 hidden md:block rotate-12" />

                <h1 className="text-6xl sm:text-7xl md:text-9xl mb-8 leading-[0.85] tracking-tightest font-black uppercase">
                    NAVIGATE<br />
                    <div className="inline-block relative my-2 px-6 py-2 bg-tertiary border-pop border-text shadow-pop rotate-3 transform-gpu">
                        <span className="relative z-10">YOUR</span>
                    </div><br />
                    FUTURE
                </h1>

                <p className="max-w-[550px] mx-auto mb-12 text-xl sm:text-2xl font-bold text-text-light leading-snug">
                    Get an AI-powered career roadmap that doesn't suck. 
                    <span className="text-text block mt-2 underline decoration-accent decoration-4 underline-offset-4">Stop guessing, start sailing.</span>
                </p>

                <motion.button
                    className="pop-button text-2xl px-12 py-5 group relative"
                    onClick={() => navigate('/assessment')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span className="relative z-10 flex items-center gap-3">
                        Launch Assessment 
                        <span className="group-hover:translate-x-2 transition-transform">→</span>
                    </span>
                </motion.button>
            </motion.div>
        </div>
    );
};

export default Welcome;
