'use client';

import { RetentionCheckCard } from '../shared';
import type { QuizStep } from '@/lib/grammarBridgeSteps';

export function QuizStepView({
  step,
  onAnswered,
  onPlaySound,
}: {
  step: QuizStep;
  onAnswered?: (answered: boolean) => void;
  onPlaySound?: (type: 'correct' | 'incorrect') => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 w-full max-w-md mx-auto">
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        Teste rápido
      </span>
      <RetentionCheckCard
        check={step.data}
        onAnswered={onAnswered}
        onPlaySound={onPlaySound}
        feedback={step.feedback}
      />
    </div>
  );
}
