export interface LeaderboardEntry {
  username: string;
  totalScore: number;
  gamesPlayed: number;
  streak: number;
  lastPlayed: string;
  bestTime?: number;
  highestAccuracy?: number;
}

const LEADERBOARD_KEY = 'language-sprint-leaderboard';
const CURRENT_USER_KEY = 'language-sprint-current-user';
const STREAK_KEY = 'language-sprint-streak';

// Cache leaderboard data to reduce localStorage parsing
let leaderboardCache: LeaderboardEntry[] | null = null;
let leaderboardCacheTimestamp = 0;
const CACHE_TTL = 1000; // 1 second cache TTL

function getCachedLeaderboard(): LeaderboardEntry[] {
  const now = Date.now();
  if (leaderboardCache && now - leaderboardCacheTimestamp < CACHE_TTL) {
    return leaderboardCache;
  }
  return [];
}

function setCachedLeaderboard(data: LeaderboardEntry[]): void {
  leaderboardCache = data;
  leaderboardCacheTimestamp = Date.now();
}

export function getCurrentUser(): string {
  if (typeof window === 'undefined') return 'Anonymous';

  // Import auth service dynamically to avoid circular dependencies
  try {
    const authData = localStorage.getItem('language-sprint-auth');
    if (authData) {
      const auth = JSON.parse(authData);
      return auth.username || 'Anonymous';
    }
  } catch {
    // Fall back to legacy user key
  }

  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (!stored) {
    const username = `Player${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem(CURRENT_USER_KEY, username);
    return username;
  }
  return stored;
}

export function setUsername(username: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_USER_KEY, username);
}

export function updateStreak(): number {
  if (typeof window === 'undefined') return 0;

  const today = new Date().toDateString();
  const streakData = localStorage.getItem(STREAK_KEY);

  if (!streakData) {
    const newStreak = { count: 1, lastDate: today };
    localStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
    return 1;
  }

  const { count, lastDate } = JSON.parse(streakData);
  const lastPlayedDate = new Date(lastDate);
  const todayDate = new Date(today);

  // Calculate days difference
  const diffTime = todayDate.getTime() - lastPlayedDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let newCount: number;
  if (diffDays === 0) {
    // Same day, keep current streak
    newCount = count;
  } else if (diffDays === 1) {
    // Next day, increment streak
    newCount = count + 1;
  } else {
    // Streak broken, reset to 1
    newCount = 1;
  }

  localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastDate: today }));
  return newCount;
}

export function getCurrentStreak(): number {
  if (typeof window === 'undefined') return 0;
  const streakData = localStorage.getItem(STREAK_KEY);
  if (!streakData) return 0;
  return JSON.parse(streakData).count;
}

export function getLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return [];
  
  // Try to return cached data first
  const cached = getCachedLeaderboard();
  if (cached.length > 0) return cached;
  
  const stored = localStorage.getItem(LEADERBOARD_KEY);
  if (!stored) return [];
  
  const data = JSON.parse(stored);
  setCachedLeaderboard(data);
  return data;
}

export function updateLeaderboard(
  score: number,
  time?: number,
  accuracy?: number
): void {
  if (typeof window === 'undefined') return;

  const username = getCurrentUser();
  const streak = updateStreak();
  const leaderboard = getLeaderboard();

  const existingIndex = leaderboard.findIndex(entry => entry.username === username);

  if (existingIndex >= 0) {
    // Update existing entry
    const existing = leaderboard[existingIndex];
    leaderboard[existingIndex] = {
      username,
      totalScore: existing.totalScore + score,
      gamesPlayed: existing.gamesPlayed + 1,
      streak,
      lastPlayed: new Date().toISOString(),
      bestTime: time && (!existing.bestTime || time < existing.bestTime) ? time : existing.bestTime,
      highestAccuracy: accuracy && (!existing.highestAccuracy || accuracy > existing.highestAccuracy)
        ? accuracy
        : existing.highestAccuracy
    };
  } else {
    // Create new entry
    leaderboard.push({
      username,
      totalScore: score,
      gamesPlayed: 1,
      streak,
      lastPlayed: new Date().toISOString(),
      bestTime: time,
      highestAccuracy: accuracy
    });
  }

  // Sort by total score descending
  leaderboard.sort((a, b) => b.totalScore - a.totalScore);

  // Keep top 100
  const topLeaderboard = leaderboard.slice(0, 100);

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topLeaderboard));
  setCachedLeaderboard(topLeaderboard);
}

export function getPlayerRank(username: string): number {
  const leaderboard = getLeaderboard();
  const index = leaderboard.findIndex(entry => entry.username === username);
  return index >= 0 ? index + 1 : -1;
}

export function getPlayerStats(username: string): LeaderboardEntry | null {
  const leaderboard = getLeaderboard();
  return leaderboard.find(entry => entry.username === username) || null;
}
