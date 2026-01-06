import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Welcome from './components/Welcome';
import Questionnaire from './components/Questionnaire';
import Roadmap from './components/Roadmap';

function App() {
  const location = useLocation();

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '3rem'
      }}>
        <div style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.05em' }}>
          CAREER<span style={{ color: 'var(--color-primary)' }}>SEA</span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Welcome />} />
          <Route path="/assessment" element={<Questionnaire />} />
          <Route path="/roadmap" element={<Roadmap />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;
