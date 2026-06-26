import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import RouteFallback from './components/RouteFallback';
import LazyBoundary from './components/LazyBoundary';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const LegacyDashboard = lazy(() => import('./pages/LegacyDashboard'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const LearnPage = lazy(() => import('./pages/Learn'));
const Connect = lazy(() => import('./pages/Connect'));
const Profile = lazy(() => import('./pages/Profile'));
const Tournament = lazy(() => import('./pages/Tournament'));

function App() {
  return (
    <div className="min-h-screen bg-[#0A0F1A] font-sans text-[#F3F4F6]">
      <Navbar />
      <LazyBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/play" element={<LegacyDashboard />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/connect" element={<Connect />} />
            <Route
              path="/pools"
              element={
                <div className="xelma-grid-bg px-4 py-20 text-center text-xl font-bold text-gray-500">
                  Pools — Coming Soon
                </div>
              }
            />
            <Route
              path="/tournament"
              element={
                <div className="xelma-grid-bg px-4 py-20 text-center text-xl font-bold text-gray-500">
                  Tournament — Coming Soon
                </div>
              }
            />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Suspense>
      </LazyBoundary>
      <Toaster richColors position="top-center" theme="dark" />
    </div>
  );
}

export default App;
