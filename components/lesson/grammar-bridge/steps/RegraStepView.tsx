'use client';

import { ArrowRight } from 'lucide-react';
import { AudioPlayerButton } from '../../AudioPlayerButton';
import { GrammarFlagAvatar, stripHighlights, TargetPhrase } from '../shared';
import type { RegraStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage } from '@/types';
import type { WordClickPayload } from '../../ClickableWord';

interface RegraStepViewProps {
  step: RegraStep;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
}

export function RegraStepView({
  step,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
}: RegraStepViewProps) {
  const { insight, usageContext, culturalNote, bridge, explanationItems } = step.data;

  return (
    <div className="flex flex-col gap-4 sm:gap-5 px-1 w-full max-w-lg mx-auto">
      {(usageContext || insight) && (
        <div className="flex flex-col items-center gap-2 text-center">
          {usageContext && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-primary/10 text-primary border border-primary/15">
              ✦ {usageContext}
            </span>
          )}
          {insight && (
            <div className="flex flex-col gap-1">
              <span className="grammar-step-label text-primary">A Sacada Central</span>
              <p className="grammar-secondary font-medium text-text-primary leading-snug max-w-md">
                {insight}
              </p>
            </div>
          )}
        </div>
      )}

      {bridge && (
        <div className="flex flex-col rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-4 bg-surface-raised/30">
            <div className="flex items-center gap-2 mb-2.5">
              <GrammarFlagAvatar variant="pt-br" className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="text-xs font-bold uppercase tracking-wide text-text-muted">
                Português
              </span>
            </div>
            <TargetPhrase
              text={bridge.portuguese}
              language={language}
              className="grammar-bridge-phrase font-bold text-text-primary leading-relaxed text-center"
              highlightClassName="text-primary font-bold not-italic bg-primary/10 px-1 py-0.5 rounded"
            />
          </div>

          <div className="flex items-center justify-center py-1.5 text-text-muted border-y border-border/40">
            <ArrowRight size={14} className="rotate-90" />
          </div>

          <div
            className="p-4"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary-light) 35%, transparent)' }}
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <GrammarFlagAvatar variant="target" language={language} className="h-7 w-7 sm:h-8 sm:w-8" />
                <span className="text-xs font-bold uppercase tracking-wide text-primary">
                  {language === 'fr' ? 'Francês' : 'Inglês'}
                </span>
              </div>
              <AudioPlayerButton text={stripHighlights(bridge.target)} language={language} size="sm" />
            </div>
            <TargetPhrase
              text={bridge.target}
              language={language}
              newVocabulary={newVocabulary}
              newVerbs={newVerbs}
              onWordClick={onWordClick}
              className="grammar-bridge-phrase font-bold text-text-primary leading-relaxed text-center"
              highlightClassName="bg-primary text-white px-1.5 py-0.5 rounded font-bold"
            />
          </div>

          {bridge.difference && (
            <div className="px-4 py-3 border-t border-border/40 bg-surface-raised/20">
              <span className="grammar-step-label block mb-1.5">A diferença</span>
              <p className="grammar-secondary text-text-primary leading-relaxed">{bridge.difference}</p>
            </div>
          )}
        </div>
      )}

      {explanationItems.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="grammar-step-label">Como aplicar</span>
          <ol className="flex flex-col gap-2 list-none">
            {explanationItems.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-text-secondary leading-relaxed">
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {culturalNote && (
        <div className="p-3.5 rounded-xl bg-success/5 border border-success/15">
          <span className="text-xs font-bold uppercase tracking-wide text-success">
            🌍 Toque Cultural
          </span>
          <p className="grammar-secondary text-text-primary mt-1.5">{culturalNote}</p>
        </div>
      )}
    </div>
  );
}
