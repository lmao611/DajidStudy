// Thuật toán đo khoảng cách chỉnh sửa Levenshtein Distance (đếm số ký tự khác biệt/gõ sai)
export function getLevenshteinDistance(a = '', b = '') {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();
  
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // Xóa
          dp[i][j - 1],     // Thêm
          dp[i - 1][j - 1]  // Thay thế
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Tính toán độ khó mới của từ sau khi kiểm tra:
 * - "nếu từ càng khó, giảm càng ít"
 * - "nếu sai càng nhiều kí tự, giảm càng ít, sai 2 kí tự thì giữ độ khó, nếu quá 3 kí tự thì tăng độ khó"
 * 
 * @param {number} currentDifficulty - Độ khó hiện tại (1.0 - 10.0)
 * @param {number} typos - Số ký tự gõ sai (Levenshtein distance)
 * @param {boolean} gaveUp - Người dùng bỏ cuộc / xem đáp án / hết giờ
 * @returns {{ newDifficulty: number, delta: number, label: string }}
 */
export function calculateNextDifficultyFromTest(currentDifficulty = 5.0, typos = 0, gaveUp = false) {
  const D = typeof currentDifficulty === 'number' ? currentDifficulty : 5.0;

  // 1. Quá 3 ký tự sai hoặc bỏ cuộc -> Tăng độ khó
  if (gaveUp || typos > 3) {
    const delta = +0.70;
    const newDifficulty = Math.min(10.0, Number((D + delta).toFixed(2)));
    return {
      newDifficulty,
      delta: Number((newDifficulty - D).toFixed(2)),
      label: `+${Number((newDifficulty - D).toFixed(2))} (Tăng độ khó)`
    };
  }

  // 2. Sai 3 ký tự -> Tăng nhẹ độ khó (+0.25)
  if (typos === 3) {
    const delta = +0.25;
    const newDifficulty = Math.min(10.0, Number((D + delta).toFixed(2)));
    return {
      newDifficulty,
      delta: Number((newDifficulty - D).toFixed(2)),
      label: `+${Number((newDifficulty - D).toFixed(2))} (Tăng nhẹ)`
    };
  }

  // 3. Sai 2 ký tự -> Giữ nguyên độ khó
  if (typos === 2) {
    return {
      newDifficulty: D,
      delta: 0,
      label: '0 (Giữ nguyên)'
    };
  }

  // 4. Đúng hoàn toàn (0 ký tự sai) hoặc sai 1 ký tự:
  // - "nếu từ càng khó, giảm càng ít"
  // - "nếu sai càng nhiều kí tự, giảm càng ít"
  const baseDrop = 0.50 * (11.0 - D) / 10.0;
  const typoScale = typos === 0 ? 1.0 : 0.50;
  const delta = -(baseDrop * typoScale);

  const newDifficulty = Math.max(1.0, Number((D + delta).toFixed(2)));
  const actualDelta = Number((newDifficulty - D).toFixed(2));

  return {
    newDifficulty,
    delta: actualDelta,
    label: `${actualDelta} (Giảm độ khó)`
  };
}

// Đánh giá độ khó tượng trưng của từ vựng (dựa trên: Độ dài từ, Độ khó FSRS)
// Lưu ý: Độ khó từ KHÔNG bị giảm theo chuỗi đúng (streak)
export function getRawDifficultyScore(vocab) {
  if (!vocab) return 10;
  const word = (vocab.word || '').trim();
  const len = word.length;
  
  // 1. Độ khó FSRS (thang điểm 1.0 - 10.0, mặc định 5.0)
  const difficulty = typeof vocab.difficulty === 'number' ? vocab.difficulty : 5.0;

  // Hệ số độ khó (Độ khó càng cao thì điểm độ khó càng lớn: 1 -> ~0.45x, 5 -> 1.05x, 10 -> 1.8x)
  const diffMultiplier = 0.3 + (difficulty / 10) * 1.5;

  // Điểm độ khó thuần túy dựa vào độ dài từ và độ khó FSRS (không bị giảm bởi streak)
  return Math.max(5, (len * 4.0) * diffMultiplier);
}

/**
 * Chuẩn bị danh sách từ cho bài kiểm tra và phân bổ điểm Spirit Energy (SE):
 * - Min điểm: 200 SE (cho từ dễ nhất)
 * - Max điểm chuẩn: 1,000 SE (cho Top 10% từ khó nhất trong bài kiểm tra)
 * - Duy nhất 1 từ khó nhất trong bài thi: có cơ hội nhận 3,333 SE nếu đúng 100% không gợi ý và không sai chính tả!
 * - Chuỗi đúng liên tiếp (streak): Tăng nhẹ điểm SE nhưng bị chặn trần 1,000 SE
 * - Các từ ở giữa: Nội suy mượt mà từ 200 SE đến ~950 SE
 */
export function prepareTestWords(selectedVocabs = []) {
  if (!selectedVocabs || selectedVocabs.length === 0) return [];

  // Tính điểm độ khó cho từng từ trong danh sách các từ được lấy vào kiểm tra
  const scored = selectedVocabs.map(vocab => ({
    ...vocab,
    rawScore: getRawDifficultyScore(vocab)
  }));

  // Sắp xếp theo độ khó tăng dần
  scored.sort((a, b) => {
    if (a.rawScore !== b.rawScore) return a.rawScore - b.rawScore;
    if ((a.word || '').length !== (b.word || '').length) return (a.word || '').length - (b.word || '').length;
    return (a.word || '').localeCompare(b.word || '');
  });

  const N = scored.length;
  // Top 10% khó nhất tính trên số từ được lấy vào bài kiểm tra (tối thiểu 1 từ)
  const top10Count = Math.max(1, Math.ceil(N * 0.1));
  const top10ThresholdIndex = N - top10Count;
  // Duy nhất 1 từ khó nhất trong bài kiểm tra (từ cuối cùng sau khi sort)
  const singleHardestIndex = N - 1;

  return scored.map((item, idx) => {
    let baseSE = 200;
    let difficultyLabel = 'Dễ';
    let difficultyFactor = 0; // 0 (dễ nhất) -> 1 (khó nhất 1000 SE)
    const isTop10Hardest = idx >= top10ThresholdIndex;
    const isSingleHardest = idx === singleHardestIndex;

    if (isSingleHardest) {
      baseSE = 1000;
      difficultyLabel = 'Khó Nhất Bài Thi (★ Thử thách 3,333 SE)';
      difficultyFactor = 1.0;
    } else if (isTop10Hardest) {
      baseSE = 1000;
      difficultyLabel = 'Cực Khó (Top 10%)';
      difficultyFactor = 1.0;
    } else if (N === 1) {
      baseSE = 1000;
      difficultyLabel = 'Khó Nhất Bài Thi (★ Thử thách 3,333 SE)';
      difficultyFactor = 1.0;
    } else {
      // Nội suy từ 200 SE đến 950 SE
      const ratio = idx / Math.max(1, top10ThresholdIndex);
      difficultyFactor = ratio;
      // Dùng hàm luỹ thừa nhẹ để phân cấp rõ ràng
      baseSE = Math.round(200 + Math.pow(ratio, 1.2) * (950 - 200));

      if (baseSE < 450) {
        difficultyLabel = 'Dễ';
      } else if (baseSE < 750) {
        difficultyLabel = 'Trung Bình';
      } else {
        difficultyLabel = 'Khó';
      }
    }

    // CHUỖI ĐÚNG LIÊN TIẾP (STREAK):
    // Tăng nhẹ điểm SE có thể nhận nhưng không vượt quá trần 1,000 SE
    const streak = Math.max(0, item.reps || item.streak || 0);
    if (streak > 0 && !isTop10Hardest) {
      const streakMultiplier = 1 + Math.min(0.30, streak * 0.05);
      baseSE = Math.min(1000, Math.max(200, Math.round(baseSE * streakMultiplier)));
    }

    return {
      ...item,
      baseSE,
      streak,
      difficultyLabel,
      difficultyFactor,
      isTop10Hardest,
      isSingleHardest
    };
  });
}

/**
 * Tính toán điểm Spirit Energy thực nhận cho 1 câu hỏi kiểm tra:
 * - Nerf SE bài thi: Min 200 SE, Max 1,000 SE
 * - ĐẶC BIỆT: Duy nhất 1 từ khó nhất trong bài nếu KHÔNG dùng gợi ý và ĐÚNG 100% CHÍNH TẢ -> Nhận 3,333 SE!
 * - Sai chính tả tối đa 3 ký tự (quá 3 ký tự tính 0 SE)
 */
export function calculateQuestionSE({
  item, // Đối tượng từ vựng đã được gán baseSE & difficultyFactor & isSingleHardest
  userAnswer = '',
  hintLevel = 0, // 0, 1, 2
  gaveUp = false, // Xem đáp án hoặc bỏ qua
  timeSpentSeconds = 0,
  timeLimit = null
}) {
  const baseSE = item?.baseSE || 200;
  const d = item?.difficultyFactor || 0; // 0: dễ nhất, 1: khó nhất (1000 SE)
  const isSingleHardest = Boolean(item?.isSingleHardest);
  const target = (item?.word || '').trim().toLowerCase();
  const input = (userAnswer || '').trim().toLowerCase();

  // Nếu bỏ cuộc, xem đáp án hoặc không nhập gì -> 0 SE
  if (gaveUp || !input) {
    return {
      earnedSE: 0,
      baseSE,
      typos: 999,
      isPassed: false,
      message: 'Bỏ cuộc / Chưa nhập từ (0 SE)',
      typoPenaltyPercent: 100,
      hintPenaltyPercent: 0,
      accuracyStatus: 'failed',
      isSingleHardestJackpot: false
    };
  }

  // Đo khoảng cách ký tự sai Levenshtein
  const typos = getLevenshteinDistance(input, target);

  // QUÁ 3 KÝ TỰ SAI -> COI NHƯ SAI HOÀN TOÀN (0 SE)
  if (typos > 3) {
    return {
      earnedSE: 0,
      baseSE,
      typos,
      isPassed: false,
      message: `Gõ sai ${typos} ký tự (vượt quá giới hạn 3 ký tự, 0 SE)`,
      typoPenaltyPercent: 100,
      hintPenaltyPercent: 0,
      accuracyStatus: 'failed',
      isSingleHardestJackpot: false
    };
  }

  // ★ ĐẶC QUYỀN DUY NHẤT 1 TỪ KHÓ NHẤT TRONG BÀI THI:
  // "chỉ 1 từ khó nhất trong bài nếu không dùng gợi ý và đúng hết chính tả thì nhận 3333SE"
  if (isSingleHardest && hintLevel === 0 && typos === 0) {
    return {
      earnedSE: 3333,
      baseSE: 3333,
      typos: 0,
      speedBonus: 0,
      streakBonus: 0,
      isPassed: true,
      message: '★ Tuyệt Đỉnh! Chinh phục từ khó nhất bài thi không tì vết (+3,333 SE)',
      typoPenaltyPercent: 0,
      hintPenaltyPercent: 0,
      accuracyStatus: 'jackpot',
      isSingleHardestJackpot: true
    };
  }

  // Hệ số phạt theo độ khó:
  // Từ dễ nhất (d=0) phạt 1.3 (+30%), từ khó nhất (d=1, 1000 SE) phạt 0.7 (-30%)
  const penaltyScale = 1.3 - 0.6 * d;

  // 1. Phạt sai chính tả (Typo Penalties)
  let baseTypoDeduction = 0;
  if (typos === 1) baseTypoDeduction = 0.20;       // 1 ký tự sai: 20%
  else if (typos === 2) baseTypoDeduction = 0.45;  // 2 ký tự sai: 45%
  else if (typos === 3) baseTypoDeduction = 0.70;  // 3 ký tự sai: 70%
  const typoPenalty = baseTypoDeduction * penaltyScale;

  // 2. Phạt dùng gợi ý (Hint Penalties)
  let baseHintDeduction = 0;
  if (hintLevel === 1) baseHintDeduction = 0.20;      // Gợi ý 1 (số chữ): 20%
  else if (hintLevel >= 2) baseHintDeduction = 0.50;  // Gợi ý 2 (ngữ cảnh): 50%
  const hintPenalty = baseHintDeduction * penaltyScale;

  // Tổng tỷ lệ phạt
  const totalPenalty = Math.min(1.0, typoPenalty + hintPenalty);

  // Điểm sau khi phạt (trên cơ sở baseSE tối đa 1000 SE)
  let finalSE = Math.round(baseSE * (1 - totalPenalty));

  // Thưởng tốc độ nếu hoàn thành nhanh (trong 35% thời gian quy định)
  let speedBonus = 0;
  if (timeLimit && timeSpentSeconds <= timeLimit * 0.35 && typos === 0 && hintLevel === 0) {
    speedBonus = Math.round(baseSE * 0.08); // Thưởng 8% SE phản xạ nhanh
    finalSE += speedBonus;
  }

  // Thưởng chuỗi đúng liên tiếp (Streak Bonus): nếu làm đúng không sai chính tả và không dùng gợi ý
  const streak = Math.max(0, item?.streak || item?.reps || 0);
  let streakBonus = 0;
  if (streak > 0 && typos === 0 && hintLevel === 0 && !gaveUp) {
    streakBonus = Math.round(baseSE * Math.min(0.20, streak * 0.04));
    finalSE += streakBonus;
  }

  // Khống chế trần tối đa 1,000 SE (theo yêu cầu nerf min 200, max 1000) và sàn 0 SE
  finalSE = Math.min(1000, Math.max(0, finalSE));

  let message = 'Chính xác hoàn hảo!';
  let accuracyStatus = 'perfect';

  if (typos > 0) {
    accuracyStatus = 'typo';
    message = `Gần đúng (sai ${typos} ký tự, trừ ${Math.round(typoPenalty * 100)}% SE)`;
  } else if (hintLevel > 0) {
    accuracyStatus = 'hinted';
    message = `Chính xác (dùng ${hintLevel} gợi ý, trừ ${Math.round(hintPenalty * 100)}% SE)`;
  }

  return {
    earnedSE: finalSE,
    baseSE,
    typos,
    speedBonus,
    streakBonus,
    isPassed: true,
    message,
    typoPenaltyPercent: Math.round(typoPenalty * 100),
    hintPenaltyPercent: Math.round(hintPenalty * 100),
    accuracyStatus,
    isSingleHardestJackpot: false
  };
}

/**
 * Hệ thống Cảnh Giới Tu Luyện (Đấu Phá Thương Khung + Đại Chúa Tể)
 * Tính dựa trên tổng điểm Spirit Energy (totalSE) với yêu cầu SE ngày càng tăng
 */
export function getVocabularyRank(totalSE = 0) {
  const realms = [
    {
      name: "Đấu Chi Khí",
      title: "Cố Bản Bồi Nguyên",
      world: "Đấu Phá Thương Khung",
      minSE: 0,
      maxSE: 1999,
      badgeImage: "/ranking/Đấu chi khí.png",
      color: "text-amber-800 bg-amber-50 border-amber-300",
      badgeBg: "from-amber-500/20 to-yellow-600/20",
      glowColor: "shadow-amber-500/25"
    },
    {
      name: "Đấu Giả",
      title: "Ngưng Tụ Khí Toàn",
      world: "Đấu Phá Thương Khung",
      minSE: 2000,
      maxSE: 5999,
      badgeImage: "/ranking/Đấu giả.png",
      color: "text-blue-800 bg-blue-50 border-blue-300",
      badgeBg: "from-blue-500/20 to-cyan-600/20",
      glowColor: "shadow-blue-500/25"
    },
    {
      name: "Đấu Sư",
      title: "Đấu Khí Hóa Khảm",
      world: "Đấu Phá Thương Khung",
      minSE: 6000,
      maxSE: 11999,
      badgeImage: "/ranking/Đấu sư.png",
      color: "text-emerald-800 bg-emerald-50 border-emerald-300",
      badgeBg: "from-emerald-500/20 to-teal-600/20",
      glowColor: "shadow-emerald-500/25"
    },
    {
      name: "Đại Đấu Sư",
      title: "Đấu Khí Khải Giáp",
      world: "Đấu Phá Thương Khung",
      minSE: 12000,
      maxSE: 19999,
      badgeImage: "/ranking/Đại đấu sư.png",
      color: "text-teal-800 bg-teal-50 border-teal-300",
      badgeBg: "from-teal-500/20 to-emerald-700/20",
      glowColor: "shadow-teal-500/25"
    },
    {
      name: "Đấu Linh",
      title: "Đấu Khí Ngưng Vật",
      world: "Đấu Phá Thương Khung",
      minSE: 20000,
      maxSE: 29999,
      badgeImage: "/ranking/Đấu linh.png",
      color: "text-indigo-800 bg-indigo-50 border-indigo-300",
      badgeBg: "from-indigo-500/20 to-blue-700/20",
      glowColor: "shadow-indigo-500/25"
    },
    {
      name: "Đấu Vương",
      title: "Hóa Khí Thành Dực",
      world: "Đấu Phá Thương Khung",
      minSE: 30000,
      maxSE: 42999,
      badgeImage: "/ranking/Đấu vương.png",
      color: "text-violet-800 bg-violet-50 border-violet-300",
      badgeBg: "from-violet-500/20 to-purple-700/20",
      glowColor: "shadow-violet-500/25"
    },
    {
      name: "Đấu Hoàng",
      title: "Lăng Không Hư Độ",
      world: "Đấu Phá Thương Khung",
      minSE: 43000,
      maxSE: 59999,
      badgeImage: "/ranking/Đấu hoàng.png",
      color: "text-purple-800 bg-purple-50 border-purple-300",
      badgeBg: "from-purple-500/20 to-pink-700/20",
      glowColor: "shadow-purple-500/25"
    },
    {
      name: "Đấu Tông",
      title: "Khống Chế Không Gian",
      world: "Đấu Phá Thương Khung",
      minSE: 60000,
      maxSE: 81999,
      badgeImage: "/ranking/Đấu tông.png",
      color: "text-rose-800 bg-rose-50 border-rose-300",
      badgeBg: "from-rose-500/20 to-red-700/20",
      glowColor: "shadow-rose-500/25"
    },
    {
      name: "Đấu Tôn",
      title: "Không Gian Khóa Linh",
      world: "Đấu Phá Thương Khung",
      minSE: 82000,
      maxSE: 109999,
      badgeImage: "/ranking/Đấu tôn.png",
      color: "text-pink-800 bg-pink-50 border-pink-300",
      badgeBg: "from-pink-500/20 to-rose-700/20",
      glowColor: "shadow-pink-500/25"
    },
    {
      name: "Đấu Thánh",
      title: "Dời Núi Lấp Biển",
      world: "Đấu Phá Thương Khung",
      minSE: 110000,
      maxSE: 144999,
      badgeImage: "/ranking/Đấu thánh.png",
      color: "text-amber-900 bg-amber-50 border-amber-300",
      badgeBg: "from-amber-500/20 to-orange-700/20",
      glowColor: "shadow-amber-500/30"
    },
    {
      name: "Đấu Đế",
      title: "Phá Toái Hư Không",
      world: "Đấu Phá Thương Khung",
      minSE: 145000,
      maxSE: 189999,
      badgeImage: "/ranking/Đấu đế.png",
      color: "text-orange-950 bg-orange-50 border-orange-400",
      badgeBg: "from-orange-500/25 to-red-700/25",
      glowColor: "shadow-orange-500/35"
    },
    {
      name: "Địa Chí Tôn",
      title: "Hóa Chí Tôn Hải",
      world: "Đại Chúa Tể",
      minSE: 190000,
      maxSE: 249999,
      badgeImage: "/ranking/Địa chí tôn.png",
      color: "text-cyan-950 bg-cyan-50 border-cyan-400",
      badgeBg: "from-cyan-500/25 to-blue-700/25",
      glowColor: "shadow-cyan-500/35"
    },
    {
      name: "Thiên Chí Tôn",
      title: "Thánh Phẩm Chí Tôn",
      world: "Đại Chúa Tể",
      minSE: 250000,
      maxSE: 329999,
      badgeImage: "/ranking/Thiên chí tôn.png",
      color: "text-indigo-950 bg-indigo-50 border-indigo-400",
      badgeBg: "from-indigo-500/30 via-purple-600/30 to-pink-600/30",
      glowColor: "shadow-indigo-500/40"
    },
    {
      name: "Chúa Tể Cảnh",
      title: "Khắc Tên Thương Khung Bảng",
      world: "Đại Chúa Tể",
      minSE: 330000,
      maxSE: Infinity,
      badgeImage: "/ranking/Chúa tể cảnh.png",
      color: "text-purple-950 bg-gradient-to-r from-amber-50 via-purple-50 to-amber-50 border-purple-300",
      badgeBg: "from-amber-400/30 via-purple-600/30 to-yellow-500/30",
      glowColor: "shadow-purple-500/50"
    }
  ];

  let currentRank = realms[0];
  let nextRank = realms[1];

  for (let i = 0; i < realms.length; i++) {
    if (totalSE >= realms[i].minSE && totalSE <= realms[i].maxSE) {
      currentRank = realms[i];
      nextRank = realms[i + 1] || null;
      break;
    }
  }

  let progressPercent = 100;
  let expToNext = 0;
  if (nextRank) {
    const range = currentRank.maxSE - currentRank.minSE + 1;
    const gained = Math.max(0, totalSE - currentRank.minSE);
    progressPercent = Math.min(100, Math.max(0, Math.round((gained / range) * 100)));
    expToNext = Math.max(0, (currentRank.maxSE + 1) - totalSE);
  }

  return {
    currentRank,
    nextRank,
    progressPercent,
    expToNext,
    totalSE
  };
}

/**
 * Hệ thống Cấp Bậc Chuỗi Ngày Học theo Devil May Cry 5 (DMC5 Style Rank)
 * D: Dismal | C: Crazy | B: Badass | A: Apocalyptic | S: Savage | SS: Sick Skills | SSS: Smokin' Sexy Style
 */
export function getStreakRank(streakDays = 0) {
  if (streakDays >= 100) {
    return {
      rank: "SSS",
      title: "Smokin' Sexy Style",
      level: "Hạng SSS",
      badgeImage: "/rating/sss.png",
      color: "text-purple-600 bg-purple-50 border-purple-200",
      tagline: "Đẳng cấp thợ săn quỷ tối thượng — Phong cách huyền thoại bất diệt!",
      nextRankName: null,
      daysToNext: 0
    };
  }
  if (streakDays >= 60) {
    return {
      rank: "SS",
      title: "Sick Skills",
      level: "Hạng SS",
      badgeImage: "/rating/ss.png",
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      tagline: "Kỹ năng thượng thừa, combo học tập không tì vết!",
      nextRankName: "SSS (Smokin' Sexy Style)",
      daysToNext: 100 - streakDays
    };
  }
  if (streakDays >= 30) {
    return {
      rank: "S",
      title: "Savage",
      level: "Hạng S",
      badgeImage: "/rating/s.png",
      color: "text-rose-600 bg-rose-50 border-rose-200",
      tagline: "Dã man không thể cản phá — Chuỗi 1 tháng kiên định!",
      nextRankName: "SS (Sick Skills)",
      daysToNext: 60 - streakDays
    };
  }
  if (streakDays >= 14) {
    return {
      rank: "A",
      title: "Apocalyptic",
      level: "Hạng A",
      badgeImage: "/rating/a.png",
      color: "text-red-600 bg-red-50 border-red-200",
      tagline: "Sức công phá hủy diệt — Giữ vững phong độ đỉnh cao!",
      nextRankName: "S (Savage)",
      daysToNext: 30 - streakDays
    };
  }
  if (streakDays >= 7) {
    return {
      rank: "B",
      title: "Badass",
      level: "Hạng B",
      badgeImage: "/rating/b.png",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      tagline: "Phong cách cực ngầu — Hoàn thành tròn 1 tuần không nghỉ!",
      nextRankName: "A (Apocalyptic)",
      daysToNext: 14 - streakDays
    };
  }
  if (streakDays >= 3) {
    return {
      rank: "C",
      title: "Crazy",
      level: "Hạng C",
      badgeImage: "/rating/c.png",
      color: "text-orange-600 bg-orange-50 border-orange-200",
      tagline: "Bắt đầu bùng nổ — Cơn sốt học tập đang dâng trào!",
      nextRankName: "B (Badass)",
      daysToNext: 7 - streakDays
    };
  }
  return {
    rank: "D",
    title: "Dismal",
    level: "Hạng D",
    badgeImage: "/rating/d.png",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    tagline: "Khởi động làm quen — Cần 3 ngày liên tục để kích hoạt Crazy!",
    nextRankName: "C (Crazy)",
    daysToNext: Math.max(1, 3 - streakDays)
  };
}

/**
 * Hệ thống Cấp Bậc Hoạt Động 5 Ngày Gần Nhất (Phong cách Devil May Cry 5)
 * Tính theo số từ đã đánh giá dựa trên số ngày trong 5 ngày gần nhất:
 * Mỗi ngày đều ôn và đánh giá ít nhất 70% số từ có trong list ngày hôm đó thì là hạng SSS,
 * và giảm dần theo số từ ôn:
 * - >= 70%: SSS (Smokin' Sexy Style)
 * - >= 50%: SS (Sick Skills)
 * - >= 35%: S (Savage)
 * - >= 20%: A (Apocalyptic)
 * - >= 10%: B (Badass)
 * - >= 3%: C (Crazy)
 * - < 3%: D (Dismal)
 */
export function getFiveDayActivityRank(history = [], totalVocabularies = 0) {
  const last5 = (history || []).slice(-5);
  const total5DaysSE = last5.reduce((sum, d) => sum + (Number(d.pointsSE) || 0), 0);
  const totalWords = Math.max(0, Number(totalVocabularies) || 0);
  const total5DaysWords = last5.reduce((sum, d) => {
    const raw = Array.isArray(d.reviewedWordIds) ? d.reviewedWordIds.length : (Number(d.wordsLearned) || 0);
    return sum + (totalWords > 0 ? Math.min(totalWords, raw) : raw);
  }, 0);

  // Tính tỷ lệ % ôn tập mỗi ngày dựa trên số từ độc nhất trong kho:
  // Mỗi ngày đạt % = (words / totalWords) * 100 (tối đa 100%/ngày để tránh dồn dập 1 ngày gánh các ngày nghỉ)
  const daysCount = Math.max(1, last5.length);
  let sumDailyPercent = 0;
  let activeDays = 0;

  last5.forEach(d => {
    const raw = Array.isArray(d.reviewedWordIds) ? d.reviewedWordIds.length : (Number(d.wordsLearned) || 0);
    const words = totalWords > 0 ? Math.min(totalWords, raw) : raw;
    if (words > 0) activeDays++;
    const dayPct = totalWords > 0 ? (words / totalWords) * 100 : 0;
    sumDailyPercent += Math.min(100, dayPct);
  });

  const avgDailyPercent = totalWords > 0 ? Math.round((sumDailyPercent / daysCount) * 10) / 10 : 0;
  const avgDailyWords = Math.round((total5DaysWords / daysCount) * 10) / 10;
  const roundedPercent = avgDailyPercent;

  if (avgDailyPercent >= 70) {
    return {
      rank: "SSS",
      title: "Smokin' Sexy Style",
      level: "Hạng SSS",
      label: "Smokin' Sexy Style — Tối Thượng",
      badgeImage: "/rating/sss.png",
      color: "text-purple-600 bg-purple-50 border-purple-200",
      tagline: "Đẳng cấp tối thượng — Mỗi ngày đều ôn và đánh giá từ 70% kho từ trở lên!",
      wordPercent: roundedPercent,
      avgDailyPercent,
      avgDailyWords,
      activeDays,
      total5DaysSE,
      total5DaysWords,
      totalWords
    };
  }
  if (avgDailyPercent >= 50) {
    return {
      rank: "SS",
      title: "Sick Skills",
      level: "Hạng SS",
      label: "Sick Skills — Kỹ Năng Thượng Thừa",
      badgeImage: "/rating/ss.png",
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      tagline: "Kỹ năng xuất chúng — Mỗi ngày ôn và đánh giá từ 50% đến dưới 70% kho từ!",
      wordPercent: roundedPercent,
      avgDailyPercent,
      avgDailyWords,
      activeDays,
      total5DaysSE,
      total5DaysWords,
      totalWords
    };
  }
  if (avgDailyPercent >= 35) {
    return {
      rank: "S",
      title: "Savage",
      level: "Hạng S",
      label: "Savage — Dã Man Bùng Nổ",
      badgeImage: "/rating/s.png",
      color: "text-rose-600 bg-rose-50 border-rose-200",
      tagline: "Dã man không thể cản phá — Mỗi ngày ôn và đánh giá từ 35% đến dưới 50% kho từ!",
      wordPercent: roundedPercent,
      avgDailyPercent,
      avgDailyWords,
      activeDays,
      total5DaysSE,
      total5DaysWords,
      totalWords
    };
  }
  if (avgDailyPercent >= 20) {
    return {
      rank: "A",
      title: "Apocalyptic",
      level: "Hạng A",
      label: "Apocalyptic — Hủy Diệt",
      badgeImage: "/rating/a.png",
      color: "text-red-600 bg-red-50 border-red-200",
      tagline: "Sức công phá hủy diệt — Mỗi ngày ôn và đánh giá từ 20% đến dưới 35% kho từ!",
      wordPercent: roundedPercent,
      avgDailyPercent,
      avgDailyWords,
      activeDays,
      total5DaysSE,
      total5DaysWords,
      totalWords
    };
  }
  if (avgDailyPercent >= 10) {
    return {
      rank: "B",
      title: "Badass",
      level: "Hạng B",
      label: "Badass — Cực Ngầu",
      badgeImage: "/rating/b.png",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      tagline: "Phong cách cực ngầu — Mỗi ngày ôn và đánh giá từ 10% đến dưới 20% kho từ!",
      wordPercent: roundedPercent,
      avgDailyPercent,
      avgDailyWords,
      activeDays,
      total5DaysSE,
      total5DaysWords,
      totalWords
    };
  }
  if (avgDailyPercent >= 3) {
    return {
      rank: "C",
      title: "Crazy",
      level: "Hạng C",
      label: "Crazy — Bùng Nổ",
      badgeImage: "/rating/c.png",
      color: "text-orange-600 bg-orange-50 border-orange-200",
      tagline: "Bắt đầu bùng nổ — Mỗi ngày ôn và đánh giá từ 3% đến dưới 10% kho từ!",
      wordPercent: roundedPercent,
      avgDailyPercent,
      avgDailyWords,
      activeDays,
      total5DaysSE,
      total5DaysWords,
      totalWords
    };
  }
  return {
    rank: "D",
    title: "Dismal",
    level: "Hạng D",
    label: "Dismal — Khởi Động",
    badgeImage: "/rating/d.png",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    tagline: "Khởi động — Ôn tập ít hơn 3% số từ vựng mỗi ngày!",
    wordPercent: roundedPercent,
    avgDailyPercent,
    avgDailyWords,
    activeDays,
    total5DaysSE,
    total5DaysWords,
    totalWords
  };
}
