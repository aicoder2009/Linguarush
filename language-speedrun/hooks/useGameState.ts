import { useState, useCallback } from 'react';
import { type Question } from '../services/languageDatabase';

export interface Answer {
  questionId: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface GameState {
  status: 'ready' | 'playing' | 'paused' | 'finished';
  currentQuestionIndex: number;
  answers: Answer[];
  lives: number;
  startTime: number | null;
  endTime: number | null;
  timeRemaining?: number; // For time attack mode (in milliseconds)
  cumulativeTime: number; // Track cumulative time for performance
}

export function useGameState(mode: string, questions: Question[]) {
  const getLivesForMode = (gameMode: string) => {
    if (gameMode === 'endless' || gameMode === 'perfect') return 3;
    if (gameMode === 'zen') return Infinity;
    return Infinity;
  };

  const [gameState, setGameState] = useState<GameState>({
    status: 'ready',
    currentQuestionIndex: 0,
    answers: [],
    lives: getLivesForMode(mode),
    startTime: null,
    endTime: null,
    timeRemaining: mode === 'timeattack' ? 60000 : undefined, // 60 seconds for time attack
    cumulativeTime: 0
  });

  const startGame = useCallback(() => {
    setGameState({
      status: 'playing',
      currentQuestionIndex: 0,
      answers: [],
      lives: getLivesForMode(mode),
      startTime: Date.now(),
      endTime: null,
      timeRemaining: mode === 'timeattack' ? 60000 : undefined,
      cumulativeTime: 0
    });
  }, [mode]);

  const updateTimeRemaining = useCallback((timeElapsed: number) => {
    if (mode !== 'timeattack') return;

    setGameState(prev => {
      const newTimeRemaining = 60000 - timeElapsed;

      // Check if time has run out
      if (newTimeRemaining <= 0) {
        return {
          ...prev,
          timeRemaining: 0,
          status: 'finished',
          endTime: Date.now()
        };
      }

      return {
        ...prev,
        timeRemaining: newTimeRemaining
      };
    });
  }, [mode]);

  const submitAnswer = useCallback((userAnswer: string, currentQuestion: Question) => {
    const isCorrect = currentQuestion.acceptableAnswers.some(
      acceptable => acceptable.toLowerCase() === userAnswer.toLowerCase()
    );

    // Calculate time spent using tracked cumulative time (avoids O(n) reduce)
    const timeSpent = Date.now() - (gameState.startTime || 0) - gameState.cumulativeTime;

    const answerRecord: Answer = {
      questionId: currentQuestion.id,
      userAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      timeSpent
    };

    const newAnswers = [...gameState.answers, answerRecord];
    const newLives = isCorrect ? gameState.lives : gameState.lives - 1;
    const isLastQuestion = gameState.currentQuestionIndex === questions.length - 1;
    const isGameOver = newLives === 0 || (mode === 'perfect' && !isCorrect);

    if (isGameOver || isLastQuestion) {
      setGameState(prev => ({
        ...prev,
        answers: newAnswers,
        lives: newLives,
        status: 'finished',
        endTime: Date.now(),
        cumulativeTime: prev.cumulativeTime + timeSpent
      }));
      return { finished: true, isCorrect };
    } else {
      setGameState(prev => ({
        ...prev,
        answers: newAnswers,
        lives: newLives,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        cumulativeTime: prev.cumulativeTime + timeSpent
      }));
      return { finished: false, isCorrect };
    }
  }, [gameState, mode, questions]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'paused' }));
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'playing' }));
  }, []);

  return {
    gameState,
    startGame,
    submitAnswer,
    pauseGame,
    resumeGame,
    updateTimeRemaining
  };
}
