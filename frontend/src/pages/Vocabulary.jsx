import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  Volume2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  Search,
  Sparkles,
  Layers,
  List,
  X,
  BookmarkCheck,
  HelpCircle,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowRight,
  Lightbulb,
  Eye,
  Target,
  Clock,
  Upload,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStudyStore } from '../stores/studyStore';
import { CountUp } from '../components/CountUp';
import { VocabularyTestModal } from '../components/VocabularyTestModal';
import { ProfileRankModal } from '../components/ProfileRankModal';
import { categorizeVocabs, buildStudyQueue } from '../utils/queue';

export const Vocabulary = ({ onNavigate }) => {
  const { 
    vocabularies, 
    addVocabulary, 
    addVocabulariesBatch, 
    reviewVocabulary, 
    deleteVocabulary,
    deleteAllVocabularies 
  } = useStudyStore();

  // Mode: 'flashcard', 'typing', or 'list'
  const [viewMode, setViewMode] = useState('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('Tất cả');
  const [statusFilter, setStatusFilter] = useState('all'); // all, mastered, learning
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Delete All Vocabularies Modal States
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [confirmPhraseInput, setConfirmPhraseInput] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState('');
  const CONFIRM_PHRASE = 'Đại đẹp trai';

  // Typing Mode States
  const [typedInput, setTypedInput] = useState('');
  const [inputStatus, setInputStatus] = useState('idle'); // 'idle', 'correct', 'incorrect'
  const [hintLevel, setHintLevel] = useState(0); // 0: no hint, 1: letter count, 2: context sentence
  const [showAnswer, setShowAnswer] = useState(false);
  const [typingStreak, setTypingStreak] = useState(0);
  const [typingScore, setTypingScore] = useState({ correct: 0, total: 0 });
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  // Mouse interactive 3D tilt
  const [mouseTilt, setMouseTilt] = useState({ rotX: 2, rotY: 33 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);

  const handleCardMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    // Base Y is 33deg. Clamped strictly between 22deg and 40deg:
    // When mouse moves left, it gently decreases to min 22deg, NEVER flipping or facing left.
    const targetRotY = Math.max(22, Math.min(40, 33 + x * 7));
    const targetRotX = Math.max(-5, Math.min(6, -y * 5 + 2));

    setMouseTilt({ rotX: targetRotX, rotY: targetRotY });
    setIsHoveringCard(true);
  };

  const handleCardMouseLeave = () => {
    setIsHoveringCard(false);
    setMouseTilt({ rotX: 2, rotY: 33 });
  };

  // Form State for new vocab
  const [formData, setFormData] = useState({
    word: '',
    phonetic: '',
    partOfSpeech: 'noun',
    meaning: '',
    example: '',
    topic: 'Công nghệ'
  });

  // Extract unique topics
  const topics = ['Tất cả', ...Array.from(new Set(vocabularies.map(v => v.topic)))];

  // Hàng đợi từ vựng:
  // - Ở chế độ Lật thẻ (flashcard) hoặc Gõ chữ (typing): sử dụng Smart Prioritized Queue (ưu tiên từ mới, tiệm cận thuộc, độ khó cao có jitter, thỉnh thoảng check từ đã thuộc)
  // - Ở chế độ Danh sách (list): tra cứu toàn bộ danh mục từ
  const filteredVocabs = useMemo(() => {
    if (viewMode === 'list') {
      return vocabularies.filter(item => {
        const matchesSearch = (item.word || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.meaning || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTopic = selectedTopic === 'Tất cả' || item.topic === selectedTopic;
        const isMastered = item.isMastered || (typeof item.difficulty === 'number' && item.difficulty <= 3.0);
        const matchesStatus = statusFilter === 'all'
          ? true
          : statusFilter === 'mastered' ? isMastered : !isMastered;
        return matchesSearch && matchesTopic && matchesStatus;
      });
    }

    return buildStudyQueue(vocabularies, {
      topicFilter: selectedTopic,
      searchQuery,
      statusFilter
    });
  }, [vocabularies, viewMode, selectedTopic, searchQuery, statusFilter]);

  const currentCard = filteredVocabs[currentIndex] || filteredVocabs[0];

  // Speech pronunciation using Browser SpeechSynthesis
  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 2-step combined hint handler (1: số lượng chữ, 2: ngữ cảnh ví dụ)
  const handleHintClick = () => {
    if (hintLevel === 0) {
      setHintLevel(1);
    } else if (hintLevel === 1) {
      setHintLevel(2);
    }
  };

  // Nút chuyển chế độ riêng: Lật thẻ ⇄ Gõ chữ
  const handleTogglePracticeMode = () => {
    if (viewMode === 'flashcard') {
      // 1. Chuyển từ Lật thẻ qua Gõ chữ:
      // Chọn random 1 từ khác không phải từ trước đó (đợi lật hết hãy đổi tránh bị lộ từ)
      const availableIndices = filteredVocabs.map((_, i) => i).filter(i => i !== currentIndex);
      const randomNextIndex = availableIndices.length > 0
        ? availableIndices[Math.floor(Math.random() * availableIndices.length)]
        : currentIndex;

      if (!isFlipped) {
        // Đang ở mặt trước tiếng Anh -> lật úp sang mặt sau tiếng Việt trước
        setIsFlipped(true);
        // Đợi thẻ xoay khuất góc nhìn (sau ~360ms) rồi mới nạp từ ngẫu nhiên mới, tránh lộ từ tiếng Anh
        setTimeout(() => {
          setCurrentIndex(randomNextIndex);
          setViewMode('typing');
          setTypedInput('');
          setInputStatus('idle');
          setHintLevel(0);
          setShowAnswer(false);
          setTimeout(() => inputRef.current?.focus(), 100);
        }, 360);
      } else {
        // Đã ở mặt sau -> đổi sang từ ngẫu nhiên ngay
        setCurrentIndex(randomNextIndex);
        setViewMode('typing');
        setTypedInput('');
        setInputStatus('idle');
        setHintLevel(0);
        setShowAnswer(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } else if (viewMode === 'typing') {
      // 2. Chuyển từ Gõ chữ về Lật thẻ:
      // Cứ lật lại mặt sau của từ đó (giữ nguyên từ hiện tại, giữ mặt sau nghĩa tiếng Việt)
      setViewMode('flashcard');
      setIsFlipped(true);
    } else {
      setViewMode('flashcard');
      setIsFlipped(false);
    }
  };

  // Bấm vào thẻ để tương tác:
  // "Khi đang ở chế độ gõ, nếu bấm vào thẻ để lật thì coi như xem đáp án"
  const handleCardClick = () => {
    if (viewMode === 'typing') {
      if (inputStatus !== 'correct' && !showAnswer) {
        // Coi như xem đáp án
        setShowAnswer(true);
        setTypedInput(currentCard.word);
        speakWord(currentCard.word);
        setIsFlipped(false); // Lật sang mặt trước hiển thị từ tiếng Anh
        return;
      }
    }
    // Bình thường: lật qua lại giữa mặt trước và mặt sau
    setIsFlipped(!isFlipped);
  };

  // Auto reset typing state khi chuyển từ (currentIndex thay đổi)
  useEffect(() => {
    setTypedInput('');
    setInputStatus('idle');
    setHintLevel(0);
    setShowAnswer(false);
    if (viewMode === 'typing') {
      setIsFlipped(true); // Luôn lật mặt nghĩa tiếng Việt khi sang từ mới trong chế độ gõ
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentIndex]);

  const handleCheckAnswer = (e) => {
    if (e) e.preventDefault();
    if (!currentCard) return;

    if (inputStatus === 'correct') {
      handleNextCard();
      return;
    }

    if (!typedInput.trim()) return;

    const cleanInput = typedInput.trim().toLowerCase();
    const cleanTarget = currentCard.word.trim().toLowerCase();

    if (cleanInput === cleanTarget) {
      setInputStatus('correct');
      setTypingStreak(prev => prev + 1);
      setTypingScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (err) {}
      speakWord(currentCard.word);
    } else {
      setInputStatus('incorrect');
      setTypingStreak(0);
      setTypingScore(prev => ({ correct: prev.correct, total: prev.total + 1 }));
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleNextCard = () => {
    setIsFlipped(viewMode === 'typing'); // Nếu đang ở chế độ gõ, giữ lật mặt nghĩa tiếng Việt; ở flashcard, quay về mặt trước
    setMouseTilt({ rotX: 2, rotY: 33 });
    setIsHoveringCard(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredVocabs.length);
    }, 150);
  };

  const handlePrevCard = () => {
    setIsFlipped(viewMode === 'typing'); // Nếu đang ở chế độ gõ, giữ lật mặt nghĩa tiếng Việt; ở flashcard, quay về mặt trước
    setMouseTilt({ rotX: 2, rotY: 33 });
    setIsHoveringCard(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + filteredVocabs.length) % filteredVocabs.length);
    }, 150);
  };

  // Đã gỡ bỏ nút thủ công 'Đã thành thạo', giờ đây 'Đã thuộc' được tính tự động (độ khó <= 3)

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.word.trim() || !formData.meaning.trim()) return;

    addVocabulary(formData);
    setFormData({
      word: '',
      phonetic: '',
      partOfSpeech: 'noun',
      meaning: '',
      example: '',
      topic: 'Công nghệ'
    });
    setIsModalOpen(false);
  };

  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (Array.isArray(json)) {
          const addedCount = await addVocabulariesBatch(json);
          alert(`Đã thêm thành công ${addedCount} từ vựng vào kho học tập!`);
        } else {
          alert("File JSON không hợp lệ. Vui lòng tải lên file chứa mảng các từ vựng.");
        }
      } catch (error) {
        alert("Lỗi khi đọc file JSON: " + error.message);
        console.error(error);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const isPhraseMatched = confirmPhraseInput.trim().normalize() === CONFIRM_PHRASE.normalize();

  const handleDeleteAll = async (e) => {
    if (e) e.preventDefault();
    if (!isPhraseMatched) {
      setDeleteAllError('Vui lòng gõ chính xác cụm từ "Đại đẹp trai"!');
      return;
    }
    try {
      setIsDeletingAll(true);
      setDeleteAllError('');
      await deleteAllVocabularies();
      setIsDeleteAllModalOpen(false);
      setConfirmPhraseInput('');
      setCurrentIndex(0);
      alert('Đã xóa toàn bộ kho từ vựng thành công!');
    } catch (err) {
      console.error(err);
      setDeleteAllError('Lỗi khi xóa từ: ' + (err.message || 'Không thể xóa'));
    } finally {
      setIsDeletingAll(false);
    }
  };

  const buckets = categorizeVocabs(vocabularies, 'Tất cả');
  const newCount = buckets.new.length;
  const dueCount = buckets.due.length + buckets.learning.length;
  const masteredCount = buckets.mastered.length;
  const learningCount = vocabularies.length - masteredCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 text-blue-700 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Flashcard & Sổ tay Từ vựng</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Kho Từ Vựng Cá Nhân
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Ghi chép và luyện tập từ vựng mỗi ngày bằng phương pháp Flashcard lặp lại thông minh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick counters */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-2xl text-xs">
            <div className="text-blue-600 font-bold flex items-center gap-1" title="Từ mới">
              <span><CountUp end={newCount} duration={800} /> Mới</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <div className="text-amber-600 font-bold flex items-center gap-1" title="Cần ôn">
              <Clock className="w-3.5 h-3.5" />
              <span><CountUp end={dueCount} duration={800} /> Cần ôn</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <div className="text-emerald-600 font-bold flex items-center gap-1" title="Đã thuộc">
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span><CountUp end={masteredCount} duration={800} /> Đã thuộc</span>
            </div>
          </div>

          {/* Vocabulary Test Button */}
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 hover:shadow-orange-500/40 active:translate-y-0"
          >
            <Target className="w-4 h-4" />
            <span>Kiểm Tra Từ Vựng 🎯</span>
          </button>

          {/* Import JSON Button */}
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
            title="Nhập danh sách từ vựng từ file JSON"
          >
            <Upload className="w-4 h-4" />
            <span>Tải file JSON</span>
          </button>

          {/* Add vocab button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm từ vựng mới</span>
          </button>

          {/* Delete All Vocabularies Button */}
          <button
            type="button"
            onClick={() => {
              setConfirmPhraseInput('');
              setDeleteAllError('');
              setIsDeleteAllModalOpen(true);
            }}
            disabled={vocabularies.length === 0}
            className={`px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              vocabularies.length === 0
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600 cursor-not-allowed shadow-none'
                : 'bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 dark:border-rose-800/40 shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
            }`}
            title="Xóa toàn bộ từ vựng trong kho"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span className="hidden sm:inline">Xóa hết từ vựng</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Switch mode */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                if (viewMode === 'list') {
                  setViewMode('flashcard');
                  setIsFlipped(false);
                }
              }}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${viewMode !== 'list'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
            >
              <Layers className="w-4 h-4" />
              <span>Luyện Thẻ 3D</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
            >
              <List className="w-4 h-4" />
              <span>Danh sách từ (<CountUp end={vocabularies.length} duration={600} />)</span>
            </button>
          </div>

          {/* Nút chuyển chế độ riêng: Lật thẻ ⇄ Gõ chữ */}
          {viewMode !== 'list' && (
            <button
              onClick={handleTogglePracticeMode}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border shadow-xs bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 active:scale-95"
              title="Nhấn để đổi chế độ học (Lật thẻ ⇄ Gõ chữ)"
            >
              {viewMode === 'flashcard' ? (
                <>
                  <Keyboard className="w-4 h-4 text-blue-600" />
                  <span>Chế độ: Lật thẻ</span>
                  <span className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-800/40 font-medium">
                    ⇄ Đổi sang Gõ chữ
                  </span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Chế độ: Gõ chữ</span>
                  <span className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-800/40 font-medium">
                    ⇄ Đổi sang Lật thẻ
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm từ hoặc nghĩa..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentIndex(0);
            }}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* MODES 1 & 2: 3D CARD + COMPANION PANEL (FLASHCARD 3D HOẶC LUYỆN GÕ TỪ VỰNG) */}
      {(viewMode === 'flashcard' || viewMode === 'typing') && (
        <div className="max-w-5xl mx-auto space-y-6">
          {filteredVocabs.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl border-dashed border-2 border-slate-200 dark:border-slate-600 p-8">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Không tìm thấy từ vựng nào phù hợp</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Hãy thử xóa bộ lọc tìm kiếm hoặc thêm từ mới.</p>
            </div>
          ) : (
            <>
              {/* Card Counter & Topic & Mode Badge */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800/40">
                    {currentCard.topic}
                  </span>
                  <button
                    onClick={handleTogglePracticeMode}
                    className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 shadow-2xs transition-colors"
                    title="Bấm để chuyển đổi nhanh giữa Lật thẻ và Gõ chữ"
                  >
                    {viewMode === 'typing' ? (
                      <>
                        <Keyboard className="w-3.5 h-3.5 text-blue-600" />
                        <span>Chế độ: Gõ chữ (Bấm để đổi sang Lật thẻ)</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>Chế độ: Lật thẻ 3D (Bấm để đổi sang Gõ chữ)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {viewMode === 'typing' && typingStreak > 0 && (
                    <span className="inline-flex items-center gap-1 font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200 text-[11px] animate-bounce">
                      <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                      {typingStreak} câu đúng liên tiếp
                    </span>
                  )}
                  <span className="font-medium">
                    {viewMode === 'typing' ? 'Câu' : 'Thẻ'} {currentIndex + 1} / {filteredVocabs.length}
                  </span>
                </div>
              </div>

              {/* Main 3D Card (Left) & 2D Info Box / Typing Panel (Right) Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">

                {/* ========================================================================= */}
                {/* 1. THẺ 3D BÊN TRÁI: TILT 3D QUA BÊN PHẢI VỚI HIỆU ỨNG LẬT                */}
                {/* ========================================================================= */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center">
                  <div
                    className="w-full max-w-[430px] flex flex-col items-center justify-center py-2"
                    style={{ perspective: '1200px' }}
                  >
                    {/* Tilt 3D Wrapper: Nghiêng 3D quay mặt qua bên phải & tương tác theo chuột */}
                    <div
                      className="w-full cursor-pointer group select-none"
                      style={{
                        transform: `rotateY(${mouseTilt.rotY}deg) rotateX(${mouseTilt.rotX}deg)`,
                        transformStyle: 'preserve-3d',
                        transition: isHoveringCard
                          ? 'transform 0.12s cubic-bezier(0.2, 0, 0.4, 1)'
                          : 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
                      }}
                      onMouseMove={handleCardMouseMove}
                      onMouseLeave={handleCardMouseLeave}
                      onClick={handleCardClick}
                      title={viewMode === 'typing' && inputStatus !== 'correct' && !showAnswer ? "Bấm vào thẻ để xem đáp án" : "Nhấn vào thẻ để lật qua lại"}
                    >
                      {/* Flip container: Xoay 180 độ khi lật */}
                      <div
                        className="relative w-full h-[360px] rounded-3xl transition-transform duration-700 shadow-2xl hover:shadow-blue-500/10"
                        style={{
                          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                          transformStyle: 'preserve-3d',
                        }}
                      >
                        {/* FRONT FACE (MẶT TRƯỚC 3D) */}
                        <div
                          className="absolute inset-0 rounded-3xl p-7 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-white dark:from-slate-800 via-blue-50/40 dark:via-blue-900/30 to-white dark:to-slate-800 border-2 border-blue-200 dark:border-blue-700/60 select-none shadow-xl"
                          style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800/40">
                                {currentCard.partOfSpeech || 'Từ vựng'}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600" title="Độ khó">
                                Khó: {(currentCard.difficulty || 5.0).toFixed(1)}
                              </span>
                            </div>
                            {currentCard.isMastered && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                                <BookmarkCheck className="w-3.5 h-3.5" />
                                Đã thuộc
                              </span>
                            )}
                          </div>

                          <div className="my-auto space-y-3 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                {currentCard.word}
                              </h2>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakWord(currentCard.word);
                                }}
                                className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors shadow-xs"
                                title="Phát âm tiếng Anh"
                              >
                                <Volume2 className="w-5 h-5" />
                              </button>
                            </div>

                            {currentCard.phonetic && (
                              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/30 inline-block px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800/40">
                                {currentCard.phonetic}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
                            <span>{viewMode === 'typing' ? 'Nhấn để lật lại nghĩa tiếng Việt' : 'Nhấn thẻ hoặc nút bên để lật mặt'}</span>
                          </div>
                        </div>

                        {/* BACK FACE (MẶT SAU 3D) */}
                        <div
                          className="absolute inset-0 rounded-3xl p-7 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-[#0c1f38] via-slate-900 to-[#071326] text-white border-2 border-blue-500/40 select-none shadow-2xl"
                          style={{
                            transform: 'rotateY(180deg)',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                          }}
                        >
                          <div className="flex items-center justify-between text-xs text-sky-300">
                            {viewMode === 'typing' && inputStatus !== 'correct' && !showAnswer ? (
                              <span className="inline-flex items-center gap-1.5 font-bold text-sky-300 bg-blue-800/80 px-2.5 py-1 rounded-lg border border-blue-600/60 text-[11px]">
                                <Keyboard className="w-3.5 h-3.5 text-sky-400" />
                                <span>Chế độ Luyện Gõ</span>
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{currentCard.word}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakWord(currentCard.word);
                                  }}
                                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-sky-300 transition-colors"
                                  title="Nghe phát âm"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                            <span className="bg-blue-800/60 px-2.5 py-0.5 rounded-lg border border-blue-700/60 text-[11px]">
                              {currentCard.topic}
                            </span>
                          </div>

                          <div className="my-auto space-y-4 text-center">
                            <div>
                              <span className="text-[11px] uppercase tracking-wider text-sky-400 font-bold block mb-1">
                                {viewMode === 'typing' ? 'Nghĩa tiếng Việt (Điền từ tiếng Anh bên phải):' : 'Định nghĩa:'}
                              </span>
                              <h3 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                                {currentCard.meaning}
                              </h3>
                              {viewMode === 'typing' && (
                                <span className="inline-block mt-2 text-[11px] font-semibold text-sky-300/90 uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10">
                                  Loại từ: {currentCard.partOfSpeech || 'Từ vựng'}
                                </span>
                              )}
                            </div>

                            {/* Ví dụ ngữ cảnh: Flashcard luôn hiện; Typing chỉ hiện khi hintLevel >= 2 hoặc đúng/xem đáp án */}
                            {currentCard.example && (viewMode !== 'typing' || hintLevel >= 2 || inputStatus === 'correct' || showAnswer) && (
                              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-left backdrop-blur-xs">
                                <span className="text-[10px] text-sky-300 font-bold uppercase tracking-wider block mb-1">
                                  {viewMode === 'typing' && inputStatus !== 'correct' && !showAnswer ? 'Ngữ cảnh gợi ý (Đã che từ):' : 'Ví dụ thực tế:'}
                                </span>
                                <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
                                  {viewMode === 'typing' && inputStatus !== 'correct' && !showAnswer ? (
                                    `"${currentCard.example.replace(new RegExp(`\\b${currentCard.word}\\b`, 'gi'), '__________')}"`
                                  ) : (
                                    `"${currentCard.example}"`
                                  )}
                                </p>
                              </div>
                            )}

                            {viewMode === 'typing' && hintLevel < 2 && inputStatus !== 'correct' && !showAnswer && (
                              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-400/20 text-xs text-sky-200/90 text-center">
                                <span>👉 Nhập từ vào ô bên phải hoặc dùng gợi ý để mở khóa ngữ cảnh ví dụ</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 mt-4 z-10 relative">
                            <span className="text-[10px] text-center font-bold text-sky-400 uppercase block mb-1">
                              Đánh giá độ nhớ từ này:
                            </span>
                            <div className="grid grid-cols-4 gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); reviewVocabulary(currentCard.id, 1, viewMode); handleNextCard(); }}
                                className="py-2 rounded-xl text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/40 transition-colors shadow-2xs"
                                title="Lại (1)"
                              >
                                Lại (1)
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); reviewVocabulary(currentCard.id, 2, viewMode); handleNextCard(); }}
                                className="py-2 rounded-xl text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/40 transition-colors shadow-2xs"
                                title="Khó (2)"
                              >
                                Khó (2)
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); reviewVocabulary(currentCard.id, 3, viewMode); handleNextCard(); }}
                                className="py-2 rounded-xl text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/40 transition-colors shadow-2xs"
                                title="Tốt (3)"
                              >
                                Tốt (3)
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); reviewVocabulary(currentCard.id, 4, viewMode); handleNextCard(); }}
                                className="py-2 rounded-xl text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/40 transition-colors shadow-2xs"
                                title="Dễ (4)"
                              >
                                Dễ (4)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3D Depth Floor Shadow */}
                    <div
                      className="w-3/4 h-3.5 mt-2 bg-slate-900/10 rounded-full blur-md pointer-events-none transition-transform duration-200"
                      style={{
                        transform: `skewX(-${mouseTilt.rotY * 0.65}deg)`
                      }}
                    />
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* 2. KHUNG BÊN PHẢI: ĐỐI CHIẾU 2D (FLASHCARD) HOẶC ĐIỀN TỪ (TYPING)         */}
                {/* ========================================================================= */}
                {viewMode === 'flashcard' ? (
                  /* 2A. KHUNG THÔNG TIN ĐỐI CHIẾU 2D CHO FLASHCARD */
                  <div className="lg:col-span-5 flex flex-col justify-center">
                    <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-xs flex flex-col justify-between h-[325px] relative overflow-hidden transition-all duration-300">

                      {/* Decorative subtle ambient light */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

                      {/* Header: Face indicator & 2D Flip action */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isFlipped ? 'bg-indigo-500 animate-pulse' : 'bg-blue-500 animate-pulse'}`} />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                            {isFlipped ? 'Mặt Sau (2D)' : 'Mặt Trước (2D)'}
                          </span>
                        </div>

                        <button
                          onClick={() => setIsFlipped(!isFlipped)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 transition-colors border border-blue-200 dark:border-blue-700/50 shadow-2xs active:scale-95"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>{isFlipped ? 'Xem mặt trước' : 'Lật mặt sau'}</span>
                        </button>
                      </div>

                      {/* Body: 2D Record of Card Information */}
                      <div className="my-auto space-y-3 py-2">
                        {!isFlipped ? (
                          /* GHI LẠI THÔNG TIN MẶT TRƯỚC Ở DẠNG 2D */
                          <div className="space-y-3 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-0.5 rounded-lg uppercase tracking-wider border border-blue-100 dark:border-blue-800/40">
                                {currentCard.partOfSpeech || 'Từ vựng'}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                Chủ đề: <strong className="text-slate-700 dark:text-slate-300">{currentCard.topic}</strong>
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2.5">
                                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                                  {currentCard.word}
                                </h3>
                                <button
                                  onClick={() => speakWord(currentCard.word)}
                                  className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-800/60 text-blue-600 dark:text-blue-300 transition-colors"
                                  title="Nghe phát âm"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                              </div>
                              {currentCard.phonetic && (
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                  {currentCard.phonetic}
                                </p>
                              )}
                            </div>

                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                                💡 Gợi ý nhận diện 2D:
                              </span>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                Tập trung liên tưởng ngữ cảnh của từ <strong className="text-slate-700 dark:text-slate-200">{currentCard.word}</strong> trước khi lật để tối ưu khả năng phản xạ trí nhớ.
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* GHI LẠI THÔNG TIN MẶT SAU Ở DẠNG 2D */
                          <div className="space-y-3 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-lg uppercase tracking-wider border border-indigo-100 dark:border-indigo-800/40">
                                Ý nghĩa & Giải thích
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                Từ gốc: <strong className="text-blue-700 dark:text-blue-400">{currentCard.word}</strong>
                              </span>
                            </div>

                            <div>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Nghĩa tiếng Việt:</span>
                              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug mt-0.5">
                                {currentCard.meaning}
                              </h3>
                            </div>

                            {currentCard.example && (
                              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                                  Ngữ cảnh áp dụng:
                                </span>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 italic leading-relaxed">
                                  "{currentCard.example}"
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer: Status toggle and fast actions */}
                      <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                        {isFlipped ? (
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] text-center font-bold text-slate-400 dark:text-slate-500 uppercase">Đánh giá trí nhớ của bạn:</span>
                            <div className="grid grid-cols-4 gap-2">
                              <button onClick={() => { reviewVocabulary(currentCard.id, 1); handleNextCard(); }} className="py-1.5 rounded-lg text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shadow-2xs">Lại (1)</button>
                              <button onClick={() => { reviewVocabulary(currentCard.id, 2); handleNextCard(); }} className="py-1.5 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors shadow-2xs">Khó (2)</button>
                              <button onClick={() => { reviewVocabulary(currentCard.id, 3); handleNextCard(); }} className="py-1.5 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shadow-2xs">Tốt (3)</button>
                              <button onClick={() => { reviewVocabulary(currentCard.id, 4); handleNextCard(); }} className="py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-2xs">Dễ (4)</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setIsFlipped(false)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-600 text-white shadow-2xs"
                              >
                                Mặt 1
                              </button>
                              <button
                                onClick={() => setIsFlipped(true)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                Mặt 2
                              </button>
                            </div>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${currentCard.isMastered
                              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40'
                              : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                              }`}>
                              {currentCard.isMastered ? '✓ Đã thuộc' : '○ Đang học'}
                            </span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                ) : (
                  /* 2B. KHUNG ĐIỀN TỪ TIẾNG ANH (ACTIVE RECALL TYPING PANEL) */
                  <div className="lg:col-span-5 flex flex-col justify-center">
                    <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[325px] lg:h-[360px] relative overflow-hidden transition-all duration-300">
                      {/* Decorative subtle ambient light */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                            <Keyboard className="w-3.5 h-3.5 text-blue-600" />
                            Điền Từ Tiếng Anh
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {typingStreak > 0 && (
                            <span className="inline-flex items-center gap-1 font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-orange-800/40 text-[11px] animate-bounce">
                              <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                              {typingStreak}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            Câu {currentIndex + 1}/{filteredVocabs.length}
                          </span>
                        </div>
                      </div>

                      {/* Middle Content: Hints, Answer Reveal, Form & Alerts */}
                      <div className="my-auto space-y-3 py-1 overflow-y-auto max-h-[220px] scrollbar-none">
                        {/* 2 GỢI Ý CHUNG (LẦN 1: SỐ LƯỢNG CHỮ, LẦN 2: NGỮ CẢNH VÍ DỤ) */}
                        {hintLevel >= 1 && !showAnswer && inputStatus !== 'correct' && (
                          <div className="space-y-2 animate-in fade-in duration-200">
                            {/* Gợi ý 1: Số lượng chữ */}
                            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                                    Gợi ý 1: Số lượng ký tự ({currentCard.word.replace(/\s+/g, '').length} chữ)
                                  </span>
                                  <span className="font-mono text-sm tracking-widest font-black text-amber-900 dark:text-amber-100">
                                    {currentCard.word.split('').map((ch, i) => i === 0 ? ch.toUpperCase() : (ch === ' ' ? '' : '_')).join(' ')}
                                  </span>
                                </div>
                              </div>
                              {currentCard.phonetic && (
                                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40 shrink-0">
                                  {currentCard.phonetic}
                                </span>
                              )}
                            </div>

                            {/* Gợi ý 2: Ngữ cảnh câu ví dụ (khi hintLevel === 2) */}
                            {hintLevel >= 2 && currentCard.example && (
                              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-200 space-y-0.5 animate-in fade-in duration-200">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                                  Gợi ý 2: Ngữ cảnh ví dụ (đã che từ)
                                </span>
                                <p className="text-[11px] text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                  "{currentCard.example.replace(new RegExp(`\\b${currentCard.word}\\b`, 'gi'), '__________')}"
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Khi bấm xem đáp án */}
                        {showAnswer && (
                          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-between gap-2 animate-in fade-in">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">Đáp án chính xác:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-black text-blue-900 dark:text-blue-100">{currentCard.word}</span>
                                {currentCard.phonetic && (
                                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{currentCard.phonetic}</span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => speakWord(currentCard.word)}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 shadow-xs border border-blue-200 dark:border-blue-800/40"
                              title="Nghe phát âm"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Ô điền từ & nút kiểm tra */}
                        <form onSubmit={handleCheckAnswer} className="space-y-2">
                          <div className="relative">
                            <input
                              ref={inputRef}
                              type="text"
                              placeholder="Gõ từ tiếng Anh rồi bấm Enter..."
                              value={typedInput}
                              onChange={(e) => {
                                setTypedInput(e.target.value);
                                if (inputStatus !== 'idle') setInputStatus('idle');
                              }}
                              disabled={inputStatus === 'correct'}
                              className={`w-full px-4 py-2.5 pr-24 text-sm font-semibold rounded-xl border transition-all outline-none ${
                                isShaking ? 'animate-shake' : ''
                              } ${
                                inputStatus === 'correct'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                                  : inputStatus === 'incorrect'
                                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20'
                                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                              }`}
                            />

                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                              {inputStatus === 'correct' ? (
                                <button
                                  type="button"
                                  onClick={handleNextCard}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95"
                                >
                                  <span>Tiếp</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="submit"
                                  disabled={!typedInput.trim()}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 ${
                                    typedInput.trim()
                                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Kiểm tra</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Phản hồi đúng / sai */}
                          {inputStatus === 'correct' && (
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-in fade-in">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                Chính xác 100%! Bấm <strong>Enter</strong> để sang từ tiếp theo.
                              </span>
                              <button
                                type="button"
                                onClick={() => speakWord(currentCard.word)}
                                className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded text-emerald-700 dark:text-emerald-300"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {inputStatus === 'incorrect' && (
                            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-[11px] font-semibold text-rose-800 dark:text-rose-200 flex items-center gap-1.5 animate-in fade-in">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              Chưa đúng! Thử lại hoặc bấm gợi ý bên dưới.
                            </div>
                          )}

                          {/* 4 NÚT ĐÁNH GIÁ ĐỘ KHÓ FSRS KHI ĐÃ GÕ ĐÚNG HOẶC XEM ĐÁP ÁN */}
                          {(inputStatus === 'correct' || showAnswer) && (
                            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5 animate-in fade-in duration-200">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <span>Đánh giá độ nhớ từ:</span>
                                <span className="text-blue-600 dark:text-blue-400">Độ khó: {(currentCard.difficulty || 5.0).toFixed(1)}</span>
                              </div>
                              <div className="grid grid-cols-4 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => { reviewVocabulary(currentCard.id, 1, 'typing'); handleNextCard(); }}
                                  className="py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all active:scale-95 shadow-2xs"
                                  title="Quên từ / Cần học lại"
                                >
                                  Lại (1)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { reviewVocabulary(currentCard.id, 2, 'typing'); handleNextCard(); }}
                                  className="py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all active:scale-95 shadow-2xs"
                                  title="Nhớ mang máng, hơi khó"
                                >
                                  Khó (2)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { reviewVocabulary(currentCard.id, 3, 'typing'); handleNextCard(); }}
                                  className="py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all active:scale-95 shadow-2xs"
                                  title="Nhớ tốt"
                                >
                                  Tốt (3)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { reviewVocabulary(currentCard.id, 4, 'typing'); handleNextCard(); }}
                                  className="py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all active:scale-95 shadow-2xs"
                                  title="Rất dễ, nhớ ngay"
                                >
                                  Dễ (4)
                                </button>
                              </div>
                            </div>
                          )}
                        </form>
                      </div>

                      {/* Footer: 2 Gợi Ý & Xem đáp án */}
                      <div className="border-t border-slate-100 dark:border-slate-700 pt-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {/* 2 Gợi Ý Button */}
                          {inputStatus !== 'correct' && !showAnswer && (
                            <button
                              type="button"
                              onClick={handleHintClick}
                              disabled={hintLevel >= 2}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                                hintLevel === 0
                                  ? 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                                  : hintLevel === 1
                                  ? 'bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700/50'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                              }`}
                              title={hintLevel === 0 ? "Lần 1: Xem số lượng chữ" : hintLevel === 1 ? "Lần 2: Xem ngữ cảnh ví dụ" : "Đã dùng hết 2 gợi ý"}
                            >
                              <Lightbulb className="w-3 h-3 text-amber-600" />
                              <span>
                                {hintLevel === 0
                                  ? 'Gợi ý (0/2)'
                                  : hintLevel === 1
                                  ? 'Gợi ý thêm (1/2)'
                                  : 'Hết gợi ý (2/2)'}
                              </span>
                            </button>
                          )}

                          {/* Xem đáp án button */}
                          {!showAnswer && inputStatus !== 'correct' && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowAnswer(true);
                                setTypedInput(currentCard.word);
                                speakWord(currentCard.word);
                                setIsFlipped(false); // Lật sang mặt trước hiển thị từ tiếng Anh
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Xem đáp án</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px] text-slate-600 dark:text-slate-300">Enter</kbd>
                          <span>kiểm tra</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Action Controls (Trước / Đã thuộc / Tiếp) */}
              <div className="flex items-center justify-between gap-4 pt-2 max-w-xl mx-auto">
                <button
                  onClick={handlePrevCard}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-transform active:scale-95 flex items-center gap-1 text-xs font-semibold"
                  title="Thẻ trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Từ trước</span>
                </button>

                {/* 4 Nút đánh giá độ khó FSRS */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => { reviewVocabulary(currentCard.id, 1, viewMode); handleNextCard(); }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all active:scale-95 shadow-2xs"
                    title="Lại (1)"
                  >
                    Lại (1)
                  </button>
                  <button
                    type="button"
                    onClick={() => { reviewVocabulary(currentCard.id, 2, viewMode); handleNextCard(); }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all active:scale-95 shadow-2xs"
                    title="Khó (2)"
                  >
                    Khó (2)
                  </button>
                  <button
                    type="button"
                    onClick={() => { reviewVocabulary(currentCard.id, 3, viewMode); handleNextCard(); }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all active:scale-95 shadow-2xs"
                    title="Tốt (3)"
                  >
                    Tốt (3)
                  </button>
                  <button
                    type="button"
                    onClick={() => { reviewVocabulary(currentCard.id, 4, viewMode); handleNextCard(); }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all active:scale-95 shadow-2xs"
                    title="Dễ (4)"
                  >
                    Dễ (4)
                  </button>
                </div>

                <button
                  onClick={handleNextCard}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-transform active:scale-95 flex items-center gap-1 text-xs font-semibold"
                  title="Thẻ tiếp theo"
                >
                  <span className="hidden sm:inline">Từ kế tiếp</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* MODE 3: WORD LIST / DICTIONARY */}
      {viewMode === 'list' && (
        <div className="space-y-4">

          {/* Filters: Topic & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">

            {/* Topic buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {topics.map(topic => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${selectedTopic === topic
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                >
                  {topic}
                </button>
              ))}
            </div>

            {/* Status toggle buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium ${statusFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs font-semibold' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Tất cả (<CountUp end={vocabularies.length} duration={600} />)
              </button>
              <button
                onClick={() => setStatusFilter('mastered')}
                className={`px-2.5 py-1 rounded-lg font-medium ${statusFilter === 'mastered' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Đã thuộc (<CountUp end={masteredCount} duration={600} />)
              </button>
              <button
                onClick={() => setStatusFilter('learning')}
                className={`px-2.5 py-1 rounded-lg font-medium ${statusFilter === 'learning' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-semibold' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Cần học (<CountUp end={learningCount} duration={600} />)
              </button>

              {vocabularies.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmPhraseInput('');
                    setDeleteAllError('');
                    setIsDeleteAllModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/40 transition-all flex items-center gap-1 cursor-pointer ml-1"
                  title="Xóa toàn bộ từ vựng trong kho"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Xóa hết</span>
                </button>
              )}
            </div>

          </div>

          {/* Words Table / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVocabs.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${item.isMastered
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/40 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-xs hover:border-blue-200 dark:hover:border-blue-700'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{item.word}</h4>
                      <button
                        onClick={() => speakWord(item.word)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {item.partOfSpeech}
                      </span>
                    </div>
                    {item.phonetic && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block">{item.phonetic}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteVocabulary(item.id)}
                      className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Xóa từ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs space-y-1.5">
                  <div className="text-slate-800 dark:text-slate-100 font-medium">
                    <span className="font-bold text-blue-700 dark:text-blue-400">Nghĩa: </span>
                    {item.meaning}
                  </div>
                  {item.example && (
                    <div className="text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      "{item.example}"
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    <span>Chủ đề: <strong className="text-slate-600 dark:text-slate-300">{item.topic}</strong></span>
                    <span className={`font-semibold ${item.isMastered ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {item.isMastered ? '● Đã thành thạo' : '○ Cần ôn tập'}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* Modal Thêm Từ Vựng Mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Thêm Từ Vựng Mới</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Từ vựng (Tiếng Anh/Khác) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Paradigm, Synergy..."
                    value={formData.word}
                    onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Phiên âm IPA</label>
                  <input
                    type="text"
                    placeholder="/ˈpær.ə.daɪm/"
                    value={formData.phonetic}
                    onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Từ loại</label>
                  <select
                    value={formData.partOfSpeech}
                    onChange={(e) => setFormData({ ...formData, partOfSpeech: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white"
                  >
                    <option value="noun">Danh từ (noun)</option>
                    <option value="verb">Động từ (verb)</option>
                    <option value="adjective">Tính từ (adj)</option>
                    <option value="adverb">Trạng từ (adv)</option>
                    <option value="phrase">Cụm từ (phrase)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Chủ đề</label>
                  <input
                    type="text"
                    placeholder="Công nghệ, IELTS, Giao tiếp..."
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Nghĩa tiếng Việt *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Mô hình, hệ hình tư duy chuẩn mực..."
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Ví dụ câu thực tế</label>
                <textarea
                  rows={2}
                  placeholder="The company created a new paradigm in digital streaming..."
                  value={formData.example}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
                >
                  Lưu từ vựng
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Toàn Bộ Từ Vựng */}
      {isDeleteAllModalOpen && (
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => {
            if (!isDeletingAll) {
              setIsDeleteAllModalOpen(false);
              setConfirmPhraseInput('');
              setDeleteAllError('');
            }
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-rose-100 dark:border-rose-900/40 animate-in zoom-in-95 duration-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header with Danger Icon */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                  Xóa Toàn Bộ Từ Vựng?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Hành động này <strong className="text-rose-600 dark:text-rose-400 font-bold">không thể hoàn tác</strong>!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDeletingAll) {
                    setIsDeleteAllModalOpen(false);
                    setConfirmPhraseInput('');
                    setDeleteAllError('');
                  }
                }}
                disabled={isDeletingAll}
                className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Details */}
            <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-900 dark:text-rose-200 space-y-1.5">
              <p className="leading-relaxed">
                Bạn sắp xóa sạch vĩnh viễn <strong className="font-extrabold text-rose-700 dark:text-rose-400">{vocabularies.length} từ vựng</strong> khỏi trình duyệt và toàn bộ Cloud Database (Firestore).
              </p>
            </div>

            {/* Confirm phrase box */}
            <form onSubmit={handleDeleteAll} className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Vui lòng gõ lại chính xác cụm từ sau để xác nhận:
                </label>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-black text-slate-900 dark:text-slate-100 select-all font-mono text-base tracking-wider shadow-inner">
                  {CONFIRM_PHRASE}
                </div>
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  autoFocus
                  disabled={isDeletingAll}
                  placeholder={`Gõ "${CONFIRM_PHRASE}" vào đây...`}
                  value={confirmPhraseInput}
                  onChange={(e) => {
                    setConfirmPhraseInput(e.target.value);
                    setDeleteAllError('');
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border transition-all outline-none ${
                    isPhraseMatched
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  }`}
                />
                
                {confirmPhraseInput.trim().length > 0 && (
                  <p className={`text-[11px] font-bold flex items-center gap-1 pt-0.5 ${
                    isPhraseMatched ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {isPhraseMatched ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Đã khớp cụm từ xác nhận!</span>
                      </>
                    ) : (
                      <span>Chưa khớp cụm từ yêu cầu</span>
                    )}
                  </p>
                )}

                {deleteAllError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold pt-1">
                    {deleteAllError}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  disabled={isDeletingAll}
                  onClick={() => {
                    setIsDeleteAllModalOpen(false);
                    setConfirmPhraseInput('');
                    setDeleteAllError('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={!isPhraseMatched || isDeletingAll}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    isPhraseMatched && !isDeletingAll
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25 active:scale-95 cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isDeletingAll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang xóa sạch dữ liệu...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xác nhận xóa hết</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Vocabulary Test System Modal */}
      <VocabularyTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onOpenRankModal={() => {
          setIsTestModalOpen(false);
          setIsProfileModalOpen(true);
        }}
      />

      {/* Profile & Rank Modal */}
      <ProfileRankModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenGiaPha={() => {
          setIsProfileModalOpen(false);
          if (onNavigate) {
            onNavigate('giapha');
          } else {
            window.history.pushState({ tab: 'giapha' }, '', '/gia-pha');
            window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'giapha' }));
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenTestModal={() => {
          setIsProfileModalOpen(false);
          setIsTestModalOpen(true);
        }}
      />

    </div>
  );
};
