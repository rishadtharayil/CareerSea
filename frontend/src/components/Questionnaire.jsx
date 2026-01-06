import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader } from 'lucide-react';

const Questionnaire = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/questions/')
            .then(res => {
                setQuestions(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleNext = () => {
        if (!currentAnswer.trim()) return;

        const question = questions[currentIndex];
        const newAnswers = { ...answers, [question.text]: currentAnswer };
        setAnswers(newAnswers);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setCurrentAnswer('');
        } else {
            handleSubmit(newAnswers);
        }
    };

    const handleSubmit = async (finalAnswers) => {
        setSubmitting(true);
        try {
            const res = await axios.post('http://127.0.0.1:8000/api/submit/', { answers: finalAnswers });
            navigate('/roadmap', { state: { data: res.data } });
        } catch (error) {
            console.error("Submission failed", error);
            alert("Failed to analyze. Please ensure Backend is running and API Key is set.");
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', fontWeight: 800, fontSize: '1.5rem' }}>
            LOADING...
        </div>
    );

    if (submitting) {
        return (
            <div style={{
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
            }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    style={{ marginBottom: '2rem', color: 'var(--color-primary)' }}
                >
                    <Loader size={64} />
                </motion.div>
                <h2 style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    background: 'var(--color-surface)',
                    border: 'var(--border-width) solid var(--border-color)',
                    padding: '1rem 2rem',
                    boxShadow: 'var(--box-shadow-offset) var(--box-shadow-offset) 0 var(--border-color)'
                }}>
                    ANALYZING YOUR FUTURE...
                </h2>
            </div>
        );
    }

    if (questions.length === 0) return <div>No questions found.</div>;

    const question = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            {/* Progress Bar */}
            <div style={{
                width: '100%',
                height: '16px',
                border: 'var(--border-width) solid var(--border-color)',
                borderRadius: '100px',
                marginBottom: '3rem',
                backgroundColor: 'var(--color-surface)',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    style={{
                        height: '100%',
                        backgroundColor: 'var(--color-secondary)'
                    }}
                />
            </div>

            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentIndex}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="pop-card" style={{ marginBottom: '2rem' }}>
                        <h2 style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: 'var(--color-text-light)',
                            textTransform: 'uppercase',
                            marginBottom: '1rem'
                        }}>
                            Question {currentIndex + 1}/{questions.length}
                        </h2>
                        <h1 style={{
                            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                            marginBottom: '2rem',
                            lineHeight: '1.2'
                        }}>
                            {question.text}
                        </h1>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {question.choices && question.choices.length > 0 ? (
                                question.choices.map((choice) => (
                                    <button
                                        key={choice}
                                        onClick={() => setCurrentAnswer(choice)}
                                        style={{
                                            padding: '1.25rem',
                                            textAlign: 'left',
                                            fontWeight: 700,
                                            fontSize: '1.125rem',
                                            backgroundColor: currentAnswer === choice ? 'var(--color-tertiary)' : 'var(--color-bg)',
                                            border: 'var(--border-width) solid var(--border-color)',
                                            borderRadius: 'var(--border-radius)',
                                            boxShadow: currentAnswer === choice
                                                ? '2px 2px 0 var(--border-color)'
                                                : '0 0 0 transparent',
                                            transform: currentAnswer === choice ? 'translate(-2px, -2px)' : 'none',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {choice}
                                    </button>
                                ))
                            ) : (
                                <textarea
                                    value={currentAnswer}
                                    onChange={(e) => setCurrentAnswer(e.target.value)}
                                    placeholder="Type your answer here..."
                                    className="pop-input"
                                    style={{
                                        minHeight: '180px',
                                        resize: 'vertical',
                                        fontSize: '1.25rem'
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleNext}
                            disabled={!currentAnswer}
                            className="pop-button"
                            style={{
                                opacity: !currentAnswer ? 0.5 : 1,
                                cursor: !currentAnswer ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Questionnaire;
