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
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] border-b-[3px] shadow-sm"
          style={{ backgroundColor: 'var(--color-vocab-bg)', color: 'var(--color-vocab)' }}
        >
          <Mic size={22} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: 'var(--color-vocab)' }}>
            Guia Fonético
          </p>
          <h2 className="font-serif text-2xl font-black italic tracking-tight text-[var(--color-text-primary)] mt-0.5">
            {tip.title}
          </h2>
        </div>
      </div>

      {/* Topic pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] border-b-[2px] w-fit shadow-sm">
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
          <p className="text-[15px] font-semibold leading-relaxed text-[var(--color-text-primary)]">
            {tip.brazilianTrap}
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div
        className="rounded-2xl p-5 border border-[var(--color-border)] border-b-[3px] bg-[var(--color-surface)] shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-4 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" />
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            Como funciona
          </p>
        </div>
        <p className="text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
          {tip.explanation}
        </p>
      </div>

      {/* Pronunciation examples */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-4 rounded-full bg-[var(--color-vocab)] shadow-[0_0_8px_var(--color-vocab)]" />
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            Exemplos na prática
          </p>
        </div>
        
        {tip.examples.map((ex, i) => (
          <div
            key={i}
            className="group flex items-center gap-4 rounded-2xl p-5 border border-[var(--color-border)] border-b-[4px] shadow-sm transition-all duration-150 hover:translate-y-[1px] hover:border-b-[3px] active:translate-y-[2px] active:border-b-[1px] bg-[var(--color-surface)]"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2.5">
                <span className="font-serif text-xl font-black italic tracking-tight text-[var(--color-text-primary)]">
                  {ex.word}
                </span>
                <span
                  className="text-[9px] font-black px-2.5 py-1 rounded-lg border border-[var(--color-border)] border-b-[2px] bg-[var(--color-surface-raised)] text-[var(--color-vocab)] flex items-center gap-1.5"
                >
                  <span className="opacity-70 uppercase tracking-wider">SOUA COMO:</span>
                  <span className="font-mono bg-[var(--color-vocab-bg)] px-1 rounded">{ex.soundsLike.toUpperCase()}</span>
                </span>
              </div>
              <p className="text-xs font-medium leading-relaxed text-[var(--color-text-secondary)] italic border-l-2 pl-3 border-[var(--color-border)]">
                {ex.tip}
              </p>
            </div>
            <div className="shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95">
              <AudioPlayerButton text={ex.word} language={language} size="md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
