import React from 'react';
import { Trophy } from 'lucide-react';

interface LessonCompleteScreenProps {
  totalExercises: number;
  correctExercises: number;
  newVocabulary: string[];
  onExit: () => void;
}

export function LessonCompleteScreen({
  totalExercises,
  correctExercises,
  newVocabulary,
  onExit,
}: LessonCompleteScreenProps) {
  const pct = totalExercises > 0 ? Math.round((correctExercises / totalExercises) * 100) : 100;
  const isPerfect = pct === 100;

  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center gap-6 px-5 py-12 overflow-hidden"
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
          className="flex h-24 w-24 items-center justify-center rounded-3xl animate-glow-amber"
          style={{
            background: isPerfect
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : 'linear-gradient(135deg, var(--color-primary), #2563eb)',
            boxShadow: isPerfect
              ? '0 12px 40px rgba(217,119,6,0.4)'
              : '0 12px 40px rgba(29,94,212,0.4)',
          }}
        >
          <Trophy size={44} color="white" />
        </div>
        {isPerfect && (
          <span className="absolute -top-2 -right-2 text-2xl animate-bounce">⭐</span>
        )}
      </div>

      {/* Score */}
      <div className="text-center animate-slide-up delay-75">
        <h1 className="font-display text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {isPerfect ? 'Perfeito!' : 'Lição concluída!'}
        </h1>
        <div className="mt-3 flex items-baseline justify-center gap-1">
          <span
            className="font-display text-5xl font-bold"
            style={{ color: isPerfect ? 'var(--color-vocab)' : 'var(--color-primary)' }}
          >
            {pct}%
          </span>
          <span className="text-lg font-medium" style={{ color: 'var(--color-text-muted)' }}>de acerto</span>
        </div>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {correctExercises} de {totalExercises} exercícios corretos
        </p>
      </div>

      {/* Score bar */}
      <div className="w-full max-w-xs animate-slide-up delay-150">
        <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: isPerfect
                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                : 'linear-gradient(90deg, var(--color-primary), #60a5fa)',
            }}
          />
        </div>
      </div>

      {/* Learned words */}
      {newVocabulary.length > 0 && (
        <div
          className="w-full max-w-sm rounded-2xl p-4 animate-slide-up delay-225"
          style={{ backgroundColor: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
            Palavras aprendidas
          </p>
          <div className="flex flex-wrap gap-2">
            {newVocabulary.map((w, i) => (
              <span
                key={w}
                className="rounded-xl px-3 py-1.5 text-sm font-semibold animate-scale-in"
                style={{
                  animationDelay: `${300 + i * 80}ms`,
                  animationFillMode: 'both',
                  backgroundColor: 'var(--color-vocab-bg)',
                  color: 'var(--color-vocab)',
                  border: '1px solid rgba(217,119,6,0.2)',
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
          className="cta-shimmer relative w-full overflow-hidden rounded-2xl py-4 text-base font-bold text-white transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
            boxShadow: '0 8px 24px rgba(29,94,212,0.35)',
          }}
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
