import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight, Loader } from 'lucide-react';

const Questionnaire = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch questions from Django API
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

    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-2xl">Loading Questions...</div>;

    if (submitting) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-400 p-8">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                    <Loader size={64} />
                </motion.div>
                <h2 className="text-4xl font-black mt-8 text-center bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    ANALYZING YOUR FUTURE...
                </h2>
            </div>
        );
    }

    if (questions.length === 0) return <div>No questions found.</div>;

    const question = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-[#E0E7FF] p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-4 bg-white border-b-4 border-black">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-[#FF00FF]"
                />
            </div>

            <div className="w-full max-w-2xl">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentIndex}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        className="neo-box p-8 md:p-12 mb-8 bg-white"
                    >
                        <h2 className="text-xl font-bold text-gray-500 mb-2">Question {currentIndex + 1}/{questions.length}</h2>
                        <h1 className="text-3xl md:text-4xl font-black mb-8 leading-tight">{question.text}</h1>

                        {question.choices && question.choices.length > 0 ? (
                            <div className="grid gap-4">
                                {question.choices.map((choice) => (
                                    <button
                                        key={choice}
                                        onClick={() => setCurrentAnswer(choice)}
                                        className={`p-4 text-left text-lg font-bold border-2 border-black transition-all ${currentAnswer === choice
                                                ? 'bg-[#00FFFF] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                                                : 'bg-white hover:bg-gray-50'
                                            }`}
                                    >
                                        {choice}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <textarea
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                placeholder="Type your answer here..."
                                className="w-full p-4 text-xl border-4 border-black font-bold focus:outline-none focus:ring-4 ring-[#FFD700] min-h-[150px]"
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                <div className="flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={!currentAnswer}
                        className={`neo-button flex items-center gap-2 text-xl ${!currentAnswer ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {currentIndex === questions.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Questionnaire;
