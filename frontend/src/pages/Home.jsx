import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Target,
  Clock,
  CheckCircle,
  Flame,
  Compass,
  Plus,
  Trash2,
  ArrowRight,
  GraduationCap,
  MapPin,
  Laptop,
  Mail,
  User,
  X,
  Copy,
  Check,
  MessageSquare,
  Award,
  Code2
} from 'lucide-react';
import { useStudyStore } from '../stores/studyStore';
import { CountUp } from '../components/CountUp';
import { useInView } from '../components/useInView';
import { ImageOfTheDay } from '../components/ImageOfTheDay';
import { EmotionState } from '../components/EmotionState';

const DEFAULT_EMOTION = { value: 0, label: "Chưa có cảm xúc", emoji: "—", tag: "" };
const BANNER_WORDS = ['Vui Vẻ', 'Học Hỏi', 'Sáng Tạo', 'Tò Mò', 'Năng Động'];

export const Home = ({ onNavigate }) => {
  const { profile, schedules, vocabularies, toggleGoal, addGoal, deleteGoal } = useStudyStore();
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalTag, setNewGoalTag] = useState('Học tập');
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  // In-view animation triggers
  const [aboutRef, aboutInView] = useInView({ threshold: 0.1 });
  const [skillsRef, skillsInView] = useInView({ threshold: 0.15 });
  const [goalsRef, goalsInView] = useInView({ threshold: 0.15 });

  // Modal contact state
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Emotion state — shared between ImageOfTheDay and EmotionState widgets
  const [emotionData, setEmotionData] = useState(DEFAULT_EMOTION);

  const handleChangeEmotion = (level, label, emoji, tag) => {
    setEmotionData({ value: level, label, emoji, tag });
  };

  // Calculations
  const completedGoalsCount = profile.goals?.filter(g => g.done).length || 0;
  const totalGoals = profile.goals?.length || 0;
  const goalPercent = totalGoals > 0 ? Math.round((completedGoalsCount / totalGoals) * 100) : 0;

  const completedSchedulesCount = schedules.filter(s => s.completed).length;
  const masteredVocabCount = vocabularies.filter(v => v.isMastered).length;

  const handleCreateGoal = (e) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    addGoal(newGoalText.trim(), newGoalTag);
    setNewGoalText('');
    setIsAddingGoal(false);
  };

  const scrollToAbout = () => {
    const el = document.getElementById('dashboard-details');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('daipv.study@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="w-full pb-16 animate-in fade-in duration-300">

      {/* ========================================================================= */}
      {/* 1. HERO BANNER: CHỮ KHỔNG LỒ SAU ẢNH + ẢNH GIỮA PHÓNG TO + 2 CÁNH BÊN    */}
      {/* ========================================================================= */}
      <section className="relative w-full min-h-screen flex flex-col justify-end overflow-hidden bg-gradient-to-b from-[#06080E] via-[#0B0F1C] to-[#0F1424] text-white pt-16">

        {/* Background Ambient Glows & Dot Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-25 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[450px] bg-blue-600/15 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-t from-blue-500/25 via-sky-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />


        {/* ===================== CONTAINER CHÍNH CHỨA ẢNH Ở GIỮA VÀ 2 CÁNH BÊN ===================== */}
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">

          {/* =================== CÁNH TRÁI: TIÊU ĐỀ 2 & NÚT BẢN THÂN VÀ KỸ NĂNG =================== */}
          <div className="lg:col-span-4 flex flex-col justify-end pb-8 lg:pb-24 text-center lg:text-left space-y-4 z-20 order-2 lg:order-1">
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-widest text-sky-400 font-bold block">
                Academic Hub
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-sky-200 via-blue-200 to-cyan-200 bg-clip-text text-transparent leading-tight">
                Pham Van Dai's Academic Space
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Không gian học tập & nghiên cứu của Phạm Văn Đại
              </p>
            </div>

            <div className="pt-2 flex justify-center lg:justify-start">
              <button
                onClick={scrollToAbout}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-100 font-bold text-xs sm:text-sm flex items-center gap-2.5 border border-white/20 backdrop-blur-md transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-lg shadow-black/30"
              >
                <User className="w-4 h-4 text-sky-300" />
                <span>Bản thân & Kỹ năng</span>
              </button>
            </div>
          </div>

          {/* =================== Ở GIỮA: ẢNH CHÂN DUNG PHÓNG TO 2X & ĐÁY CHẠM MÉP DƯỚI (Z-10) =================== */}
          <div className="lg:col-span-4 flex items-end justify-center self-end h-full z-10 order-1 lg:order-2 pointer-events-none">
            <div className="relative flex items-end justify-center w-full translate-x-[38px]">
              <img
                src="/Me-nobg.png"
                alt="Phạm Văn Đại"
                style={{ transform: 'scale(2)', transformOrigin: 'center bottom' }}
                className="h-[65vh] sm:h-[78vh] lg:h-[90vh] xl:h-[96vh] max-h-[1050px] w-auto object-contain object-bottom select-none drop-shadow-[0_25px_60px_rgba(0,0,0,0.98)] transition-transform duration-500"
              />
            </div>
          </div>

          {/* =================== CÁNH PHẢI: SLOGAN & NÚT LIÊN HỆ TÔI =================== */}
          <div className="lg:col-span-4 flex flex-col justify-end pb-8 lg:pb-24 text-center lg:text-right space-y-4 z-20 order-3">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-widest text-sky-400 font-bold block">
                Guiding Philosophy
              </span>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black italic text-slate-100 tracking-wide select-none leading-snug">
                “Innocence doesn't get you far.”
              </p>
            </div>

            <div className="pt-2 flex justify-center lg:justify-end">
              <button
                onClick={() => setIsContactOpen(true)}
                className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-blue-600/40 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Liên hệ tôi</span>
              </button>
            </div>
          </div>

        </div>

        {/* ===================== CHÂN BANNER: DẢI CHỮ NỐI TIẾP NHAU CHẠY QUA PHẢI ===================== */}
        <div className="w-full relative z-20 border-t border-white/10 bg-slate-950/70 backdrop-blur-md py-2.5 overflow-hidden select-none">
          <div className="flex animate-marquee-right whitespace-nowrap">
            {/* Track 1 */}
            <div className="flex items-center shrink-0">
              {Array.from({ length: 8 }).map((_, repeatIdx) => (
                <span key={repeatIdx} className="inline-flex items-center">
                  {BANNER_WORDS.map((word, wIdx) => (
                    <span key={wIdx} className="inline-flex items-center">
                      <span className="text-xs sm:text-sm font-extrabold tracking-wider bg-gradient-to-r from-sky-300 via-blue-200 to-cyan-300 bg-clip-text text-transparent hover:brightness-125 transition-all">
                        {word}
                      </span>
                      <span className="mx-3 text-sky-400/60 font-black text-xs sm:text-sm select-none">
                        -
                      </span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
            {/* Track 2 (bản sao chính xác để vòng lặp chạy mượt mà vô tận) */}
            <div className="flex items-center shrink-0" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, repeatIdx) => (
                <span key={repeatIdx} className="inline-flex items-center">
                  {BANNER_WORDS.map((word, wIdx) => (
                    <span key={wIdx} className="inline-flex items-center">
                      <span className="text-xs sm:text-sm font-extrabold tracking-wider bg-gradient-to-r from-sky-300 via-blue-200 to-cyan-300 bg-clip-text text-transparent hover:brightness-125 transition-all">
                        {word}
                      </span>
                      <span className="mx-3 text-sky-400/60 font-black text-xs sm:text-sm select-none">
                        -
                      </span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>

      </section>


      {/* ========================================================================= */}
      {/* 2. DASHBOARD BODY: VỀ BẢN THÂN TÔI (FULL-WIDTH), SKILLS & GOALS           */}
      {/* ========================================================================= */}
      <div id="dashboard-details" className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-16 space-y-10">

        {/* ========================================================================= */}
        {/* COMPONENT LỚN: VỀ BẢN THÂN TÔI (BỀ NGANG LỚN / FULL-WIDTH CARD)           */}
        {/* ========================================================================= */}
        <div 
          ref={aboutRef}
          className={`glass-card p-6 sm:p-8 lg:p-10 rounded-3xl shadow-xs hover:shadow-md border border-slate-200 dark:border-slate-700 relative overflow-hidden transition-all duration-700 ${
            aboutInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Ambient decorative lighting */}
          <div className="absolute -top-12 -right-12 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Col (4 cols): Avatar, Name, Role, Location, Contact Button */}
            <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 lg:border-r lg:border-slate-100 dark:lg:border-slate-700 lg:pr-8">
              <div className="relative">
                <img
                  src={profile.avatar && profile.avatar !== '/avatar.svg' ? profile.avatar : '/avt.jpg'}
                  alt={profile.name}
                  onError={(e) => { e.currentTarget.src = '/avt.jpg'; }}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover object-center border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-xs"
                />
                <span className="absolute -bottom-1.5 -right-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Dev
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {profile.name}
                  </h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 border border-blue-100 dark:border-blue-800/50">
                    {profile.nickname || "Dajid"}
                  </span>
                </div>
                <p className="text-xs font-semibold text-blue-600 flex items-center justify-center lg:justify-start gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{profile.role}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs text-slate-500 dark:text-slate-500">
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-xl font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {profile.location || "Hà Nội, Việt Nam"}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-xl font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {profile.status}
                </span>
              </div>

              <div className="pt-1 w-full flex justify-center lg:justify-start">
                <button
                  onClick={() => setIsContactOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Kết nối với tôi</span>
                </button>
              </div>
            </div>

            {/* Right Col (8 cols): Bio Story, Mindset & 3 Key Pillars */}
            <div className="lg:col-span-8 space-y-5">
              
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 text-blue-700 text-xs font-bold">
                  <Award className="w-3.5 h-3.5" />
                  <span>Về Bản Thân Tôi • About Me</span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                  “{profile.quote || "Innocence doesn't get you far."}”
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                  Xây dựng tri thức & kiến tạo sản phẩm từ kỷ luật mỗi ngày
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {profile.bio}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tôi theo đuổi tư duy phát triển bền vững trong lập trình: không chỉ dừng lại ở việc viết code chạy được, mà phải hiểu sâu bản chất hệ thống, kiến trúc sạch và ứng dụng phương pháp ghi nhớ ngắt quãng (Spaced Repetition) để biến kiến thức công nghệ thành phản xạ tự nhiên.
                </p>
              </div>

              {/* 3 Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                    <Laptop className="w-4 h-4" />
                    <span>Fullstack Mindset</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-normal">
                    Làm chủ từ giao diện React trực quan đến hệ thống API & Database vững chắc.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                    <Target className="w-4 h-4" />
                    <span>1% Tốt hơn mỗi ngày</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-normal">
                    Duy trì thói quen học tập liên tục, tích lũy từ vựng và giải thuật hằng ngày.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
                    <Compass className="w-4 h-4" />
                    <span>Học qua Thực chiến</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-normal">
                    Biến mọi lý thuyết thành sản phẩm thực tế, có thể chạy và tương tác được.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Main Content Split: Kỹ năng & Mục tiêu cá nhân */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left column (7 cols): Giới thiệu chi tiết & Kỹ năng */}
          <div className="lg:col-span-7 space-y-8">

            {/* Skills Card */}
            <div ref={skillsRef} className="glass-card p-6 sm:p-8 rounded-3xl shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Kỹ Năng & Mảng Kiến Thức</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-500">Các lĩnh vực đang rèn luyện và áp dụng thực tế</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {profile.skills?.map((skill, index) => {
                  const fallbackGradients = [
                    'linear-gradient(90deg, #3b82f6 0%, #22d3ee 100%)', // Blue - Cyan
                    'linear-gradient(90deg, #10b981 0%, #2dd4bf 100%)', // Emerald - Teal
                    'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)', // Indigo - Purple (Database & APIs)
                    'linear-gradient(90deg, #f59e0b 0%, #fb923c 100%)', // Amber - Orange
                    'linear-gradient(90deg, #ec4899 0%, #fb7185 100%)', // Pink - Rose
                  ];
                  const gradientClass = 
                    skill.name === 'Database & APIs' || index === 2 || skill.color === 'from-blue-600 to-cyan-500'
                      ? 'from-indigo-500 to-purple-500'
                      : skill.color || 'from-blue-500 to-cyan-400';
                  const inlineGradient = fallbackGradients[index % fallbackGradients.length];

                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                        <span>{skill.name}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          <CountUp end={skill.level} duration={1200} suffix="%" />
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-1000 ease-out`}
                          style={{
                            width: skillsInView ? `${skill.level}%` : '0%',
                            backgroundImage: inlineGradient
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">#CleanCode</span>
                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">#Fullstack</span>
                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">#ContinuousLearning</span>
                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">#EnglishForTech</span>
              </div>
            </div>

            {/* Learning Philosophy Card */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-xs space-y-4 border-l-4 border-l-blue-600">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-50 dark:bg-sky-900/30 text-sky-600 rounded-xl">
                  <Compass className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Phương Pháp Học Tập</h2>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Tôi tin tưởng vào việc kết hợp giữa <strong className="text-slate-800 dark:text-slate-200">Học theo dự án thực tế (Project-based Learning)</strong> và <strong className="text-slate-800 dark:text-slate-200">Lặp lại ngắt quãng (Spaced Repetition)</strong>. Nền tảng DajidStudy này là minh chứng cho việc biến tri thức thành sản phẩm có thể sử dụng mỗi ngày.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 block mb-1">🎯 1% Tốt hơn mỗi ngày</span>
                  <span className="text-slate-500 dark:text-slate-500">Mỗi ngày học 1 chủ đề, ghi nhớ ít nhất 5 từ vựng mới.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 block mb-1">🛠️ Học đi đôi với Hành</span>
                  <span className="text-slate-500 dark:text-slate-500">Viết code ngay khi đọc lý thuyết, ghi chú bài học qua dự án.</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right column (5 cols): Image of the Day, Emotion State, Goals & Todo List */}
          <div className="lg:col-span-5 space-y-8">

            {/* Image of the Day (tích hợp Emotion State bên trong) */}
            {/* 2 WIDGETS: "IMAGE OF THE DAY" (7 cols) & "EMOTION STATE" (5 cols) */}
            <div className="grid grid-cols-12 gap-3.5 sm:gap-4 items-stretch">

              {/* Widget 1: Image of the Day — small square, click to open modal */}
              <div className="col-span-7 flex flex-col">
                <ImageOfTheDay
                  emotion={emotionData}
                  onChangeEmotion={(preset) =>
                    handleChangeEmotion(preset.value, preset.label, preset.emoji, preset.tag)
                  }
                />
              </div>

              {/* Widget 2: Emotion State */}
              <div className="col-span-5 flex flex-col">
                <EmotionState
                  level={emotionData.value}
                  label={emotionData.label}
                  emoji={emotionData.emoji}
                  tag={emotionData.tag}
                  onChangeLevel={handleChangeEmotion}
                />
              </div>

            </div>

            {/* Mục Tiêu Tuần Này */}
            <div ref={goalsRef} className="glass-card p-6 sm:p-8 rounded-3xl shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Mục Tiêu Tuần Này</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Tiến độ: <CountUp end={completedGoalsCount} duration={800} />/{totalGoals} (<CountUp end={goalPercent} duration={1000} suffix="%" />)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddingGoal(!isAddingGoal)}
                  className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  title="Thêm mục tiêu"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-1000 ease-out"
                  style={{ width: goalsInView ? `${goalPercent}%` : '0%' }}
                />
              </div>

              {/* Add Goal Form */}
              {isAddingGoal && (
                <form onSubmit={handleCreateGoal} className="mb-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="Nhập mục tiêu cần thực hiện..."
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-slate-100"
                    autoFocus
                  />
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={newGoalTag}
                      onChange={(e) => setNewGoalTag(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 text-slate-600"
                    >
                      <option value="Học tập">Học tập</option>
                      <option value="Coding">Coding</option>
                      <option value="Ngoại ngữ">Ngoại ngữ</option>
                      <option value="Kỷ luật">Kỷ luật</option>
                      <option value="Cá nhân">Cá nhân</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingGoal(false)}
                        className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Goals List */}
              <div className="space-y-2.5">
                {profile.goals?.map((goal) => (
                  <div
                    key={goal.id}
                    className={`group flex items-center justify-between p-3 rounded-2xl border transition-all ${goal.done
                      ? 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 shadow-xs hover:border-blue-200'
                      }`}
                  >
                    <div
                      onClick={() => toggleGoal(goal.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={goal.done}
                        onChange={() => { }}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                      />
                      <span className={`text-xs font-medium ${goal.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {goal.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${goal.done ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' : 'bg-blue-50 text-blue-600'
                        }`}>
                        {goal.tag}
                      </span>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 rounded-md transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Quick Schedule Preview Card */}
            <div className="glass-card p-6 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Lịch học sắp tới</h3>
                </div>
                <button
                  onClick={() => onNavigate('schedule')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {schedules.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-100 block truncate max-w-[200px]">{item.subject}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.dayOfWeek} • {item.timeStart} - {item.timeEnd}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.completed ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}>
                      {item.completed ? 'Đã học' : 'Chưa'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL LIÊN HỆ TÔI                                                      */}
      {/* ========================================================================= */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-100 space-y-5 animate-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Liên Hệ Với Tôi</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Phạm Văn Đại (Dajid)</p>
                </div>
              </div>

              <button
                onClick={() => setIsContactOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Rất vui được kết nối cùng bạn! Bạn có thể liên hệ với tôi qua email hoặc các kênh trực tuyến dưới đây để trao đổi về học tập, dự án và công nghệ.
            </p>

            <div className="space-y-3 text-xs">
              {/* Email row */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Email làm việc</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 truncate block">daipv.study@gmail.com</span>
                  </div>
                </div>
                <button
                  onClick={handleCopyEmail}
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors shrink-0"
                  title="Sao chép email"
                >
                  {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Location row */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Khu vực</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Hà Nội, Việt Nam</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="mailto:daipv.study@gmail.com"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Gửi email trực tiếp</span>
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
