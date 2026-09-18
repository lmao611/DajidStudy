import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
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
  RotateCcw,
  FlaskConical,
  Star
} from 'lucide-react';
import { useStudyStore } from '../stores/studyStore';
import { getVocabularyRank } from '../utils/testScoring';
import { calculateBadgeSummary, BADGE_TIERS } from '../utils/badgeSystem';
import { CountUp } from './CountUp';

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

/**
 * Renders the Visual Emblem for a badge based on its tier and status
 */
const BadgeEmblem = ({ badge, tier, isUnlocked, isForceActive }) => {
  const IconComponent = ICON_MAP[badge.icon] || Award;
  const tierId = badge.tier;

  return (
    <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24">
      {/* 1. Locked State Backdrop */}
      {!isUnlocked && (
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-stone-900/80 border border-stone-700/60 flex items-center justify-center grayscale-[80%] opacity-55">
          <IconComponent className="w-8 h-8 text-stone-500" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl backdrop-blur-[1px]">
            <Lock className="w-5 h-5 text-stone-400 drop-shadow-md" />
          </div>
        </div>
      )}

      {/* 2. Unlocked: Hạ Phẩm (Nâu đồng - Không hiệu ứng glow) */}
      {isUnlocked && tierId === 'ha_pham' && (
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-stone-800 via-amber-950 to-stone-900 border-2 border-amber-800/80 flex items-center justify-center shadow-md select-none group-hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-1 rounded-xl border border-amber-900/50 pointer-events-none" />
          <IconComponent className="w-8 h-8 text-amber-500/90 drop-shadow-sm" />
        </div>
      )}

      {/* 3. Unlocked: Trung Phẩm (Xanh lá - Sinh cơ thanh mát) */}
      {isUnlocked && tierId === 'trung_pham' && (
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-emerald-950/90 via-teal-900/60 to-stone-900 border-2 border-emerald-500/70 flex items-center justify-center shadow-md select-none group-hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-1 rounded-xl border border-emerald-400/30 pointer-events-none" />
          <IconComponent className="w-8 h-8 text-emerald-400 drop-shadow-sm" />
        </div>
      )}

      {/* 4. Unlocked: Thượng Phẩm (Xanh dương - Bắt đầu có glow nhẹ) */}
      {isUnlocked && tierId === 'thuong_pham' && (
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-blue-950/95 via-cyan-950/70 to-slate-900 border-2 border-cyan-400/80 flex items-center justify-center shadow-[0_0_18px_rgba(59,130,246,0.55)] select-none group-hover:scale-105 transition-transform duration-300">
          <div className="absolute -inset-1 rounded-2xl bg-cyan-500/20 blur-md pointer-events-none" />
          <div className="absolute inset-1 rounded-xl border border-cyan-300/40 pointer-events-none" />
          <IconComponent className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)] relative z-10" />
        </div>
      )}

      {/* 5. Unlocked: Cực Phẩm (Đỏ/Vàng - Glow mạnh hơn chút) */}
      {isUnlocked && tierId === 'cuc_pham' && (
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-rose-950 via-amber-950/80 to-stone-950 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.65)] select-none group-hover:scale-105 transition-transform duration-300">
          {/* Lớp hào quang xích viêm hoàng kim */}
          <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-rose-600/30 to-amber-500/30 blur-md pointer-events-none" />
          <div className="absolute inset-1 rounded-xl border border-amber-300/50 pointer-events-none" />
          <IconComponent className="w-8 h-8 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.9)] relative z-10" />
        </div>
      )}

      {/* 6. Unlocked: Hỗn Độn (Xanh dương-hồng-tím, glow mạnh, hào quang tối xoay vần) */}
      {isUnlocked && tierId === 'hon_don' && (
        <div className="relative flex items-center justify-center">
          {/* Vòng xoáy hào quang tối hư không chuyển động xung quanh */}
          <div className="absolute -inset-3 rounded-full border-2 border-dashed border-purple-500/60 bg-gradient-to-tr from-blue-600/30 via-fuchsia-500/20 to-purple-600/30 blur-[2px] animate-cosmic-swirl pointer-events-none" />
          
          {/* Hộp huy hiệu chính */}
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-blue-900/90 via-fuchsia-950/80 to-purple-950 border-2 border-fuchsia-400 flex items-center justify-center shadow-[0_0_35px_rgba(168,85,247,0.85)] select-none group-hover:scale-105 transition-transform duration-300 z-10">
            <div className="absolute inset-1 rounded-xl border border-fuchsia-300/40 pointer-events-none" />
            <IconComponent className="w-8 h-8 text-fuchsia-300 drop-shadow-[0_0_10px_rgba(217,70,239,0.9)] relative z-10" />
          </div>
        </div>
      )}

      {/* 7. Unlocked: Thần Danh (7 sắc, glow mạnh, lóe sáng, bụi sao lấp lánh nhẹ, lơ lửng chậm và nhẹ) */}
      {isUnlocked && tierId === 'than_danh' && (
        <div className="relative flex items-center justify-center animate-stardust-float">
          {/* Vòng hào quang 7 sắc cầu vồng luân chuyển */}
          <div className="absolute -inset-2.5 rounded-2xl bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 via-cyan-400 via-blue-500 via-purple-500 to-pink-500 blur-md opacity-75 animate-rainbow-prism pointer-events-none" />
          
          {/* Bụi sao lấp lánh nhẹ xung quanh (3 hạt bụi tinh tú) */}
          <div className="absolute -top-2 -right-1 w-2.5 h-2.5 rounded-full bg-amber-200 blur-[0.5px] animate-stardust-twinkle-1 pointer-events-none" />
          <div className="absolute -bottom-2 -left-1 w-2 h-2 rounded-full bg-cyan-200 blur-[0.5px] animate-stardust-twinkle-2 pointer-events-none" />
          <div className="absolute top-1/2 -right-3 w-2 h-2 rounded-full bg-pink-200 blur-[0.5px] animate-stardust-twinkle-3 pointer-events-none" />

          {/* Hộp huy hiệu Thần Danh */}
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-slate-950 via-rose-950/70 to-slate-900 border-2 border-amber-300 flex items-center justify-center shadow-[0_0_42px_rgba(236,72,153,0.9)] overflow-hidden select-none group-hover:scale-105 transition-transform duration-300 z-10">
            {/* Hiệu ứng vệt sáng quét ngang (Lens Gleam) */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent w-full h-full animate-lens-gleam pointer-events-none" />
            
            <div className="absolute inset-1 rounded-xl border border-amber-300/40 pointer-events-none" />
            <IconComponent className="w-8 h-8 text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,1)] relative z-10" />
          </div>
        </div>
      )}

      {/* Force Active Indicator tag */}
      {isForceActive && (
        <span className="absolute -bottom-2 px-1.5 py-0.2 rounded bg-amber-500 text-[9px] font-black text-slate-950 tracking-tighter uppercase shadow-xs z-20">
          TEST
        </span>
      )}
    </div>
  );
};

export const GiaPhaModal = ({ isOpen, onClose }) => {
  const { profile, vocabularies } = useStudyStore();
  const [isForceActiveFull, setIsForceActiveFull] = useState(false);
  const [selectedTierFilter, setSelectedTierFilter] = useState('ALL'); // 'ALL', 'UNLOCKED', or tier ID
  const [activeBadgeDetail, setActiveBadgeDetail] = useState(null);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeBadgeDetail) {
          setActiveBadgeDetail(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, activeBadgeDetail]);

  const totalSE = profile?.stats?.totalSE ?? 0;
  const streakDays = profile?.stats?.streakDays ?? 0;
  const testsCompleted = profile?.stats?.testsCompleted ?? (profile?.testHistory?.length || 0);
  const masteredCount = (vocabularies || []).filter(v => v.isMastered).length;
  const vocabRankInfo = getVocabularyRank(totalSE);

  // Badge summary calculation
  const { badgesWithProgress, unlockedCount, totalCount, completionPct } = useMemo(() => {
    return calculateBadgeSummary(profile, vocabularies, isForceActiveFull);
  }, [profile, vocabularies, isForceActiveFull]);

  // Filtered badges
  const filteredBadges = useMemo(() => {
    if (selectedTierFilter === 'ALL') return badgesWithProgress;
    if (selectedTierFilter === 'UNLOCKED') return badgesWithProgress.filter(b => b.isUnlocked);
    return badgesWithProgress.filter(b => b.badge.tier === selectedTierFilter);
  }, [badgesWithProgress, selectedTierFilter]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-amber-500/30 dark:border-amber-400/25 shadow-2xl shadow-black/80 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================
            HEADER: GIA PHẢ TU TIÊN
            ========================================================= */}
        <div className="relative px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-stone-900 via-slate-900 to-stone-900 flex items-center justify-between flex-shrink-0">
          {/* Glow accents */}
          <div className="absolute top-0 left-10 w-48 h-24 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-10 w-48 h-24 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-inner">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Gia Phả Tu Tiên</span>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
                  Kho Tàng Huy Hiệu
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ghi chép chân truyền tu vi bản mệnh & Huân chương từ vựng
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer border border-white/15"
            title="Đóng Gia Phả"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =========================================================
            SCROLLABLE BODY
            ========================================================= */}
        <div className="p-5 sm:p-7 space-y-8 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* =========================================================
              PHẦN 1: HỒ SƠ TU TIÊN (Ở ĐẦU)
              ========================================================= */}
          <section className="relative rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-850 to-stone-900/90 border border-slate-700/80 p-5 sm:p-6 shadow-xl overflow-hidden">
            {/* Ambient lights */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -ml-12 -mb-12" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar & VIP */}
              <div className="relative flex-shrink-0">
                <img
                  src={profile.avatar && profile.avatar !== '/avatar.svg' ? profile.avatar : '/avt.jpg'}
                  alt={profile.name}
                  onError={(e) => { e.currentTarget.src = '/avt.jpg'; }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-amber-400/40 shadow-2xl bg-slate-800"
                />
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                  <Crown className="w-3 h-3 fill-slate-950" />
                  <span>VIP</span>
                </div>
              </div>

              {/* Thông tin căn bản & Danh xưng */}
              <div className="flex-1 text-center md:text-left min-w-0">
                <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-black text-white truncate">
                    {profile.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Đạo Tâm Kiên Định
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-1.5 max-w-2xl line-clamp-2">
                  {profile.bio || "Hành trình tích lũy Spirit Energy và chinh phục đỉnh cao từ vựng."}
                </p>

                {/* Cảnh giới & Tags */}
                <div className="flex items-center justify-center md:justify-start gap-2.5 mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-xs text-cyan-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{vocabRankInfo.currentRank.name} • {vocabRankInfo.currentRank.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-400/30 text-xs text-amber-300 font-bold">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span><CountUp end={totalSE} duration={1000} /> SE</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/20 border border-orange-400/30 text-xs text-orange-300 font-semibold">
                    <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    <span>{streakDays} ngày streak</span>
                  </div>
                </div>
              </div>

              {/* Huy hiệu cảnh giới lớn bên phải */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 backdrop-blur-sm min-w-[120px]">
                <img
                  src={encodeURI(vocabRankInfo.currentRank.badgeImage)}
                  alt={vocabRankInfo.currentRank.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain filter drop-shadow-xl"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider mt-1">
                  Bản Mệnh Đấu Hồn
                </span>
              </div>
            </div>

            {/* 4 Thống kê cốt lõi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-700/60">
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/40 text-center">
                <span className="text-[11px] text-slate-400 block">Từ Trong Kho</span>
                <span className="text-base sm:text-lg font-black text-cyan-300 mt-0.5 block">
                  {vocabularies.length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/40 text-center">
                <span className="text-[11px] text-slate-400 block">Đã Tinh Thông</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 block">
                  {masteredCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/40 text-center">
                <span className="text-[11px] text-slate-400 block">Bài Khảo Thí</span>
                <span className="text-base sm:text-lg font-black text-indigo-300 mt-0.5 block">
                  {testsCompleted}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/40 text-center">
                <span className="text-[11px] text-slate-400 block">Huy Hiệu Đạt</span>
                <span className="text-base sm:text-lg font-black text-amber-400 mt-0.5 block">
                  {unlockedCount} / {totalCount}
                </span>
              </div>
            </div>
          </section>

          {/* =========================================================
              PHẦN 2: KHO HUY HIỆU TU TIÊN (Ở DƯỚI)
              ========================================================= */}
          <section className="space-y-4">
            {/* Action & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-lg font-black text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>Kho Huy Hiệu Tu Tiên</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                    {unlockedCount} / {totalCount}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chỉ sáng và tỏa linh quang khi đạo hữu đạt đủ điều kiện chứng đạo
                </p>
              </div>

              {/* Nút bấm Active Full (Test toàn bộ) */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsForceActiveFull(prev => !prev)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                    isForceActiveFull
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black ring-2 ring-amber-400'
                      : 'bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/40'
                  }`}
                  title="Kích hoạt xem thử toàn bộ 10 huy hiệu ở trạng thái đạt thành tựu"
                >
                  <FlaskConical className={`w-4 h-4 ${isForceActiveFull ? 'animate-bounce' : ''}`} />
                  <span>{isForceActiveFull ? '⚡ Đang Bật Test Full (Tắt)' : '🧪 Active Full (Test Toàn Bộ)'}</span>
                </button>
              </div>
            </div>

            {/* Bộ lọc cấp bậc (Tiers filter) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedTierFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTierFilter === 'ALL'
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                Tất cả ({totalCount})
              </button>

              <button
                type="button"
                onClick={() => setSelectedTierFilter('UNLOCKED')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTierFilter === 'UNLOCKED'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800/80 text-emerald-400 hover:text-emerald-300 border border-emerald-900/60'
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
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? `${tier.tagBg} font-bold ring-1 ring-white/20`
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                    }`}
                  >
                    {tier.name} ({countInTier})
                  </button>
                );
              })}
            </div>

            {/* Grid 10 Huy Hiệu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {filteredBadges.map(({ badge, tier, currentValue, targetValue, isUnlocked, progressPct, isForceActive }) => {
                return (
                  <div
                    key={badge.id}
                    onClick={() => setActiveBadgeDetail({ badge, tier, currentValue, targetValue, isUnlocked, progressPct, isForceActive })}
                    className={`group relative rounded-2xl p-4.5 transition-all duration-300 cursor-pointer flex flex-col justify-between border ${
                      isUnlocked
                        ? `bg-slate-850/90 hover:bg-slate-800 ${tier.borderColor} ${tier.glowClass || 'shadow-md'} hover:-translate-y-1`
                        : 'bg-slate-900/60 border-slate-800 opacity-65 hover:opacity-85'
                    }`}
                  >
                    {/* Header card: Tag Cấp Bậc & Tiến trình */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isUnlocked ? tier.tagBg : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        {tier.name}
                      </span>

                      {isUnlocked ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đạt được</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">
                          {currentValue} / {targetValue} {badge.unit}
                        </span>
                      )}
                    </div>

                    {/* Emblem & Tên Huy hiệu */}
                    <div className="flex items-center gap-3.5 my-1">
                      <BadgeEmblem
                        badge={badge}
                        tier={tier}
                        isUnlocked={isUnlocked}
                        isForceActive={isForceActive}
                      />

                      <div className="flex-1 min-w-0">
                        <h5 className={`font-black text-sm leading-snug truncate ${
                          isUnlocked ? (tier.id === 'than_danh' ? tier.textColor : 'text-white') : 'text-slate-400'
                        }`}>
                          {badge.title}
                        </h5>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {badge.subtitle}
                        </p>
                        <p className="text-[11px] text-amber-300/80 line-clamp-1 mt-1 font-medium">
                          {badge.conditionDesc}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar (Chỉ hiển thị hoặc nổi bật khi chưa đạt) */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>Tiến độ tu hành</span>
                        <span className="font-bold text-slate-300">{progressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isUnlocked
                              ? (tier.id === 'than_danh'
                                  ? 'bg-gradient-to-r from-red-500 via-amber-400 to-purple-500'
                                  : 'bg-gradient-to-r from-amber-500 to-emerald-400')
                              : 'bg-slate-600'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredBadges.length === 0 && (
              <div className="p-8 text-center rounded-2xl bg-slate-850/50 border border-slate-800 text-slate-400 text-sm">
                Không tìm thấy huy hiệu nào phù hợp với bộ lọc hiện tại.
              </div>
            )}
          </section>
        </div>

        {/* =========================================================
            MODAL CHI TIẾT HUY HIỆU (KHI NHẤN VÀO TỪNG THẺ)
            ========================================================= */}
        {activeBadgeDetail && (
          <div 
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
            onClick={() => setActiveBadgeDetail(null)}
          >
            <div 
              className="relative w-full max-w-md rounded-3xl bg-slate-900 border-2 border-slate-700 p-6 shadow-2xl text-slate-100 flex flex-col items-center text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActiveBadgeDetail(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <BadgeEmblem
                badge={activeBadgeDetail.badge}
                tier={activeBadgeDetail.tier}
                isUnlocked={activeBadgeDetail.isUnlocked}
                isForceActive={activeBadgeDetail.isForceActive}
              />

              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider mt-4 ${activeBadgeDetail.tier.tagBg}`}>
                {activeBadgeDetail.tier.name}
              </span>

              <h4 className={`text-xl font-black mt-2 ${
                activeBadgeDetail.isUnlocked && activeBadgeDetail.tier.id === 'than_danh' 
                  ? activeBadgeDetail.tier.textColor 
                  : 'text-white'
              }`}>
                {activeBadgeDetail.badge.title}
              </h4>

              <p className="text-xs text-amber-300 font-semibold mt-0.5">
                {activeBadgeDetail.badge.subtitle}
              </p>

              {/* Truyện thuyết (Flavor Text) */}
              <div className="my-4 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 italic leading-relaxed text-left w-full">
                "{activeBadgeDetail.badge.flavorText}"
              </div>

              {/* Điều kiện đạt được */}
              <div className="w-full text-left space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Điều kiện đắc đạo:</span>
                  <span className="text-slate-200 font-bold">{activeBadgeDetail.badge.conditionDesc}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Tiến trình hiện tại:</span>
                  <span className="text-emerald-400 font-bold">
                    {activeBadgeDetail.currentValue} / {activeBadgeDetail.targetValue} {activeBadgeDetail.badge.unit} ({activeBadgeDetail.progressPct}%)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveBadgeDetail(null)}
                className="w-full mt-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Lĩnh Ngộ
              </button>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
