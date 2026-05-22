import { languages } from '../data/languages';

export interface Question {
  id: number;
  text: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  timestamp: number;
}

export function generateQuestions(mode: string, difficulty: string = 'medium'): Question[] {
  const questionCounts: Record<string, number> = {
    sprint: 10,
    timeattack: 50,
    endless: 100,
    perfect: 20,
    zen: 15
  };

  const count = questionCounts[mode] || 10;

  // Filter by difficulty if specified
  let availableLanguages = [...languages];
  if (difficulty && difficulty !== 'medium') {
    availableLanguages = languages.filter(lang =>
      !lang.difficulty || lang.difficulty === difficulty || lang.difficulty === 'medium'
    );
  }

  const shuffled = availableLanguages.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, availableLanguages.length));

  return selected.map((lang, index) => {
    const sampleIndex = Math.floor(Math.random() * lang.samples.length);
    return {
      id: index,
      text: lang.samples[sampleIndex],
      correctAnswer: lang.name,
      acceptableAnswers: lang.acceptableAnswers,
      timestamp: Date.now()
    };
  });
}
