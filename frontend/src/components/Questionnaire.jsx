import React, { useState, useEffect } from 'react';
import api from '../api';
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
        api.get('/api/questions/')
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
            const res = await api.post('/api/submit/', { answers: finalAnswers });
            navigate('/roadmap', { state: { data: res.data } });
        } catch (error) {
            console.error("Submission failed", error);
            // 401 handling is done by the api interceptor
            alert("Failed to analyze. Please ensure the AI service is available and try again.");
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh] font-black text-2xl tracking-widest animate-pulse">
            LOADING...
        </div>
    );

    if (submitting) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="mb-8 text-primary"
                >
                    <Loader size={80} strokeWidth={3} />
                </motion.div>
                <h2 className="pop-card text-2xl sm:text-3xl font-black uppercase tracking-tight py-4 px-8">
                    ANALYZING YOUR FUTURE...
                </h2>
            </div>
        );
    }

    if (questions.length === 0) return <div className="text-center font-bold p-20">No questions found.</div>;

    const question = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
        <div className="max-w-[800px] mx-auto w-full px-4 py-8">
            {/* Progress Bar */}
            <div className="w-full h-4 border-pop border-text rounded-full mb-12 bg-surface overflow-hidden relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-secondary"
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
                    <div className="pop-card mb-8">
                        <h2 className="text-sm font-black text-text-light uppercase mb-4 tracking-widest">
                            Step {currentIndex + 1} of {questions.length}
                        </h2>
                        <h1 className="text-2xl sm:text-4xl mb-10 leading-tight">
                            {question.text}
                        </h1>

                        <div className="grid gap-4">
                            {question.choices && question.choices.length > 0 ? (
                                question.choices.map((choice) => (
                                    <button
                                        key={choice}
                                        onClick={() => setCurrentAnswer(choice)}
                                        className={`w-full text-left p-6 font-bold text-lg border-pop border-text rounded-pop transition-all ${
                                            currentAnswer === choice 
                                            ? 'bg-tertiary shadow-pop -translate-x-[2px] -translate-y-[2px]' 
                                            : 'bg-bg hover:bg-surface'
                                        }`}
                                    >
                                        {choice}
                                    </button>
                                ))
                            ) : (
                                <textarea
                                    value={currentAnswer}
                                    onChange={(e) => setCurrentAnswer(e.target.value)}
                                    placeholder="Type your answer here..."
                                    className="pop-input min-h-[200px] text-xl resize-none"
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleNext}
                            disabled={!currentAnswer}
                            className={`pop-button px-12 ${!currentAnswer ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                        >
                            {currentIndex === questions.length - 1 ? 'Finish' : 'Next Step'}
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Questionnaire;
