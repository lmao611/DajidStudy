import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Clock,
  Zap,
  Award,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Trophy,
  Sliders,
  Volume2,
  Flame,
  ArrowRight,
  Layers,
  HelpCircle,
  Lightbulb,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStudyStore } from '../stores/studyStore';
import { prepareTestWords, calculateQuestionSE, calculateNextDifficultyFromTest } from '../utils/testScoring';
import { CountUp } from './CountUp';

export const VocabularyTestModal = ({ isOpen, onClose, onOpenRankModal }) => {
  const { vocabularies, recordTestResult } = useStudyStore();

  // Chỉ chọn những từ đã tiếp xúc (tức đã đánh giá ít nhất 1 lần qua Lật thẻ hoặc Gõ chữ)
  const eligibleVocabs = (vocabularies || []).filter(
    (v) =>
      v &&
      !v.isDeleted &&
      ((typeof v.reps === 'number' && v.reps > 0) ||
        Boolean(v.lastReviewDate) ||
        (v.srsStatus && v.srsStatus !== 'New') ||
        (typeof v.lapses === 'number' && v.lapses > 0))
  );

  // Test Phases: 'setup' | 'testing' | 'result'
  const [phase, setPhase] = useState('setup');

  // Setup options
  const [timeLimitOption, setTimeLimitOption] = useState(30); // null, 15, 30, 45
  const [wordCountOption, setWordCountOption] = useState(10); // 5, 10, 15, 'all'
  const [difficultyOption, setDifficultyOption] = useState('all'); // 'all', 'easy', 'medium', 'hard'

  // Active Test States
  const [testWords, setTestWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedInput, setTypedInput] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [testRecords, setTestRecords] = useState([]);

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setPhase('setup');
      setTypedInput('');
      setHintLevel(0);
      setIsAnswered(false);
      setCurrentResult(null);
      setTestRecords([]);
    }
  }, [isOpen]);

  // Handle countdown timer during active testing
  useEffect(() => {
    if (phase !== 'testing' || isAnswered || timeLimitOption === null) return;

    setTimeRemaining(timeLimitOption);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase, currentIndex, isAnswered, timeLimitOption]);

  // Autofocus input on each question
  useEffect(() => {
    if (phase === 'testing' && !isAnswered) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [phase, currentIndex, isAnswered]);

  const speakWord = (text) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Start test session
  const handleStartTest = () => {
    if (eligibleVocabs.length === 0) return;

    let pool = [...eligibleVocabs];

    // Filter by difficulty option if requested
    if (difficultyOption === 'easy') {
      pool = pool.filter(v => (v.word || '').length <= 7);
    } else if (difficultyOption === 'hard') {
      pool = pool.filter(v => (v.word || '').length >= 9);
    } else if (difficultyOption === 'medium') {
      pool = pool.filter(v => (v.word || '').length > 7 && (v.word || '').length < 9);
    }

    if (pool.length === 0) pool = [...eligibleVocabs];

    // Shuffle pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    // Slice count
    const targetCount = wordCountOption === 'all'
      ? shuffled.length
      : Math.min(shuffled.length, parseInt(wordCountOption, 10));

    const selectedPool = shuffled.slice(0, targetCount);

    // Prepare test words with 200 - 6666 SE scaling & top 10% hardest allocation
    const prepared = prepareTestWords(selectedPool);

    setTestWords(prepared);
    setCurrentIndex(0);
    setTypedInput('');
    setHintLevel(0);
    setIsAnswered(false);
    setCurrentResult(null);
    setTestRecords([]);
    setPhase('testing');
  };

  // Submit and check answer
  const handleSubmitAnswer = (e) => {
    if (e) e.preventDefault();
    if (isAnswered) {
      handleNextQuestion();
      return;
    }

    const currentItem = testWords[currentIndex];
    if (!currentItem) return;

    const spentTime = timeLimitOption ? (timeLimitOption - timeRemaining) : 5;

    const result = calculateQuestionSE({
      item: currentItem,
      userAnswer: typedInput,
      hintLevel,
      gaveUp: false,
      timeSpentSeconds: spentTime,
      timeLimit: timeLimitOption
    });

    const curDiff = typeof currentItem.difficulty === 'number' ? currentItem.difficulty : 5.0;
    result.diffResult = calculateNextDifficultyFromTest(curDiff, result.typos, false);

    setCurrentResult(result);
    setIsAnswered(true);

    if (!result.isPassed) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } else {
      speakWord(currentItem.word);
      if (result.isSingleHardestJackpot || currentItem.isTop10Hardest || result.earnedSE >= 3000) {
        try {
          confetti({
            particleCount: result.isSingleHardestJackpot ? 120 : 70,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch (err) {}
      }
    }

    setTestRecords(prev => [...prev, {
      wordObj: currentItem,
      userInput: typedInput,
      result
    }]);
  };

  // Handle timeout on a question
  const handleTimeOut = () => {
    const currentItem = testWords[currentIndex];
    if (!currentItem) return;

    const result = calculateQuestionSE({
      item: currentItem,
      userAnswer: typedInput,
      hintLevel,
      gaveUp: true,
      timeSpentSeconds: timeLimitOption || 30,
      timeLimit: timeLimitOption
    });

    const curDiff = typeof currentItem.difficulty === 'number' ? currentItem.difficulty : 5.0;
    result.diffResult = calculateNextDifficultyFromTest(curDiff, result.typos, true);

    result.message = 'Hết thời gian quy định! (0 SE)';
    setCurrentResult(result);
    setIsAnswered(true);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    setTestRecords(prev => [...prev, {
      wordObj: currentItem,
      userInput: typedInput,
      result
    }]);
  };

  // Handle giving up on current question
  const handleGiveUp = () => {
    const currentItem = testWords[currentIndex];
    if (!currentItem) return;

    const result = calculateQuestionSE({
      item: currentItem,
      userAnswer: '',
      hintLevel,
      gaveUp: true,
      timeSpentSeconds: timeLimitOption ? (timeLimitOption - timeRemaining) : 10,
      timeLimit: timeLimitOption
    });

    const curDiff = typeof currentItem.difficulty === 'number' ? currentItem.difficulty : 5.0;
    result.diffResult = calculateNextDifficultyFromTest(curDiff, result.typos, true);

    setCurrentResult(result);
    setIsAnswered(true);
    speakWord(currentItem.word);

    setTestRecords(prev => [...prev, {
      wordObj: currentItem,
      userInput: '(Xem đáp án)',
      result
    }]);
  };

  // Advance to next question or finish test
  const handleNextQuestion = () => {
    if (currentIndex + 1 < testWords.length) {
      setCurrentIndex(prev => prev + 1);
      setTypedInput('');
      setHintLevel(0);
      setIsAnswered(false);
      setCurrentResult(null);
    } else {
      // Test finished! Calculate summary and record to store
      finishTestSession();
    }
  };

  const finishTestSession = () => {
    const records = [...testRecords];
    if (currentResult && records.length < testWords.length) {
      records.push({
        wordObj: testWords[currentIndex],
        userInput: typedInput,
        result: currentResult
      });
    }

    const totalEarnedSE = records.reduce((sum, r) => sum + (r.result?.earnedSE || 0), 0);
    const totalMaxSE = testWords.reduce((sum, w) => sum + (w.isSingleHardest ? 3333 : (w.baseSE || 0)), 0);
    const passedCount = records.filter(r => r.result?.isPassed).length;
    const totalCount = testWords.length;
    const accuracy = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

    let grade = 'C';
    if (accuracy >= 90) grade = 'S';
    else if (accuracy >= 80) grade = 'A';
    else if (accuracy >= 65) grade = 'B';
    else if (accuracy < 50) grade = 'D';

    // Record into global studyStore & update word difficulties
    recordTestResult({
      scoreSE: totalEarnedSE,
      maxSE: totalMaxSE,
      correctCount: passedCount,
      totalCount,
      grade,
      records
    });

    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 }
      });
    } catch (e) {}

    setPhase('result');
  };

  if (!isOpen) return null;

  const currentItem = testWords[currentIndex] || {};
  const totalEarnedSoFar = testRecords.reduce((sum, r) => sum + (r.result?.earnedSE || 0), 0);
  const totalMaxSE = testWords.reduce((sum, w) => sum + (w.baseSE || 0), 0);
  const passedCount = testRecords.filter(r => r.result?.isPassed).length;
  const accuracy = testWords.length > 0 ? Math.round((passedCount / testWords.length) * 100) : 0;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 relative overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Background ambient decorative glow */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button with large generous hitbox */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 sm:right-5 sm:top-5 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 active:scale-90 rounded-2xl transition-all z-50 cursor-pointer pointer-events-auto border border-slate-200 dark:border-slate-700 shadow-xs group"
          title="Đóng bài kiểm tra (Esc)"
          aria-label="Đóng"
        >
          <X className="w-5 h-5 pointer-events-none group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* ========================================================================= */}
        {/* PHASE 1: CẤU HÌNH BÀI THI (SETUP)                                         */}
        {/* ========================================================================= */}
        {phase === 'setup' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
                <Trophy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Hệ Thống Đánh Giá Năng Lực Từ Vựng</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Kiểm Tra Từ Vựng (Active Recall)
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                Luyện gõ từ vựng tiếng Anh theo nghĩa tiếng Việt. Tích lũy điểm <strong className="text-slate-700 dark:text-slate-200">Spirit Energy (SE)</strong> để thăng cấp Rank!
              </p>
            </div>

            {/* SE Rules Announcement Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-cyan-50/60 to-blue-50/80 dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Quy chế tính điểm Spirit Energy (SE):</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pl-1 leading-relaxed">
                <li>Điểm bài thi: <strong className="text-blue-700 dark:text-blue-300">200 SE – 1,000 SE</strong> (Top 10% từ khó nhất bài thi nhận trần 1,000 SE).</li>
                <li>★ <strong>Thử thách Từ Khó Nhất</strong>: Đúng <strong>1 từ khó nhất trong bài</strong>, nếu <strong>không dùng gợi ý</strong> và <strong>đúng 100% chính tả</strong> sẽ nhận ngay <strong className="text-purple-700 dark:text-purple-300 font-extrabold">3,333 SE</strong>!</li>
                <li><strong>Giới hạn chính tả</strong>: Sai tối đa 3 ký tự (quá 3 ký tự tính 0 SE). Dùng gợi ý hoặc sai ký tự sẽ bị trừ % điểm.</li>
              </ul>
            </div>

            {/* Options Grid */}
            <div className="space-y-4">
              {/* Option 1: Word Count */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  1. Số lượng từ kiểm tra:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 'all'].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setWordCountOption(count)}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all ${
                        wordCountOption === count
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {count === 'all' ? `Tất cả (${eligibleVocabs.length})` : `${count} từ`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Time Limit */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  2. Thời gian giới hạn mỗi câu:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: null, label: 'Tự do' },
                    { val: 15, label: '15 giây' },
                    { val: 30, label: '30 giây' },
                    { val: 45, label: '45 giây' }
                  ].map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setTimeLimitOption(item.val)}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                        timeLimitOption === item.val
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 3: Difficulty Filter */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  3. Phân loại độ khó:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'all', label: 'Hỗn hợp' },
                    { key: 'easy', label: 'Dễ' },
                    { key: 'medium', label: 'Vừa' },
                    { key: 'hard', label: 'Khó' }
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setDifficultyOption(item.key)}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all ${
                        difficultyOption === item.key
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Warning if no words have been evaluated yet */}
            {eligibleVocabs.length === 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-amber-900 dark:text-amber-200">Chưa có từ vựng đủ điều kiện kiểm tra!</p>
                  <p className="text-[12px] text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                    Hệ thống bài kiểm tra chỉ chọn những từ bạn <strong>đã tiếp xúc (tức đã đánh giá ít nhất 1 lần)</strong> qua chế độ Lật thẻ hoặc Gõ chữ. Hãy học và đánh giá vài từ trước khi bắt đầu bài kiểm tra nhé!
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleStartTest}
                disabled={eligibleVocabs.length === 0}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all ${
                  eligibleVocabs.length === 0
                    ? 'bg-slate-300 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25 active:scale-95'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Bắt đầu kiểm tra</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PHASE 2: LÀM BÀI THI TRỰC TIẾP (ACTIVE TESTING)                           */}
        {/* ========================================================================= */}
        {phase === 'testing' && currentItem && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header: Progress, Points & Timer */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                  Câu {currentIndex + 1} / {testWords.length}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                  currentItem.isSingleHardest
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/60 ring-2 ring-amber-400/30 animate-pulse'
                    : currentItem.isTop10Hardest
                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50'
                    : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/40'
                }`}>
                  ⚡ {currentItem.isSingleHardest ? '1,000 SE (★ 3,333 SE nếu không gợi ý & chuẩn chính tả)' : `${currentItem.baseSE} SE (${currentItem.difficultyLabel})`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Timer (if enabled) */}
                {timeLimitOption !== null && (
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono transition-colors ${
                    timeRemaining <= 5
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 animate-bounce'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeRemaining}s</span>
                  </div>
                )}

                {/* Live SE accumulator */}
                <div className="text-xs font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>+{totalEarnedSoFar} SE</span>
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-400">
                <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[11px]">
                  {currentItem.partOfSpeech || 'Từ vựng'} • {currentItem.topic}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentItem.word?.length} ký tự
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Nghĩa tiếng Việt:</span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-snug pt-0.5">
                  {currentItem.meaning}
                </h3>
              </div>

              {/* Hints display if requested */}
              {hintLevel >= 1 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-700 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200">
                    <span className="font-bold flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Gợi ý 1:
                    </span>
                    <span className="font-mono text-sm tracking-widest font-black text-amber-900 dark:text-amber-200">
                      {currentItem.word.split('').map((ch, i) => i === 0 ? ch.toUpperCase() : (ch === ' ' ? '' : '_')).join(' ')}
                    </span>
                  </div>

                  {hintLevel >= 2 && currentItem.example && (
                    <div className="text-xs bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg border border-blue-200 dark:border-blue-800/40 text-blue-900 dark:text-blue-200 italic animate-in fade-in">
                      "{currentItem.example.replace(new RegExp(`\\b${currentItem.word}\\b`, 'gi'), '__________')}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Typing Form */}
            <form onSubmit={handleSubmitAnswer} className="space-y-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Gõ từ tiếng Anh rồi bấm Enter..."
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  disabled={isAnswered}
                  className={`w-full px-4 py-3 pr-24 text-base font-semibold rounded-2xl border transition-all outline-none ${
                    isShaking ? 'animate-shake' : ''
                  } ${
                    isAnswered
                      ? currentResult?.isPassed
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-400'
                  }`}
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {isAnswered ? (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
                    >
                      <span>{currentIndex + 1 === testWords.length ? 'Xem kết quả' : 'Tiếp theo'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!typedInput.trim()}
                      className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 ${
                        typedInput.trim()
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Nộp bài</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Feedback Alert After Submitting */}
              {isAnswered && currentResult && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in ${
                  currentResult.isPassed
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200'
                }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      {currentResult.isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{currentResult.message}</span>
                    </div>
                    {!currentResult.isPassed && (
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 pl-5">
                        Đáp án đúng: <strong className="font-bold underline">{currentItem.word}</strong>
                        {currentItem.phonetic ? ` [${currentItem.phonetic}]` : ''}
                      </p>
                    )}

                    {currentResult.diffResult && (
                      <div className="flex items-center gap-1 text-[11px] font-bold pl-5 pt-0.5">
                        <span className="text-slate-500 dark:text-slate-400">Độ khó từ:</span>
                        <span className="text-slate-700 dark:text-slate-300">{(currentItem.difficulty || 5.0).toFixed(1)}</span>
                        <span>➔</span>
                        <span className={currentResult.diffResult.delta < 0 ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : (currentResult.diffResult.delta > 0 ? 'text-rose-700 dark:text-rose-400 font-extrabold' : 'text-slate-600 dark:text-slate-400')}>
                          {currentResult.diffResult.newDifficulty.toFixed(1)} ({currentResult.diffResult.delta > 0 ? `+${currentResult.diffResult.delta}` : (currentResult.diffResult.delta < 0 ? `${currentResult.diffResult.delta}` : 'Giữ nguyên')})
                        </span>
                        {currentResult.diffResult.newDifficulty <= 3.0 && (
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px]">
                            ★ Đã thuộc!
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`block text-sm font-black ${
                      currentResult.isSingleHardestJackpot ? 'text-purple-700 dark:text-purple-300 text-base animate-bounce' : 'text-emerald-700 dark:text-emerald-400'
                    }`}>
                      +{currentResult.earnedSE} SE
                    </span>
                    {currentResult.isSingleHardestJackpot && (
                      <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-extrabold tracking-wide">
                        ★ JACKPOT 3,333 SE
                      </span>
                    )}
                    {currentResult.speedBonus > 0 && (
                      <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                        ⚡ Thưởng tốc độ +{currentResult.speedBonus} SE
                      </span>
                    )}
                  </div>
                </div>
              )}
            </form>

            {/* Helpers & Actions during test */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                {!isAnswered && (
                  <>
                    <button
                      type="button"
                      onClick={() => setHintLevel(prev => Math.min(2, prev + 1))}
                      disabled={hintLevel >= 2}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                        hintLevel === 0
                          ? 'bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                          : hintLevel === 1
                          ? 'bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                      }`}
                      title="Sử dụng gợi ý sẽ bị trừ một phần điểm SE"
                    >
                      <Lightbulb className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>{hintLevel === 0 ? 'Gợi ý (-18% SE)' : hintLevel === 1 ? 'Thêm ví dụ (-45% SE)' : 'Hết gợi ý'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGiveUp}
                      className="px-2.5 py-1 rounded-lg text-[11px] text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      Bỏ cuộc (0 SE)
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-300">Enter</kbd>
                <span>để nộp / tiếp</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PHASE 3: TỔNG KẾT KẾT QUẢ BÀI KIỂM TRA (RESULTS)                          */}
        {/* ========================================================================= */}
        {phase === 'result' && (
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-300 py-2">
            <div className="relative inline-block">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-200 flex items-center justify-center shadow-xl shadow-amber-400/20 ring-4 ring-amber-100 dark:ring-amber-900/40">
                <Trophy className="w-10 h-10 text-amber-950" />
              </div>
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-black text-xs shadow-md">
                Hạng {accuracy >= 90 ? 'S' : accuracy >= 80 ? 'A' : accuracy >= 65 ? 'B' : 'C'}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Hoàn Thành Bài Kiểm Tra!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Điểm Spirit Energy đã được cộng trực tiếp vào thành tích cá nhân của bạn.
              </p>
            </div>

            {/* Score Showcase */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Tổng SE Nhận Được</span>
                <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                  +<CountUp end={totalEarnedSoFar} duration={1200} /> SE
                </span>
              </div>
              <div className="text-center border-x border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Độ Chính Xác</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  <CountUp end={accuracy} duration={1000} />%
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Số Từ Đúng</span>
                <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
                  {passedCount} / {testWords.length}
                </span>
              </div>
            </div>

            {/* Test Word Breakdown Mini-list */}
            <div className="text-left space-y-1.5 max-h-36 overflow-y-auto p-1 scrollbar-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-1">
                Chi tiết kết quả từng từ:
              </span>
              {testRecords.map((rec, i) => (
                <div key={i} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${rec.result?.isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="font-bold text-slate-800 dark:text-slate-200">{rec.wordObj?.word}</span>
                    {rec.wordObj?.isSingleHardest && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50">
                        ★ Khó nhất
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">({rec.wordObj?.meaning})</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className={rec.result?.isPassed ? (rec.result?.isSingleHardestJackpot ? 'text-purple-700 dark:text-purple-300 font-black' : 'text-emerald-600 dark:text-emerald-400 font-bold') : 'text-slate-400 dark:text-slate-500'}>
                      +{rec.result?.earnedSE || 0} SE
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPhase('setup');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm bài kiểm tra khác</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenRankModal) onOpenRankModal();
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Trophy className="w-4 h-4" />
                <span>Xem Cấp Bậc Rank & Hồ Sơ</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
