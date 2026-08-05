'use client';

import React from 'react';

interface HighlightedTranslationProps {
  text: string;
  /** Character range to emphasise, matching the word being narrated. */
  range?: { start: number; end: number } | null;
  className?: string;
}

/**
 * Renders the fixed PT-BR line translation, emphasising the stretch that
 * corresponds to the word currently being spoken.
 */
export function HighlightedTranslation({
  text,
  range,
  className,
}: HighlightedTranslationProps) {
  const isValid =
    !!range && range.start >= 0 && range.end > range.start && range.end <= text.length;

  if (!isValid) {
    return <p className={className}>{text}</p>;
  }

  return (
    <p className={className}>
      {text.slice(0, range.start)}
      <span
        className="rounded-[0.3rem] px-1 font-bold text-primary transition-colors duration-150"
        style={{ backgroundColor: 'var(--color-primary-light)' }}
      >
        {text.slice(range.start, range.end)}
      </span>
      {text.slice(range.end)}
    </p>
  );
}
