import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[60vh] px-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.5, ease: "backOut" }}
            >
                <h1 className="text-5xl sm:text-6xl md:text-8xl mb-6 leading-[0.9] tracking-tighter uppercase">
                    NAVIGATE<br />
                    <span className="text-tertiary" style={{ WebkitTextStroke: '2px var(--color-text)', textShadow: '4px 4px 0 var(--color-text)' }}>YOUR</span><br />
                    FUTURE
                </h1>

                <p className="max-w-[600px] mx-auto mb-12 text-lg sm:text-xl font-medium text-text-light leading-relaxed">
                    AI-powered career roadmaps tailored to your unique journey.
                    Stop guessing, start sailing using CareerSea.
                </p>

                <motion.button
                    className="pop-button text-2xl px-12 py-4 sm:w-auto"
                    onClick={() => navigate('/assessment')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Start Your Journey
                </motion.button>
            </motion.div>
        </div>
    );
};

export default Welcome;
