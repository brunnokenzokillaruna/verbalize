'use client';

import { useEffect, useState } from 'react';
import { AudioPlayerButton } from '../../AudioPlayerButton';
import { getVocabImage } from '@/app/actions/getVocabImage';
import { looksCutOff, mentionsVerb } from '@/lib/grammarBridge/textClamp';
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
  const personalityText =
    looksCutOff(personality) || !mentionsVerb(personality, infinitive) ? '' : personality;
  const noteText = looksCutOff(frequencyNote) ? '' : frequencyNote;
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVocabImage(infinitive, meaning, language, [], undefined, {
      translation: meaning,
      acceptBestEffort: true,
    })
      .then((result) => {
        if (!cancelled) setImageUrl(result?.imageUrl ?? null);
      })
      .catch(() => {
        if (!cancelled) setImageUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [infinitive, meaning, language]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 text-center max-w-md mx-auto w-full">
      {imageUrl && (
        <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] opacity-85">
        O Verbo em Destaque
      </span>
      <div className="flex items-center justify-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <h3 className="font-display text-2xl font-black tracking-tight text-[var(--color-primary-dark)]">
            {infinitive}
          </h3>
          <span className="text-sm font-semibold italic text-[var(--color-text-secondary)]">= {meaning}</span>
        </div>
        <AudioPlayerButton text={infinitive} language={language} size="sm" />
      </div>
      {personalityText && (
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] font-medium">{personalityText}</p>
      )}
      {noteText && (
        <div className="flex items-center gap-2 bg-[var(--color-primary-light)]/20 px-3 py-1.5 rounded-xl border border-[var(--color-primary)]/10">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
          <p className="text-xs font-bold text-[var(--color-primary-dark)]">{noteText}</p>
        </div>
      )}
    </div>
  );
}
