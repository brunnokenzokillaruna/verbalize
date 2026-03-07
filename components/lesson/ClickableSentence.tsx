'use client';

import { ClickableWord, type WordClickPayload } from './ClickableWord';

interface ClickableSentenceProps {
  text: string;
  /** Words that should be highlighted as new vocabulary */
  newVocabulary?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
  className?: string;
}

const PUNCTUATION_RE = /([.,!?;:»«"'()[\]{}])/;

/**
 * Splits a sentence into individual ClickableWord tokens.
 * Handles punctuation as non-clickable separators.
 */
export function ClickableSentence({
  text,
  newVocabulary = [],
  onWordClick,
  className = '',
}: ClickableSentenceProps) {
  const vocabSet = new Set(newVocabulary.map((w) => w.toLowerCase()));

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
        const clean = token.value.toLowerCase().replace(/[.,!?;:]/g, '');
        return (
          <ClickableWord
            key={i}
            word={token.value}
            isNewVocabulary={vocabSet.has(clean)}
            onWordClick={onWordClick}
          />
        );
      })}
    </p>
  );
}
