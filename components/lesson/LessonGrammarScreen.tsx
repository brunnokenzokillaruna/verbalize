import React from 'react';
import { GrammarBridgeFlow } from './grammar-bridge/GrammarBridgeFlow';
import type { GrammarBridgeResult, LessonTag, SupportedLanguage } from '@/types';
import type { WordClickPayload } from './ClickableWord';

interface LessonGrammarScreenProps {
  bridge: GrammarBridgeResult;
  language: SupportedLanguage;
  tag?: LessonTag;
  grammarFocus?: string;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
  onComplete?: (complete: boolean) => void;
  onAdvanceToPractice?: () => void;
  onQuizCorrect?: (correct: boolean) => void;
}

export function LessonGrammarScreen({
  bridge,
  language,
  tag,
  grammarFocus,
  newVocabulary,
  newVerbs,
  onWordClick,
  onComplete,
  onAdvanceToPractice,
  onQuizCorrect,
}: LessonGrammarScreenProps) {
  return (
    <div className="flex flex-col gap-6 animate-slide-up-spring">
      <div className="flex flex-col gap-1.5 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] border-b-[3px] text-lg shadow-sm">
            🧠
          </div>
          <div className="flex flex-col">
            <h2 className="font-serif text-2xl font-black italic tracking-tight text-[var(--color-text-primary)]">
              Ponte Gramatical
            </h2>
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] mt-0.5">
              {grammarFocus ? grammarFocus : 'Entenda a lógica por trás'}
            </p>
          </div>
        </div>
      </div>
      <GrammarBridgeFlow
        bridge={bridge}
        language={language}
        tag={tag}
        newVocabulary={newVocabulary}
        newVerbs={newVerbs}
        onWordClick={onWordClick}
        onComplete={onComplete}
        onAdvanceToPractice={onAdvanceToPractice}
        onQuizCorrect={onQuizCorrect}
      />
    </div>
  );
}
