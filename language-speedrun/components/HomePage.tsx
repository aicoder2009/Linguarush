'use client';

import { useState, useEffect, memo } from 'react';
import { getLeaderboard, getCurrentUser, getCurrentStreak, type LeaderboardEntry } from '../services/leaderboard';
import { logout } from '../services/auth';
import LeaderboardView from './LeaderboardView';
import LogbookView from './LogbookView';

interface HomePageProps {
  onSelectMode: (mode: string) => void;
  onLogout?: () => void;
}

const HomePage = memo(({ onSelectMode, onLogout }: HomePageProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard' | 'logbook'>('play');

  useEffect(() => {
    setLeaderboard(getLeaderboard());
    setCurrentUser(getCurrentUser());
    setCurrentStreak(getCurrentStreak());
  }, []);

  const modes = [
    { id: 'sprint', name: 'Sprint', icon: '🏃', description: '10 questions', color: 'bg-orange-500' },
    { id: 'timeattack', name: 'Time Attack', icon: '⏱️', description: '60 seconds', color: 'bg-red-500' },
    { id: 'zen', name: 'Zen', icon: '🧘', description: 'No timer', color: 'bg-blue-500' },
    { id: 'endless', name: 'Endless', icon: '♾️', description: '3 lives', color: 'bg-emerald-500' },
  ];

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
  };

  return (
    <div className="min-h-screen bg-[#F5F4ED] p-4 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between py-4 mb-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black italic">Linguarush</h1>
            {currentStreak > 0 && (
              <div className="text-sm font-bold text-orange-600 mt-0.5">
                🔥 {currentStreak} day streak
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl font-bold text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-200 bg-white"
            aria-label="Logout"
          >
            Leave
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex bg-white rounded-xl p-1 border border-gray-200 mb-5">
          {(['play', 'leaderboard', 'logbook'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-colors ${
                activeTab === tab
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'play' ? 'Play' : tab === 'leaderboard' ? 'Leaderboard' : 'Logbook'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'play' && (
            <div className="grid grid-cols-2 gap-3">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => onSelectMode(mode.id)}
                  className={`${mode.color} rounded-2xl p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg`}
                >
                  <div className="text-3xl mb-2">{mode.icon}</div>
                  <h3 className="text-white font-black text-lg">{mode.name}</h3>
                  <p className="text-white/80 text-sm font-medium">{mode.description}</p>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardView leaderboard={leaderboard} currentUser={currentUser} />
          )}

          {activeTab === 'logbook' && (
            <LogbookView />
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 py-3 mt-auto">
          Made with care in Arizona 🌵 by{' '}
          <a
            href="https://github.com/aicoder2009"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-gray-500 hover:underline"
          >
            Karthick Arun
          </a>
        </footer>
      </div>
    </div>
  );
});

HomePage.displayName = 'HomePage';

export default HomePage;
