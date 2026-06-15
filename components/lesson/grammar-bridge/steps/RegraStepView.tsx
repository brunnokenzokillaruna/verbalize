'use client';

import { ArrowRight } from 'lucide-react';
import { AudioPlayerButton } from '../../AudioPlayerButton';
import { HighlightedText, stripHighlights, TargetPhrase } from '../shared';
import { LanguageFlag } from '@/components/LanguageFlag';
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
    <div className="flex flex-col gap-4 px-1 w-full max-w-md mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        {usageContext && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--color-primary-light)]/30 text-[var(--color-primary)] border border-[var(--color-primary)]/15">
            ✦ {usageContext}
          </span>
        )}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white text-xl shadow-md">
          💡
        </div>
        {(insight || usageContext) && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-primary)]">
              A Sacada Central
            </span>
            <p className="font-display text-base font-bold leading-snug text-[var(--color-text-primary)]">
              {insight || usageContext}
            </p>
          </div>
        )}
      </div>

      {bridge && (
        <div className="flex flex-col rounded-2xl ring-1 ring-[var(--color-border)] shadow-sm">
          <div className="p-3.5 bg-[var(--color-surface-raised)]/20 border-b border-[var(--color-border)]/50">
            <span className="text-[9px] font-black text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 block">
              PT-BR
            </span>
            <p className="text-sm font-semibold italic text-[var(--color-text-secondary)] leading-relaxed">
              <HighlightedText
                text={bridge.portuguese}
                className="text-[var(--color-primary)] font-black not-italic underline underline-offset-4 decoration-[var(--color-primary)]/40"
              />
            </p>
          </div>
          <div className="flex items-center justify-center py-0.5 text-[var(--color-text-muted)]">
            <ArrowRight size={12} className="rotate-90" />
          </div>
          <div className="p-3.5 bg-[var(--color-primary-light)]/10 rounded-b-2xl">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-wider">
              <LanguageFlag language={language} size="xs" />
              </span>
              <AudioPlayerButton text={stripHighlights(bridge.target)} language={language} size="sm" />
            </div>
            <TargetPhrase
              text={bridge.target}
              language={language}
              newVocabulary={newVocabulary}
              newVerbs={newVerbs}
              onWordClick={onWordClick}
              className="font-display text-sm font-black text-[var(--color-primary-dark)] leading-relaxed text-center"
              highlightClassName="bg-[var(--color-primary)] text-white px-1.5 py-0.5 rounded font-bold"
            />
          </div>
          {bridge.difference && (
            <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)] font-medium px-3.5 py-2 border-t border-[var(--color-border)]/40 flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shrink-0 mt-1.5" />
              {bridge.difference}
            </p>
          )}
        </div>
      )}

      {explanationItems.length > 0 && (
        <ol className="flex flex-col gap-2 list-none pl-1">
          {explanationItems.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary-light)]/30 text-[9px] font-black text-[var(--color-primary)]">
                {idx + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )}

      {culturalNote && (
        <div className="p-3 rounded-xl bg-[var(--color-success-light)]/10 border border-[var(--color-success)]/10">
          <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-success)]">
            🌍 Toque Cultural
          </span>
          <p className="text-xs font-semibold text-[var(--color-text-primary)] mt-1">{culturalNote}</p>
        </div>
      )}
    </div>
  );
}
