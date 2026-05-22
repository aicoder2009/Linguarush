import { type Language } from '../data/languages';

export function getAutocompleteSuggestions(input: string, languages: Language[]): Language[] {
  if (!input || input.length === 0) return [];

  const normalized = input.toLowerCase().trim();

  // Pre-compute lowercase values to avoid repeated toLowerCase() calls
  const matches = languages.filter(lang => {
    const langNameLower = lang.name.toLowerCase();
    if (langNameLower.startsWith(normalized)) return true;
    
    // Check acceptable answers
    for (const ans of lang.acceptableAnswers) {
      if (ans.toLowerCase().startsWith(normalized)) return true;
    }
    return false;
  });

  matches.sort((a, b) => {
    const aNameLower = a.name.toLowerCase();
    const bNameLower = b.name.toLowerCase();
    const aExact = aNameLower === normalized;
    const bExact = bNameLower === normalized;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.name.localeCompare(b.name);
  });

  return matches.slice(0, 5);
}
