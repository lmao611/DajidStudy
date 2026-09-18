import React from 'react';
import { createPortal } from 'react-dom';

// Exact vector contour tracing the left cut silhouette of moonside.png (1308x736)
const MOONSIDE_LEFT_BORDER_PATH = "M 458 -10 L 458 0 L 485 25 L 496 34 L 531 73 L 532 81 L 533 82 L 533 86 L 534 87 L 534 91 L 535 92 L 535 96 L 536 97 L 536 101 L 537 102 L 537 106 L 538 107 L 538 111 L 539 112 L 539 116 L 540 117 L 540 121 L 541 122 L 541 132 L 542 133 L 542 145 L 543 146 L 543 158 L 544 159 L 543 161 L 543 166 L 542 167 L 542 173 L 541 174 L 540 185 L 539 186 L 539 192 L 538 193 L 538 223 L 539 224 L 539 244 L 540 245 L 540 249 L 541 250 L 541 253 L 542 254 L 542 257 L 543 258 L 543 261 L 545 265 L 545 268 L 546 269 L 546 272 L 547 273 L 547 276 L 548 278 L 550 280 L 552 285 L 557 292 L 559 297 L 561 299 L 565 307 L 578 322 L 578 327 L 579 328 L 580 339 L 581 340 L 582 345 L 585 350 L 585 352 L 592 366 L 592 368 L 597 377 L 598 381 L 618 401 L 649 415 L 673 416 L 695 418 L 712 425 L 735 441 L 755 462 L 768 470 L 768 471 L 774 479 L 775 482 L 781 490 L 784 496 L 784 498 L 787 503 L 787 505 L 793 517 L 792 518 L 792 524 L 791 525 L 791 530 L 790 531 L 790 537 L 789 538 L 789 543 L 788 544 L 788 550 L 787 551 L 787 557 L 786 558 L 786 564 L 785 565 L 785 571 L 784 572 L 784 579 L 783 580 L 783 598 L 784 599 L 784 601 L 785 602 L 785 604 L 787 608 L 788 614 L 801 632 L 824 644 L 851 655 L 874 661 L 893 677 L 893 699 L 894 700 L 880 713 L 854 714 L 854 727 L 855 728 L 855 735 L 855 745";

export const ThemeTransitionOverlay = ({ toDark }) => {
  if (typeof document === 'undefined') return null;

  const content = (
    <div className="fixed inset-0 z-[99999999] pointer-events-none overflow-hidden select-none">
      {/* Dimmed backdrop flash behind the sliding artwork */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs animate-theme-backdrop pointer-events-none" />

      {/* Sunside Image: covers full screen, slides in from left (z-20 when bright, z-10 when dark) */}
      <div 
        className={`absolute inset-0 w-full h-full pointer-events-none ${
          toDark ? 'animate-sunside-to-dark z-10' : 'animate-sunside-to-light z-20'
        }`}
      >
        <img
          src="/sunside.png"
          alt="Sunside"
          className="w-full h-full object-cover object-center select-none pointer-events-none"
        />
      </div>

      {/* Moonside Image: covers full screen, slides in from right (z-20 when bright, z-10 when dark) */}
      <div 
        className={`absolute inset-0 w-full h-full pointer-events-none ${
          toDark ? 'animate-moonside-to-dark z-20' : 'animate-moonside-to-light z-10'
        }`}
      >
        <img
          src="/moonside.png"
          alt="Moonside"
          className="w-full h-full object-cover object-center select-none pointer-events-none"
        />
      </div>

      {/* SEPARATE CONTOUR BORDER LAYER (z-30): Attaches to Moonside when Moonside is bright, or to Sunside when Sunside is bright */}
      <div 
        className={`absolute inset-0 w-full h-full pointer-events-none z-30 ${
          toDark ? 'animate-border-with-moonside' : 'animate-border-with-sunside'
        }`}
      >
        <svg
          viewBox="0 0 1308 736"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full pointer-events-none"
        >
          <defs>
            {/* 1. Lunar Starlight Gradient (When Moonside is Bright / toDark === true) */}
            <linearGradient id="lunarBorderGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#818cf8" stopOpacity="1" />
              <stop offset="50%" stopColor="#c7d2fe" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#6366f1" stopOpacity="1" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.95" />
            </linearGradient>

            {/* 2. Solar Golden Sunfire Gradient (When Sunside is Bright / toDark === false) */}
            <linearGradient id="solarBorderGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="20%" stopColor="#fde047" stopOpacity="1" />
              <stop offset="45%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="75%" stopColor="#ea580c" stopOpacity="1" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0.95" />
            </linearGradient>

            <filter id="borderGlowBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
            </filter>
          </defs>

          {/* 1. Ambient Glow Aura: soft wide halo overlapping onto Sunside */}
          <path
            d={MOONSIDE_LEFT_BORDER_PATH}
            fill="none"
            stroke={toDark ? '#818cf8' : '#f59e0b'}
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#borderGlowBlur)"
            opacity="0.85"
          />

          {/* 2. Main Luminous Border Ribbon: covers the cut seam */}
          <path
            d={MOONSIDE_LEFT_BORDER_PATH}
            fill="none"
            stroke={toDark ? 'url(#lunarBorderGlow)' : 'url(#solarBorderGlow)'}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 3. Core Starlight / Solar Highlight Line */}
          <path
            d={MOONSIDE_LEFT_BORDER_PATH}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
        </svg>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default ThemeTransitionOverlay;
