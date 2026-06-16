'use client';

import { AudioPlayerButton } from '../../AudioPlayerButton';
import { GrammarFlagAvatar, TargetPhrase } from '../shared';
import type { TransferStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage } from '@/types';
import type { WordClickPayload } from '../../ClickableWord';

interface TransferStepViewProps {
  step: TransferStep;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
}

export function TransferStepView({
  step,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
}: TransferStepViewProps) {
  const { target, portuguese } = step.data;

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mx-auto px-1">
      <div className="text-center">
        <span className="grammar-step-label">Generalize</span>
        <p className="grammar-secondary mt-2 max-w-sm mx-auto">
          A mesma regra vale com outras palavras — veja como soa na prática:
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <GrammarFlagAvatar variant="target" language={language} />
          <div
            className="min-w-0 flex-1 rounded-2xl rounded-tl-md border px-3.5 py-3 sm:px-4 sm:py-3.5"
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
              <div className="shrink-0">
                <AudioPlayerButton text={target} language={language} size="sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5 sm:gap-3 flex-row-reverse ml-auto w-full max-w-[calc(100%-0.5rem)] sm:max-w-[92%]">
          <GrammarFlagAvatar variant="pt-br" />
          <div className="min-w-0 flex-1 rounded-2xl rounded-tr-md border border-border bg-surface px-3.5 py-3 sm:px-4 sm:py-3.5">
            <p className="grammar-secondary text-left">{portuguese}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
