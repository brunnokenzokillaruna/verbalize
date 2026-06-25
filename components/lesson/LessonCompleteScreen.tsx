import React from 'react';
import { Trophy } from 'lucide-react';
import { ProductionWeekStat } from '@/components/lesson/ProductionWeekStat';
import type { WeeklyProductionBreakdown } from '@/lib/productionStatsHelpers';

interface LessonCompleteScreenProps {
  totalExercises: number;
  correctExercises: number;
  newVocabulary: string[];
  weeklyProduction?: WeeklyProductionBreakdown;
  onExit: () => void;
}

export function LessonCompleteScreen({
  totalExercises,
  correctExercises,
  newVocabulary,
  weeklyProduction,
  onExit,
}: LessonCompleteScreenProps) {
  const pct = totalExercises > 0 ? Math.min(Math.round((correctExercises / totalExercises) * 100), 100) : 100;
  const isPerfect = pct === 100;

  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center gap-7 px-5 py-12 overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Background glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(29,94,212,0.4) 0%, transparent 70%)' }}
        />
        {isPerfect && (
          <div
            className="absolute bottom-1/4 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full blur-3xl opacity-25"
            style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.5) 0%, transparent 70%)' }}
          />
        )}
      </div>

      {/* Trophy icon */}
      <div className="relative animate-scale-in">
        <div
          className="flex h-28 w-28 items-center justify-center rounded-3xl border-2 border-b-[6px] shadow-lg"
          style={{
            background: isPerfect
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : 'linear-gradient(135deg, var(--color-primary), #2563eb)',
            borderColor: isPerfect ? '#f59e0b' : '#3b82f6',
            borderBottomColor: 'rgba(0, 0, 0, 0.35)',
            boxShadow: isPerfect
              ? '0 12px 40px rgba(217,119,6,0.3)'
              : '0 12px 40px rgba(29,94,212,0.3)',
          }}
        >
          <Trophy size={48} color="white" />
        </div>
        {isPerfect && (
          <span className="absolute -top-2 -right-2 text-2xl animate-bounce">⭐</span>
        )}
      </div>

      {/* Score */}
      <div className="text-center animate-slide-up delay-75">
        <h1 className="font-serif text-3xl font-black italic tracking-tight text-[var(--color-text-primary)]">
          {isPerfect ? 'Desempenho Perfeito!' : 'Lição Concluída!'}
        </h1>
        
        <div className="mt-3.5 flex items-baseline justify-center gap-1.5">
          <span
            className="font-serif text-5xl font-black italic"
            style={{ color: isPerfect ? 'var(--color-vocab)' : 'var(--color-primary)' }}
          >
            {pct}%
          </span>
          <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">de acerto</span>
        </div>
        
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {Math.min(correctExercises, totalExercises)} de {totalExercises} exercícios corretos
        </p>

        {pct >= 80 && (
          <div
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest border animate-slide-up"
            style={{
              backgroundColor: 'rgba(16,185,129,0.06)',
              color: 'var(--color-success)',
              borderColor: 'rgba(16,185,129,0.2)',
              borderBottomWidth: '3px',
              borderBottomColor: 'var(--color-success)',
              animationDelay: '400ms',
              animationFillMode: 'both'
            }}
          >
            <span className="text-xs">✨</span>
            Isento de revisão por excelência
          </div>
        )}
      </div>

      {/* Score bar */}
      <div className="w-full max-w-xs animate-slide-up delay-150 rounded-full border border-[var(--color-border)] p-[3px] bg-[var(--color-surface-raised)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="h-3 w-full rounded-full overflow-hidden bg-black/5 dark:bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              width: `${pct}%`,
              background: isPerfect
                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                : 'linear-gradient(90deg, var(--color-primary), #60a5fa)',
            }}
          />
        </div>
      </div>

      {weeklyProduction && <ProductionWeekStat breakdown={weeklyProduction} />}

      {/* Learned words passport box */}
      {newVocabulary.length > 0 && (
        <div
          className="w-full max-w-sm rounded-2xl p-5 border border-[var(--color-border)] border-b-[4px] bg-[var(--color-surface)] shadow-md animate-slide-up delay-225"
        >
          <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] border-b border-[var(--color-border)]/50 pb-2 flex justify-between items-center">
            <span>Vocabulário Adquirido</span>
            <span className="bg-[var(--color-vocab-bg)] text-[var(--color-vocab)] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">{newVocabulary.length} palavras</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {newVocabulary.map((w) => (
              <span
                key={w}
                className="rounded-xl px-3 py-1.5 text-sm font-bold border border-b-[2px] transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--color-vocab-bg)',
                  borderColor: 'rgba(217,119,6,0.25)',
                  borderBottomColor: 'var(--color-vocab)',
                  color: 'var(--color-vocab)',
                }}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="w-full max-w-sm animate-slide-up delay-300">
        <button
          type="button"
          onClick={onExit}
          className="cta-shimmer relative flex w-full items-center justify-center rounded-2xl py-4 text-base font-bold text-white transition-all duration-100 active:translate-y-[2px] active:border-b-[2px] border border-b-[4px]"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
            borderBottomColor: 'rgba(0, 0, 0, 0.35)',
            boxShadow: '0 8px 24px rgba(29,94,212,0.3)',
          }}
        >
          Retornar ao Painel
        </button>
      </div>
    </div>
  );
}
