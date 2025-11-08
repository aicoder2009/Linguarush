'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useTimer } from '../hooks/useTimer';
import { generateQuestions } from '../services/languageDatabase';
import { startNewSession, recordRoundTime, getTimeDifference, formatTimeDifference } from '../services/roundTimeTracker';
import AnswerInput from './AnswerInput';

interface GameScreenProps {
  mode: string;
  difficulty: string;
  onFinish: (results: {
    mode: string;
    time: number;
    answers: Array<{ questionId: number; userAnswer: string; correctAnswer: string; isCorrect: boolean; timeSpent: number }>;
    questions: Array<{ id: number; text: string; correctAnswer: string; acceptableAnswers: string[] }>;
  }) => void;
  onQuit: () => void;
}

export default function GameScreen({ mode, difficulty, onFinish, onQuit }: GameScreenProps) {
  const [questions] = useState(() => generateQuestions(mode, difficulty));
  const { gameState, startGame, submitAnswer, updateTimeRemaining } = useGameState(mode, questions);
  const { time, formatTime } = useTimer(gameState.status === 'playing');
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState<string>('');
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [timeComparison, setTimeComparison] = useState<{ difference: number; isFaster: boolean } | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [showComboAnimation, setShowComboAnimation] = useState(false);
  const sessionStarted = useRef(false);

  useEffect(() => {
    if (!sessionStarted.current) {
      startNewSession(mode);
      sessionStarted.current = true;
    }
    startGame();
    setRoundStartTime(Date.now());
  }, [startGame, mode]);

  // Update time remaining for time attack mode
  useEffect(() => {
    if (mode === 'timeattack' && gameState.status === 'playing') {
      updateTimeRemaining(time);
    }
  }, [time, mode, gameState.status, updateTimeRemaining]);

  useEffect(() => {
    if (gameState.status === 'finished') {
      setTimeout(() => {
        onFinish({
          mode,
          time,
          answers: gameState.answers,
          questions: questions
        });
      }, 1500);
    }
  }, [gameState.status, mode, time, gameState.answers, questions, onFinish]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Use F2 for pause/resume (universal key that won't conflict with typing)
      if (e.key === 'F2') {
        e.preventDefault();
        setIsPaused(!isPaused);
      }
      // Keep Escape as toggle for convenience
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsPaused(!isPaused);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPaused]);

  const handleSkip = useCallback(() => {
    const penalty = 5;
    setCurrentScore(prev => prev - penalty); // Allow negative scores
    setComboStreak(0);

    // Move to next question
    const currentQuestion = questions[gameState.currentQuestionIndex];
    submitAnswer('', currentQuestion); // Submit empty answer to move forward

    setRoundStartTime(Date.now());
  }, [questions, gameState.currentQuestionIndex, submitAnswer]);

  const handleSubmit = useCallback((answer: string) => {
    const currentQuestion = questions[gameState.currentQuestionIndex];
    const result = submitAnswer(answer, currentQuestion);

    // Calculate round time
    const roundTime = Date.now() - roundStartTime;

    // Record this round time
    recordRoundTime(gameState.currentQuestionIndex, roundTime);

    // Get time comparison with previous round (if applicable)
    const comparison = getTimeDifference(roundTime, gameState.currentQuestionIndex);
    if (comparison?.showComparison) {
      setTimeComparison({
        difference: comparison.difference,
        isFaster: comparison.isFaster
      });
    }

    // Update score and combo
    if (result.isCorrect) {
      const newCombo = comboStreak + 1;
      setComboStreak(newCombo);
      const basePoints = 10;
      const comboBonus = newCombo > 1 ? (newCombo - 1) * 5 : 0;
      const points = basePoints + comboBonus;
      setCurrentScore(currentScore + points);

      if (newCombo > 1) {
        setShowComboAnimation(true);
        setTimeout(() => setShowComboAnimation(false), 1000);
      }
    } else {
      setComboStreak(0);
    }

    setLastAnswerCorrect(result.isCorrect);
    setLastCorrectAnswer(currentQuestion.correctAnswer);
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      setRoundStartTime(Date.now()); // Reset for next round
      setTimeComparison(null);
    }, 1500);
  }, [questions, gameState.currentQuestionIndex, submitAnswer, roundStartTime, comboStreak, currentScore]);

  // Memoize expensive calculations
  const progressSegments = useMemo(() => 
    Array.from({ length: questions.length }, (_, i) => {
      if (i < gameState.currentQuestionIndex) return 'bg-blue-400';
      if (i === gameState.currentQuestionIndex) return 'bg-blue-400';
      return 'bg-gray-300';
    }),
    [questions.length, gameState.currentQuestionIndex]
  );

  // Memoize timer display calculation
  const timerDisplay = useMemo(() => {
    if (mode === 'timeattack' && gameState.timeRemaining !== undefined) {
      const seconds = Math.ceil(gameState.timeRemaining / 1000);
      return `${seconds}s`;
    }
    return formatTime();
  }, [mode, gameState.timeRemaining, formatTime]);

  // Memoize timer styling
  const timerClassName = useMemo(() => {
    const isLowTime = mode === 'timeattack' && 
      gameState.timeRemaining !== undefined && 
      Math.ceil(gameState.timeRemaining / 1000) <= 10;
    
    return `font-black italic ${
      isLowTime ? 'text-6xl text-red-600 animate-pulse' : 'text-6xl text-gray-900'
    }`;
  }, [mode, gameState.timeRemaining]);

  if (gameState.status === 'ready' || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-2xl sm:text-3xl text-gray-800 font-bold animate-pulse">Loading game...</div>
      </div>
    );
  }

  const currentQuestion = questions[gameState.currentQuestionIndex];

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F4ED] p-6 relative">
      {/* Score Display - Top Left */}
      <div className="fixed top-6 left-6 z-40 flex flex-col gap-3">
        <div className={`rounded-full px-6 py-3 border-4 border-white shadow-lg transition-all ${
          currentScore < 0
            ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse'
            : 'bg-gradient-to-br from-yellow-400 to-yellow-500'
        }`}>
          <div className="text-center">
            <div className="text-xs font-bold text-white opacity-90">
              {currentScore < 0 ? 'DEBT' : 'SCORE'}
            </div>
            <div className="text-2xl font-black text-white">{currentScore}</div>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="bg-white rounded-2xl px-4 py-3 border-4 border-gray-200 shadow-lg">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-800 text-white rounded font-bold text-xs border-2 border-gray-900 shadow-sm min-w-[28px] text-center">
                F2
              </kbd>
              <span className="text-gray-700 font-medium">Pause</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-800 text-white rounded font-bold text-xs border-2 border-gray-900 shadow-sm min-w-[28px] text-center">
                Esc
              </kbd>
              <span className="text-gray-700 font-medium">Pause</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Control Bar */}
      <div className="fixed top-6 right-6 flex gap-3 z-40">
        {/* Pause/Resume Toggle */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center border-2 border-gray-200 hover:border-gray-300"
          aria-label={isPaused ? "Resume game" : "Pause game"}
        >
          {isPaused ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          )}
        </button>

        {/* Exit Button */}
        <button
          onClick={onQuit}
          className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center border-2 border-gray-200 hover:border-gray-300"
          aria-label="Exit to menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Game Paused</h2>
            <p className="text-gray-600 mb-6">Take a break and resume when ready</p>
            <button
              onClick={() => setIsPaused(false)}
              className="w-full bg-[#00917A] text-white font-bold py-4 px-6 rounded-full hover:bg-[#007a68] transition-colors"
            >
              Resume Game
            </button>
          </div>
        </div>
      )}

      {/* Correct Answer Feedback Overlay */}
      {showFeedback && lastAnswerCorrect && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-[scale-in_0.5s_ease-out]">
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-2xl"
            >
              {/* Green circle background */}
              <circle cx="100" cy="100" r="90" fill="#22C55E" className="animate-pulse"/>
              {/* White checkmark */}
              <path
                d="M60 100 L85 125 L140 70"
                stroke="white"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-[draw_0.5s_ease-out]"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Combo Streak Animation */}
      {showComboAnimation && comboStreak > 1 && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-[scale-in_0.5s_ease-out]">
            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl px-8 py-6 border-4 border-white shadow-2xl">
              <div className="text-center">
                <div className="text-6xl font-black text-white mb-2">{comboStreak}x</div>
                <div className="text-2xl font-bold text-white">COMBO!</div>
                <div className="text-sm text-white opacity-90 mt-2">+{(comboStreak - 1) * 5} bonus pts</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        {/* Progress Bar */}
        <div className="flex gap-1 mb-4">
          {progressSegments.map((color, i) => (
            <div key={i} className={`h-2 flex-1 rounded-full ${color}`} />
          ))}
        </div>

        {/* Timer Display - Prominent (hide for zen mode) */}
        {mode !== 'zen' && (
          <div className="text-center mb-6">
            <div className={timerClassName}>
              {timerDisplay}
            </div>
          </div>
        )}

        {/* Question */}
        <div className="flex-1 flex items-center justify-center mb-6">
          <h1 className="text-4xl font-black text-center leading-tight px-4">
            {currentQuestion.text}
          </h1>
        </div>

        {/* Answer Container */}
        <div className="bg-[#FFDA57] rounded-3xl p-6 border-4 border-white shadow-lg">
          <div className="mb-4">
            <AnswerInput
              onSubmit={handleSubmit}
              disabled={showFeedback || gameState.status !== 'playing'}
              showFeedback={showFeedback}
              isCorrect={lastAnswerCorrect}
            />
          </div>

          {showFeedback && !lastAnswerCorrect && (
            <div className="bg-white rounded-full px-5 py-3 mb-4">
              <p className="text-center font-medium">
                Answer: <span className="font-bold">{lastCorrectAnswer}</span>
              </p>
            </div>
          )}

          {/* Time Comparison Display */}
          {showFeedback && timeComparison && (
            <div className={`rounded-full px-5 py-3 mb-4 ${timeComparison.isFaster ? 'bg-green-100 border-2 border-green-400' : 'bg-red-100 border-2 border-red-400'}`}>
              <p className={`text-center font-bold ${timeComparison.isFaster ? 'text-green-700' : 'text-red-700'}`}>
                {timeComparison.isFaster ? '⚡ Faster' : '🐌 Slower'} by {formatTimeDifference(timeComparison.difference)}
              </p>
            </div>
          )}

          {/* Skip Button */}
          {!showFeedback && (
            <button
              onClick={handleSkip}
              className="w-full bg-white text-gray-700 font-bold py-3 px-6 rounded-full hover:bg-gray-100 transition-colors border-2 border-gray-300"
            >
              Skip (-5 pts)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
