import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Welcome from './components/Welcome';
import Questionnaire from './components/Questionnaire';
import Roadmap from './components/Roadmap';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/assessment" element={<Questionnaire />} />
      <Route path="/roadmap" element={<Roadmap />} />
    </Routes>
  );
}

export default App;
