'use client';

import { ClickableWord, type WordClickPayload } from './ClickableWord';
import { tokenizeNarratedText } from '@/lib/dialogueNarration';

interface ClickableSentenceProps {
  text: string;
  /** Words that should be highlighted as new vocabulary */
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
  narratedRange?: { start: number; end: number } | null;
  className?: string;
}

/** Strip diacritics so e.g. "achète" and "achete" compare equal. */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Checks whether a dialogue token matches a vocabulary word.
 * Uses stem-based matching to handle verb conjugations and noun plurals.
 * E.g. vocab "manger" matches dialogue token "mange" or "mangeons".
 */
function matchesVocab(token: string, vocabWords: string[]): boolean {
  const normToken = normalize(token);
  for (const vocab of vocabWords) {
    const normVocab = normalize(vocab);
    // Exact match
    if (normToken === normVocab) return true;
    // Stem match: check if both share a common prefix that is long enough
    // to avoid false positives (min 3 chars, or full word if shorter).
    const stemLen = Math.max(3, normVocab.length - 2);
    const stem = normVocab.slice(0, stemLen);
    if (stem.length >= 3 && normToken.length >= stem.length && normToken.startsWith(stem)) {
      return true;
    }
  }
  return false;
}

/**
 * Splits a sentence into individual ClickableWord tokens.
 * Handles punctuation as non-clickable separators.
 */
export function ClickableSentence({
  text,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
  narratedRange = null,
  className = '',
}: ClickableSentenceProps) {
  type Token =
    | { type: 'separator'; value: string; start: number; end: number }
    | { type: 'word'; value: string; start: number; end: number };

  const tokens: Token[] = [];
  let cursor = 0;
  for (const word of tokenizeNarratedText(text)) {
    if (word.start > cursor) {
      tokens.push({
        type: 'separator',
        value: text.slice(cursor, word.start),
        start: cursor,
        end: word.start,
      });
    }
    tokens.push({ type: 'word', value: word.text, start: word.start, end: word.end });
    cursor = word.end;
  }
  if (cursor < text.length) {
    tokens.push({
      type: 'separator',
      value: text.slice(cursor),
      start: cursor,
      end: text.length,
    });
  }

  return (
    <p
      className={`lesson-text leading-[1.9] ${className}`}
      style={{ color: 'var(--color-text-primary)' }}
    >
      {tokens.map((token, i) => {
        if (token.type === 'separator') {
          return <span key={i}>{token.value}</span>;
        }
        const clean = token.value.replace(/\*+/g, '');
        const displayWord = token.value.replace(/\*+/g, '');
        const isNarrating =
          !!narratedRange &&
          token.start < narratedRange.end &&
          token.end > narratedRange.start;
        return (
          <ClickableWord
            key={i}
            word={displayWord}
            isNewVocabulary={matchesVocab(clean, newVocabulary)}
            isNewVerb={matchesVocab(clean, newVerbs)}
            isNarrating={isNarrating}
            onWordClick={onWordClick}
          />
        );
      })}
    </p>
  );
}
