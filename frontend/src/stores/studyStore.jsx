import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  profileService,
  vocabService,
  scheduleService,
  testHistoryService,
  reviewLogService,
  planService,
  isFirebaseConfigured
} from '../services/firebase';
import { r2StorageService, isR2Configured } from '../services/r2Storage';
import { calculateNextSrsState } from '../utils/srs/index.js';
import { appendCompressedLog, extractRawLogs } from '../utils/srs/reviewLog.js';
import { getLocalDateString } from '../utils/queue.js';
import { calculateNextDifficultyFromTest, getVocabularyRank, getStreakRank } from '../utils/testScoring.js';

// Initial data for Profile (stats all zero, histories empty — loaded from cloud on first run)
const initialProfile = {
  name: "Phạm Văn Đại",
  nickname: "Dajid",
  role: "Lập trình viên & Người học suốt đời (Lifelong Learner)",
  bio: "Chào bạn! Đây là không gian số cá nhân của tôi — nơi tôi chia sẻ về hành trình phát triển bản thân, theo dõi lịch trình học tập mỗi ngày và ghi chép kho từ vựng yêu thích.",
  avatar: "/avt.jpg",
  quote: "“Innocence doesn't get you far.”",
  location: "Việt Nam",
  status: "Đang cày cuốc công nghệ mới 🚀",
  stats: {
    totalHoursStudied: 0,
    completedTasks: 0,
    streakDays: 0,
    wordsLearned: 0,
    totalSE: 0,
    testsCompleted: 0,
  },
  studyHistory: [],
  testHistory: [],
  skills: [
    { name: "React / Frontend", level: 0, color: "from-blue-500 to-cyan-400" },
    { name: "Node.js / Express", level: 0, color: "from-emerald-500 to-teal-400" },
    { name: "Database & APIs", level: 0, color: "from-indigo-500 to-purple-500" },
    { name: "Tiếng Anh Chuyên ngành", level: 0, color: "from-amber-500 to-orange-400" },
    { name: "Tự học & Nghiên cứu", level: 0, color: "from-pink-500 to-rose-400" },
  ],
  goals: []
};

// Initial data for Schedule (empty — user adds their own)
const initialSchedules = [];

// Initial data for Vocabularies (empty — user adds their own)
const initialVocabularies = [];

// Initial data for Plans (empty)
const initialPlans = [];

const StudyContext = createContext(null);

export const StudyProvider = ({ children }) => {
  // Load from localStorage if available, otherwise use mock defaults
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('dajid_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.avatar = parsed.avatar || '/avt.jpg';
        if (!parsed.stats) parsed.stats = { ...initialProfile.stats };
        // Dọn sạch mock stats cũ
        if (parsed.stats.totalSE === 4850 || parsed.testHistory?.[0]?.id === 'test-init-1') {
          parsed.stats = { totalHoursStudied: 0, completedTasks: 0, streakDays: 0, wordsLearned: 0, totalSE: 0, testsCompleted: 0 };
          parsed.studyHistory = [];
          parsed.testHistory = [];
        }
        if (parsed.stats.totalSE === undefined) parsed.stats.totalSE = 0;
        if (parsed.stats.testsCompleted === undefined) parsed.stats.testsCompleted = 0;
        if (parsed.stats.streakDays === undefined) parsed.stats.streakDays = 0;
        if (!parsed.studyHistory) parsed.studyHistory = [];
        if (!parsed.testHistory) parsed.testHistory = [];
        // Dọn sạch mock goals cũ (id 1..4 dạng số nguyên)
        if (parsed.goals?.some(g => [1, 2, 3, 4].includes(g.id))) {
          parsed.goals = [];
        }
        // Dọn sạch mock skill levels cũ (85, 80, 75, 78, 90) → reset về 0
        const mockLevels = [85, 80, 75, 78, 90];
        if (parsed.skills?.some(s => mockLevels.includes(s.level))) {
          parsed.skills = parsed.skills.map(s =>
            mockLevels.includes(s.level) ? { ...s, level: 0 } : s
          );
        }
        if (parsed.skills) {
          parsed.skills = parsed.skills.map((s, idx) => {
            if (s.name === 'Database & APIs' || idx === 2 || s.color === 'from-blue-600 to-cyan-500') {
              return { ...s, color: 'from-indigo-500 to-purple-500' };
            }
            return s;
          });
        }
        return parsed;
      } catch (e) {
        return initialProfile;
      }
    }
    return initialProfile;
  });

  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem('dajid_schedules');
    return saved ? JSON.parse(saved) : initialSchedules;
  });

  const [vocabularies, setVocabularies] = useState(() => {
    try {
      const saved = localStorage.getItem('dajid_vocabs');
      const list = saved ? JSON.parse(saved) : initialVocabularies;
      const seenIds = new Set();
      return (list || []).map((item, idx) => {
        if (!item.id || seenIds.has(item.id)) {
          item.id = `voc-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
        }
        seenIds.add(item.id);
        return item;
      });
    } catch (e) {
      return initialVocabularies;
    }
  });

  const [compressedLogs, setCompressedLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('dajid_compressed_review_logs');
      return saved ? JSON.parse(saved) : { dict: [], logs: [] };
    } catch (e) {
      return { dict: [], logs: [] };
    }
  });

  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem('dajid_plans');
    return saved ? JSON.parse(saved) : initialPlans;
  });

  const [cloudSynced, setCloudSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    if (profile) {
      localStorage.setItem('dajid_profile', JSON.stringify(profile));
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('dajid_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('dajid_vocabs', JSON.stringify(vocabularies));
  }, [vocabularies]);

  useEffect(() => {
    localStorage.setItem('dajid_plans', JSON.stringify(plans));
  }, [plans]);

  // Initial cloud sync with Firestore
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let isMounted = true;
    const syncFromCloud = async () => {
      try {
        setIsSyncing(true);

        // 1. Đồng bộ Profile
        const cloudProfile = await profileService.getProfile('main_profile');
        if (cloudProfile && isMounted) {
          // Dọn sạch mọi dữ liệu mock cũ trong Profile
          let profileDirty = false;

          // Mock stats cũ (SE 4850, test-init-1, hoặc streak/wordsLearned mock)
          if (
            cloudProfile.stats?.totalSE === 4850 ||
            cloudProfile.testHistory?.[0]?.id === 'test-init-1'
          ) {
            cloudProfile.stats = { totalHoursStudied: 0, completedTasks: 0, streakDays: 0, wordsLearned: 0, totalSE: 0, testsCompleted: 0 };
            cloudProfile.studyHistory = [];
            cloudProfile.testHistory = [];
            profileDirty = true;
          }

          // Mock goals cũ (id 1..4 dạng số nguyên)
          if (cloudProfile.goals?.some(g => [1, 2, 3, 4].includes(g.id))) {
            cloudProfile.goals = [];
            profileDirty = true;
          }

          // Mock skill levels cũ (85, 80, 75, 78, 90)
          const mockLevels = [85, 80, 75, 78, 90];
          if (cloudProfile.skills?.some(s => mockLevels.includes(s.level))) {
            cloudProfile.skills = cloudProfile.skills.map(s =>
              mockLevels.includes(s.level) ? { ...s, level: 0 } : s
            );
            profileDirty = true;
          }

          if (profileDirty) {
            await profileService.saveProfile(cloudProfile, 'main_profile');
          }

          setProfile(prev => {
            const localStats = prev?.stats || {};
            const cloudStats = cloudProfile?.stats || {};

            // Giữ lại tiến trình cao nhất giữa local và cloud (tránh trường hợp cloud ghi đè làm tụt số từ đã học)
            const mergedStats = {
              ...localStats,
              ...cloudStats,
              wordsLearned: Math.max(Number(localStats.wordsLearned) || 0, Number(cloudStats.wordsLearned) || 0),
              totalSE: Math.max(Number(localStats.totalSE) || 0, Number(cloudStats.totalSE) || 0),
              streakDays: Math.max(Number(localStats.streakDays) || 0, Number(cloudStats.streakDays) || 0),
              testsCompleted: Math.max(Number(localStats.testsCompleted) || 0, Number(cloudStats.testsCompleted) || 0),
            };

            // Hợp nhất studyHistory để không mất số từ học trong ngày
            const historyMap = new Map();
            (cloudProfile.studyHistory || []).forEach(item => {
              if (!item) return;
              const key = item.isoDate || item.date;
              if (key) historyMap.set(key, { ...item });
            });
            (prev?.studyHistory || []).forEach(item => {
              if (!item) return;
              const key = item.isoDate || item.date;
              if (key) {
                const existing = historyMap.get(key);
                if (existing) {
                  historyMap.set(key, {
                    ...existing,
                    ...item,
                    wordsLearned: Math.max(Number(existing.wordsLearned) || 0, Number(item.wordsLearned) || 0),
                    pointsSE: Math.max(Number(existing.pointsSE) || 0, Number(item.pointsSE) || 0),
                    testsCount: Math.max(Number(existing.testsCount) || 0, Number(item.testsCount) || 0)
                  });
                } else {
                  historyMap.set(key, { ...item });
                }
              }
            });
            const mergedHistory = Array.from(historyMap.values()).slice(-7);

            const nextMerged = {
              ...prev,
              ...cloudProfile,
              stats: mergedStats,
              skills: cloudProfile.skills || prev.skills,
              goals: cloudProfile.goals ?? prev.goals,
              studyHistory: mergedHistory,
              testHistory: cloudProfile.testHistory || prev.testHistory || [],
              avatar: cloudProfile.avatar || prev.avatar || '/avt.jpg',
            };

            // Đồng bộ ngược lại Firestore nếu local đang có số từ/SE/Streak cao hơn cloud
            if (mergedStats.wordsLearned > (Number(cloudStats.wordsLearned) || 0) ||
                mergedStats.totalSE > (Number(cloudStats.totalSE) || 0) ||
                mergedStats.streakDays > (Number(cloudStats.streakDays) || 0)) {
              profileService.saveProfile(nextMerged, 'main_profile');
            }

            return nextMerged;
          });
        } else if (!cloudProfile && isMounted) {
          await profileService.saveProfile(profile, 'main_profile');
        }

        // 2. Đồng bộ Vocabularies 2 chiều (Local <-> Cloud Firestore)
        const cloudVocabs = await vocabService.getAll();
        const localVocabs = JSON.parse(localStorage.getItem('dajid_vocabs') || '[]');
        const mockVocabIds = ['voc-1', 'voc-2', 'voc-3', 'voc-4', 'voc-5', 'voc-6'];

        const cleanCloud = (cloudVocabs || []).filter(v => v && v.word && !mockVocabIds.includes(v.id));
        const cleanLocal = (localVocabs || []).filter(v => v && v.word && !mockVocabIds.includes(v.id));

        // Gom danh sách theo từ (word lowercased)
        const vocabMap = new Map();
        cleanCloud.forEach(item => {
          vocabMap.set(item.word.trim().toLowerCase(), item);
        });

        // Tìm từ có ở local nhưng chưa có trên cloud để upload lên cloud
        const toUploadToCloud = [];
        cleanLocal.forEach(item => {
          const key = item.word.trim().toLowerCase();
          if (!vocabMap.has(key)) {
            vocabMap.set(key, item);
            toUploadToCloud.push(item);
          } else {
            // Nếu cả 2 đều có: giữ lại bản có số lần ôn tập (reps) cao hơn hoặc đã thuộc
            const existing = vocabMap.get(key);
            if ((item.reps || 0) > (existing.reps || 0) || item.isMastered) {
              vocabMap.set(key, { ...existing, ...item });
            }
          }
        });

        const mergedVocabs = Array.from(vocabMap.values());
        if (isMounted) {
          setVocabularies(mergedVocabs);
          localStorage.setItem('dajid_vocabs', JSON.stringify(mergedVocabs));
        }

        // Tự động đẩy các từ còn thiếu từ Local lên Cloud để điện thoại và các thiết bị khác cùng có
        if (toUploadToCloud.length > 0) {
          for (const vocab of toUploadToCloud) {
            await vocabService.add(vocab).catch(e => console.warn('Lỗi đồng bộ từ lên cloud:', e));
          }
        }

        // 3. Đồng bộ Schedules 2 chiều (Local <-> Cloud Firestore)
        const cloudSchedules = await scheduleService.getAll();
        const localSchedules = JSON.parse(localStorage.getItem('dajid_schedules') || '[]');
        const mockSchIds = ['sch-1', 'sch-2', 'sch-3', 'sch-4', 'sch-5'];

        const cleanCloudSch = (cloudSchedules || []).filter(s => s && s.subject && !mockSchIds.includes(s.id));
        const cleanLocalSch = (localSchedules || []).filter(s => s && s.subject && !mockSchIds.includes(s.id));

        const schMap = new Map();
        cleanCloudSch.forEach(s => schMap.set(s.id || s.subject, s));
        const schToUpload = [];
        cleanLocalSch.forEach(s => {
          const key = s.id || s.subject;
          if (!schMap.has(key)) {
            schMap.set(key, s);
            schToUpload.push(s);
          }
        });

        const mergedSchedules = Array.from(schMap.values());
        if (isMounted) {
          setSchedules(mergedSchedules);
          localStorage.setItem('dajid_schedules', JSON.stringify(mergedSchedules));
        }

        if (schToUpload.length > 0) {
          for (const s of schToUpload) {
            await scheduleService.add(s).catch(e => console.warn('Lỗi đồng bộ lịch lên cloud:', e));
          }
        }

        // 3.5 Đồng bộ Plans 2 chiều (Local <-> Cloud Firestore)
        const cloudPlans = await planService.getAll();
        const localPlans = JSON.parse(localStorage.getItem('dajid_plans') || '[]');
        
        const planMap = new Map();
        (cloudPlans || []).forEach(p => planMap.set(p.id, p));
        
        const plansToUpload = [];
        (localPlans || []).forEach(p => {
          if (!planMap.has(p.id)) {
            planMap.set(p.id, p);
            plansToUpload.push(p);
          }
        });

        const mergedPlans = Array.from(planMap.values());
        if (isMounted) {
          setPlans(mergedPlans);
          localStorage.setItem('dajid_plans', JSON.stringify(mergedPlans));
        }

        if (plansToUpload.length > 0) {
          for (const p of plansToUpload) {
            await planService.add(p).catch(e => console.warn('Lỗi đồng bộ plans lên cloud:', e));
          }
        }

        // 4. Đồng bộ Review Logs (Nén từ điển / Dictionary-compressed format)
        try {
          const cloudLogs = await reviewLogService.getCompressedLogs();
          if (cloudLogs && Array.isArray(cloudLogs.logs) && cloudLogs.logs.length > 0 && isMounted) {
            setCompressedLogs(cloudLogs);
            localStorage.setItem('dajid_compressed_review_logs', JSON.stringify(cloudLogs));
          }
        } catch (logErr) {
          console.warn('Lỗi khi đồng bộ compressed review logs:', logErr);
        }

        // 5. Kiểm tra tính liên tục của chuỗi học tập (Streak check)
        if (cloudProfile?.stats?.lastActiveDate && isMounted) {
          const todayStr = getLocalDateString();
          const yesterdayStr = getLocalDateString(Date.now() - 86400000);
          const lastActive = cloudProfile.stats.lastActiveDate;
          if (lastActive !== todayStr && lastActive !== yesterdayStr) {
            // Đã quá 1 ngày bỏ học -> reset streak
            if (cloudProfile.stats.streakDays > 0) {
              const updatedStats = { ...cloudProfile.stats, streakDays: 0 };
              setProfile(p => ({ ...p, stats: updatedStats }));
              await profileService.saveProfile({ stats: updatedStats }, 'main_profile');
            }
          }
        }

        if (isMounted) setCloudSynced(true);
      } catch (err) {
        console.warn('Lỗi khi đồng bộ Firestore:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    syncFromCloud();
    return () => { isMounted = false; };
  }, []);

  // Profile Actions
  const updateProfile = async (updatedFields) => {
    setProfile(prev => {
      const updated = { ...prev, ...updatedFields };
      if (isFirebaseConfigured) {
        profileService.saveProfile(updated, 'main_profile');
      }
      return updated;
    });
  };

  // Avatar Upload via Cloudflare R2 (có kiểm tra trùng lặp)
  const uploadAvatar = async (file) => {
    if (!isR2Configured) {
      throw new Error('Cloudflare R2 chưa được cấu hình đầy đủ trong file .env.local');
    }
    setIsSyncing(true);
    try {
      const res = await r2StorageService.uploadAvatar(file, profile.avatar);
      if (res.url && res.url !== profile.avatar) {
        await updateProfile({ avatar: res.url });
      }
      return res;
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleGoal = async (goalId) => {
    setProfile(prev => {
      const updatedGoals = prev.goals.map(g => g.id === goalId ? { ...g, done: !g.done } : g);
      const updated = { ...prev, goals: updatedGoals };
      if (isFirebaseConfigured) {
        profileService.saveProfile(updated, 'main_profile');
      }
      return updated;
    });
  };

  const addGoal = async (title, tag = "Cá nhân") => {
    const newGoal = { id: Date.now(), title, done: false, tag };
    setProfile(prev => {
      const updated = { ...prev, goals: [newGoal, ...prev.goals] };
      if (isFirebaseConfigured) {
        profileService.saveProfile(updated, 'main_profile');
      }
      return updated;
    });
  };

  const deleteGoal = async (goalId) => {
    setProfile(prev => {
      const updated = { ...prev, goals: prev.goals.filter(g => g.id !== goalId) };
      if (isFirebaseConfigured) {
        profileService.saveProfile(updated, 'main_profile');
      }
      return updated;
    });
  };

  // Schedule Actions
  const addSchedule = async (scheduleData) => {
    const newSchedule = {
      ...scheduleData,
      id: "sch-" + Date.now(),
      completed: false,
    };
    setSchedules(prev => [newSchedule, ...prev]);
    if (isFirebaseConfigured) {
      await scheduleService.add(newSchedule);
    }
  };

  const toggleScheduleComplete = async (id) => {
    let nextStatus = false;
    setSchedules(prev => prev.map(item => {
      if (item.id === id) {
        nextStatus = !item.completed;
        return { ...item, completed: nextStatus };
      }
      return item;
    }));
    if (isFirebaseConfigured) {
      await scheduleService.update(id, { completed: nextStatus });
    }
  };

  const deleteSchedule = async (id) => {
    setSchedules(prev => prev.filter(item => item.id !== id));
    if (isFirebaseConfigured) {
      await scheduleService.delete(id);
    }
  };

  const updateSchedule = async (id, updatedData) => {
    setSchedules(prev => prev.map(item => item.id === id ? { ...item, ...updatedData } : item));
    if (isFirebaseConfigured) {
      await scheduleService.update(id, updatedData);
    }
  };

  // Plan Actions
  const addPlan = async (planData) => {
    const newPlan = {
      ...planData,
      id: "plan-" + Date.now(),
      createdAt: new Date().toISOString()
    };
    setPlans(prev => [newPlan, ...prev]);
    if (isFirebaseConfigured) {
      await planService.add(newPlan);
    }
  };

  const updatePlan = async (id, updatedData) => {
    setPlans(prev => prev.map(item => item.id === id ? { ...item, ...updatedData } : item));
    if (isFirebaseConfigured) {
      await planService.update(id, updatedData);
    }
  };

  const deletePlan = async (id) => {
    setPlans(prev => prev.filter(item => item.id !== id));
    if (isFirebaseConfigured) {
      await planService.delete(id);
    }
  };

  const importPlansFromJson = async (plansList) => {
    if (!Array.isArray(plansList) || plansList.length === 0) return 0;
    const now = Date.now();
    const validItems = plansList.map((item, index) => ({
      ...item,
      id: item.id || `plan-${now}-${index}`,
      createdAt: item.createdAt || new Date().toISOString()
    }));

    setPlans(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const filtered = validItems.filter(p => !existingIds.has(p.id));
      return [...filtered, ...prev];
    });

    if (isFirebaseConfigured) {
      await planService.addBatch(validItems);
    }
    return validItems.length;
  };

  // Vocabulary Actions
  const addVocabulary = async (vocabData) => {
    const now = Date.now();
    const difficulty = typeof vocabData.difficulty === 'number' ? vocabData.difficulty : 5.0;
    const isMastered = vocabData.isMastered || difficulty <= 3.0;

    const newVocab = {
      ...vocabData,
      id: vocabData.id || `voc-${now}-${Math.random().toString(36).substring(2, 8)}`,
      isMastered,
      srsStatus: isMastered ? 'Mastered' : (vocabData.srsStatus || 'New'),
      difficulty,
      stability: vocabData.stability || 1.0,
      reps: vocabData.reps || 0,
      lapses: vocabData.lapses || 0,
      createdAt: vocabData.createdAt || new Date().toISOString()
    };
    setVocabularies(prev => [newVocab, ...prev]);
    if (isFirebaseConfigured) {
      await vocabService.add(newVocab);
    }
  };

  const addVocabulariesBatch = async (vocabList = []) => {
    if (!Array.isArray(vocabList) || vocabList.length === 0) return 0;
    const now = Date.now();
    const validItems = vocabList
      .filter(item => item && item.word && item.meaning)
      .map((item, index) => {
        const difficulty = typeof item.difficulty === 'number' ? item.difficulty : 5.0;
        const isMastered = item.isMastered || difficulty <= 3.0;
        return {
          ...item,
          id: `voc-${now}-${index}-${Math.random().toString(36).substring(2, 8)}`,
          isMastered,
          srsStatus: isMastered ? 'Mastered' : (item.srsStatus || 'New'),
          difficulty,
          stability: item.stability || 1.0,
          reps: item.reps || 0,
          lapses: item.lapses || 0,
          createdAt: item.createdAt || new Date().toISOString()
        };
      });

    if (validItems.length === 0) return 0;

    setVocabularies(prev => {
      const existingIds = new Set(prev.map(v => v.id));
      const filtered = validItems.filter(v => !existingIds.has(v.id));
      return [...filtered, ...prev];
    });

    if (isFirebaseConfigured) {
      try {
        await Promise.all(validItems.map(item => vocabService.add(item)));
      } catch (err) {
        console.warn('Lỗi lưu hàng loạt lên Firestore:', err);
      }
    }

    return validItems.length;
  };

  // Đã bỏ toggleMasteredVocab vì 'Đã thuộc' sẽ được tự động tính theo độ khó (<=3)

  const reviewVocabulary = async (id, rating, modality = 'en-vi') => {
    let nextState = null;
    let revLog = null;
    const now = Date.now();

    setVocabularies(prev => prev.map(item => {
      if (item.id === id) {
        // Prepare the card for calculateNextSrsState
        const cardState = { ...item };
        // FSRS-7 rating: 1: Again, 2: Hard, 3: Good, 4: Easy
        const { newState, log } = calculateNextSrsState(cardState, rating, modality);
        
        // Cập nhật isMastered thành true nếu độ khó <= 3
        if (newState.difficulty <= 3) {
            newState.isMastered = true;
            newState.srsStatus = 'Mastered';
        } else {
            newState.isMastered = false;
        }

        nextState = newState;
        revLog = log;
        return nextState;
      }
      return item;
    }));

    // 1. Cập nhật trạng thái từ vựng lên Firestore
    if (nextState && isFirebaseConfigured) {
      await vocabService.update(id, {
        difficulty: nextState.difficulty,
        stability: nextState.stability,
        stabilityShort: nextState.stabilityShort,
        reps: nextState.reps,
        lapses: nextState.lapses,
        srsInterval: nextState.srsInterval,
        srsDueDate: nextState.srsDueDate,
        srsStatus: nextState.srsStatus,
        lastReviewDate: nextState.lastReviewDate,
        isMastered: nextState.isMastered,
      });
    }

    // 2. Áp dụng NÉN TỪ ĐIỂN (Dictionary Compression) cho review logs
    if (revLog) {
      setCompressedLogs(prev => {
        const updated = appendCompressedLog(prev, revLog);
        try {
          localStorage.setItem('dajid_compressed_review_logs', JSON.stringify(updated));
        } catch (e) {}

        if (isFirebaseConfigured) {
          reviewLogService.saveCompressedLogs(updated);
        }
        return updated;
      });
    }

    // 3. Hệ thống tính chuỗi học tập (Streak):
    // "chỉ tính ngày đó nếu đánh giá 3 từ bất kì nhé"
    const todayStr = getLocalDateString(now);
    const nowDate = new Date(now);
    const dateDisplayStr = `${nowDate.getDate().toString().padStart(2, '0')}/${(nowDate.getMonth() + 1).toString().padStart(2, '0')}`;

    let todayDailyReviews = { date: todayStr, count: 0, wordIds: [] };
    try {
      const stored = JSON.parse(localStorage.getItem('dajid_today_reviews') || '{}');
      if (stored && stored.date === todayStr) {
        todayDailyReviews = {
          date: todayStr,
          count: stored.count || 0,
          wordIds: Array.isArray(stored.wordIds) ? stored.wordIds : []
        };
      }
    } catch (e) {}

    if (!todayDailyReviews.wordIds.includes(id)) {
      todayDailyReviews.wordIds.push(id);
    }
    todayDailyReviews.count = todayDailyReviews.wordIds.length;
    try {
      localStorage.setItem('dajid_today_reviews', JSON.stringify(todayDailyReviews));
    } catch (e) {}

    // Ghi nhận theo số TỪ độc nhất được đánh giá trong ngày, không phải theo lượt lặp lại!
    setProfile(prev => {
      const stats = prev?.stats || {};
      const lastActive = stats.lastActiveDate;

      let newStreak = stats.streakDays || 0;
      let streakActiveToday = lastActive === todayStr;

      // CHỈ KHI đánh giá đủ từ 3 từ độc nhất trở lên trong ngày mới kích hoạt / tăng streak ngày hôm nay!
      if (todayDailyReviews.count >= 3 && !streakActiveToday) {
        const yesterdayStr = getLocalDateString(now - 86400000);
        if (lastActive === yesterdayStr) {
          newStreak = (stats.streakDays || 0) + 1;
        } else {
          newStreak = 1; // Bắt đầu chuỗi mới
        }
        streakActiveToday = true;
      }

      // Cập nhật ngày học trong studyHistory (match chuẩn theo ngày ISO hoặc DD/MM)
      const history = [...(prev?.studyHistory || [])];
      const todayIdx = history.findIndex(h => h.isoDate === todayStr || h.date === dateDisplayStr);
      if (todayIdx >= 0) {
        const entry = history[todayIdx];
        const reviewedIds = Array.isArray(entry.reviewedWordIds) ? [...entry.reviewedWordIds] : [];
        if (!reviewedIds.includes(id)) {
          reviewedIds.push(id);
        }
        history[todayIdx] = {
          ...entry,
          isoDate: todayStr,
          date: dateDisplayStr,
          reviewedWordIds: reviewedIds,
          // Số từ học trong ngày = số lượng TỪ phân biệt (unique) đã đánh giá:
          wordsLearned: reviewedIds.length
        };
      } else {
        const dayNamesVN = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        history.push({
          isoDate: todayStr,
          date: dateDisplayStr,
          dayName: dayNamesVN[nowDate.getDay()],
          pointsSE: 0,
          reviewedWordIds: [id],
          wordsLearned: 1,
          testsCount: 0
        });
        if (history.length > 7) history.shift();
      }

      const cultivationInfo = getVocabularyRank(stats.totalSE || 0);
      const streakInfo = getStreakRank(newStreak);

      // Tổng số từ đã học trong stats = số từ độc nhất trong vocabularies mà đã được học/ôn (reps > 0 hoặc srsStatus !== 'New')
      const totalUniqueLearned = (vocabularies || []).filter(
        v => v.id === id || (v.reps && v.reps > 0) || (v.srsStatus && v.srsStatus !== 'New')
      ).length;

      const nextStats = {
        ...stats,
        lastActiveDate: streakActiveToday ? todayStr : stats.lastActiveDate,
        streakDays: newStreak,
        wordsLearned: Math.max(totalUniqueLearned, stats.wordsLearned || 0),
        cultivationRank: cultivationInfo.currentRank.name,
        cultivationWorld: cultivationInfo.currentRank.world,
        streakRank: `${streakInfo.level} - ${streakInfo.title}`
      };

      const nextProfile = {
        ...prev,
        stats: nextStats,
        studyHistory: history
      };

      // Luôn đồng bộ ngay lên Cloud Firestore mỗi khi học từ để reset/F5 trang không bị mất tiến trình!
      if (isFirebaseConfigured) {
        profileService.saveProfile(nextProfile, 'main_profile');
      }

      return nextProfile;
    });
  };

  const deleteVocabulary = async (id) => {
    setVocabularies(prev => prev.filter(item => item.id !== id));
    if (isFirebaseConfigured) {
      await vocabService.delete(id);
    }
  };

  const deleteAllVocabularies = async () => {
    setVocabularies([]);
    try {
      localStorage.setItem('dajid_vocabs', JSON.stringify([]));
    } catch (e) {}
    if (isFirebaseConfigured) {
      await vocabService.deleteAll();
    }
  };

  // Record completed vocabulary test result & update word difficulties
  const recordTestResult = async (testSummary) => {
    const { scoreSE = 0, maxSE = 0, correctCount = 0, totalCount = 0, grade = 'A', records = [] } = testSummary;
    const now = new Date();
    const timestampNow = now.getTime();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const fullDateStr = `${dateStr}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newTestRecord = {
      id: 'test-' + Date.now(),
      date: fullDateStr,
      scoreSE,
      maxSE,
      correctCount,
      totalCount,
      accuracy: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0,
      grade
    };

    // 1. CẬP NHẬT ĐỘ KHÓ VÀ TRẠNG THÁI TỪ VỰNG DỰA TRÊN KẾT QUẢ BÀI TEST:
    // - "dựa trên độ khó và gõ kí tự đúng mà giảm độ khó:
    //    nếu từ càng khó, giảm càng ít
    //    nếu sai càng nhiều kí tự, giảm càng ít, sai 2 kí tự thì giữ độ khó, nếu quá 3 kí tự thì tăng độ khó"
    if (records && records.length > 0) {
      let currentComp = compressedLogs;
      const recordsMap = new Map();
      records.forEach(r => {
        if (r.wordObj?.id) {
          recordsMap.set(r.wordObj.id, r);
        }
      });

      setVocabularies(prev => {
        return prev.map(item => {
          const testRec = recordsMap.get(item.id);
          if (!testRec) return item;

          const res = testRec.result || {};
          const typos = typeof res.typos === 'number' ? res.typos : 0;
          const gaveUp = Boolean(res.gaveUp || (!res.isPassed && typos > 3));

          const curDiff = typeof item.difficulty === 'number' ? item.difficulty : 5.0;
          const { newDifficulty } = calculateNextDifficultyFromTest(curDiff, typos, gaveUp);

          const isMastered = newDifficulty <= 3.0;
          const srsStatus = isMastered ? 'Mastered' : (item.srsStatus === 'New' ? 'Learning' : (item.srsStatus || 'Learning'));

          let reps = item.reps || 0;
          let lapses = item.lapses || 0;
          if (typos <= 1 && !gaveUp) {
            reps += 1;
          } else if (typos > 2 || gaveUp) {
            reps = Math.max(0, Math.floor(reps / 2));
            lapses += 1;
          }

          const updatedItem = {
            ...item,
            difficulty: newDifficulty,
            isMastered,
            srsStatus,
            reps,
            lapses,
            lastReviewDate: timestampNow
          };

          // Ghi nhận log review theo chuẩn nén từ điển (modality: 'quiz')
          const ratingEquivalent = gaveUp || typos > 2 ? 1 : (typos === 2 ? 2 : (typos === 1 ? 3 : 4));
          const lastRev = item.lastReviewDate || timestampNow;
          const t = Math.max(0, Number(((timestampNow - lastRev) / 86400000).toFixed(4)));

          currentComp = appendCompressedLog(currentComp, {
            cardId: item.id,
            rating: ratingEquivalent,
            t,
            reviewTime: timestampNow,
            modality: 'quiz'
          });

          // Đồng bộ trực tiếp lên Firestore
          if (isFirebaseConfigured) {
            vocabService.update(item.id, {
              difficulty: newDifficulty,
              isMastered,
              srsStatus,
              reps,
              lapses,
              lastReviewDate: timestampNow
            });
          }

          return updatedItem;
        });
      });

      // Lưu log nén
      setCompressedLogs(currentComp);
      try {
        localStorage.setItem('dajid_compressed_review_logs', JSON.stringify(currentComp));
      } catch (e) {}
      if (isFirebaseConfigured) {
        reviewLogService.saveCompressedLogs(currentComp);
      }
    }

    // 2. Cập nhật Profile, Stats và Chuỗi học tập (Streak)
    setProfile(prev => {
      const currentStats = prev.stats || {};
      const newTotalSE = (currentStats.totalSE || 0) + scoreSE;
      const newTestsCompleted = (currentStats.testsCompleted || 0) + 1;
      const newWordsLearned = (currentStats.wordsLearned || 0) + correctCount;

      const todayStr = getLocalDateString(timestampNow);
      let newStreak = currentStats.streakDays || 0;
      let isFirstTimeToday = false;

      // Nếu làm bài test từ 3 từ trở lên thì cũng được tính tích lũy streak ngày hôm nay!
      if (totalCount >= 3) {
        if (currentStats.lastActiveDate !== todayStr) {
          isFirstTimeToday = true;
          const yesterdayStr = getLocalDateString(timestampNow - 86400000);
          if (currentStats.lastActiveDate === yesterdayStr) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
        }
      }

      // Cập nhật hoặc thêm vào ngày hôm nay trong studyHistory (match chuẩn theo ngày ISO hoặc DD/MM)
      const history = [...(prev.studyHistory || initialProfile.studyHistory)];
      const todayEntryIndex = history.findIndex(h => h.isoDate === todayStr || h.date === dateStr);
      const testedWordIds = (records || []).map(r => r.wordObj?.id).filter(Boolean);

      if (todayEntryIndex >= 0) {
        const entry = history[todayEntryIndex];
        const reviewedIds = Array.isArray(entry.reviewedWordIds) ? [...entry.reviewedWordIds] : [];
        testedWordIds.forEach(wid => {
          if (!reviewedIds.includes(wid)) reviewedIds.push(wid);
        });
        history[todayEntryIndex] = {
          ...entry,
          isoDate: todayStr,
          date: dateStr,
          pointsSE: (entry.pointsSE || 0) + scoreSE,
          reviewedWordIds: reviewedIds,
          wordsLearned: reviewedIds.length > 0 ? reviewedIds.length : (entry.wordsLearned || 0),
          testsCount: (entry.testsCount || 0) + 1
        };
      } else {
        const dayNamesVN = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const reviewedIds = Array.from(new Set(testedWordIds));
        history.push({
          isoDate: todayStr,
          date: dateStr,
          dayName: dayNamesVN[now.getDay()],
          pointsSE: scoreSE,
          reviewedWordIds: reviewedIds,
          wordsLearned: reviewedIds.length > 0 ? reviewedIds.length : correctCount,
          testsCount: 1
        });
        if (history.length > 7) {
          history.shift();
        }
      }

      const newTestHistory = [newTestRecord, ...(prev.testHistory || [])].slice(0, 20);

      const cultivationInfo = getVocabularyRank(newTotalSE);
      const streakInfo = getStreakRank(newStreak);

      const nextProfile = {
        ...prev,
        stats: {
          ...currentStats,
          totalSE: newTotalSE,
          testsCompleted: newTestsCompleted,
          wordsLearned: newWordsLearned,
          streakDays: newStreak,
          cultivationRank: cultivationInfo.currentRank.name,
          cultivationWorld: cultivationInfo.currentRank.world,
          streakRank: `${streakInfo.level} - ${streakInfo.title}`,
          lastActiveDate: isFirstTimeToday || totalCount >= 3 ? todayStr : currentStats.lastActiveDate
        },
        studyHistory: history,
        testHistory: newTestHistory
      };

      if (isFirebaseConfigured) {
        profileService.saveProfile(nextProfile, 'main_profile');
        testHistoryService.add(newTestRecord);
      }

      return nextProfile;
    });
  };

  // Reset tiến trình học tập (Chuỗi streak, Điểm SE, Số từ đã học, Lịch sử 5 ngày)
  const resetLearningProgress = async (options = { resetVocabsProgress: true }) => {
    const freshStats = {
      totalHoursStudied: 0,
      completedTasks: 0,
      streakDays: 0,
      wordsLearned: 0,
      totalSE: 0,
      testsCompleted: 0,
      cultivationRank: 'Đấu Chi Khí',
      cultivationWorld: 'Đấu Phá Thương Khung',
      streakRank: 'Hạng D - Dismal',
      lastActiveDate: null
    };

    setProfile(prev => {
      const nextProfile = {
        ...prev,
        stats: freshStats,
        studyHistory: [],
        testHistory: []
      };

      try {
        localStorage.setItem('dajid_profile', JSON.stringify(nextProfile));
        localStorage.removeItem('dajid_today_reviews');
        localStorage.removeItem('dajid_compressed_review_logs');
      } catch (e) {}

      if (isFirebaseConfigured) {
        profileService.saveProfile(nextProfile, 'main_profile');
      }

      return nextProfile;
    });

    if (options.resetVocabsProgress) {
      setVocabularies(prev => {
        const resetVocabs = prev.map(v => ({
          ...v,
          reps: 0,
          lapses: 0,
          difficulty: 5.0,
          isMastered: false,
          srsStatus: 'New',
          lastReviewDate: null
        }));
        try {
          localStorage.setItem('dajid_vocabs', JSON.stringify(resetVocabs));
        } catch (e) {}
        if (isFirebaseConfigured) {
          resetVocabs.forEach(v => {
            vocabService.update(v.id, {
              reps: 0,
              lapses: 0,
              difficulty: 5.0,
              isMastered: false,
              srsStatus: 'New',
              lastReviewDate: null
            });
          });
        }
        return resetVocabs;
      });
    }
  };

  // Reset to sample data
  const resetToDefaultData = () => {
    setProfile(initialProfile);
    setSchedules(initialSchedules);
    setVocabularies(initialVocabularies);
    localStorage.clear();
  };

  return (
    <StudyContext.Provider value={{
      profile,
      updateProfile,
      uploadAvatar,
      toggleGoal,
      addGoal,
      deleteGoal,
      schedules,
      addSchedule,
      updateSchedule,
      toggleScheduleComplete,
      deleteSchedule,
      plans,
      addPlan,
      updatePlan,
      deletePlan,
      importPlansFromJson,
      vocabularies,
      addVocabulary,
      addVocabulariesBatch,
      reviewVocabulary,
      deleteVocabulary,
      deleteAllVocabularies,
      recordTestResult,
      resetLearningProgress,
      resetToDefaultData,
      isSyncing,
      cloudSynced,
      isFirebaseConfigured,
      isR2Configured,
      compressedLogs,
      reviewLogs: extractRawLogs(compressedLogs)
    }}>
      {children}
    </StudyContext.Provider>
  );
};

export const useStudyStore = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudyStore must be used within a StudyProvider');
  }
  return context;
};
