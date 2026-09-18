import React, { useEffect, useRef, useState } from 'react';

/**
 * Reusable animated counter that triggers when scrolled to around 1/3 of the viewport
 */
export const CountUp = ({ end, duration = 1200, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [hasTriggered, setHasTriggered] = useState(false);
  const spanRef = useRef(null);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    // Trigger when element scrolls into around 1/3 of the viewport from bottom
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasTriggered(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -22% 0px' // Around 1/3 into the screen
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasTriggered) return;

    let startTimestamp = null;
    const endValue = Number(end) || 0;
    if (endValue === 0) {
      setCount(0);
      return;
    }

    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease-out curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(easeOut * endValue));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [hasTriggered, end, duration]);

  return (
    <span ref={spanRef} className="inline-block tabular-nums">
      {prefix}{count}{suffix}
    </span>
  );
};
