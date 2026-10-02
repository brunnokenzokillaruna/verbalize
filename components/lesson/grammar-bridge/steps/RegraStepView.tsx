'use client';

import { ArrowRight } from 'lucide-react';
import { AudioPlayerButton } from '../../AudioPlayerButton';
import { GrammarFlagAvatar, stripHighlights, TargetPhrase } from '../shared';
import { RevealOnTap } from '../reveal';
import { resolveRegraContent } from '@/lib/grammarBridge/regraContent';
import type { RegraStep } from '@/lib/grammarBridgeSteps';
import type { LessonTag, SupportedLanguage } from '@/types';
import type { WordClickPayload } from '../../ClickableWord';

interface RegraStepViewProps {
  step: RegraStep;
  language: SupportedLanguage;
  tag?: LessonTag;
  verbInfinitive?: string;
  hideApplyList?: boolean;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
}

function PhrasePair({
  portuguese,
  target,
  language,
  newVocabulary,
  newVerbs,
  onWordClick,
}: {
  portuguese: string;
  target: string;
  language: SupportedLanguage;
  newVocabulary: string[];
  newVerbs: string[];
  onWordClick?: (payload: WordClickPayload) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="p-4 bg-surface-raised/30">
        <div className="flex items-center gap-2 mb-2.5">
          <GrammarFlagAvatar variant="pt-br" className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Português</span>
        </div>
        <TargetPhrase
          text={portuguese}
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
          <AudioPlayerButton text={stripHighlights(target)} language={language} size="sm" />
        </div>
        <TargetPhrase
          text={target}
          language={language}
          newVocabulary={newVocabulary}
          newVerbs={newVerbs}
          onWordClick={onWordClick}
          className="grammar-bridge-phrase font-bold text-text-primary leading-relaxed text-center"
          highlightClassName="bg-primary text-white px-1.5 py-0.5 rounded font-bold"
        />
      </div>
    </div>
  );
}

export function RegraStepView({
  step,
  language,
  tag,
  verbInfinitive,
  hideApplyList = false,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
}: RegraStepViewProps) {
  const { insight, analogy, usageContext, culturalNote, bridge, explanationItems } = step.data;
  const {
    insightText,
    analogyText,
    differenceText,
    visibleItems,
    cultureFirst,
    showRuleReveal,
    showMore,
  } = resolveRegraContent({
    tag,
    verbInfinitive,
    insight,
    analogy,
    usageContext,
    culturalNote,
    difference: bridge?.difference,
    explanationItems,
    hideApplyList,
  });

  if (!bridge) {
    return (
      <div className="flex flex-col gap-4 sm:gap-5 px-1 w-full max-w-lg mx-auto">
        {(insightText || analogyText) && (
          <div className="flex flex-col items-center gap-2 text-center">
            {usageContext && (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-primary/10 text-primary border border-primary/15">
                ✦ {usageContext}
              </span>
            )}
            {insightText && (
              <div className="flex flex-col gap-1">
                <span className="grammar-step-label text-primary">A Sacada Central</span>
                <p className="grammar-secondary font-medium text-text-primary leading-snug max-w-md">{insightText}</p>
              </div>
            )}
            {analogyText && (
              <p className="text-sm text-text-muted italic leading-relaxed max-w-md">{analogyText}</p>
            )}
          </div>
        )}
        {visibleItems.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <span className="grammar-step-label">Como aplicar</span>
            <ol className="flex flex-col gap-2 list-none">
              {visibleItems.map((item, idx) => (
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
            <span className="text-xs font-bold uppercase tracking-wide text-success">🌍 Toque Cultural</span>
            <p className="grammar-secondary text-text-primary mt-1.5">{culturalNote}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5 px-1 w-full max-w-lg mx-auto">
      <PhrasePair
        portuguese={bridge.portuguese}
        target={bridge.target}
        language={language}
        newVocabulary={newVocabulary}
        newVerbs={newVerbs}
        onWordClick={onWordClick}
      />

      {cultureFirst && culturalNote && (
        <RevealOnTap revealKey={`${step.id}-culture`} label="O que isso mostra?">
          {usageContext && (
            <span className="self-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-primary/10 text-primary border border-primary/15">
              ✦ {usageContext}
            </span>
          )}
          {culturalNote && (
            <div className="p-3.5 rounded-xl bg-success/5 border border-success/15">
              <span className="text-xs font-bold uppercase tracking-wide text-success">🌍 Toque Cultural</span>
              <p className="grammar-secondary text-text-primary mt-1.5">{culturalNote}</p>
            </div>
          )}
        </RevealOnTap>
      )}

      {showRuleReveal && (
        <RevealOnTap
          revealKey={`${step.id}-difference`}
          label={differenceText ? 'Qual a diferença?' : 'Qual a sacada?'}
        >
          {differenceText && (
            <div className="rounded-xl border border-border/40 bg-surface-raised/20 px-4 py-3">
              <span className="grammar-step-label block mb-1.5">A diferença</span>
              <p className="grammar-secondary text-text-primary leading-relaxed">{differenceText}</p>
            </div>
          )}
          {insightText && (
            <div className="flex flex-col gap-1 text-center">
              <span className="grammar-step-label text-primary">A Sacada Central</span>
              <p className="grammar-secondary font-medium text-text-primary leading-snug">{insightText}</p>
            </div>
          )}
          {!cultureFirst && usageContext && (
            <span className="self-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-primary/10 text-primary border border-primary/15">
              ✦ {usageContext}
            </span>
          )}
        </RevealOnTap>
      )}

      {showMore && (
        <RevealOnTap revealKey={`${step.id}-more`} label="Ver como aplicar">
          {analogyText && (
            <p className="text-sm text-text-muted italic leading-relaxed text-center">{analogyText}</p>
          )}
          {visibleItems.length > 0 && (
            <ol className="flex flex-col gap-2 list-none">
              {visibleItems.map((item, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-text-secondary leading-relaxed">
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          )}
          {!cultureFirst && culturalNote && (
            <div className="p-3.5 rounded-xl bg-success/5 border border-success/15">
              <span className="text-xs font-bold uppercase tracking-wide text-success">🌍 Toque Cultural</span>
              <p className="grammar-secondary text-text-primary mt-1.5">{culturalNote}</p>
            </div>
          )}
        </RevealOnTap>
      )}
    </div>
  );
}
