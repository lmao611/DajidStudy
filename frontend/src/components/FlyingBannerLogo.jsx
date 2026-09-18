import React, { useEffect, useRef, useState } from 'react';

export const FlyingBannerLogo = () => {
  const logoRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [targetScale, setTargetScale] = useState(0.18);

  // Measure natural height and compute exact targetScale for the 26px navbar logo
  useEffect(() => {
    const updateScale = () => {
      if (logoRef.current) {
        const naturalHeight = logoRef.current.offsetHeight || 135;
        setTargetScale(26 / naturalHeight);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Trigger flight as soon as user scrolls down (not at the very top of the page)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      // As soon as user scrolls past 20px, it immediately flies to navbar
      if (scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      ref={logoRef}
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transformOrigin: 'center top',
        transform: isScrolled
          ? `translate3d(-50%, 18px, 0) scale(${targetScale})`
          : 'translate3d(-50%, 30vh, 0) scale(1)',
        zIndex: isScrolled ? 60 : 5,
        pointerEvents: isScrolled ? 'auto' : 'none',
        transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease',
        willChange: 'transform, opacity',
      }}
      className="select-none whitespace-nowrap cursor-pointer"
      title="DajidStudy - Cuộn về đầu trang"
    >
      <span
        className={`font-black uppercase tracking-tight text-6xl sm:text-7xl md:text-8xl lg:text-[9.5rem] xl:text-[11.5rem] leading-none transition-all duration-500 drop-shadow-2xl ${
          isScrolled
            ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 dark:from-sky-400 dark:via-blue-400 dark:to-cyan-300 bg-clip-text text-transparent'
            : 'bg-gradient-to-r from-sky-200 via-white to-blue-200 bg-clip-text text-transparent'
        }`}
      >
        DajidStudy
      </span>
    </div>
  );
};
