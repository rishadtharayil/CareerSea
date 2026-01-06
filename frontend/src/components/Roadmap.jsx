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
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                <h1 className="pop-card" style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase' }}>
                    NO MAP FOUND
                </h1>
                <button onClick={() => navigate('/')} className="pop-button">Go Home</button>
            </div>
        );
    }

    const suggestion = data.suggestions[0];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '6rem' }}>

            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: '5rem', paddingTop: '2rem' }}>
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{
                        display: 'inline-block',
                        backgroundColor: 'var(--color-tertiary)',
                        border: 'var(--border-width) solid var(--border-color)',
                        padding: '0.5rem 1.5rem',
                        marginBottom: '1.5rem',
                        fontWeight: 900,
                        fontSize: '1.125rem',
                        transform: 'rotate(-2deg)',
                        boxShadow: '4px 4px 0 var(--border-color)'
                    }}
                >
                    RECOMMENDED CAREER
                </motion.div>

                <h1 style={{
                    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                    fontWeight: 900,
                    marginBottom: '2rem',
                    textTransform: 'uppercase',
                    lineHeight: '1'
                }}>
                    {suggestion.title}
                </h1>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="pop-card"
                    style={{
                        textAlign: 'left',
                        maxWidth: '800px',
                        margin: '0 auto',
                        backgroundColor: 'var(--color-surface)'
                    }}
                >
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: '1.6', marginBottom: '1.5rem' }}>
                        {suggestion.description}
                    </p>
                    <div style={{
                        backgroundColor: 'var(--color-primary)',
                        border: 'var(--border-width) solid var(--border-color)',
                        borderRadius: 'var(--border-radius)',
                        padding: '1.5rem',
                        fontWeight: 600
                    }}>
                        <span style={{ display: 'block', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.8 }}>Why this fits you:</span>
                        {suggestion.reasoning}
                    </div>
                </motion.div>
            </div>

            {/* Roadmap Visualization */}
            <div style={{ position: 'relative', padding: '0 1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        display: 'inline-block',
                        backgroundColor: 'var(--color-text)',
                        color: 'var(--color-bg)',
                        padding: '0.5rem 1.5rem',
                        transform: 'rotate(1deg)'
                    }}>
                        YOUR ROADMAP
                    </h2>
                </div>

                {/* Central Line */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '100px',
                    bottom: '0',
                    width: '4px',
                    backgroundColor: 'var(--color-border-color)',
                    borderLeft: 'var(--border-width) dashed var(--color-border-color)',
                    transform: 'translateX(-50%)',
                    zIndex: 0
                }}></div>

                {suggestion.roadmap_steps.map((step, index) => (
                    <motion.div
                        initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        key={step.id || index}
                        style={{
                            display: 'flex',
                            justifyContent: index % 2 === 0 ? 'flex-end' : 'flex-start',
                            marginBottom: '4rem',
                            position: 'relative'
                        }}
                    >
                        {/* Connector Dot */}
                        <div style={{
                            position: 'absolute',
                            left: '50%',
                            top: '2rem',
                            width: '24px',
                            height: '24px',
                            backgroundColor: 'var(--color-accent)',
                            border: 'var(--border-width) solid var(--border-color)',
                            zIndex: 10,
                            transform: 'translate(-50%, 0) rotate(45deg)'
                        }}></div>

                        {/* Card */}
                        <div className="pop-card" style={{
                            width: 'calc(50% - 3rem)',
                            position: 'relative',
                            backgroundColor: index % 2 === 0 ? 'var(--color-bg)' : 'var(--color-primary)'
                        }}>
                            {/* Step Number Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '-20px',
                                right: index % 2 === 0 ? 'auto' : '-20px',
                                left: index % 2 === 0 ? '-20px' : 'auto',
                                width: '40px',
                                height: '40px',
                                backgroundColor: 'var(--color-text)',
                                color: 'var(--color-bg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                borderRadius: '50%',
                                border: '2px solid var(--color-bg)',
                                zIndex: 20
                            }}>
                                {step.order}
                            </div>

                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.75rem' }}>{step.title}</h3>
                            <p style={{ fontWeight: 500, marginBottom: '1rem', fontSize: '1rem' }}>{step.description}</p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.875rem', fontWeight: 700 }}>
                                {step.duration && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--color-surface)', border: 'var(--border-width) solid var(--border-color)', padding: '0.25rem 0.75rem', borderRadius: '100px' }}>
                                        <Clock size={14} /> {step.duration}
                                    </div>
                                )}
                                {step.resources && step.resources.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--color-surface)', border: 'var(--border-width) solid var(--border-color)', padding: '0.25rem 0.75rem', borderRadius: '100px' }}>
                                        <BookOpen size={14} /> Resources
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Finish Line */}
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', paddingTop: '2rem' }}>
                    <div style={{
                        backgroundColor: 'var(--color-secondary)',
                        border: 'var(--border-width) solid var(--border-color)',
                        padding: '1rem 2rem',
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        boxShadow: '6px 6px 0 var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <CheckCircle size={28} /> GOAL ACHIEVED
                    </div>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '6rem' }}>
                <button onClick={() => navigate('/')} className="pop-button accent">
                    <Home size={20} /> Start New Journey
                </button>
            </div>
        </div>
    );
};

export default Roadmap;
