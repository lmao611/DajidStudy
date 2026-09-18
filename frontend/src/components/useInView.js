import { useEffect, useRef, useState } from 'react';

/**
 * useInView hook that triggers when element scrolls to around 1/3 of the viewport from bottom
 */
export const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const defaultOptions = {
      threshold: 0.05,
      rootMargin: '0px 0px -22% 0px', // Triggers around 1/3 into the screen
      ...options,
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, defaultOptions);

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, isInView];
};
