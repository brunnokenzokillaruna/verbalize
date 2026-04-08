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
        className="relative inline-block cursor-pointer select-none rounded-[4px] px-1 transition-all duration-200"
        style={{
          color: 'var(--color-vocab)',
          borderBottom: `1.5px solid ${ripple ? 'var(--color-vocab)' : 'rgba(217, 119, 6, 0.25)'}`,
          fontWeight: 600,
          backgroundColor: ripple ? 'var(--color-vocab-bg)' : 'transparent',
        }}
        aria-label={`Traduzir: ${word}`}
      >
        {ripple && (
          <span
            className="absolute inset-0 rounded-[4px]"
            style={{
              backgroundColor: 'var(--color-vocab)',
              opacity: 0.1,
              animation: 'fade-in 400ms ease forwards',
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
