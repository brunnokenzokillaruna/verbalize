'use client';

import { ChevronRight } from 'lucide-react';
import { MistakeContextCard } from './MistakeContextCard';
import { MISTAKE_THEME } from './mistakeTheme';
import type { LessonMistakeDocument } from '@/types';

type MistakeReviewIntroProps = {
  mistake: LessonMistakeDocument;
  totalExercises: number;
  onStart: () => void;
  onClose: () => void;
};

export function MistakeReviewIntro({ mistake, totalExercises, onStart, onClose }: MistakeReviewIntroProps) {
  return (
    <div className="flex-1 flex flex-col px-5 py-6 mx-auto max-w-lg w-full gap-6 animate-slide-up-spring">
      <MistakeContextCard mistake={mistake} />

      <div
        className="rounded-2xl border border-border p-5 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
          Como funciona
        </p>
        {[
          { step: '1', text: `${totalExercises} exercícios focados neste ponto gramatical` },
          { step: '2', text: 'A IA gera frases parecidas com o erro original' },
          { step: '3', text: 'Acerte todos para remover o erro do seu perfil' },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-start gap-3">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: MISTAKE_THEME.accent }}
            >
              {step}
            </span>
            <p className="text-sm font-medium text-text-primary leading-snug pt-0.5">{text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 mt-auto">
        <button
          type="button"
          onClick={onStart}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
          style={{
            backgroundColor: MISTAKE_THEME.accent,
            boxShadow: `0 3px 0 ${MISTAKE_THEME.accentDark}`,
          }}
        >
          Começar revisão
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold text-text-muted py-2 cursor-pointer hover:text-text-primary transition-colors"
        >
          Voltar ao perfil
        </button>
      </div>
    </div>
  );
}
