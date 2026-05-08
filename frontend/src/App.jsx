import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Welcome from './components/Welcome';
import Questionnaire from './components/Questionnaire';
import Roadmap from './components/Roadmap';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('access_token');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/';
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: 'clamp(1rem, 5vw, 2rem)',
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
        <div>
          {isAuthenticated ? (
            <button onClick={handleLogout} className="pop-button" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>LOGOUT</button>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="/login" style={{ fontWeight: 800, textDecoration: 'none', color: 'inherit' }}>LOGIN</a>
              <a href="/register" style={{ fontWeight: 800, textDecoration: 'none', color: 'inherit' }}>REGISTER</a>
            </div>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Welcome />} />
          <Route path="/assessment" element={<Questionnaire />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;
