import { useState, useEffect } from 'react';

/**
 * useTheme – Manages dark/light mode preference with cinematic sunside/moonside transition.
 * - Reads from localStorage on mount.
 * - Syncs the `dark` class on <html>.
 * - Returns { isDark, toggle, transitionState }.
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('theme') === 'dark';
  });

  const [transitionState, setTransitionState] = useState(null); // { toDark: boolean } | null

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggle = () => {
    // Prevent spamming during transition animation
    if (transitionState) return;

    const nextIsDark = !isDark;
    setTransitionState({ toDark: nextIsDark });

    // Switch theme at 530ms when both banners clash at the center 1/2
    const themeTimer = setTimeout(() => {
      setIsDark(nextIsDark);
    }, 530);

    // End transition overlay after banners fly back out
    const cleanupTimer = setTimeout(() => {
      setTransitionState(null);
    }, 1420);

    return () => {
      clearTimeout(themeTimer);
      clearTimeout(cleanupTimer);
    };
  };

  return { isDark, toggle, transitionState };
}
