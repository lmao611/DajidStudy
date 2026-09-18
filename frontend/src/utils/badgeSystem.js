import badgesData from '../data/badges.json';

export const BADGE_TIERS = badgesData.tiers;
export const VOCABULARY_BADGES = badgesData.badges;

/**
 * Calculates current progress and unlock status for a given badge.
 * 
 * @param {object} badge - Badge definition from badges.json
 * @param {object} profile - User profile object from studyStore
 * @param {Array} vocabularies - Array of vocabulary items from studyStore
 * @param {boolean} isForceActiveFull - Test mode toggle to simulate 100% unlock
 * @returns {object} Progress information
 */
export function calculateBadgeProgress(badge, profile = {}, vocabularies = [], isForceActiveFull = false) {
  const stats = profile?.stats || {};
  const testHistory = profile?.testHistory || [];

  let currentValue = 0;

  switch (badge.metricType) {
    case 'vocabCount':
      currentValue = vocabularies?.length || 0;
      break;

    case 'testCount':
      currentValue = stats.testsCompleted || testHistory.length || 0;
      break;

    case 'learnedCount': {
      const activeLearned = (vocabularies || []).filter(
        v => (v.reps && v.reps > 0) || (v.srsStatus && v.srsStatus !== 'New')
      ).length;
      currentValue = Math.max(activeLearned, stats.wordsLearned || 0);
      break;
    }

    case 'streak':
      currentValue = stats.streakDays || 0;
      break;

    case 'masteredCount':
      currentValue = (vocabularies || []).filter(v => v.isMastered).length;
      break;

    case 'se':
      currentValue = stats.totalSE || 0;
      break;

    case 'accuracy100': {
      // Find if any test had 100% accuracy and at least 5 questions
      const hasPerfectTest = testHistory.some(test => {
        const total = test.totalQuestions || test.total || test.wordsTested?.length || 0;
        const correct = test.correctCount || test.score || 0;
        const accuracy = test.accuracy ?? (total > 0 ? (correct / total) * 100 : 0);
        return accuracy >= 100 && total >= 5;
      });
      currentValue = hasPerfectTest ? 1 : 0;
      break;
    }

    default:
      currentValue = 0;
  }

  const targetValue = badge.targetValue || 1;
  const naturallyUnlocked = currentValue >= targetValue;
  const isUnlocked = isForceActiveFull ? true : naturallyUnlocked;
  const effectiveCurrent = isForceActiveFull ? Math.max(currentValue, targetValue) : currentValue;
  const progressPct = Math.min(100, Math.round((effectiveCurrent / targetValue) * 100));

  return {
    badge,
    tier: BADGE_TIERS[badge.tier] || {},
    currentValue: effectiveCurrent,
    targetValue,
    isUnlocked,
    progressPct,
    isForceActive: isForceActiveFull && !naturallyUnlocked
  };
}

/**
 * Returns overall summary of badges (total unlocked, list of badges with progress)
 * 
 * @param {object} profile
 * @param {Array} vocabularies
 * @param {boolean} isForceActiveFull
 */
export function calculateBadgeSummary(profile = {}, vocabularies = [], isForceActiveFull = false) {
  const badgesWithProgress = VOCABULARY_BADGES.map(badge =>
    calculateBadgeProgress(badge, profile, vocabularies, isForceActiveFull)
  );

  const unlockedCount = badgesWithProgress.filter(b => b.isUnlocked).length;
  const totalCount = badgesWithProgress.length;
  const completionPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return {
    badgesWithProgress,
    unlockedCount,
    totalCount,
    completionPct
  };
}
