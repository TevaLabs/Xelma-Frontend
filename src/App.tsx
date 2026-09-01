import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import CommandPalette from './components/CommandPalette';
import PageSkeleton from './components/PageSkeleton';
import RouteProgressBar from './components/RouteProgressBar';
import Landing from './pages/Landing';
import RouteFallback from './components/RouteFallback';
import RouteTransition from './components/RouteTransition';
import LazyBoundary from './components/LazyBoundary';
import ErrorBoundary from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';
import Footer from './components/Footer';
import OnboardingChecklist from './components/OnboardingChecklist';

const NotFound = lazy(() => import('./pages/NotFound'));
const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ './pages/Dashboard'));
const Leaderboard = lazy(() => import(/* webpackChunkName: "leaderboard" */ './components/Leaderboard'));
const LearnPage = lazy(() => import(/* webpackChunkName: "learn" */ './pages/Learn'));
const Connect = lazy(() => import('./pages/Connect'));
const Profile = lazy(() => import('./pages/Profile'));
const Pools = lazy(() => import('./pages/Pools'));
const Tournament = lazy(() => import(/* webpackChunkName: "tournament" */ './pages/Tournament'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  const { pathname } = useLocation();
  // Landing renders its own Footer at the bottom of its bespoke layout.
  // All other routes share the global session footer for consistent branding.
  const showGlobalFooter = pathname !== '/';

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0F1A] font-sans text-[#F3F4F6]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-4 focus:left-4 focus:rounded-lg focus:bg-cyan-500 focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0A0F1A]"
      >
        Skip to main content
      </a>
      <OfflineBanner />
      <RouteProgressBar />
      <Navbar />
      <CommandPalette />
      <ErrorBoundary>
        <LazyBoundary>
          <Suspense fallback={<RouteFallback />}>
            <RouteTransition>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Suspense fallback={<PageSkeleton type="dashboard" />}><Dashboard /></Suspense>} />
                {/* /play is deprecated: its high-value panels (price chart, round
                    timeline, chat, end-round modal) now live in /dashboard. */}
                <Route path="/play" element={<Navigate to="/dashboard" replace />} />
                <Route path="/leaderboard" element={<Suspense fallback={<PageSkeleton type="leaderboard" />}><Leaderboard /></Suspense>} />
                <Route path="/learn" element={<Suspense fallback={<PageSkeleton type="learn" />}><LearnPage /></Suspense>} />
                <Route path="/connect" element={<Connect />} />
                <Route path="/pools" element={<Pools />} />
                <Route path="/tournament" element={<Suspense fallback={<PageSkeleton type="tournament" />}><Tournament /></Suspense>} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Suspense fallback={<PageSkeleton type="settings" />}><Settings /></Suspense>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </RouteTransition>
          </Suspense>
        </LazyBoundary>
      </ErrorBoundary>
      {showGlobalFooter && <Footer />}
      <Toaster richColors position="top-center" theme="dark" />
      <OnboardingChecklist />
    </div>
  );
}

export default App;
