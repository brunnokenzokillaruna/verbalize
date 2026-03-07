'use client';

import { useState } from 'react';

export interface WordClickPayload {
  word: string;
  rect: DOMRect;
}

interface ClickableWordProps {
  word: string;
  isNewVocabulary?: boolean;
  isPunctuation?: boolean;
  onWordClick?: (payload: WordClickPayload) => void;
}

export function ClickableWord({
  word,
  isNewVocabulary = false,
  isPunctuation = false,
  onWordClick,
}: ClickableWordProps) {
  const [ripple, setRipple] = useState(false);

  if (isPunctuation) {
    return <span style={{ color: 'var(--color-text-primary)' }}>{word}</span>;
  }

  function handleClick(e: React.MouseEvent<HTMLSpanElement>) {
    if (!onWordClick) return;
    const rect = e.currentTarget.getBoundingClientRect();

    // Amber ripple flash on click
    setRipple(true);
    setTimeout(() => setRipple(false), 400);

    onWordClick({ word, rect });
  }

  if (isNewVocabulary) {
    return (
      <span
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick(e as never)}
        className="relative inline-block cursor-pointer select-none rounded px-1 transition-colors duration-150"
        style={{
          color: 'var(--color-vocab)',
          backgroundColor: ripple ? 'var(--color-vocab)' : 'var(--color-vocab-bg)',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textDecorationColor: 'var(--color-vocab)',
          textUnderlineOffset: '3px',
          fontWeight: 500,
          transition: 'background-color 0.15s ease',
        }}
        aria-label={`Traduzir: ${word}`}
      >
        {ripple && (
          <span
            className="absolute inset-0 rounded"
            style={{
              backgroundColor: 'var(--color-vocab)',
              opacity: 0.25,
              animation: 'tooltip-enter 400ms ease forwards',
              pointerEvents: 'none',
            }}
          />
        )}
        {word}
      </span>
    );
  }

  // Regular word — still clickable, but no highlight
  return (
    <span
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e as never)}
      className="inline-block cursor-pointer select-none rounded px-0.5 transition-colors duration-100 hover:bg-[var(--color-surface-raised)]"
      style={{ color: 'var(--color-text-primary)' }}
      aria-label={`Traduzir: ${word}`}
    >
      {word}
    </span>
  );
}
