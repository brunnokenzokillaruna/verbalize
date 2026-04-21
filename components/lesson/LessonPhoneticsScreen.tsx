'use client';

import { Mic, AlertTriangle } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import type { PhoneticsTipResult, SupportedLanguage } from '@/types';

interface LessonPhoneticsScreenProps {
  tip: PhoneticsTipResult;
  language: SupportedLanguage;
  grammarFocus: string;
}

export function LessonPhoneticsScreen({ tip, language, grammarFocus }: LessonPhoneticsScreenProps) {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}
        >
          <Mic size={22} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#ea580c' }}>
            Guia Fonético
          </p>
          <h2 className="text-xl font-black leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            {tip.title}
          </h2>
        </div>
      </div>

      {/* Topic pill */}
      <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
        📚 {grammarFocus}
      </p>

      {/* Brazilian Trap warning */}
      <div
        className="flex gap-3 rounded-2xl p-4"
        style={{
          backgroundColor: '#fff7ed',
          border: '2px solid #fed7aa',
        }}
      >
        <AlertTriangle size={20} className="shrink-0 mt-0.5" style={{ color: '#ea580c' }} />
        <div>
          <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: '#ea580c' }}>
            ⚠️ Armadilha Brasileira
          </p>
          <p className="text-sm font-medium leading-relaxed" style={{ color: '#7c2d12' }}>
            {tip.brazilianTrap}
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
        }}
      >
        <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Como funciona
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
          {tip.explanation}
        </p>
      </div>

      {/* Pronunciation examples */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Como pronunciar
        </p>
        {tip.examples.map((ex, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl p-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-border)',
            }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>
                  {ex.word}
                </span>
                <span
                  className="text-sm font-bold px-2.5 py-0.5 rounded-lg"
                  style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}
                >
                  🗣️ {ex.soundsLike}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                💡 {ex.tip}
              </p>
            </div>
            <AudioPlayerButton text={ex.word} language={language} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
