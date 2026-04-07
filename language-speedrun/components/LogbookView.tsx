'use client';

import { useState, useMemo } from 'react';
import { getGameHistory, type GameHistoryEntry } from '../services/gameHistory';

const MODE_INFO: Record<string, { name: string; icon: string }> = {
  sprint: { name: 'Sprint', icon: '🏃' },
  timeattack: { name: 'Time Attack', icon: '⏱️' },
  zen: { name: 'Zen', icon: '🧘' },
  endless: { name: 'Endless', icon: '♾️' },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
};

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export default function LogbookView() {
  const [filter, setFilter] = useState<string>('all');
  const history = useMemo(() => getGameHistory(), []);

  const filtered = filter === 'all' ? history : history.filter(e => e.mode === filter);

  const summaryStats = useMemo(() => {
    if (history.length === 0) return null;
    const totalGames = history.length;
    const avgAccuracy = Math.round(history.reduce((sum, e) => sum + e.accuracy, 0) / totalGames);
    const modeCounts: Record<string, number> = {};
    history.forEach(e => { modeCounts[e.mode] = (modeCounts[e.mode] || 0) + 1; });
    const favoriteMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'sprint';
    return { totalGames, avgAccuracy, favoriteMode };
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📖</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">No games yet</h3>
        <p className="text-gray-500">Play a game and it will show up here!</p>
      </div>
    );
  }

  return (
    <div>
      {summaryStats && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
            <div className="text-2xl font-black text-gray-900">{summaryStats.totalGames}</div>
            <div className="text-xs text-gray-500 font-medium">Games</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
            <div className="text-2xl font-black text-gray-900">{summaryStats.avgAccuracy}%</div>
            <div className="text-xs text-gray-500 font-medium">Avg Accuracy</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
            <div className="text-2xl font-black text-gray-900">
              {MODE_INFO[summaryStats.favoriteMode]?.icon || '🎮'}
            </div>
            <div className="text-xs text-gray-500 font-medium">Favorite</div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'sprint', 'timeattack', 'zen', 'endless'].map(mode => (
          <button
            key={mode}
            onClick={() => setFilter(mode)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === mode
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {mode === 'all' ? 'All' : MODE_INFO[mode]?.name || mode}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((entry: GameHistoryEntry) => {
          const modeInfo = MODE_INFO[entry.mode] || { name: entry.mode, icon: '🎮' };
          return (
            <div key={entry.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
              <div className="text-2xl shrink-0">{modeInfo.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-sm text-gray-900">{modeInfo.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${DIFFICULTY_COLORS[entry.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                    {entry.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{entry.correctCount}/{entry.totalCount} correct</span>
                  <span>{entry.accuracy}%</span>
                  <span>{formatTime(entry.totalTime)}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-black text-gray-900">{entry.score}</div>
                <div className="text-xs text-gray-400">{formatRelativeTime(entry.playedAt)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
