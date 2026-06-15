import type { SupportedLanguage, VerbDocument } from '@/types';

const VERB_CACHE_KEY = 'verbalize-verb-conjugation-cache';
const SCORE_KEY = 'verbalize-verb-sprint-scores';
const MAX_CACHED_VERBS = 30;

type VerbCacheStore = Record<string, VerbDocument>;
type ScoreStore = Record<string, number>;

function cacheKey(language: SupportedLanguage, word: string): string {
  return `${language}:${word.trim().toLowerCase()}`;
}

function scoreKey(uid: string, language: SupportedLanguage): string {
  return `${uid}:${language}`;
}

function readCacheStore(): VerbCacheStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(VERB_CACHE_KEY);
    return raw ? (JSON.parse(raw) as VerbCacheStore) : {};
  } catch {
    return {};
  }
}

function writeCacheStore(store: VerbCacheStore): void {
  if (typeof window === 'undefined') return;
  const entries = Object.entries(store);
  const trimmed =
    entries.length <= MAX_CACHED_VERBS
      ? store
      : Object.fromEntries(entries.slice(-MAX_CACHED_VERBS));
  localStorage.setItem(VERB_CACHE_KEY, JSON.stringify(trimmed));
}

export function readVerbFromCache(
  language: SupportedLanguage,
  word: string,
): VerbDocument | null {
  return readCacheStore()[cacheKey(language, word)] ?? null;
}

export function writeVerbToCache(
  language: SupportedLanguage,
  doc: VerbDocument,
): void {
  const store = readCacheStore();
  store[cacheKey(language, doc.infinitive)] = doc;
  writeCacheStore(store);
}

export function readBestSprintScore(
  uid: string,
  language: SupportedLanguage,
): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw) as ScoreStore;
    return store[scoreKey(uid, language)] ?? null;
  } catch {
    return null;
  }
}

/** Saves score if it's a new record. Returns the current best score. */
export function saveBestSprintScore(
  uid: string,
  language: SupportedLanguage,
  score: number,
): number {
  const current = readBestSprintScore(uid, language) ?? 0;
  const best = Math.max(current, score);
  if (typeof window === 'undefined') return best;

  try {
    const raw = localStorage.getItem(SCORE_KEY);
    const store: ScoreStore = raw ? JSON.parse(raw) : {};
    store[scoreKey(uid, language)] = best;
    localStorage.setItem(SCORE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
  return best;
}
