'use client';

import { useCallback, useEffect, useRef } from 'react';

const SWIPE_THRESHOLD = 50;

export function useGrammarSwipe(
  onPrev: () => void,
  onNext: () => void,
  canPrev: boolean,
  canNext: boolean,
) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      touchStart.current = null;

      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

      if (dx < 0 && canNext) onNext();
      else if (dx > 0 && canPrev) onPrev();
    },
    [canNext, canPrev, onNext, onPrev],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && canNext) onNext();
      if (e.key === 'ArrowLeft' && canPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canNext, canPrev, onNext, onPrev]);

  return { onTouchStart, onTouchEnd };
}
