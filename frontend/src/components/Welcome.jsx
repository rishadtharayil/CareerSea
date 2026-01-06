import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: '60vh'
        }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.5, ease: "backOut" }}
            >
                <h1 style={{
                    fontSize: 'clamp(3rem, 8vw, 6rem)',
                    marginBottom: '1rem',
                    lineHeight: '0.9',
                    letterSpacing: '-0.04em'
                }}>
                    NAVIGATE<br />
                    <span style={{
                        color: 'var(--color-tertiary)',
                        WebkitTextStroke: '2px var(--color-text)',
                        textShadow: '4px 4px 0 var(--color-text)'
                    }}>YOUR</span><br />
                    FUTURE
                </h1>

                <p style={{
                    maxWidth: '600px',
                    margin: '0 auto 3rem',
                    fontSize: '1.25rem',
                    fontWeight: 500,
                    color: 'var(--color-text-light)'
                }}>
                    AI-powered career roadmaps tailored to your unique journey.
                    Stop guessing, start sailing using CareerSea.
                </p>

                <motion.button
                    className="pop-button"
                    onClick={() => navigate('/assessment')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ fontSize: '1.5rem', padding: '1rem 3rem' }}
                >
                    Start Your Journey
                </motion.button>
            </motion.div>
        </div>
    );
};

export default Welcome;
