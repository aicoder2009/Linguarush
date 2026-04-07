'use client';

import { useState, useEffect } from 'react';
import { formatShareableResults } from '../services/resultsFormatter';
import { saveScore, type GameStats } from '../services/scoreManager';
import { saveGameToHistory } from '../services/gameHistory';
import { saveSessionToHistory } from '../services/roundTimeTracker';

interface ResultsScreenProps {
  gameData: {
    mode: string;
    difficulty: string;
    time: number;
    answers: Array<{
      questionId: number;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      timeSpent: number;
    }>;
    questions: Array<{
      id: number;
      text: string;
      correctAnswer: string;
      acceptableAnswers: string[];
    }>;
  };
  onPlayAgain: () => void;
  onMenu: () => void;
}

export default function ResultsScreen({ gameData, onPlayAgain, onMenu }: ResultsScreenProps) {
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);

  useEffect(() => {
    const correctCount = gameData.answers.filter(a => a.isCorrect).length;
    const totalCount = gameData.answers.length;
    const accuracy = Math.round((correctCount / totalCount) * 100);
    const totalTime = gameData.time;

    const formatTime = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const milliseconds = Math.floor((ms % 1000) / 10);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    };

    const calculatedStats: GameStats = {
      mode: gameData.mode,
      correctCount,
      totalCount,
      accuracy,
      totalTime,
      formatTime: formatTime(totalTime)
    };

    setStats(calculatedStats);
    saveScore(gameData.mode, calculatedStats);
    saveSessionToHistory();

    const score = correctCount * 100 + (accuracy === 100 ? 500 : 0);
    saveGameToHistory({
      mode: gameData.mode,
      difficulty: gameData.difficulty,
      correctCount,
      totalCount,
      accuracy,
      totalTime,
      score,
    });
  }, [gameData]);

  const handleShare = () => {
    if (stats) {
      const shareText = formatShareableResults(gameData, stats);
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!stats) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F5F4ED] p-6">
      <div className="w-full max-w-md">
        <div className="bg-[#FFDA57] rounded-2xl p-8 border-2 border-amber-300 shadow-lg relative overflow-hidden">
          <h1 className="text-4xl font-black text-center mb-8">
            You Scored
            <br />
            {stats.accuracy}%!
          </h1>

          <div className="bg-white rounded-xl p-6 mb-6">
            <div className="text-center mb-4">
              <p className="text-lg font-bold mb-2">
                {stats.correctCount} / {stats.totalCount} Correct
              </p>
              <p className="text-gray-600 font-medium">
                Time: {stats.formatTime}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {gameData.answers.map((answer, i) => (
                <span key={i} className="text-2xl">
                  {answer.isCorrect ? '✅' : '❌'}
                </span>
              ))}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {gameData.answers.map((answer, i) => {
                const question = gameData.questions[i];
                return (
                  <div
                    key={i}
                    className={`p-2 rounded-lg text-xs ${
                      answer.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="font-bold mb-1">{question.text}</div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        {!answer.isCorrect && answer.userAnswer && (
                          <div className="text-red-600">
                            Your answer: <span className="font-medium">{answer.userAnswer}</span>
                          </div>
                        )}
                        <div className={answer.isCorrect ? 'text-green-600' : 'text-gray-600'}>
                          Correct: <span className="font-medium">{answer.correctAnswer}</span>
                        </div>
                      </div>
                      <div className="text-gray-500 text-xs">
                        {(answer.timeSpent / 1000).toFixed(1)}s
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onPlayAgain}
              className="w-full bg-black text-white font-bold py-4 px-6 rounded-xl hover:bg-gray-900 transition-colors"
            >
              Play Again
            </button>

            <button
              onClick={handleShare}
              className="w-full bg-white text-black font-bold py-4 px-6 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
            >
              {copied ? 'Copied!' : 'Share Results'}
            </button>

            <button
              onClick={onMenu}
              className="w-full bg-emerald-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
