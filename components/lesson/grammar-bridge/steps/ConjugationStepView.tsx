'use client';

import { useState } from 'react';
import { useAudio } from '@/hooks/useAudio';
import { getStudioVoiceName } from '@/lib/voiceConfig';
import { getConjugationAudioText } from '@/utils/conjugationHelper';
import type { ConjugationStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage } from '@/types';

function ConjugationRow({
  pronoun,
  form,
  language,
}: {
  pronoun: string;
  form: string;
  language: SupportedLanguage;
}) {
  const [shown, setShown] = useState(false);
  const { toggle, isPlaying, isLoading } = useAudio(getStudioVoiceName(language));
  const audioText = getConjugationAudioText(pronoun, form, language);

  return (
    <button
      type="button"
      onClick={() => {
        setShown(true);
        toggle(audioText, language);
      }}
      className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-border/60 bg-surface text-left min-h-[44px]"
      aria-expanded={shown}
    >
      <span className="text-xs font-bold text-text-muted uppercase w-11 shrink-0">{pronoun}</span>
      <span className={`flex-1 grammar-body font-bold truncate ${shown ? 'text-primary' : 'text-text-muted tracking-widest'}`}>
        {shown ? form : '···'}
      </span>
      <span className="text-[10px] font-bold uppercase text-text-muted">
        {isLoading ? '…' : isPlaying ? '■' : '▶'}
      </span>
    </button>
  );
}

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
        {partLabel && <p className="text-xs font-bold text-primary uppercase mt-1.5">{partLabel}</p>}
        <p className="grammar-body font-semibold text-text-muted mt-1">{infinitive}</p>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
        {forms.map((c, i) => (
          <ConjugationRow key={i} pronoun={c.pronoun} form={c.form} language={language} />
        ))}
      </div>
    </div>
  );
}
