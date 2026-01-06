import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Map as MapIcon, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="neo-box p-12 text-center max-w-2xl bg-[#FFD700] border-4 border-black relative z-10"
            >
                <div className="flex justify-center mb-6">
                    <Compass size={64} color="black" strokeWidth={2.5} />
                </div>

                <h1 className="text-6xl font-black mb-4 uppercase tracking-tighter" style={{ textShadow: '4px 4px 0px #fff' }}>
                    CareerSea
                </h1>

                <p className="text-xl font-bold mb-8 max-w-lg mx-auto leading-relaxed">
                    Navigate the ocean of possibilities. Answer a few questions, and we'll chart a personalized course to your dream career.
                </p>

                <button
                    onClick={() => navigate('/assessment')}
                    className="neo-button accent text-2xl flex items-center gap-3 mx-auto"
                >
                    Start Journey <ArrowRight size={28} />
                </button>
            </motion.div>

            {/* Decorative Elements */}
            <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute top-20 left-20 hidden md:block"
            >
                <MapIcon size={48} className="text-cyan-400" />
            </motion.div>
        </div>
    );
};

export default Welcome;
