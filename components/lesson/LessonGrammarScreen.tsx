import React from 'react';
import { GrammarBridgeCard } from './GrammarBridgeCard';
import type { GrammarBridgeResult, SupportedLanguage } from '@/types';

interface LessonGrammarScreenProps {
  bridge: GrammarBridgeResult;
  language: SupportedLanguage;
}

export function LessonGrammarScreen({ bridge, language }: LessonGrammarScreenProps) {
  return (
    <div className="flex flex-col gap-6 animate-slide-up-spring">
      <div className="flex flex-col gap-1.5 animate-slide-up">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-base shadow-inner ring-1 ring-white/10 backdrop-blur-md dark:bg-white/5">
            🧠
          </div>
          <div className="flex flex-col">
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Ponte Gramatical
            </h2>
            <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">
              Entenda a lógica por trás
            </p>
          </div>
        </div>
      </div>
      <GrammarBridgeCard bridge={bridge} language={language} />
    </div>
  );
}
