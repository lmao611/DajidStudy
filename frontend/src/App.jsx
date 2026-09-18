import React, { useState, useEffect } from 'react';
import { StudyProvider } from './stores/studyStore';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Schedule } from './pages/Schedule';
import { Vocabulary } from './pages/Vocabulary';
import { GiaPha } from './pages/GiaPha';
import { FlyingBannerLogo } from './components/FlyingBannerLogo';
import { ThemeTransitionOverlay } from './components/ThemeTransitionOverlay';
import { useTheme } from './hooks/useTheme';

// Parse URL path to corresponding tab ID
const getTabFromPath = (path = typeof window !== 'undefined' ? window.location.pathname : '/') => {
  const cleanPath = (path || '').toLowerCase().replace(/\/+$/, '') || '/';
  if (cleanPath === '/schedule') return 'schedule';
  if (cleanPath === '/vocabulary' || cleanPath === '/vocab') return 'vocabulary';
  if (cleanPath === '/gia-pha' || cleanPath === '/giapha') return 'giapha';
  return 'home';
};

// Map tab ID to clean URL path
const getPathFromTab = (tab) => {
  if (tab === 'schedule') return '/schedule';
  if (tab === 'vocabulary') return '/vocabulary';
  if (tab === 'giapha') return '/gia-pha';
  return '/';
};

function AppContent() {
  const [activeTab, setActiveTabState] = useState(() => getTabFromPath());
  const { isDark, toggle: toggleTheme, transitionState } = useTheme();

  const handleNavigate = (tab, replace = false) => {
    const targetPath = getPathFromTab(tab);
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      if (replace) {
        window.history.replaceState({ tab }, '', targetPath);
      } else {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
    setActiveTabState(tab);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Normalise initial URL (e.g. /vocab -> /vocabulary, trailing slashes)
    const currentTab = getTabFromPath();
    const expectedPath = getPathFromTab(currentTab);
    if (window.location.pathname !== expectedPath) {
      window.history.replaceState({ tab: currentTab }, '', expectedPath);
    }

    // Handle Browser Back / Forward buttons (popstate)
    const handlePopState = () => {
      setActiveTabState(getTabFromPath());
    };

    // Handle Global Custom Navigation Events (from modals or anywhere)
    const handleAppNavigate = (e) => {
      if (e?.detail) {
        handleNavigate(e.detail);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('app-navigate', handleAppNavigate);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('app-navigate', handleAppNavigate);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Background Dot Grid Matrix & Elongated Vertical Side Halos */}
      <div className="fixed inset-0 bg-dot-grid pointer-events-none z-0" aria-hidden="true" />
      <div className="fixed top-1/2 -translate-y-1/2 -left-32 sm:-left-44 w-60 sm:w-80 h-[85vh] bg-gradient-to-b from-blue-500/15 via-sky-500/20 to-blue-600/15 dark:from-blue-600/25 dark:via-sky-500/20 dark:to-indigo-600/25 rounded-full blur-[120px] pointer-events-none z-0" aria-hidden="true" />
      <div className="fixed top-1/2 -translate-y-1/2 -right-32 sm:-right-44 w-60 sm:w-80 h-[85vh] bg-gradient-to-b from-cyan-400/15 via-blue-500/20 to-cyan-600/15 dark:from-cyan-500/25 dark:via-blue-600/20 dark:to-teal-500/25 rounded-full blur-[120px] pointer-events-none z-0" aria-hidden="true" />

      {/* Theme Transition Overlay: Sunside & Moonside Cinematic Clash */}
      {transitionState && <ThemeTransitionOverlay toDark={transitionState.toDark} />}

      {/* Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={handleNavigate} isDark={isDark} toggleTheme={toggleTheme} />

      {/* Flying DajidStudy Logo from Banner into Navbar */}
      {activeTab === 'home' && <FlyingBannerLogo />}

      {/* Main Container */}
      <main className="flex-1 w-full">
        {activeTab === 'home' && <Home onNavigate={(tab) => handleNavigate(tab)} />}
        {activeTab === 'schedule' && (
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 lg:pt-36 pb-16">
            <Schedule />
          </div>
        )}
        {activeTab === 'vocabulary' && (
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 lg:pt-36 pb-16">
            <Vocabulary onNavigate={(tab) => handleNavigate(tab)} />
          </div>
        )}
        {activeTab === 'giapha' && (
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 lg:pt-36 pb-16">
            <GiaPha onNavigate={(tab) => handleNavigate(tab)} />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <StudyProvider>
      <AppContent />
    </StudyProvider>
  );
}
