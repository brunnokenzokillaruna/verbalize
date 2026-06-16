'use client';

import { AudioPlayerButton } from '../../AudioPlayerButton';
import { getConjugationAudioText } from '@/utils/conjugationHelper';
import type { ConjugationStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage } from '@/types';

export function ConjugationStepView({
  step,
  language,
}: {
  step: ConjugationStep;
  language: SupportedLanguage;
}) {
  const { infinitive, forms, partLabel } = step.data;

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-1 w-full max-w-lg mx-auto">
      <div className="text-center">
        <span className="grammar-step-label">Conjugação — Presente</span>
        {partLabel && (
          <p className="text-xs font-bold text-primary uppercase mt-1.5">{partLabel}</p>
        )}
        <p className="grammar-body font-semibold text-text-muted mt-1">{infinitive}</p>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
        {forms.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-border/60 bg-surface"
          >
            <span className="text-xs font-bold text-text-muted uppercase w-11 shrink-0">
              {c.pronoun}
            </span>
            <span className="flex-1 grammar-body font-bold text-primary truncate">{c.form}</span>
            <AudioPlayerButton
              text={getConjugationAudioText(c.pronoun, c.form, language)}
              language={language}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
