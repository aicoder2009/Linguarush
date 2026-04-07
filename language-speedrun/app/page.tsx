'use client';

import { useState, useEffect } from 'react';
import { isLoggedIn } from '../services/auth';
import AuthScreen from '../components/AuthScreen';
import HomePage from '../components/HomePage';
import GameScreen from '../components/GameScreen';
import ResultsScreen from '../components/ResultsScreen';

export default function Home() {
  const [screen, setScreen] = useState<'auth' | 'home' | 'game' | 'results'>('auth');
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showDifficultyOverlay, setShowDifficultyOverlay] = useState(false);
  const [gameResults, setGameResults] = useState<{
    mode: string;
    difficulty: string;
    time: number;
    answers: Array<{ questionId: number; userAnswer: string; correctAnswer: string; isCorrect: boolean; timeSpent: number }>;
    questions: Array<{ id: number; text: string; correctAnswer: string; acceptableAnswers: string[] }>;
  } | null>(null);

  useEffect(() => {
    if (isLoggedIn()) {
      setScreen('home');
    }
  }, []);

  const handleSelectMode = (mode: string) => {
    setSelectedMode(mode);
    setShowDifficultyOverlay(true);
  };

  const handleSelectDifficulty = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    setShowDifficultyOverlay(false);
    setScreen('game');
  };

  const handleGameFinish = (results: {
    mode: string;
    difficulty: string;
    time: number;
    answers: Array<{ questionId: number; userAnswer: string; correctAnswer: string; isCorrect: boolean; timeSpent: number }>;
    questions: Array<{ id: number; text: string; correctAnswer: string; acceptableAnswers: string[] }>;
  }) => {
    setGameResults(results);
    setScreen('results');
  };

  const handlePlayAgain = () => {
    setScreen('game');
  };

  const handleReturnToMenu = () => {
    setScreen('home');
    setSelectedMode(null);
    setGameResults(null);
  };

  const handleAuthenticated = () => {
    setScreen('home');
  };

  const handleLogout = () => {
    setScreen('auth');
    setSelectedMode(null);
    setGameResults(null);
  };

  return (
    <>
      {screen === 'auth' && (
        <AuthScreen onAuthenticated={handleAuthenticated} />
      )}

      {screen === 'home' && (
        <>
          <HomePage onSelectMode={handleSelectMode} onLogout={handleLogout} />

          {showDifficultyOverlay && selectedMode && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-[#F5F4ED] rounded-2xl p-8 max-w-md mx-4 border-2 border-gray-200 shadow-2xl">
                <h2 className="text-3xl font-black text-center mb-6">Select Difficulty</h2>
                <div className="space-y-3">
                  {['easy', 'medium', 'hard'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => handleSelectDifficulty(diff)}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                        diff === 'easy'
                          ? 'bg-emerald-500 hover:bg-emerald-600'
                          : diff === 'medium'
                          ? 'bg-amber-500 hover:bg-amber-600'
                          : 'bg-red-500 hover:bg-red-600'
                      } text-white shadow-md hover:shadow-lg`}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowDifficultyOverlay(false)}
                  className="w-full mt-4 py-3 px-6 rounded-xl font-bold text-gray-600 bg-white hover:bg-gray-100 transition-all border border-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {screen === 'game' && selectedMode && selectedDifficulty && (
        <GameScreen
          mode={selectedMode}
          difficulty={selectedDifficulty}
          onFinish={handleGameFinish}
          onQuit={handleReturnToMenu}
        />
      )}

      {screen === 'results' && gameResults && (
        <ResultsScreen
          gameData={gameResults}
          onPlayAgain={handlePlayAgain}
          onMenu={handleReturnToMenu}
        />
      )}
    </>
  );
}
