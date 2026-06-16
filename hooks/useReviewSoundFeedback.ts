import { useCallback } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export function useReviewSoundFeedback() {
  const { play } = useSoundEffects();

  const playAnswer = useCallback(
    (correct: boolean) => {
      play(correct ? 'correct' : 'incorrect');
    },
    [play],
  );

  const playSessionComplete = useCallback(
    (pct: number) => {
      if (pct >= 90) play('perfect');
      else if (pct >= 70) play('complete');
      else play('session-end');
    },
    [play],
  );

  const playTap = useCallback(() => {
    play('tap');
  }, [play]);

  const playCombo = useCallback(
    (streak: number) => {
      play('combo', { comboLevel: Math.min(Math.max(streak, 1), 5) });
    },
    [play],
  );

  return { playAnswer, playSessionComplete, playTap, playCombo, play };
}
