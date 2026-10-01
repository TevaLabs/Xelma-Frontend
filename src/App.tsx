import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ComingSoonPage from './pages/ComingSoonPage';
import HomePage from './pages/HomePage';
import TournamentPage from './pages/TournamentPage';
import { SkipLink } from './components/SkipLink';
import GlobalStyle from './styles/GlobalStyle';

const App: React.FC = () => {
  return (
    <>
      <SkipLink />
      <GlobalStyle />
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tournament" element={<ComingSoonPage />} />
          <Route path="/coming-soon" element={<ComingSoonPage />} />
          <Route path="*" element={<ComingSoonPage />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;