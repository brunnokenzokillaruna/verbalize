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
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-[var(--color-border)]"
          style={{ backgroundColor: 'var(--color-vocab-bg)', color: 'var(--color-vocab)' }}
        >
          <Mic size={24} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: 'var(--color-vocab)' }}>
            Guia Fonético
          </p>
          <h2 className="text-2xl font-black leading-tight tracking-tight mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
            {tip.title}
          </h2>
        </div>
      </div>

      {/* Topic pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] w-fit">
        <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
          Foco: {grammarFocus}
        </span>
      </div>

      {/* Brazilian Trap warning */}
      <div
        className="flex gap-4 rounded-2xl p-5 border-2 shadow-sm transition-all animate-slide-up-spring"
        style={{
          backgroundColor: 'var(--color-vocab-bg)',
          borderColor: 'var(--color-vocab)',
          borderStyle: 'dashed',
          opacity: 0.95
        }}
      >
        <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
          <AlertTriangle size={22} style={{ color: 'var(--color-vocab)' }} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-1.5 flex items-center gap-2" style={{ color: 'var(--color-vocab)' }}>
            Armadilha Brasileira
          </p>
          <p className="text-[15px] font-medium leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
            {tip.brazilianTrap}
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div
        className="rounded-2xl p-6 shadow-sm border"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-4 rounded-full bg-[var(--color-primary)]" />
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            Como funciona
          </p>
        </div>
        <p className="text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
          {tip.explanation}
        </p>
      </div>

      {/* Pronunciation examples */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-4 rounded-full bg-[var(--color-vocab)]" />
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            Exemplos na prática
          </p>
        </div>
        
        {tip.examples.map((ex, i) => (
          <div
            key={i}
            className="group flex items-center gap-4 rounded-2xl p-5 border shadow-sm transition-all hover:border-[var(--color-primary)] hover:shadow-md"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className="text-xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                  {ex.word}
                </span>
                <span
                  className="text-xs font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5"
                  style={{ 
                    backgroundColor: 'var(--color-surface-raised)', 
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-vocab)'
                  }}
                >
                  <span className="opacity-70">SOUA COMO:</span>
                  <span className="font-mono">{ex.soundsLike.toUpperCase()}</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] italic border-l-2 pl-3" style={{ borderColor: 'var(--color-border)' }}>
                {ex.tip}
              </p>
            </div>
            <AudioPlayerButton text={ex.word} language={language} size="md" />
          </div>
        ))}
      </div>
    </div>
  );
}
