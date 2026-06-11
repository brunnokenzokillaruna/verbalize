'use client';

import { Sparkles } from 'lucide-react';
import { AudioPlayerButton } from '../../AudioPlayerButton';
import type { VerbIntroStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage } from '@/types';

export function VerbIntroStepView({
  step,
  language,
}: {
  step: VerbIntroStep;
  language: SupportedLanguage;
}) {
  const { infinitive, meaning, personality, frequencyNote } = step.data;

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 text-center max-w-md mx-auto">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/15">
        <Sparkles size={22} strokeWidth={2.5} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] opacity-85">
        O Verbo em Destaque
      </span>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center gap-3">
          <h3 className="font-display text-2xl font-black tracking-tight text-[var(--color-primary-dark)]">
            {infinitive}
          </h3>
          <AudioPlayerButton text={infinitive} language={language} size="sm" />
        </div>
        <span className="text-sm font-semibold italic text-[var(--color-text-secondary)]">
          = {meaning}
        </span>
      </div>
      {personality && (
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] font-medium">
          {personality}
        </p>
      )}
      {frequencyNote && (
        <div className="flex items-center gap-2 bg-[var(--color-primary-light)]/20 px-3 py-1.5 rounded-xl border border-[var(--color-primary)]/10">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
          <p className="text-xs font-bold text-[var(--color-primary-dark)]">{frequencyNote}</p>
        </div>
      )}
    </div>
  );
}
