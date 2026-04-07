'use client';

import { useState, useEffect } from 'react';
import { createGuestUser } from '../services/auth';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentPlayers, setRecentPlayers] = useState<{ username: string; timestamp: number }[]>([]);

  useEffect(() => {
    const fetchRecentPlayers = async () => {
      try {
        const response = await fetch('/api/guestbook');
        const data = await response.json();
        if (data.guestbook) {
          const recent = data.guestbook
            .sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp)
            .slice(0, 5);
          setRecentPlayers(recent);
        }
      } catch (error) {
        console.error('Failed to fetch recent players:', error);
      }
    };

    fetchRecentPlayers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setLoading(true);
    const result = await createGuestUser(username.trim());
    setLoading(false);

    if (result.success) {
      onAuthenticated();
    } else {
      setError(result.error || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4ED] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-5xl sm:text-6xl font-black italic text-gray-900 mb-2">Linguarush</h1>
          <p className="text-gray-500 font-medium">How many languages can you identify?</p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-black mb-1">Enter your name</h3>
            <p className="text-gray-500 text-sm">Pick a name and start playing</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {recentPlayers.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 text-center">
                  Recently Playing
                </h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {recentPlayers.map((player, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setUsername(player.username)}
                      className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors cursor-pointer"
                    >
                      {player.username}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 text-lg rounded-xl border-2 border-gray-200 focus:border-gray-900 focus:outline-none font-medium transition-colors"
                placeholder="Your name..."
                required
                minLength={2}
                maxLength={20}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center">
                <p className="text-red-600 font-medium text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white font-bold text-lg py-4 px-6 rounded-xl hover:bg-gray-800 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : "Let's Play!"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">
              Scores are saved locally on this device
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
