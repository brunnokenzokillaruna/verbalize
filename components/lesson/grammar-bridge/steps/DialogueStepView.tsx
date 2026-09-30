'use client';

import { LessonSceneBanner } from '../../LessonSceneBanner';
import { AudioPlayerButton } from '../../AudioPlayerButton';
import { GrammarFlagAvatar, TargetPhrase } from '../shared';
import type { DialogueStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage, VocabImageResult } from '@/types';
import type { WordClickPayload } from '../../ClickableWord';

interface DialogueStepViewProps {
  step: DialogueStep;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  sceneImage?: VocabImageResult | null;
  onWordClick?: (payload: WordClickPayload) => void;
}

export function DialogueStepView({
  step,
  language,
  newVocabulary = [],
  newVerbs = [],
  sceneImage = null,
  onWordClick,
}: DialogueStepViewProps) {
  const { target, portuguese } = step.data;

  return (
    <div className="flex flex-col gap-4 px-1 w-full max-w-lg mx-auto">
      <div className="flex flex-col gap-1 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          Frase Real do Diálogo
        </span>
        <p className="text-[10px] text-[var(--color-text-muted)] italic">Do diálogo que você acabou de ouvir</p>
      </div>

      {sceneImage?.imageUrl && (
        <div className="h-24 overflow-hidden rounded-xl">
          <LessonSceneBanner sceneImage={sceneImage} className="h-24 sm:h-24 rounded-xl" />
        </div>
      )}

      <div className="flex items-start gap-2.5">
        <GrammarFlagAvatar variant="target" language={language} />
        <div
          className="min-w-0 flex-1 rounded-2xl rounded-tl-md border px-3.5 py-3"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <TargetPhrase
              text={target}
              language={language}
              newVocabulary={newVocabulary}
              newVerbs={newVerbs}
              onWordClick={onWordClick}
              className="grammar-body font-semibold text-text-primary text-left leading-relaxed"
            />
            <AudioPlayerButton text={target} language={language} size="sm" />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2.5 flex-row-reverse ml-auto w-full max-w-[92%]">
        <GrammarFlagAvatar variant="pt-br" />
        <div className="min-w-0 flex-1 rounded-2xl rounded-tr-md border border-border bg-surface px-3.5 py-3">
          <p className="grammar-secondary text-left">{portuguese}</p>
        </div>
      </div>
    </div>
  );
}
