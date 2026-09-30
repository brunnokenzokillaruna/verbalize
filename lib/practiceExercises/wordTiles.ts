import type { SupportedLanguage } from '@/types';

const FILLERS: Record<SupportedLanguage, string[]> = {
  fr: ['mais', 'très', 'aussi', 'encore', 'toujours', 'jamais', 'beaucoup', 'ici', 'demain', 'petit'],
  en: ['but', 'very', 'also', 'still', 'always', 'never', 'really', 'here', 'tomorrow', 'small'],
};

function cleanToken(word: string): string {
  return word.trim();
}

function isPunctuation(word: string): boolean {
  return /^[.,!?;:'"-\s]+$/.test(word);
}

function keyOf(word: string): string {
  return word.toLowerCase();
}

/** Correct tiles plus up to two words that must stay in the bank. */
export function buildWordTiles(
  correctOrder: string[],
  words: string[] | undefined,
  language: SupportedLanguage = 'fr',
): string[] {
  const correct = correctOrder.map(cleanToken).filter((word) => word && !isPunctuation(word));
  const remaining = new Map<string, number>();
  for (const word of correct) {
    remaining.set(keyOf(word), (remaining.get(keyOf(word)) ?? 0) + 1);
  }

  const extras: string[] = [];
  for (const raw of words ?? []) {
    const word = cleanToken(raw);
    if (!word || isPunctuation(word)) continue;
    const key = keyOf(word);
    const left = remaining.get(key) ?? 0;
    if (left > 0) {
      remaining.set(key, left - 1);
      continue;
    }
    if (extras.length < 2 && !extras.some((extra) => keyOf(extra) === key)) {
      extras.push(word);
    }
  }

  const used = new Set([...correct, ...extras].map(keyOf));
  for (const filler of FILLERS[language]) {
    if (extras.length >= 2) break;
    if (used.has(keyOf(filler))) continue;
    extras.push(filler);
    used.add(keyOf(filler));
  }

  const bank = [...correct, ...extras];
  for (let i = bank.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = bank[i]!;
    bank[i] = bank[j]!;
    bank[j] = current;
  }
  return bank;
}
