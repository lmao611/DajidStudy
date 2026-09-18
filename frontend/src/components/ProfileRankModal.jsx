import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import {
  X,
  Crown,
  Flame,
  Zap,
  Award,
  Sparkles,
  Shield,
  Sprout,
  TrendingUp,
  BarChart3,
  BookOpen,
  Target,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Camera,
  Loader2,
  SlidersHorizontal,
  RotateCcw,
  Check
} from 'lucide-react';
import { useStudyStore } from '../stores/studyStore';
import { CountUp } from './CountUp';
import {
  getVocabularyRank,
  getStreakRank,
  getFiveDayActivityRank
} from '../utils/testScoring';

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

export const ProfileRankModal = ({ isOpen, onClose, onOpenTestModal, onOpenGiaPha }) => {
  const { profile, updateProfile, vocabularies, uploadAvatar, isR2Configured, resetLearningProgress } = useStudyStore();
  const [activeChartMetric, setActiveChartMetric] = useState('pointsSE'); // 'pointsSE' or 'wordsLearned'
  const [hoveredDayIndex, setHoveredDayIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState(null);
  const [previewSE, setPreviewSE] = useState(null); // Tạm chỉnh SE để xem thử các cảnh giới
  const [showSEControl, setShowSEControl] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const fileInputRef = useRef(null);

  // Tắt hồ sơ khi bấm và chuyển sang trang Gia Phả (/gia-pha)
  const handleGoToGiaPha = () => {
    onClose();
    if (onOpenGiaPha) {
      onOpenGiaPha();
    } else {
      window.history.pushState({ tab: 'giapha' }, '', '/gia-pha');
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'giapha' }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // In-view refs & state for scroll-triggered badge stamp animations
  const modalBodyRef = useRef(null);
  const rankingRef = useRef(null);
  const activityRef = useRef(null);
  const streakRef = useRef(null);

  const [rankingInView, setRankingInView] = useState(true);
  const [activityInView, setActivityInView] = useState(false);
  const [streakInView, setStreakInView] = useState(false);

  // Trigger stamp animations when badge elements scroll into view (only once)
  useEffect(() => {
    if (!isOpen) return;

    const container = modalBodyRef.current;
    if (!container) return;

    // If all badges have already triggered their one-time stamp, detach listener
    if (rankingInView && activityInView && streakInView) return;

    const checkInView = () => {
      const root = modalBodyRef.current;
      if (!root) return;
      const rootRect = root.getBoundingClientRect();

      const testVisibility = (el, currentVal) => {
        // Run stamp animation strictly once when scrolled to
        if (currentVal) return true;
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.top < rootRect.bottom - 20 && r.bottom > rootRect.top + 20;
      };

      setRankingInView(curr => testVisibility(rankingRef.current, curr));
      setActivityInView(curr => testVisibility(activityRef.current, curr));
      setStreakInView(curr => testVisibility(streakRef.current, curr));
    };

    const timer = setTimeout(checkInView, 60);
    container.addEventListener('scroll', checkInView, { passive: true });

    return () => {
      clearTimeout(timer);
      container.removeEventListener('scroll', checkInView);
    };
  }, [isOpen, rankingInView, activityInView, streakInView]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG, WebP)!');
      return;
    }
    try {
      setIsUploading(true);
      setUploadFeedback('Đang kiểm tra & xử lý ảnh...');
      const res = await uploadAvatar(file);
      setUploadFeedback(res?.message || 'Avatar đã cập nhật thành công!');
      setTimeout(() => setUploadFeedback(null), 3500);
    } catch (err) {
      console.error(err);
      alert('Lỗi tải ảnh lên R2: ' + (err.message || 'Không thể upload'));
      setUploadFeedback(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Hỗ trợ lệnh DevTools Console: window.setSE(50000), window.resetSE(), window.resetProgress()
  useEffect(() => {
    window.setSE = (val) => {
      const num = Number(val);
      if (!isNaN(num) && num >= 0) {
        setPreviewSE(num);
        console.log(`%c[DajidStudy] Đã tạm chỉnh SE thành: ${num.toLocaleString()} SE`, 'color: #3b82f6; font-weight: bold;');
      }
    };
    window.resetSE = () => {
      setPreviewSE(null);
      console.log(`%c[DajidStudy] Đã khôi phục SE về số thực tế`, 'color: #10b981; font-weight: bold;');
    };
    window.trongTu = window.resetProgress = async () => {
      if (window.confirm('Xác nhận Trọng tu (phế bỏ tu vi hiện tại, đặt lại toàn bộ chuỗi streak, SE, số từ đã học và lịch sử về 0 để tu luyện lại từ đầu)?')) {
        await resetLearningProgress();
        setPreviewSE(null);
        console.log(`%c[DajidStudy] Đã hoàn tất Trọng tu thành công!`, 'color: #ef4444; font-weight: bold;');
        alert('Đã hoàn tất Trọng tu! Toàn bộ tu vi, SE và chuỗi ngày học đã trở về vạch xuất phát.');
      }
    };
    return () => {
      delete window.setSE;
      delete window.resetSE;
      delete window.resetProgress;
      delete window.trongTu;
    };
  }, [resetLearningProgress]);

  const totalSE = previewSE !== null ? previewSE : (profile.stats?.totalSE ?? 0);
  const streakDays = profile.stats?.streakDays ?? 0;
  const testsCompleted = profile.stats?.testsCompleted ?? 0;
  const masteredCount = vocabularies.filter(v => v.isMastered).length;

  const vocabRankInfo = getVocabularyRank(totalSE);
  const streakRankInfo = getStreakRank(streakDays);

  // Chuỗi 5 ngày liên tiếp động tính từ ngày hôm nay (loại bỏ hoàn toàn lỗi hiển thị 12/9 là Hôm nay)
  const chartDays = useMemo(() => {
    const now = new Date();
    const result = [];
    const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    
    // Map dữ liệu theo cả isoDate (YYYY-MM-DD) và date (DD/MM)
    const historyMap = new Map();
    (profile.studyHistory || []).forEach(item => {
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
  }, [profile.studyHistory, vocabularies?.length]);

  const activityRankInfo = getFiveDayActivityRank(chartDays, vocabularies.length);

  // Track previous rank values to trigger stamp animation when rank levels up / changes
  const prevRankNameRef = useRef(vocabRankInfo.currentRank.name);
  const prevStreakRankRef = useRef(streakRankInfo.rank);
  const prevActivityRankRef = useRef(activityRankInfo.rank);

  const [vocabAnimKey, setVocabAnimKey] = useState(0);
  const [streakAnimKey, setStreakAnimKey] = useState(0);
  const [activityAnimKey, setActivityAnimKey] = useState(0);

  // If vocabulary cultivation realm levels up / changes:
  useEffect(() => {
    if (prevRankNameRef.current && prevRankNameRef.current !== vocabRankInfo.currentRank.name) {
      setRankingInView(true);
      setVocabAnimKey(k => k + 1);
      // Breakthrough celebration!
      try {
        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.55 }
        });
      } catch (e) {}
    }
    prevRankNameRef.current = vocabRankInfo.currentRank.name;
  }, [vocabRankInfo.currentRank.name]);

  // If streak rank levels up / changes:
  useEffect(() => {
    if (prevStreakRankRef.current && prevStreakRankRef.current !== streakRankInfo.rank) {
      setStreakInView(true);
      setStreakAnimKey(k => k + 1);
    }
    prevStreakRankRef.current = streakRankInfo.rank;
  }, [streakRankInfo.rank]);

  // If 5-day activity rank levels up / changes:
  useEffect(() => {
    if (prevActivityRankRef.current && prevActivityRankRef.current !== activityRankInfo.rank) {
      setActivityInView(true);
      setActivityAnimKey(k => k + 1);
    }
    prevActivityRankRef.current = activityRankInfo.rank;
  }, [activityRankInfo.rank]);

  // Maximum value for scaling the SVG chart bars
  const maxSEVal = Math.max(...chartDays.map(d => d.pointsSE || 0), 1000);
  const maxWordsVal = Math.max(...chartDays.map(d => d.wordsLearned || 0), 10);

  // Icon mapping for Rank
  const renderRankIcon = (iconName, className = "w-6 h-6") => {
    switch (iconName) {
      case 'Crown': return <Crown className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'Award': return <Award className={className} />;
      case 'Shield': return <Shield className={className} />;
      default: return <Sprout className={className} />;
    }
  };

  // Ensure modal only renders content when opened, but AFTER all hooks are declared
  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ======================= MODAL HEADER ======================= */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden flex-shrink-0">
          {/* Decorative ambient glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16"></div>

          {/* Close button with large, generous hitbox and guaranteed high z-index */}
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-11 h-11 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 active:scale-90 text-slate-200 hover:text-white transition-all backdrop-blur-md z-50 cursor-pointer pointer-events-auto border border-white/15 shadow-md group"
            title="Đóng cửa sổ hồ sơ (Esc)"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 pointer-events-none group-hover:rotate-90 transition-transform duration-200 text-slate-200 group-hover:text-white" />
          </button>

          {/* Profile overview with right padding to never overlap close button */}
          <div className="flex items-center gap-4 relative z-10 pr-14">
            <div className="relative group flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <img
                src={profile.avatar && profile.avatar !== '/avatar.svg' ? profile.avatar : '/avt.jpg'}
                alt={profile.name}
                onError={(e) => { e.currentTarget.src = '/avt.jpg'; }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover object-center ring-4 ring-amber-400/40 shadow-xl bg-slate-800"
              />
              
              {/* Camera Hover Overlay for Cloudflare R2 upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Đổi ảnh đại diện (Tải lên Cloudflare R2)"
                className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold cursor-pointer z-10"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-0.5 text-amber-300" />
                    <span>Đổi ảnh</span>
                  </>
                )}
              </button>

              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-0.5 z-20">
                <Crown className="w-3 h-3 fill-slate-950 animate-bounce" />
                <span>VIP</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate text-white">
                  {profile.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Learner
                </span>
              </div>
              
              {uploadFeedback ? (
                <div className="text-[11px] font-medium text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 mt-1 border border-amber-400/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  {uploadFeedback}
                </div>
              ) : (
                <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                  {profile.bio || "Hành trình tích lũy Spirit Energy và chinh phục đỉnh cao từ vựng."}
                </p>
              )}

              {/* Badges row */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <div 
                  onClick={() => setShowSEControl(prev => !prev)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/30 text-xs text-amber-300 font-bold backdrop-blur-sm shadow-xs cursor-pointer hover:bg-amber-500/30 transition-all"
                  title="Nhấn để mở thanh thử nghiệm các mức SE và cảnh giới"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-[spin_5s_linear_infinite]" />
                  <span><CountUp end={totalSE} duration={1200} /> SE</span>
                  {previewSE !== null && (
                    <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1 rounded ml-0.5">XEM THỬ</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/20 border border-orange-400/30 text-xs text-orange-300 font-semibold">
                  <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  <span>{streakDays} ngày streak</span>
                </div>
                <button
                  type="button"
                  onClick={handleGoToGiaPha}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600/30 via-fuchsia-600/25 to-blue-600/30 hover:from-purple-600/50 hover:to-blue-600/50 border border-purple-400/40 hover:border-purple-300 text-xs text-purple-200 hover:text-white font-bold backdrop-blur-sm shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Mở Gia Phả Tu Tiên và Kho Huy Hiệu Từ Vựng"
                >
                  <Award className="w-3.5 h-3.5 text-purple-300" />
                  <span>📜 Gia Phả Tu Tiên</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ======================= MODAL BODY ======================= */}
        <div ref={modalBodyRef} className="p-6 space-y-6 flex-1 overflow-y-auto">

          {/* 1. CẢNH GIỚI TU LUYỆN - Phóng to icon, icon đứng ngoài ô bao, ô bao bọc phần thông tin */}
          <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-5 sm:gap-6 py-1">
            
            {/* Huy hiệu cảnh giới để bên trái - Phóng to hơn nữa, đứng tự do không bị ô bao */}
            <div ref={rankingRef} className="flex-shrink-0 flex items-center justify-center relative group min-h-[144px]">
              <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/30 rounded-full blur-2xl animate-pulse pointer-events-none" />
              <img
                key={`${vocabRankInfo.currentRank.name}-${rankingInView}-${vocabAnimKey}`}
                src={encodeURI(vocabRankInfo.currentRank.badgeImage)}
                alt={vocabRankInfo.currentRank.name}
                className={`w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 object-contain filter drop-shadow-2xl select-none hover:scale-110 hover:-rotate-2 transition-transform duration-300 relative z-10 cursor-pointer ${
                  rankingInView ? 'animate-dmc-stamp-ranking' : 'opacity-0'
                }`}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* Ô bao phần cảnh giới (bao bọc phần thông tin & tiến trình đột phá, không bao icon) */}
            <div className="flex-1 min-w-0 w-full p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-center space-y-3.5">
              <div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
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

              {/* Collapsible SE Testing Controller */}
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

                  {/* 14 Realm Preset Buttons */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {realmPresets.map((r) => {
                      const isSelected = previewSE !== null 
                        ? (vocabRankInfo.currentRank.name === r.name)
                        : (profile.stats?.totalSE >= r.se && (r.name === vocabRankInfo.currentRank.name));
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

                  {/* Custom SE input & Save button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 flex-wrap">
                    <div className="flex-1 min-w-[140px] flex items-center gap-1.5">
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">SE tùy chỉnh:</label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={previewSE !== null ? previewSE : (profile.stats?.totalSE ?? 0)}
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

              {/* Progress bar to next realm */}
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
                  ></div>
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

          {/* 2. BIỂU ĐỒ MỨC ĐỘ HỌC 5 NGÀY GẦN NHẤT */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
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

              {/* 5-Day Activity Rank Badge (Devil May Cry 5 Style) - Trong khung & Phóng to */}
              <div ref={activityRef} className="flex items-center gap-2">
                <div 
                  className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:bg-slate-100/80 dark:hover:bg-slate-700/80 hover:border-amber-400/40 transition-all cursor-help group"
                  title={`Ôn tập & đánh giá trung bình ${activityRankInfo.avgDailyWords}/${activityRankInfo.totalWords} lượt/ngày (${activityRankInfo.avgDailyPercent}% kho từ/ngày) trong 5 ngày qua`}
                >
                  <div className="relative flex items-center justify-center min-w-[48px] min-h-[48px]">
                    <div className="absolute inset-0 bg-amber-500/20 dark:bg-amber-500/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <img
                      key={`activity-${activityRankInfo.rank}-${activityInView}-${activityAnimKey}`}
                      src={encodeURI(activityRankInfo.badgeImage)}
                      alt={activityRankInfo.rank}
                      className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain filter drop-shadow-sm select-none group-hover:scale-115 transition-transform duration-200 relative z-10 ${
                        activityInView ? 'animate-dmc-stamp' : 'opacity-0'
                      }`}
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
                      {/* Interactive Tooltip on hover */}
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
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                        </div>
                      )}

                      {/* Bar Value Indicator */}
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

                      {/* Bar Column Track */}
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
                        ></div>
                      </div>

                      {/* Day & Date Labels below */}
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

          {/* 3. CHUỖI NGÀY HỌC (STREAK RANK) & THỐNG KÊ PHỤ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Streak (Devil May Cry 5 Style) - Icon đứng ngoài ô bao, ô bao bọc phần thông tin */}
            <div ref={streakRef} className="flex items-center gap-3">
              <div className="relative flex-shrink-0 flex items-center justify-center group min-w-[80px] min-h-[80px]">
                <div className="absolute inset-0 bg-orange-500/20 dark:bg-orange-500/30 rounded-full blur-xl animate-pulse pointer-events-none" />
                <img
                  key={`streak-${streakRankInfo.rank}-${streakInView}-${streakAnimKey}`}
                  src={encodeURI(streakRankInfo.badgeImage)}
                  alt={streakRankInfo.rank}
                  className={`w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-md select-none hover:scale-110 hover:rotate-3 transition-transform duration-300 relative z-10 cursor-pointer ${
                    streakInView ? 'animate-dmc-stamp' : 'opacity-0'
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-center">
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                  {streakRankInfo.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 shrink-0" />
                  <span>{streakDays} ngày học liên tiếp</span>
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
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
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-around">
              <div className="text-center">
                <span className="block text-lg font-black text-slate-800 dark:text-slate-100">
                  <CountUp end={masteredCount} duration={800} />
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 justify-center">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Đã thuộc
                </span>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
              <div className="text-center">
                <span className="block text-lg font-black text-slate-800 dark:text-slate-100">
                  <CountUp end={testsCompleted} duration={800} />
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 justify-center">
                  <Target className="w-3 h-3 text-blue-500" /> Bài test
                </span>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
              <div className="text-center">
                <span className="block text-lg font-black text-purple-600 dark:text-purple-400">
                  3,333
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 justify-center">
                  <Sparkles className="w-3 h-3 text-purple-500" /> Max SE/Từ
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* ======================= MODAL FOOTER ======================= */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isResetting}
              onClick={async () => {
                if (window.confirm('Xác nhận Trọng tu (Phế bỏ toàn bộ tu vi hiện tại, đặt lại Chuỗi ngày học, Điểm SE, Số từ đã học và Lịch sử về 0 để tu luyện lại từ đầu)?')) {
                  try {
                    setIsResetting(true);
                    await resetLearningProgress();
                    setPreviewSE(null);
                    alert('Đã hoàn tất Trọng tu! Toàn bộ tu vi và chuỗi học tập đã quay về vạch xuất phát. Chúc đạo hữu sớm ngày đột phá đỉnh phong!');
                  } catch (err) {
                    alert('Lỗi khi trọng tu: ' + err.message);
                  } finally {
                    setIsResetting(false);
                  }
                }
              }}
              className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/60 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Phế bỏ toàn bộ tu vi hiện tại để tu luyện lại từ đầu (Trọng tu)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isResetting ? 'Đang trọng tu...' : 'Trọng tu'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleGoToGiaPha}
              className="px-3.5 py-2.5 rounded-xl border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 hover:text-purple-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Mở Gia Phả Tu Tiên và Kho Huy Hiệu"
            >
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span>Gia Phả Tu Tiên</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>
            {onOpenTestModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTestModal();
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Kiểm tra từ vựng ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
export default ProfileRankModal;
