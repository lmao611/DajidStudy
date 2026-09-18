import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Calendar, 
  BookOpen, 
  Flame, 
  Menu, 
  X, 
  RotateCcw,
  CheckCircle2,
  Sun,
  Moon,
  Orbit
} from 'lucide-react';
import { useStudyStore } from '../stores/studyStore';
import { CountUp } from './CountUp';
import { ProfileRankModal } from './ProfileRankModal';

export const Navbar = ({ activeTab, setActiveTab, isDark, toggleTheme }) => {
  const { profile, resetToDefaultData } = useStudyStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Tham chiếu và vị trí nền trượt động (Sliding Pill Indicator)
  const navRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // Detect scroll position to toggle transparent vs glassmorphic navbar and logo visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: Home, path: '/' },
    { id: 'schedule', label: 'Lịch học', icon: Calendar, path: '/schedule' },
    { id: 'vocabulary', label: 'Từ vựng', icon: BookOpen, path: '/vocabulary' },
    { id: 'khonggian', label: 'Không Gian', icon: Orbit, path: 'https://daipagepersonal.onrender.com', isExternal: true },
  ];

  // Tính toán vị trí trượt mượt mà của phần nền nút khi chuyển trang
  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = navRefs.current[activeTab];
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1
        });
      } else {
        setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();
    const timer = setTimeout(updateIndicator, 40);
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab]);

  const handleReset = () => {
    resetToDefaultData();
    setShowResetConfirm(false);
  };

  // Whether navbar is currently sitting over the dark hero banner on the home page
  const isOverHero = !isScrolled && activeTab === 'home';

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        isOverHero 
          ? 'bg-transparent border-b border-transparent text-white' 
          : 'backdrop-blur-md bg-white/85 dark:bg-slate-950/90 border-b border-slate-200/80 dark:border-slate-700/80 shadow-xs text-slate-800 dark:text-slate-100'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          
          {/* ===================== BÊN TRÁI: CÁC NÚT ĐIỀU HƯỚNG ===================== */}
          <div className="flex items-center">
            {/* Desktop Navigation Links */}
            <nav className={`relative hidden md:flex items-center gap-1.5 p-1 rounded-2xl border transition-all ${
              isOverHero 
                ? 'bg-slate-900/50 backdrop-blur-md border-white/10' 
                : 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-200/60 dark:border-slate-700/60'
            }`}>
              {/* Nền trượt động mượt mà (Animated Sliding Pill Indicator) khi chuyển trang */}
              <div
                className={`absolute top-1 bottom-1 rounded-xl transition-all duration-300 ease-out pointer-events-none ${
                  isOverHero
                    ? 'bg-white shadow-md'
                    : 'bg-white dark:bg-slate-700 shadow-xs'
                }`}
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                  opacity: indicatorStyle.opacity,
                  transform: indicatorStyle.opacity ? 'scale(1)' : 'scale(0.92)',
                  transitionProperty: 'left, width, opacity, transform, background-color'
                }}
              />

              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const animClass = idx === 0 ? 'animate-nav-item-1' : idx === 1 ? 'animate-nav-item-2' : 'animate-nav-item-3';
                return (
                  <a
                    ref={el => { navRefs.current[item.id] = el; }}
                    key={item.id}
                    href={item.path}
                    target={item.isExternal ? '_blank' : undefined}
                    rel={item.isExternal ? 'noopener noreferrer' : undefined}
                    onClick={(e) => {
                      if (item.isExternal) {
                        return; // Open external URL
                      }
                      e.preventDefault();
                      setActiveTab(item.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`relative z-10 flex items-center gap-1.5 lg:gap-2 px-3 lg:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${animClass} ${
                      isActive
                        ? isOverHero 
                          ? 'text-slate-950 font-bold scale-[1.02]' 
                          : 'text-blue-700 dark:text-blue-400 font-bold scale-[1.02]'
                        : isOverHero
                          ? 'text-slate-200 hover:text-white hover:scale-105'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:scale-105'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-colors duration-200 ${
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : isOverHero ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500'
                    }`} />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>

            {/* Mobile menu trigger */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-xl transition-colors ${
                  isOverHero ? 'text-white hover:bg-white/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* ===================== Ở GIỮA: VỊ TRÍ CHO LOGO ===================== */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
            {activeTab !== 'home' && (
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 select-none pointer-events-auto cursor-pointer"
              >
                <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 bg-clip-text text-transparent drop-shadow-xs hover:opacity-90 transition-opacity">
                  DajidStudy
                </span>
              </a>
            )}
          </div>

          {/* ===================== BÊN PHẢI: STREAK, THEME TOGGLE, RESET & MINI AVATAR ===================== */}
          <div className="flex items-center gap-3 animate-nav-right">
            {/* Streak Counter */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs border transition-transform hover:scale-105 ${
              isOverHero
                ? 'bg-slate-900/60 backdrop-blur-md border-orange-500/40 text-orange-300'
                : 'bg-orange-50 dark:bg-slate-800 border-orange-200 dark:border-orange-700/40 text-orange-700 dark:text-orange-300'
            }`}>
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-bounce" />
              <span><CountUp end={profile.stats?.streakDays ?? 0} duration={1200} /> ngày</span>
            </div>

            {/* Theme Toggle Button - Frameless, Glowing & Animated */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              className="p-1.5 transition-all duration-300 hidden sm:flex items-center justify-center group active:scale-90 hover:scale-110 cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400 fill-amber-300/40 drop-shadow-[0_0_10px_rgba(251,191,36,0.95)] animate-[spin_12s_linear_infinite] group-hover:rotate-180 transition-transform duration-500" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 fill-indigo-400/30 drop-shadow-[0_0_9px_rgba(99,102,241,0.85)] group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300" />
              )}
            </button>

            {/* Reset Button */}
            <button
              onClick={() => setShowResetConfirm(true)}
              title="Đặt lại dữ liệu mẫu ban đầu"
              className={`p-2 rounded-xl transition-colors hidden sm:block ${
                isOverHero 
                  ? 'text-slate-300 hover:text-white hover:bg-white/10' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Mini Avatar / Name - Click to open Profile & Rank Modal */}
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              title="Hồ sơ cá nhân & Cấp bậc Spirit Energy"
              className={`flex items-center gap-2.5 pl-2 border-l cursor-pointer hover:opacity-90 transition-all group ${
                isOverHero ? 'border-slate-700' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="relative">
                <img
                  src={profile.avatar && profile.avatar !== '/avatar.svg' ? profile.avatar : '/avt.jpg'}
                  alt={profile.name}
                  onError={(e) => { e.currentTarget.src = '/avt.jpg'; }}
                  className="w-9 h-9 rounded-full object-cover object-center ring-2 ring-blue-500/30 group-hover:ring-amber-400 shadow-xs bg-slate-800 transition-all"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full"></span>
              </div>
              <div className="text-left leading-tight hidden lg:block">
                <span className={`block text-xs font-bold ${isOverHero ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                  {profile.name}
                </span>
                <span className="block text-[10px] text-amber-500 font-bold group-hover:text-amber-600 transition-colors flex items-center gap-0.5">
                  ⭐ Xem Rank
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg px-4 pt-3 pb-5 space-y-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 text-slate-800 dark:text-slate-100">
          {/* Mobile Profile & Rank card */}
          <div 
            onClick={() => {
              setMobileMenuOpen(false);
              setIsProfileModalOpen(true);
            }}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-blue-50 dark:from-slate-800 to-indigo-50 dark:to-slate-800 border border-blue-100 dark:border-slate-700 cursor-pointer hover:bg-blue-100/60 dark:hover:bg-slate-700/60 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={profile.avatar && profile.avatar !== '/avatar.svg' ? profile.avatar : '/avt.jpg'}
                alt={profile.name}
                onError={(e) => { e.currentTarget.src = '/avt.jpg'; }}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-blue-500/30"
              />
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{profile.name}</span>
                <span className="block text-[10px] text-amber-600 font-bold">⭐ Xem Cấp Bậc & Hồ Sơ</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-blue-600 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 dark:text-blue-400 shadow-xs">
              Chi tiết →
            </span>
          </div>

          <div className="flex items-center justify-between pb-1 pt-1 border-b border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Menu Điều Hướng</span>
            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              {profile.stats?.streakDays ?? 0} ngày streak
            </span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.path}
                target={item.isExternal ? '_blank' : undefined}
                rel={item.isExternal ? 'noopener noreferrer' : undefined}
                onClick={(e) => {
                  if (item.isExternal) {
                    setMobileMenuOpen(false);
                    return;
                  }
                  e.preventDefault();
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200/50 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
              </a>
            );
          })}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <button
              onClick={() => {
                resetToDefaultData();
                setMobileMenuOpen(false);
              }}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 py-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại dữ liệu mẫu</span>
            </button>
            <div className="flex items-center gap-2">
              {/* Mobile theme toggle - Frameless, Glowing & Animated */}
              <button
                onClick={toggleTheme}
                className="p-1.5 transition-all duration-300 flex items-center justify-center group active:scale-90 hover:scale-110 cursor-pointer"
                title={isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400 fill-amber-300/40 drop-shadow-[0_0_8px_rgba(251,191,36,0.95)] animate-[spin_12s_linear_infinite]" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500 dark:text-indigo-400 fill-indigo-400/30 drop-shadow-[0_0_8px_rgba(99,102,241,0.85)]" />
                )}
              </button>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Chế độ Dev
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-100">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Đặt lại dữ liệu ban đầu?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Hành động này sẽ khôi phục lại thời khóa biểu, từ vựng và thông tin mẫu mặc định trong bộ nhớ trình duyệt.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
              >
                Đồng ý đặt lại
              </button>
            </div>
          </div>
        </div>
      )}
    </header>

    {/* Profile & Rank Modal */}
    <ProfileRankModal
      isOpen={isProfileModalOpen}
      onClose={() => setIsProfileModalOpen(false)}
      onOpenGiaPha={() => {
        setIsProfileModalOpen(false);
        setActiveTab('giapha');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      onOpenTestModal={() => {
        setActiveTab('vocabulary');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    />
  </>
);
};
