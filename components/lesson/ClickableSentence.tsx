'use client';

import { ClickableWord, type WordClickPayload } from './ClickableWord';

interface ClickableSentenceProps {
  text: string;
  /** Words that should be highlighted as new vocabulary */
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
  className?: string;
}

const PUNCTUATION_RE = /([.,!?;:»«\u201c\u201d\u2018\u2019"'()[\]{}])/;

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
  className = '',
}: ClickableSentenceProps) {
  type Token =
    | { type: 'space'; value: string }
    | { type: 'punct'; value: string }
    | { type: 'word'; value: string };

  // Tokenize: split on spaces but keep punctuation attached for analysis
  const tokens = text.split(/(\s+)/).flatMap((token): Token[] => {
    if (/^\s+$/.test(token)) return [{ type: 'space', value: token }];
    // Split punctuation away from the word
    const parts = token.split(PUNCTUATION_RE).filter(Boolean);
    return parts.map((p): Token =>
      PUNCTUATION_RE.test(p)
        ? { type: 'punct', value: p }
        : { type: 'word', value: p },
    );
  });

  return (
    <p
      className={`lesson-text leading-[1.9] ${className}`}
      style={{ color: 'var(--color-text-primary)' }}
    >
      {tokens.map((token, i) => {
        if (token.type === 'space') {
          return <span key={i}>{token.value}</span>;
        }
        if (token.type === 'punct') {
          return (
            <ClickableWord key={i} word={token.value} isPunctuation />
          );
        }
        const clean = token.value.replace(/[.,!?;:]/g, '');
        return (
          <ClickableWord
            key={i}
            word={token.value}
            isNewVocabulary={matchesVocab(clean, newVocabulary)}
            isNewVerb={matchesVocab(clean, newVerbs)}
            onWordClick={onWordClick}
          />
        );
      })}
    </p>
  );
}
