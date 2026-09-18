import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Crown,
  Flame,
  Zap,
  Award,
  Sparkles,
  Shield,
  Sprout,
  BookOpen,
  Target,
  MessageSquareQuote,
  Compass,
  Sun,
  Lock,
  CheckCircle2,
  Filter,
  Info,
  ChevronRight,
  FlaskConical,
  Star,
  ArrowLeft,
  X,
  TrendingUp,
  BarChart3,
  SlidersHorizontal,
  RotateCcw,
  Check
} from 'lucide-react';
import { useStudyStore } from '../stores/studyStore';
import {
  getVocabularyRank,
  getStreakRank,
  getFiveDayActivityRank
} from '../utils/testScoring';
import { calculateBadgeSummary, BADGE_TIERS } from '../utils/badgeSystem';
import { CountUp } from '../components/CountUp';

const ICON_MAP = {
  BookOpen,
  MessageSquareQuote,
  Sprout,
  Flame,
  Target,
  Sparkles,
  Zap,
  Sun,
  Compass,
  Crown
};

const realmPresets = [
  { name: 'Đấu Chi Khí', se: 0, label: '0' },
  { name: 'Đấu Giả', se: 2000, label: '2k' },
  { name: 'Đấu Sư', se: 6000, label: '6k' },
  { name: 'Đại Đấu Sư', se: 12000, label: '12k' },
  { name: 'Đấu Linh', se: 20000, label: '20k' },
  { name: 'Đấu Vương', se: 30000, label: '30k' },
  { name: 'Đấu Hoàng', se: 43000, label: '43k' },
  { name: 'Đấu Tông', se: 60000, label: '60k' },
  { name: 'Đấu Tôn', se: 82000, label: '82k' },
  { name: 'Đấu Thánh', se: 110000, label: '110k' },
  { name: 'Đấu Đế', se: 145000, label: '145k' },
  { name: 'Địa Chí Tôn', se: 190000, label: '190k' },
  { name: 'Thiên Chí Tôn', se: 250000, label: '250k' },
  { name: 'Chúa Tể Cảnh', se: 330000, label: '330k' }
];

/**
 * Ngôi sao 4 cánh tinh xảo (Four-Point Star / Sparkle SVG)
 */
const FourPointStar = ({ className = "w-2.5 h-2.5 text-amber-300", style }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M12 0 C12 6.5 6.5 12 0 12 C6.5 12 12 17.5 12 24 C12 17.5 17.5 12 24 12 C17.5 12 12 6.5 12 0 Z" />
  </svg>
);

/**
 * Danh sách vị trí các ngôi sao 4 cánh phân bố ngẫu nhiên trên toàn bề mặt thẻ Thần Danh
 */
const THAN_DANH_SCATTERED_STARS = [
  { top: '4%', left: '22%', size: 'w-2.5 h-2.5', color: 'text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,1)]', anim: 'animate-stardust-twinkle-1' },
  { top: '6%', right: '24%', size: 'w-2 h-2', color: 'text-cyan-300 drop-shadow-[0_0_6px_rgba(103,232,249,1)]', anim: 'animate-stardust-twinkle-2' },
  { top: '18%', left: '6%', size: 'w-3 h-3', color: 'text-pink-300 drop-shadow-[0_0_7px_rgba(244,114,182,1)]', anim: 'animate-stardust-twinkle-3' },
  { top: '25%', right: '6%', size: 'w-2.5 h-2.5', color: 'text-emerald-300 drop-shadow-[0_0_6px_rgba(110,231,183,1)]', anim: 'animate-stardust-twinkle-1' },
  { top: '46%', left: '5%', size: 'w-2 h-2', color: 'text-amber-200 drop-shadow-[0_0_6px_rgba(253,230,138,1)]', anim: 'animate-stardust-twinkle-2' },
  { top: '55%', right: '5%', size: 'w-3 h-3', color: 'text-purple-300 drop-shadow-[0_0_7px_rgba(216,180,254,1)]', anim: 'animate-stardust-twinkle-3' },
  { top: '72%', left: '6%', size: 'w-2.5 h-2.5', color: 'text-cyan-200 drop-shadow-[0_0_6px_rgba(165,243,252,1)]', anim: 'animate-stardust-twinkle-1' },
  { top: '80%', right: '7%', size: 'w-2 h-2', color: 'text-rose-300 drop-shadow-[0_0_6px_rgba(253,164,175,1)]', anim: 'animate-stardust-twinkle-2' },
  { top: '93%', left: '18%', size: 'w-2.5 h-2.5', color: 'text-yellow-300 drop-shadow-[0_0_6px_rgba(253,224,71,1)]', anim: 'animate-stardust-twinkle-3' },
  { top: '94%', right: '20%', size: 'w-2 h-2', color: 'text-sky-300 drop-shadow-[0_0_6px_rgba(125,211,252,1)]', anim: 'animate-stardust-twinkle-1' },
];

/**
 * Visual Emblem inside Card Artwork Chamber
 */
const BadgeEmblem = ({ badge, tier, isUnlocked }) => {
  const IconComponent = ICON_MAP[badge.icon] || Award;
  const tierId = badge.tier;

  return (
    <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 select-none">
      {/* 1. Locked: Khóa xích niêm ấn */}
      {!isUnlocked && (
        <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-stone-300/40 dark:bg-stone-900/80 border-2 border-dashed border-stone-400 dark:border-stone-700 flex items-center justify-center grayscale">
          <IconComponent className="w-10 h-10 text-stone-500 dark:text-stone-600" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl backdrop-blur-[2px]">
            <Lock className="w-7 h-7 text-stone-300 dark:text-stone-400 drop-shadow-lg" />
          </div>
        </div>
      )}

      {/* 2. Unlocked: Hạ Phẩm (Nâu đồng - Không glow) */}
      {isUnlocked && tierId === 'ha_pham' && (
        <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-amber-800 via-amber-950 to-stone-900 border-2 border-amber-700/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
          <div className="absolute inset-1.5 rounded-2xl border border-amber-600/40 pointer-events-none" />
          <IconComponent className="w-10 h-10 text-amber-400 drop-shadow-md" />
        </div>
      )}

      {/* 3. Unlocked: Trung Phẩm (Xanh lá - Sinh cơ ngọc bích) */}
      {isUnlocked && tierId === 'trung_pham' && (
        <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-emerald-950/95 via-teal-900/80 to-slate-950 border-2 border-emerald-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
          <div className="absolute inset-1.5 rounded-2xl border border-emerald-400/40 pointer-events-none" />
          <IconComponent className="w-10 h-10 text-emerald-300 drop-shadow-md" />
        </div>
      )}

      {/* 4. Unlocked: Thượng Phẩm (Xanh dương - Glow nhẹ) */}
      {isUnlocked && tierId === 'thuong_pham' && (
        <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-blue-950 via-cyan-950 to-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_22px_rgba(59,130,246,0.6)] group-hover:scale-110 transition-transform duration-300">
          <div className="absolute -inset-1 rounded-3xl bg-cyan-500/25 blur-md pointer-events-none" />
          <div className="absolute inset-1.5 rounded-2xl border border-cyan-300/50 pointer-events-none" />
          <IconComponent className="w-10 h-10 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)] relative z-10" />
        </div>
      )}

      {/* 5. Unlocked: Cực Phẩm (Đỏ/Vàng - Xích viêm kim quang) */}
      {isUnlocked && tierId === 'cuc_pham' && (
        <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-rose-950 via-amber-950 to-stone-950 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.7)] group-hover:scale-110 transition-transform duration-300">
          <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-rose-600/40 to-amber-500/40 blur-md pointer-events-none" />
          <div className="absolute inset-1.5 rounded-2xl border border-amber-300/60 pointer-events-none" />
          <IconComponent className="w-10 h-10 text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,1)] relative z-10" />
        </div>
      )}

      {/* 6. Unlocked: Hỗn Độn (Vòng xoáy tối hư không chuyển động tròn hoàn hảo bên trong khung) */}
      {isUnlocked && tierId === 'hon_don' && (
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-3.5 rounded-full border-2 border-dashed border-purple-400/80 bg-gradient-to-tr from-blue-600/35 via-fuchsia-500/30 to-purple-600/35 blur-[2px] animate-cosmic-swirl pointer-events-none" />
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-indigo-950 via-fuchsia-950 to-purple-950 border-2 border-fuchsia-400 flex items-center justify-center shadow-[0_0_38px_rgba(168,85,247,0.9)] group-hover:scale-110 transition-transform duration-300 z-10">
            <div className="absolute inset-1.5 rounded-2xl border border-fuchsia-300/50 pointer-events-none" />
            <IconComponent className="w-10 h-10 text-fuchsia-300 drop-shadow-[0_0_12px_rgba(217,70,239,1)] relative z-10" />
          </div>
        </div>
      )}

      {/* 7. Unlocked: Thần Danh (7 sắc, vệt sáng quét ngang, sao 4 cánh nhỏ) */}
      {isUnlocked && tierId === 'than_danh' && (
        <div className="relative flex items-center justify-center animate-stardust-float">
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 via-cyan-400 via-blue-500 via-purple-500 to-pink-500 blur-md opacity-85 animate-rainbow-prism pointer-events-none" />
          
          <div className="absolute -top-2 -right-2 animate-stardust-twinkle-1 pointer-events-none">
            <FourPointStar className="w-3 h-3 text-amber-200 drop-shadow-[0_0_4px_rgba(251,191,36,0.9)]" />
          </div>
          <div className="absolute -bottom-2 -left-2 animate-stardust-twinkle-2 pointer-events-none">
            <FourPointStar className="w-2.5 h-2.5 text-cyan-200 drop-shadow-[0_0_4px_rgba(103,232,249,0.9)]" />
          </div>

          <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-slate-950 via-rose-950/80 to-slate-900 border-2 border-amber-300 flex items-center justify-center shadow-[0_0_45px_rgba(236,72,153,0.95)] overflow-hidden group-hover:scale-110 transition-transform duration-300 z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/85 to-transparent w-full h-full animate-lens-gleam pointer-events-none" />
            <div className="absolute inset-1.5 rounded-2xl border border-amber-300/50 pointer-events-none" />
            <IconComponent className="w-10 h-10 text-amber-200 drop-shadow-[0_0_14px_rgba(251,191,36,1)] relative z-10" />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * THẺ BÀI HUY HIỆU TU TIÊN (Collectible Cultivation Soul Card)
 * Hiệu ứng toàn thẻ, ôm sát viền (không bị chòi góc) và hỗ trợ cả Dark/Light Mode
 */
const BadgeCard = ({ badge, tier, currentValue, targetValue, isUnlocked, progressPct, isForceActive, index, onClick }) => {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const tierId = badge.tier;

  // Hiệu ứng tương tác 3D tilt và tráng gương y hệt ProductCard
  const handleMouseMove = (e) => {
    if (window.innerWidth < 1024) return;
    const card = cardRef.current;
    const glare = glareRef.current;
    if (!card || !glare) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * 12;
    const rotateY = ((x - centerX) / centerX) * 12;
    card.style.transform = `perspective(800px) scale(1.07) rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`;
    // Điều chỉnh -90deg để góc gradient khớp chuẩn xác theo hướng nghiêng chuột
    const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) - 90;
    // Làm trong suốt hơn (maxOpacity 0.10 cho thẻ mở, 0.045 cho thẻ khóa)
    const maxOpacity = isUnlocked ? 0.10 : 0.045;
    const opacity = Math.min(maxOpacity, (Math.hypot(x - centerX, y - centerY) / (rect.width / 1.5)) * 0.45);
    // Bề dày dài ra (tăng độ trải gradient từ cạnh thẻ vào sâu đến 58%)
    glare.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,${opacity}) 0%, transparent 58%)`;
  };

  const handleMouseLeave = () => {
    if (window.innerWidth < 1024) return;
    const card = cardRef.current;
    const glare = glareRef.current;
    if (!card || !glare) return;
    card.style.transform = "perspective(800px) scale(1) rotateX(0deg) rotateY(0deg)";
    glare.style.background = "transparent";
  };

  return (
    <div
      className={`relative group animate-card-deal ${
        isUnlocked && tierId === 'than_danh' ? 'animate-card-float-grand' : ''
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* KHUNG 3D TILT TỔNG THỂ:
          Chứa cả viền hào quang bên ngoài và thân thẻ bên trong, đảm bảo viền và hiệu ứng nghiêng đồng bộ theo hover chuột!
      */}
      <div
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.15s ease-out'
        }}
        className="relative w-full cursor-pointer transition-transform duration-300"
      >
        {/* =========================================================
            1. HÀO QUANG VÀ VIỀN NGOÀI TOÀN THẺ (Nghiêng 3D đồng bộ với thẻ)
            ========================================================= */}

        {/* HỖN ĐỘN: Hào quang tối hư không ôm sát viền thẻ */}
        {isUnlocked && tierId === 'hon_don' && (
          <>
            <div className="absolute -inset-2.5 rounded-[32px] bg-gradient-to-r from-blue-600/40 via-fuchsia-600/40 to-purple-600/40 blur-lg animate-cosmic-void pointer-events-none z-0" />
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-purple-500/60 via-fuchsia-500/60 to-blue-500/60 blur-xs pointer-events-none z-0" />
          </>
        )}

        {/* THẦN DANH: 7 sắc cầu vồng prismatic rực rỡ (Ambient blur + Radiant rim halo) */}
        {isUnlocked && tierId === 'than_danh' && (
          <>
            {/* Lớp hào quang tỏa rộng (Ambient atmospheric glow) */}
            <div className="absolute -inset-3 rounded-[34px] bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 via-cyan-400 via-blue-500 via-purple-500 to-pink-500 opacity-80 blur-xl animate-rainbow-prism pointer-events-none z-0" />
            {/* Lớp viền sắc nét phát sáng (Radiant sharp rim) */}
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 via-cyan-400 via-blue-500 via-purple-500 to-pink-500 opacity-90 blur-xs animate-rainbow-prism pointer-events-none z-0" />
          </>
        )}

        {/* CỰC PHẨM: Lửa mặt trời xích viêm hoàng kim quanh toàn bộ thẻ */}
        {isUnlocked && tierId === 'cuc_pham' && (
          <>
            <div className="absolute -inset-2.5 rounded-[32px] bg-gradient-to-r from-rose-500/40 via-amber-500/35 to-orange-500/40 blur-xl animate-solar-fire pointer-events-none z-0" />
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-rose-500/60 to-amber-400/60 blur-xs pointer-events-none z-0" />
          </>
        )}

        {/* THƯỢNG PHẨM: Lam quang sapphire thanh tú quanh toàn bộ thẻ */}
        {isUnlocked && tierId === 'thuong_pham' && (
          <div className="absolute -inset-1.5 rounded-[28px] bg-cyan-500/30 blur-md animate-card-aura pointer-events-none z-0" />
        )}

        {/* TRUNG PHẨM: Sinh cơ ngọc lục bảo quanh toàn bộ thẻ */}
        {isUnlocked && tierId === 'trung_pham' && (
          <div className="absolute -inset-1 rounded-[26px] bg-emerald-500/25 blur-sm pointer-events-none z-0" />
        )}

        {/* =========================================================
            2. THÂN THẺ CHÍNH (CARD CONTAINER)
            ========================================================= */}
        <div
          className={`relative w-full rounded-3xl p-5 sm:p-5.5 flex flex-col justify-between overflow-hidden border-2 select-none z-10 min-h-[480px] shadow-xl transition-all duration-300 ${
            isUnlocked
              ? `bg-white dark:bg-slate-900 ${tier.borderColor} ${
                  tierId === 'than_danh'
                    ? 'shadow-[0_0_50px_rgba(236,72,153,0.85),_0_0_25px_rgba(6,182,212,0.65),_0_0_15px_rgba(251,191,36,0.5)]'
                    : tierId === 'hon_don'
                    ? 'shadow-[0_0_35px_rgba(168,85,247,0.7)]'
                    : tierId === 'cuc_pham'
                    ? 'shadow-[0_0_30px_rgba(244,63,94,0.6)]'
                    : tierId === 'thuong_pham'
                    ? 'shadow-[0_0_24px_rgba(59,130,246,0.45)]'
                    : tierId === 'trung_pham'
                    ? 'shadow-[0_0_18px_rgba(16,185,129,0.3)]'
                    : 'shadow-lg border-amber-900/60 dark:border-amber-800/60'
                }`
              : 'bg-slate-100/90 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 opacity-65 hover:opacity-90 grayscale-[85%]'
          }`}
        >
          {/* Nền Texture Gradient cho thẻ ở cả Giao diện Sáng và Tối */}
          <div className={`absolute inset-0 pointer-events-none opacity-40 dark:opacity-60 ${
            isUnlocked
              ? tierId === 'than_danh'
                ? 'bg-gradient-to-b from-rose-500/15 via-purple-500/10 to-slate-950/40'
                : tierId === 'hon_don'
                ? 'bg-gradient-to-b from-blue-600/20 via-fuchsia-600/15 to-purple-950/40'
                : tierId === 'cuc_pham'
                ? 'bg-gradient-to-b from-rose-500/15 via-amber-500/10 to-stone-950/30'
                : tierId === 'thuong_pham'
                ? 'bg-gradient-to-b from-blue-500/15 via-cyan-500/10 to-slate-950/30'
                : tierId === 'trung_pham'
                ? 'bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-slate-950/30'
                : 'bg-gradient-to-b from-amber-500/10 via-stone-500/5 to-stone-950/30'
              : 'bg-slate-300/30 dark:bg-black/40'
          }`} />

          {/* Hiệu ứng tráng gương Holographic Sheen quét chéo bao trọn toàn bộ thẻ */}
          {isUnlocked && (tierId === 'than_danh' || tierId === 'cuc_pham' || tierId === 'hon_don') && (
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-3xl">
              <div
                className="absolute top-0 -left-[100%] w-[300%] h-full animate-card-holo-sheen"
                style={{
                  background:
                    tierId === 'than_danh'
                      ? 'linear-gradient(115deg, transparent 0%, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(251,191,36,0.4) 48%, rgba(255,255,255,0.9) 50%, rgba(56,189,248,0.4) 52%, rgba(244,114,182,0.3) 55%, transparent 60%, transparent 100%)'
                      : tierId === 'hon_don'
                      ? 'linear-gradient(115deg, transparent 0%, transparent 40%, rgba(168,85,247,0.25) 46%, rgba(255,255,255,0.85) 50%, rgba(59,130,246,0.35) 54%, transparent 60%, transparent 100%)'
                      : 'linear-gradient(115deg, transparent 0%, transparent 42%, rgba(245,158,11,0.3) 46%, rgba(255,255,255,0.9) 50%, rgba(244,63,94,0.3) 54%, transparent 58%, transparent 100%)'
                }}
              />
            </div>
          )}

          {/* Ngôi sao 4 cánh phân bố ngẫu nhiên trên toàn bề mặt thẻ Thần Danh */}
          {isUnlocked && tierId === 'than_danh' && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {THAN_DANH_SCATTERED_STARS.map((star, sIdx) => (
                <div
                  key={sIdx}
                  className={`absolute ${star.anim}`}
                  style={{
                    top: star.top,
                    left: star.left,
                    right: star.right
                  }}
                >
                  <FourPointStar className={`${star.size} ${star.color}`} />
                </div>
              ))}
            </div>
          )}

          {/* Lớp phản chiếu 3D bóng đổ (Glare) giống hệt ProductCard */}
          <div
            ref={glareRef}
            className="pointer-events-none absolute inset-0 rounded-3xl z-30 transition-opacity duration-300"
          />

        {/* =========================================================
            HEADER THẺ: CẤP BẬC & TRẠNG THÁI ĐẮC ĐẠO
            ========================================================= */}
        <div className="relative z-10 flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-xs ${
              isUnlocked ? tier.tagBg : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
            }`}>
              {tier.name}
            </span>
            {isForceActive && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-[9px] font-black text-slate-950 uppercase tracking-tight shadow-xs">
                TEST
              </span>
            )}
          </div>

          {isUnlocked ? (
            <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ĐẮC ĐẠO</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
              <Lock className="w-3 h-3" />
              <span>CHƯA MỞ</span>
            </span>
          )}
        </div>

        {/* =========================================================
            KHUNG BẢO VẬT TRUNG TÂM (CARD ARTWORK CHAMBER)
            ========================================================= */}
        <div className="relative my-3.5 rounded-2xl p-4 flex flex-col items-center justify-center overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-gradient-to-b from-slate-100 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900/90 dark:to-slate-950 shadow-inner">
          {/* Vòng quay pháp trận phía sau bảo vật */}
          <div className="absolute inset-0 flex items-center justify-center opacity-15 dark:opacity-25 pointer-events-none">
            <div className="w-36 h-36 rounded-full border-2 border-dashed border-amber-500 dark:border-amber-400 animate-[spin_25s_linear_infinite]" />
          </div>

          {/* Huy hiệu bảo vật lớn */}
          <BadgeEmblem
            badge={badge}
            tier={tier}
            isUnlocked={isUnlocked}
          />

          {/* Danh xưng phụ của thẻ */}
          <span className="relative z-10 mt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center line-clamp-1 italic">
            {badge.subtitle}
          </span>
        </div>

        {/* =========================================================
            NỘI DUNG CHÂN NGÔN & ĐIỀU KIỆN
            ========================================================= */}
        <div className="relative z-10 flex-1 flex flex-col justify-between space-y-2.5 my-1">
          <div>
            <h4 className={`text-base sm:text-lg font-black tracking-tight text-center leading-tight line-clamp-1 ${
              isUnlocked
                ? tierId === 'than_danh'
                  ? tier.textColor
                  : 'text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              {badge.title}
            </h4>

            {/* Chân ngôn truyền thừa (Flavor text) */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 text-center italic mt-1 px-1">
              "{badge.flavorText}"
            </p>
          </div>

          {/* Hộp điều kiện chứng đạo */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 line-clamp-1">
              {badge.conditionDesc}
            </span>
          </div>
        </div>

        {/* =========================================================
            CHÂN THẺ: TIẾN ĐỘ TU HÀNH & THANH NĂNG LƯỢNG
            ========================================================= */}
        <div className="relative z-10 pt-3 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              {isUnlocked ? 'Thành Tựu Đạt' : 'Tiến Độ Tu Luyện'}
            </span>
            <span className={`font-black ${
              isUnlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
            }`}>
              {currentValue} / {targetValue} {badge.unit} ({progressPct}%)
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isUnlocked
                  ? tierId === 'than_danh'
                    ? 'bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 to-purple-500 animate-rainbow-prism'
                    : tierId === 'hon_don'
                    ? 'bg-gradient-to-r from-blue-500 via-fuchsia-500 to-purple-500'
                    : tierId === 'cuc_pham'
                    ? 'bg-gradient-to-r from-rose-500 to-amber-400'
                    : tierId === 'thuong_pham'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                    : tierId === 'trung_pham'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-amber-700 to-amber-900'
                  : 'bg-slate-400 dark:bg-slate-600'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export const GiaPha = ({ onNavigate }) => {
  const { profile, updateProfile, vocabularies, resetLearningProgress } = useStudyStore();
  const [isForceActiveFull, setIsForceActiveFull] = useState(false);
  const [selectedTierFilter, setSelectedTierFilter] = useState('ALL');
  const [activeBadgeDetail, setActiveBadgeDetail] = useState(null);

  // States y chang Cửa sổ Hồ Sơ (ProfileRankModal)
  const [previewSE, setPreviewSE] = useState(null);
  const [showSEControl, setShowSEControl] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activeChartMetric, setActiveChartMetric] = useState('pointsSE');
  const [hoveredDayIndex, setHoveredDayIndex] = useState(null);

  // Close badge detail on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeBadgeDetail) {
        setActiveBadgeDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeBadgeDetail]);

  const totalSE = previewSE !== null ? previewSE : (profile?.stats?.totalSE ?? 0);
  const streakDays = profile?.stats?.streakDays ?? 0;
  const testsCompleted = profile?.stats?.testsCompleted ?? (profile?.testHistory?.length || 0);
  const masteredCount = (vocabularies || []).filter(v => v.isMastered).length;

  const vocabRankInfo = getVocabularyRank(totalSE);
  const streakRankInfo = getStreakRank(streakDays);

  // Chuỗi 5 ngày gần nhất tính toán y chang ProfileRankModal
  const chartDays = useMemo(() => {
    const now = new Date();
    const result = [];
    const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    
    const historyMap = new Map();
    (profile?.studyHistory || []).forEach(item => {
      if (!item) return;
      if (item.isoDate) historyMap.set(item.isoDate, item);
      if (item.date) historyMap.set(item.date, item);
    });

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateKey = `${day}/${month}`;
      const isoKey = `${d.getFullYear()}-${month}-${day}`;

      let label = dayNames[d.getDay()];
      if (i === 0) label = 'Hôm nay';
      else if (i === 1) label = 'Hôm qua';

      const entry = historyMap.get(isoKey) || historyMap.get(dateKey) || {};
      const totalVocabs = Math.max(0, vocabularies?.length || 0);
      const rawWords = Array.isArray(entry.reviewedWordIds)
        ? entry.reviewedWordIds.length
        : (Number(entry.wordsLearned) || 0);
      // Số từ đã ôn trong ngày = số lượng từ độc nhất, tối đa bằng tổng số từ trong kho
      const uniqueWords = totalVocabs > 0 ? Math.min(totalVocabs, rawWords) : rawWords;

      result.push({
        date: dateKey,
        isoDate: isoKey,
        dayName: label,
        isToday: i === 0,
        isYesterday: i === 1,
        pointsSE: Number(entry.pointsSE) || 0,
        wordsLearned: uniqueWords,
        testsCount: Number(entry.testsCount) || 0,
        reviewedWordIds: entry.reviewedWordIds
      });
    }
    return result;
  }, [profile?.studyHistory, vocabularies?.length]);

  const activityRankInfo = getFiveDayActivityRank(chartDays, vocabularies.length);
  const maxSEVal = Math.max(...chartDays.map(d => d.pointsSE), 100);
  const maxWordsVal = Math.max(...chartDays.map(d => d.wordsLearned), 10);

  const { badgesWithProgress, unlockedCount, totalCount, completionPct } = useMemo(() => {
    return calculateBadgeSummary(profile, vocabularies, isForceActiveFull);
  }, [profile, vocabularies, isForceActiveFull]);

  const filteredBadges = useMemo(() => {
    if (selectedTierFilter === 'ALL') return badgesWithProgress;
    if (selectedTierFilter === 'UNLOCKED') return badgesWithProgress.filter(b => b.isUnlocked);
    return badgesWithProgress.filter(b => b.badge.tier === selectedTierFilter);
  }, [badgesWithProgress, selectedTierFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* =========================================================
          PAGE HEADER & BREADCRUMB
          ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <button
              onClick={() => onNavigate?.('home')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </button>
            <span>/</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Gia Phả Tu Tiên</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span>📜 Gia Phả Tu Tiên</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              Bộ Thẻ Bài Huy Hiệu
            </span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Ghi chép chân truyền tu vi bản mệnh và kho tàng huân chương học từ vựng
          </p>
        </div>

        {/* Nút Test Toàn Bộ (Active Full) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsForceActiveFull(prev => !prev)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md ${
              isForceActiveFull
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black ring-2 ring-amber-400 animate-pulse'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-amber-600 dark:text-amber-300 border border-amber-400/40'
            }`}
            title="Kích hoạt xem trước toàn bộ 10 thẻ bài huy hiệu ở trạng thái đã đạt"
          >
            <FlaskConical className={`w-4 h-4 ${isForceActiveFull ? 'animate-bounce' : ''}`} />
            <span>{isForceActiveFull ? '⚡ Đang Bật Test Full (Tắt)' : '🧪 Active Full (Test Toàn Bộ)'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          PHẦN 1: HỒ SƠ TU TIÊN (THÔNG TIN Y CHANG CỬA SỔ HỒ SƠ)
          ========================================================= */}
      <section className="relative rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xl backdrop-blur-md overflow-hidden space-y-6">
        {/* Glow ambient lights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

        {/* 1.1 Khung Tổng Quan Avatar & Danh Xưng */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
          <div className="relative flex-shrink-0">
            <img
              src={profile?.avatar && profile.avatar !== '/avatar.svg' ? profile.avatar : '/avt.jpg'}
              alt={profile?.name}
              onError={(e) => { e.currentTarget.src = '/avt.jpg'; }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-amber-400/40 shadow-2xl bg-slate-800"
            />
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-0.5">
              <Crown className="w-3 h-3 fill-slate-950" />
              <span>VIP</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white truncate">
                {profile?.name}
              </h2>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-600 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Learner
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-2xl">
              {profile?.bio || "Hành trình tích lũy Spirit Energy và chinh phục đỉnh cao từ vựng."}
            </p>

            <div className="flex items-center justify-center md:justify-start gap-2.5 mt-4 flex-wrap">
              <div 
                onClick={() => setShowSEControl(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-xs text-amber-700 dark:text-amber-300 font-bold cursor-pointer hover:bg-amber-500/25 transition-all shadow-xs"
                title="Nhấn để mở thanh thử nghiệm SE và xem các cấp cảnh giới"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-[spin_5s_linear_infinite]" />
                <span><CountUp end={totalSE} duration={1000} /> SE</span>
                {previewSE !== null && (
                  <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded ml-1">XEM THỬ</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 border border-orange-400/30 text-xs text-orange-700 dark:text-orange-300 font-semibold">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                <span>{streakDays} ngày streak</span>
              </div>
            </div>
          </div>
        </div>

        {/* 1.2 CẢNH GIỚI TU LUYỆN (Y chang Cửa sổ Hồ Sơ) */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-stretch gap-6 pt-2">
          {/* Huy hiệu cảnh giới lớn bên trái */}
          <div className="flex-shrink-0 flex items-center justify-center relative group min-h-[144px]">
            <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/30 rounded-full blur-2xl animate-pulse pointer-events-none" />
            <img
              src={encodeURI(vocabRankInfo.currentRank.badgeImage)}
              alt={vocabRankInfo.currentRank.name}
              className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 object-contain filter drop-shadow-2xl select-none hover:scale-105 hover:-rotate-1 transition-transform duration-300 relative z-10"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          {/* Khung chi tiết cảnh giới và thanh tiến trình đột phá */}
          <div className="flex-1 min-w-0 w-full p-5 sm:p-6 rounded-2xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-center space-y-3.5">
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Cảnh Giới Tu Luyện</span>
                </span>

                <button
                  type="button"
                  onClick={() => setShowSEControl(prev => !prev)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Mở thanh thử nghiệm SE để xem các cấp cảnh giới"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{showSEControl ? 'Đóng thử nghiệm' : 'Thử nghiệm SE'}</span>
                  {previewSE !== null && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  )}
                </button>
              </div>

              <div className="flex items-baseline gap-2.5 flex-wrap mt-1">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {vocabRankInfo.currentRank.name}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  ({totalSE.toLocaleString()} SE)
                </span>
                {previewSE !== null && (
                  <span className="text-[10px] font-black tracking-wide px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                    ĐANG XEM THỬ
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                {vocabRankInfo.currentRank.title}
              </p>
            </div>

            {/* Bảng điều khiển thử nghiệm SE (14 cảnh giới) */}
            {showSEControl && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 shadow-sm space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Chọn mốc Cảnh Giới để xem thử ngay:
                  </span>
                  {previewSE !== null && (
                    <button
                      type="button"
                      onClick={() => setPreviewSE(null)}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Khôi phục SE gốc
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {realmPresets.map((r) => {
                    const isSelected = previewSE !== null 
                      ? (vocabRankInfo.currentRank.name === r.name)
                      : (totalSE >= r.se && (r.name === vocabRankInfo.currentRank.name));
                    return (
                      <button
                        key={r.name}
                        type="button"
                        onClick={() => setPreviewSE(r.se)}
                        className={`px-1.5 py-1 rounded-lg text-[11px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102 ring-2 ring-indigo-300'
                            : 'bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 border-slate-200 dark:border-slate-700'
                        }`}
                        title={`${r.name}: ${r.se.toLocaleString()} SE`}
                      >
                        <span className="truncate max-w-full leading-tight">{r.name}</span>
                        <span className={`text-[9px] font-mono leading-tight ${isSelected ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                          {r.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 flex-wrap">
                  <div className="flex-1 min-w-[140px] flex items-center gap-1.5">
                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">SE tùy chỉnh:</label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={previewSE !== null ? previewSE : (profile?.stats?.totalSE ?? 0)}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        setPreviewSE(val);
                      }}
                      className="w-full text-xs font-bold font-mono px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      placeholder="Nhập số SE..."
                    />
                  </div>

                  {previewSE !== null && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => setPreviewSE(null)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await updateProfile({
                              stats: {
                                ...profile.stats,
                                totalSE: previewSE
                              }
                            });
                            setPreviewSE(null);
                            alert(`Đã lưu mức ${previewSE.toLocaleString()} SE vào tài khoản của bạn!`);
                          } catch (e) {
                            alert('Lỗi khi lưu SE: ' + e.message);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                        title="Lưu vĩnh viễn số SE này vào database"
                      >
                        <Check className="w-3 h-3" />
                        Lưu vào nick
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Thanh tiến trình đột phá cảnh giới */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Đột phá cảnh giới: {vocabRankInfo.progressPercent}%</span>
                </span>
                <span className="text-blue-700 dark:text-blue-400 font-bold">
                  {totalSE.toLocaleString()} SE {vocabRankInfo.nextRank ? `/ ${(vocabRankInfo.currentRank.maxSE + 1).toLocaleString()} SE` : '(Đỉnh Phong)'}
                </span>
              </div>

              <div className="h-3 w-full bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 shadow-inner border border-slate-200 dark:border-slate-600">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all duration-1000 ease-out"
                  style={{ width: `${vocabRankInfo.progressPercent}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-right font-medium">
                {vocabRankInfo.nextRank ? (
                  <>Cần thêm <strong className="text-blue-600 dark:text-blue-400 font-bold">{vocabRankInfo.expToNext.toLocaleString()} SE</strong> để đột phá cảnh giới <strong className="text-slate-800 dark:text-slate-200">{vocabRankInfo.nextRank.name}</strong></>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">★ Bạn đã đạt cảnh giới tối cao — Chúa Tể Cảnh! ★</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 1.3 BIỂU ĐỒ MỨC ĐỘ HỌC 5 NGÀY GẦN NHẤT (Y chang Cửa sổ Hồ Sơ) */}
        <div className="relative z-10 p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                  Biểu Đồ Mức Độ Học Tập (5 Ngày Gần Nhất)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Đánh giá cường độ & tần suất tích lũy Spirit Energy
              </p>
            </div>

            {/* 5-Day Activity Rank Badge (Devil May Cry 5 Style) */}
            <div className="flex items-center gap-2">
              <div 
                className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:border-amber-400/40 transition-all cursor-help group"
                title={`Ôn tập & đánh giá trung bình ${activityRankInfo.avgDailyWords}/${activityRankInfo.totalWords} lượt/ngày (${activityRankInfo.avgDailyPercent}% kho từ/ngày) trong 5 ngày qua`}
              >
                <div className="relative flex items-center justify-center min-w-[48px] min-h-[48px]">
                  <img
                    src={encodeURI(activityRankInfo.badgeImage)}
                    alt={activityRankInfo.rank}
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain filter drop-shadow-sm select-none group-hover:scale-110 transition-transform duration-200 relative z-10"
                  />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight block leading-tight">
                    {activityRankInfo.title}
                  </span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-extrabold block mt-0.5">
                    Hạng {activityRankInfo.rank} ({activityRankInfo.wordPercent}%/ngày)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Toggle Tabs */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveChartMetric('pointsSE')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeChartMetric === 'pointsSE'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ⚡ Điểm SE ({activityRankInfo.total5DaysSE.toLocaleString()} SE)
              </button>
              <button
                onClick={() => setActiveChartMetric('wordsLearned')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeChartMetric === 'wordsLearned'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                📚 Số lượt ({activityRankInfo.total5DaysWords} lượt)
              </button>
            </div>

            <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
              Rê chuột lên cột để xem chi tiết
            </span>
          </div>

          {/* Visual SVG Interactive Bar Chart */}
          <div className="pt-4 pb-2">
            <div className="grid grid-cols-5 gap-2 sm:gap-4 items-end px-1 pb-2">
              {chartDays.map((item, idx) => {
                const val = activeChartMetric === 'pointsSE' ? item.pointsSE : item.wordsLearned;
                const maxVal = activeChartMetric === 'pointsSE' ? maxSEVal : maxWordsVal;
                const hasData = val > 0;
                const heightPercent = hasData
                  ? Math.max(14, Math.min(100, Math.round((val / maxVal) * 100)))
                  : 6;
                const isHovered = hoveredDayIndex === idx;

                return (
                  <div 
                    key={item.isoDate || idx}
                    className="flex flex-col items-center justify-end group cursor-pointer relative"
                    onMouseEnter={() => setHoveredDayIndex(idx)}
                    onMouseLeave={() => setHoveredDayIndex(null)}
                  >
                    {isHovered && (
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white text-[11px] py-2 px-3 rounded-2xl shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150 border border-slate-700/60">
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          <span className={item.isToday ? 'text-blue-400' : 'text-amber-300'}>
                            {item.dayName} ({item.date})
                          </span>
                          {item.isToday && (
                            <span className="px-1.5 py-0.2 bg-blue-500/30 text-blue-300 rounded text-[9px] border border-blue-400/40">
                              Hôm nay
                            </span>
                          )}
                          {item.isYesterday && (
                            <span className="px-1.5 py-0.2 bg-slate-700 text-slate-300 rounded text-[9px]">
                              Hôm qua
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 text-[10px] space-y-0.5">
                          <p className="flex items-center gap-1.5">
                            <span>⚡</span>
                            <strong className="text-amber-300">+{item.pointsSE.toLocaleString()}</strong> SE
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span>📚</span>
                            <strong className="text-white">{item.wordsLearned}</strong> lượt ôn luyện
                            {item.testsCount > 0 && <span> • 🎯 <strong>{item.testsCount}</strong> bài test</span>}
                          </p>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                      </div>
                    )}

                    <span className={`text-[10px] mb-2 transition-all font-bold ${
                      isHovered 
                        ? 'text-blue-600 dark:text-blue-400 scale-110' 
                        : item.isToday 
                          ? 'text-blue-600 dark:text-blue-400 font-extrabold' 
                          : hasData 
                            ? 'text-slate-600 dark:text-slate-300' 
                            : 'text-slate-300 dark:text-slate-600'
                    }`}>
                      {hasData
                        ? activeChartMetric === 'pointsSE'
                          ? val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val
                          : val
                        : '0'}
                    </span>

                    <div className={`w-full max-w-[48px] rounded-2xl h-36 flex flex-col justify-end p-1 transition-all duration-200 ${
                      item.isToday
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-2 border-blue-400/70 shadow-sm shadow-blue-500/10'
                        : isHovered
                          ? 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600'
                          : 'bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700'
                    }`}>
                      <div
                        className={`w-full rounded-xl transition-all duration-500 ease-out ${
                          hasData
                            ? item.isToday
                              ? activeChartMetric === 'pointsSE'
                                ? 'bg-gradient-to-t from-blue-600 via-indigo-600 to-cyan-400 shadow-md shadow-blue-500/30'
                                : 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/30'
                              : activeChartMetric === 'pointsSE'
                                ? 'bg-gradient-to-t from-blue-500 to-indigo-400 group-hover:from-blue-600 group-hover:to-indigo-500'
                                : 'bg-gradient-to-t from-emerald-500 to-teal-400 group-hover:from-emerald-600 group-hover:to-teal-300'
                            : item.isToday
                              ? 'bg-blue-200/50 dark:bg-blue-900/40'
                              : 'bg-slate-200/60 dark:bg-slate-700/60'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    <div className="mt-2.5 text-center flex flex-col items-center">
                      {item.isToday ? (
                        <>
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black shadow-xs tracking-wide">
                            Hôm nay
                          </span>
                          <span className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {item.date}
                          </span>
                        </>
                      ) : item.isYesterday ? (
                        <>
                          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Hôm qua
                          </span>
                          <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                            {item.date}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                            {item.dayName}
                          </span>
                          <span className="block text-[10px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                            {item.date}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 1.4 CHUỖI NGÀY HỌC (STREAK DMC5) & THỐNG KÊ PHỤ */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Streak DMC5 */}
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="relative flex-shrink-0 flex items-center justify-center min-w-[72px] min-h-[72px]">
              <div className="absolute inset-0 bg-orange-500/20 dark:bg-orange-500/30 rounded-full blur-xl animate-pulse pointer-events-none" />
              <img
                src={encodeURI(streakRankInfo.badgeImage)}
                alt={streakRankInfo.rank}
                className="w-18 h-18 sm:w-20 sm:h-20 object-contain filter drop-shadow-md select-none hover:scale-105 transition-transform duration-200 relative z-10"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                {streakRankInfo.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 shrink-0" />
                <span>{streakDays} ngày học liên tiếp</span>
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                {streakRankInfo.tagline}
              </p>
              {streakRankInfo.nextRankName ? (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Cần thêm <strong className="text-orange-600 dark:text-orange-400 font-bold">{streakRankInfo.daysToNext} ngày</strong> để đạt <strong className="text-slate-600 dark:text-slate-300">{streakRankInfo.nextRankName}</strong>
                </p>
              ) : (
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block mt-1">★ Phong cách tối thượng DMC5 ★</span>
              )}
            </div>
          </div>

          {/* Test & Vocab Stats */}
          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-around shadow-xs">
            <div className="text-center">
              <span className="block text-xl font-black text-slate-800 dark:text-slate-100">
                <CountUp end={masteredCount} duration={800} />
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 justify-center mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Đã thuộc
              </span>
            </div>
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
            <div className="text-center">
              <span className="block text-xl font-black text-slate-800 dark:text-slate-100">
                <CountUp end={testsCompleted} duration={800} />
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 justify-center mt-0.5">
                <Target className="w-3 h-3 text-blue-500" /> Bài test
              </span>
            </div>
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
            <div className="text-center">
              <span className="block text-xl font-black text-purple-600 dark:text-purple-400">
                3,333
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 justify-center mt-0.5">
                <Sparkles className="w-3 h-3 text-purple-500" /> Max SE/Từ
              </span>
            </div>
          </div>
        </div>

        {/* Nút Trọng Tu (Reset tiến trình) */}
        <div className="relative z-10 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            disabled={isResetting}
            onClick={async () => {
              if (window.confirm('Xác nhận Trọng tu (Phế bỏ toàn bộ tu vi hiện tại, đặt lại Chuỗi ngày học, Điểm SE, Số từ đã học và Lịch sử về 0 để tu luyện lại từ đầu)?')) {
                try {
                  setIsResetting(true);
                  await resetLearningProgress();
                  setPreviewSE(null);
                  alert('Đã hoàn tất Trọng tu! Toàn bộ tu vi và chuỗi học tập đã quay về vạch xuất phát.');
                } catch (err) {
                  alert('Lỗi khi trọng tu: ' + err.message);
                } finally {
                  setIsResetting(false);
                }
              }
            }}
            className="px-3.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/60 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Phế bỏ toàn bộ tu vi hiện tại để tu luyện lại từ đầu (Trọng tu)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isResetting ? 'Đang trọng tu...' : 'Trọng tu'}</span>
          </button>
        </div>
      </section>

      {/* =========================================================
          PHẦN 2: BỘ THẺ BÀI HUY HIỆU TU TIÊN (Ở DƯỚI)
          ========================================================= */}
      <section className="space-y-6">
        {/* Progress & Overview Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Award className="w-6 h-6 text-amber-500" />
              <span>Kho Huy Hiệu Tu Tiên (Dạng Thẻ Bài)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold">
                {unlockedCount} / {totalCount} Thẻ Bài ({completionPct}%)
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Hiệu ứng hào quang bao phủ toàn bộ thẻ bài khi đạo hữu đạt đủ điều kiện chứng đạo
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full sm:w-64">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">
              <span>Đại Đạo Tiến Trình</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{completionPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-purple-500 transition-all duration-700 rounded-full"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bộ lọc phẩm cấp (Tiers filter) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedTierFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedTierFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold shadow-sm'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60'
            }`}
          >
            Tất cả ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setSelectedTierFilter('UNLOCKED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedTierFilter === 'UNLOCKED'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                : 'bg-white dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
            }`}
          >
            Đã đạt ({unlockedCount})
          </button>

          {Object.values(BADGE_TIERS).map(tier => {
            const countInTier = badgesWithProgress.filter(b => b.badge.tier === tier.id).length;
            const isSelected = selectedTierFilter === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedTierFilter(tier.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? `${tier.tagBg} font-bold ring-1 ring-amber-400/40 shadow-sm`
                    : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60'
                }`}
              >
                {tier.name} ({countInTier})
              </button>
            );
          })}
        </div>

        {/* LƯỚI THẺ BÀI HUY HIỆU (COLLECTIBLE TRADING CARDS GRID) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
          {filteredBadges.map(({ badge, tier, currentValue, targetValue, isUnlocked, progressPct, isForceActive }, idx) => {
            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                tier={tier}
                currentValue={currentValue}
                targetValue={targetValue}
                isUnlocked={isUnlocked}
                progressPct={progressPct}
                isForceActive={isForceActive}
                index={idx}
                onClick={() => setActiveBadgeDetail({ badge, tier, currentValue, targetValue, isUnlocked, progressPct, isForceActive })}
              />
            );
          })}
        </div>

        {filteredBadges.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
            Không tìm thấy thẻ bài huy hiệu nào phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </section>

      {/* =========================================================
          MODAL CHI TIẾT HUY HIỆU (KHI NHẤN VÀO TỪNG THẺ)
          ========================================================= */}
      {activeBadgeDetail && (
        <div 
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
          onClick={() => setActiveBadgeDetail(null)}
        >
          <div 
            className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-2xl text-slate-900 dark:text-slate-100 flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveBadgeDetail(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <BadgeEmblem
              badge={activeBadgeDetail.badge}
              tier={activeBadgeDetail.tier}
              isUnlocked={activeBadgeDetail.isUnlocked}
            />

            <span className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider mt-4 ${activeBadgeDetail.tier.tagBg}`}>
              {activeBadgeDetail.tier.name}
            </span>

            <h4 className={`text-xl sm:text-2xl font-black mt-2 ${
              activeBadgeDetail.isUnlocked && activeBadgeDetail.tier.id === 'than_danh' 
                ? activeBadgeDetail.tier.textColor 
                : 'text-slate-900 dark:text-white'
            }`}>
              {activeBadgeDetail.badge.title}
            </h4>

            <p className="text-xs text-amber-600 dark:text-amber-300 font-semibold mt-0.5">
              {activeBadgeDetail.badge.subtitle}
            </p>

            <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed text-left w-full">
              "{activeBadgeDetail.badge.flavorText}"
            </div>

            <div className="w-full text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Điều kiện đắc đạo:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{activeBadgeDetail.badge.conditionDesc}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Tiến trình tu hành:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">
                  {activeBadgeDetail.currentValue} / {activeBadgeDetail.targetValue} {activeBadgeDetail.badge.unit} ({activeBadgeDetail.progressPct}%)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveBadgeDetail(null)}
              className="w-full mt-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md"
            >
              Lĩnh Ngộ
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default GiaPha;
