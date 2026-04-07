import React from 'react';
import { GrammarBridgeCard } from './GrammarBridgeCard';
import type { GrammarBridgeResult, SupportedLanguage } from '@/types';

interface LessonGrammarScreenProps {
  bridge: GrammarBridgeResult;
  language: SupportedLanguage;
}

export function LessonGrammarScreen({ bridge, language }: LessonGrammarScreenProps) {
  return (
    <div className="flex flex-col gap-5 animate-slide-up-spring">
      <div className="flex items-center gap-2">
        <span className="text-base">🧠</span>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          Ponte Gramatical
        </p>
      </div>
      <GrammarBridgeCard bridge={bridge} language={language} />
    </div>
  );
}
