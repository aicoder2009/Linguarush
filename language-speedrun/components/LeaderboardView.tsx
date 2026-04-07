'use client';

import { type LeaderboardEntry } from '../services/leaderboard';

interface LeaderboardViewProps {
  leaderboard: LeaderboardEntry[];
  currentUser: string;
}

const rankStyle = (rank: number) => {
  if (rank === 1) return 'bg-amber-400 text-amber-900';
  if (rank === 2) return 'bg-gray-300 text-gray-700';
  if (rank === 3) return 'bg-orange-300 text-orange-800';
  return 'bg-gray-100 text-gray-600';
};

const rankLabel = (rank: number) => {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `#${rank}`;
};

export default function LeaderboardView({ leaderboard, currentUser }: LeaderboardViewProps) {
  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">No players yet</h3>
        <p className="text-gray-500">Play a game to get on the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leaderboard.map((entry, index) => {
        const rank = index + 1;
        const isCurrentUser = entry.username === currentUser;

        return (
          <div
            key={entry.username}
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
              isCurrentUser
                ? 'bg-emerald-50 border-2 border-emerald-300'
                : 'bg-white border border-gray-100'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${rankStyle(rank)}`}>
              {rankLabel(rank)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 truncate">
                  {entry.username}
                </span>
                {isCurrentUser && (
                  <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md font-medium">
                    you
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                <span>{entry.gamesPlayed} games</span>
                {entry.highestAccuracy && (
                  <span>{entry.highestAccuracy}% best</span>
                )}
                {entry.streak > 0 && (
                  <span>🔥 {entry.streak}</span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="font-black text-lg text-gray-900">{entry.totalScore.toLocaleString()}</div>
              <div className="text-xs text-gray-500">pts</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
