import { updateLeaderboard } from './leaderboard';
import { getCurrentUsername } from './auth';

const STORAGE_KEY = 'langspeed_stats';

export interface ModeStats {
  bestTime?: number;
  bestAccuracy?: number;
  highScore?: number;
  completions?: number;
  gamesPlayed?: number;
}

export interface PersonalBests {
  sprint?: ModeStats;
  timeattack?: ModeStats;
  endless?: ModeStats;
  perfect?: ModeStats;
  zen?: ModeStats;
  totalGamesPlayed?: number;
  lastPlayed?: string;
}

export interface GameStats {
  mode: string;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  totalTime: number;
  formatTime: string;
}

export function saveScore(mode: string, stats: GameStats): PersonalBests {
  const existing = getPersonalBests();

  // Update leaderboard with score
  const score = stats.correctCount * 100 + (stats.accuracy === 100 ? 500 : 0);
  updateLeaderboard(score, stats.totalTime, stats.accuracy);

  switch(mode) {
    case 'sprint':
      if (!existing.sprint || stats.totalTime < (existing.sprint.bestTime || Infinity)) {
        existing.sprint = {
          ...existing.sprint,
          bestTime: stats.totalTime,
          bestAccuracy: stats.accuracy,
          gamesPlayed: (existing.sprint?.gamesPlayed || 0) + 1
        };
      } else {
        existing.sprint = {
          ...existing.sprint,
          gamesPlayed: (existing.sprint?.gamesPlayed || 0) + 1
        };
      }
      break;
    case 'timeattack':
      if (!existing.timeattack || stats.correctCount > (existing.timeattack.highScore || 0)) {
        existing.timeattack = {
          ...existing.timeattack,
          highScore: stats.correctCount,
          gamesPlayed: (existing.timeattack?.gamesPlayed || 0) + 1
        };
      } else {
        existing.timeattack = {
          ...existing.timeattack,
          gamesPlayed: (existing.timeattack?.gamesPlayed || 0) + 1
        };
      }
      break;
    case 'endless':
      if (!existing.endless || stats.correctCount > (existing.endless.highScore || 0)) {
        existing.endless = {
          ...existing.endless,
          highScore: stats.correctCount,
          gamesPlayed: (existing.endless?.gamesPlayed || 0) + 1
        };
      } else {
        existing.endless = {
          ...existing.endless,
          gamesPlayed: (existing.endless?.gamesPlayed || 0) + 1
        };
      }
      break;
    case 'perfect':
      if (stats.accuracy === 100) {
        existing.perfect = {
          ...existing.perfect,
          bestTime: Math.min(stats.totalTime, existing.perfect?.bestTime || Infinity),
          completions: (existing.perfect?.completions || 0) + 1,
          gamesPlayed: (existing.perfect?.gamesPlayed || 0) + 1
        };
      } else {
        existing.perfect = {
          ...existing.perfect,
          gamesPlayed: (existing.perfect?.gamesPlayed || 0) + 1
        };
      }
      break;
    case 'zen':
      if (!existing.zen || stats.correctCount > (existing.zen.highScore || 0)) {
        existing.zen = {
          ...existing.zen,
          highScore: stats.correctCount,
          bestAccuracy: Math.max(stats.accuracy, existing.zen?.bestAccuracy || 0),
          gamesPlayed: (existing.zen?.gamesPlayed || 0) + 1
        };
      } else {
        existing.zen = {
          ...existing.zen,
          gamesPlayed: (existing.zen?.gamesPlayed || 0) + 1
        };
      }
      break;
  }

  existing.totalGamesPlayed = (existing.totalGamesPlayed || 0) + 1;
  existing.lastPlayed = new Date().toISOString();

  if (typeof window !== 'undefined') {
    const username = getCurrentUsername();
    const userStorageKey = `${STORAGE_KEY}_${username}`;
    localStorage.setItem(userStorageKey, JSON.stringify(existing));
  }
  return existing;
}

export function getPersonalBests(): PersonalBests {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const username = getCurrentUsername();
    const userStorageKey = `${STORAGE_KEY}_${username}`;
    const stored = localStorage.getItem(userStorageKey);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
