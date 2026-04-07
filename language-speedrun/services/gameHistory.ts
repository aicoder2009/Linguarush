import { getCurrentUsername } from './auth';

export interface GameHistoryEntry {
  id: string;
  username: string;
  mode: string;
  difficulty: string;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  totalTime: number;
  score: number;
  playedAt: string;
}

const HISTORY_KEY = 'linguarush-game-history';

export function saveGameToHistory(entry: Omit<GameHistoryEntry, 'id' | 'username' | 'playedAt'>): void {
  if (typeof window === 'undefined') return;

  const history = getGameHistory();
  const fullEntry: GameHistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    username: getCurrentUsername(),
    playedAt: new Date().toISOString(),
  };

  history.unshift(fullEntry);
  const trimmed = history.slice(0, 100);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export function getGameHistory(): GameHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getGameHistoryByMode(mode: string): GameHistoryEntry[] {
  return getGameHistory().filter(e => e.mode === mode);
}
