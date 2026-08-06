import type { Timestamp } from 'firebase/firestore';
import { cleanWordToken, normalizeWord } from '@/lib/wordTooltipUtils';
import type { SupportedLanguage, UserVocabularyDocument } from '@/types';

/** Lowercase, diacritic-stripped key used to identify the same vocabulary entry. */
export function canonicalVocabKey(word: string): string {
  return normalizeWord(cleanWordToken(word));
}

export function wordsMatchCanonically(a: string, b: string): boolean {
  return canonicalVocabKey(a) === canonicalVocabKey(b);
}

/** "le pain" → "pain", "l'addition" → "addition". */
function stripLeadingDeterminer(word: string): string {
  return word
    .trim()
    .replace(/^(?:l|d|j|n|s|c|m|t|qu)['’]\s*/i, '')
    .replace(/^(?:le|la|les|un|une|des|du|de|au|aux|the|an|a)\s+/i, '');
}

/**
 * Stems for plural and French gender agreement, so "amies" and "ami" or
 * "contente" and "content" resolve to a shared key.
 */
function inflectionVariants(key: string): string[] {
  const variants: string[] = [];
  const push = (stem: string) => {
    if (stem.length >= 3) variants.push(stem);
  };

  if (key.endsWith('ies')) push(`${key.slice(0, -3)}y`);
  if (key.endsWith('es')) {
    push(key.slice(0, -1));
    push(key.slice(0, -2));
  } else if (key.endsWith('s') || key.endsWith('x')) {
    push(key.slice(0, -1));
  }

  if (key.endsWith('euse')) push(`${key.slice(0, -4)}eux`);
  if (key.endsWith('trice')) push(`${key.slice(0, -5)}teur`);
  if (key.endsWith('ive')) push(`${key.slice(0, -3)}if`);
  if (key.endsWith('lle')) push(key.slice(0, -2));
  if (key.endsWith('e')) push(key.slice(0, -1));

  return variants;
}

/** Every canonical key a word may be stored under in the learner's bank. */
export function vocabVariantKeys(word: string): string[] {
  const keys = new Set<string>();
  for (const form of new Set([word, stripLeadingDeterminer(word)])) {
    const key = canonicalVocabKey(form);
    if (key.length < 2) continue;
    keys.add(key);
    for (const variant of inflectionVariants(key)) keys.add(variant);
  }
  return [...keys];
}

/**
 * Tests whether a word is already in the learner's vocabulary bank, tolerating
 * plurals, gender agreement and glued determiners. Words that only exist inside
 * a stored multi-word entry (chunk, collocation) also count as known.
 */
export function buildKnownVocabularyMatcher(
  knownWords: Iterable<string>,
): (word: string) => boolean {
  const knownKeys = new Set<string>();
  for (const entry of knownWords) {
    for (const key of vocabVariantKeys(entry)) knownKeys.add(key);
    const parts = entry.split(/[\s'’-]+/).filter((part) => part.length >= 3);
    if (parts.length > 1) {
      for (const part of parts) {
        for (const key of vocabVariantKeys(part)) knownKeys.add(key);
      }
    }
  }
  return (word: string) => vocabVariantKeys(word).some((key) => knownKeys.has(key));
}

/** Deterministic Firestore document ID — one doc per user + language + word. */
export function buildVocabDocId(
  uid: string,
  language: SupportedLanguage,
  word: string,
): string {
  const key = canonicalVocabKey(word).replace(/\//g, '_').replace(/\s+/g, '_');
  return `${uid}_${language}_${key}`;
}

function timestampMillis(ts: Timestamp | undefined): number {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof (ts as { toDate?: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
}

function isPlaceholderTranslation(word: string, translation: string | undefined): boolean {
  if (!translation?.trim()) return true;
  return wordsMatchCanonically(word, translation);
}

/** Prefer infinitive-style casing (e.g. "convenir" over "CONVENIR"). */
export function pickDisplayWord(items: UserVocabularyDocument[]): string {
  const sorted = [...items].sort((a, b) => {
    const aAllLower = a.word === a.word.toLowerCase();
    const bAllLower = b.word === b.word.toLowerCase();
    if (aAllLower !== bAllLower) return aAllLower ? 1 : -1;
    if (a.word.length !== b.word.length) return b.word.length - a.word.length;
    return a.word.localeCompare(b.word);
  });
  return sorted[0].word;
}

export function mergeVocabularyGroup(group: UserVocabularyDocument[]): UserVocabularyDocument {
  const displayWord = pickDisplayWord(group);
  const uid = group[0].uid;
  const language = group[0].language;
  const wordKey = canonicalVocabKey(displayWord);

  let best = group[0];
  for (const item of group.slice(1)) {
    const bestLevel = best.srsLevel ?? 0;
    const itemLevel = item.srsLevel ?? 0;
    if (itemLevel > bestLevel) {
      best = item;
      continue;
    }
    if (itemLevel === bestLevel && timestampMillis(item.lastReview) > timestampMillis(best.lastReview)) {
      best = item;
    }
  }

  const srsLevel = Math.max(...group.map((i) => i.srsLevel ?? 0));
  const mistakeCount = Math.max(...group.map((i) => i.mistakeCount ?? 0));
  const productionCount = group.reduce((sum, i) => sum + (i.productionCount ?? 0), 0);
  const encounterCount = group.reduce((sum, i) => sum + (i.encounterCount ?? 0), 0);

  const translation =
    group.find((i) => !isPlaceholderTranslation(i.word, i.translation))?.translation ??
    best.translation;

  const imageUrl = group.find((i) => i.imageUrl)?.imageUrl ?? best.imageUrl;
  const wordType = group.find((i) => i.wordType === 'verb')?.wordType ?? best.wordType;
  const entryType = group.find((i) => i.entryType)?.entryType ?? best.entryType;
  const knowledgeMode = group.some((i) => i.knowledgeMode === 'active') ? 'active' : best.knowledgeMode;

  const firstSeen = group.reduce((earliest, item) => {
    const ms = timestampMillis(item.firstSeen);
    return ms > 0 && ms < timestampMillis(earliest.firstSeen) ? item : earliest;
  }, best);

  const lastReview = group.reduce((latest, item) => {
    return timestampMillis(item.lastReview) > timestampMillis(latest.lastReview) ? item : latest;
  }, best);

  const nextReview = group.reduce((soonest, item) => {
    const itemMs = timestampMillis(item.nextReview);
    const soonestMs = timestampMillis(soonest.nextReview);
    if (itemMs === 0) return soonest;
    if (soonestMs === 0) return item;
    return itemMs < soonestMs ? item : soonest;
  }, best);

  return {
    ...best,
    // Prefer a real Firestore id that already exists; fall back to canonical.
    id: group.find((i) => i.id === buildVocabDocId(uid, language, displayWord))?.id ?? best.id,
    uid,
    language,
    word: displayWord,
    wordKey,
    translation,
    imageUrl,
    wordType,
    entryType,
    knowledgeMode,
    srsLevel,
    mistakeCount,
    productionCount: productionCount || best.productionCount,
    encounterCount: encounterCount || best.encounterCount,
    firstSeen: firstSeen.firstSeen,
    lastReview: lastReview.lastReview,
    nextReview: nextReview.nextReview,
  };
}

/** Oldest first, so `slice(-N)` yields the N most recently learned words. */
export function sortVocabularyByFirstSeen(
  items: UserVocabularyDocument[],
): UserVocabularyDocument[] {
  return [...items].sort((a, b) => timestampMillis(a.firstSeen) - timestampMillis(b.firstSeen));
}

/** Collapse duplicate cards that share the same canonical word key. */
export function dedupeVocabularyItems(items: UserVocabularyDocument[]): UserVocabularyDocument[] {
  const groups = new Map<string, UserVocabularyDocument[]>();
  for (const item of items) {
    const key = canonicalVocabKey(item.word);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return [...groups.values()].map(mergeVocabularyGroup);
}

export function findVocabularyItem(
  items: UserVocabularyDocument[],
  word: string,
): UserVocabularyDocument | undefined {
  const key = canonicalVocabKey(word);
  return items.find((item) => canonicalVocabKey(item.word) === key);
}
