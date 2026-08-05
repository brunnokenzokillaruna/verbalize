'use client';

import { useEffect } from 'react';
import { Check, Circle, Flame, Loader2, X } from 'lucide-react';
import type { RoleplayDebriefResult } from '@/features/roleplay-chat/types';

export function RoleplayDebrief({
  isOpen,
  debrief,
  loading,
  goalsPt,
  canIncreaseIntensity,
  onClose,
  onAgain,
  onAgainHarder,
  onChangeScenario,
}: {
  isOpen: boolean;
  debrief: RoleplayDebriefResult | null;
  loading: boolean;
  goalsPt: string[];
  canIncreaseIntensity: boolean;
  onClose: () => void;
  onAgain: () => void;
  onAgainHarder: () => void;
  onChangeScenario: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const completed = new Set(debrief?.completedGoalIndexes ?? []);
  const showGoals = goalsPt.length > 0 && !loading && Boolean(debrief);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6 animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(6px)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="roleplay-summary-title"
        className="relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] px-4 pb-5 pt-5 shadow-2xl sm:rounded-[2rem] sm:px-5 animate-scale-in"
        style={{
          backgroundColor: 'var(--color-bg)',
          border: '1.5px solid var(--color-border)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar resumo"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full cursor-pointer"
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <X size={18} />
        </button>

        <div className="pr-12">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Sessão concluída
          </p>
          <h2
            id="roleplay-summary-title"
            className="mt-1 font-display text-xl font-bold text-text-primary"
          >
            Resumo da conversa
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {showGoals
              ? `Você cumpriu ${completed.size} de ${goalsPt.length} metas da cena.`
              : 'Pontos para levar à próxima prática.'}
          </p>
        </div>

        {loading && (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-text-muted">
            <Loader2 size={18} className="animate-spin" />
            Montando seu feedback…
          </div>
        )}

        {showGoals && (
          <ul className="mt-4 flex flex-col gap-1.5">
            {goalsPt.map((goal, index) => {
              const done = completed.has(index);
              return (
                <li
                  key={goal}
                  className="flex items-start gap-2 rounded-xl px-3 py-2 text-sm"
                  style={{
                    backgroundColor: done
                      ? 'var(--color-success-bg)'
                      : 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: done ? 'var(--color-success)' : 'var(--color-text-secondary)',
                  }}
                >
                  {done ? (
                    <Check size={16} className="mt-0.5 shrink-0" />
                  ) : (
                    <Circle size={16} className="mt-0.5 shrink-0 opacity-50" />
                  )}
                  <span className="leading-snug">{goal}</span>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && debrief && (
          <ul className="mt-3 flex flex-col gap-3">
            <li
              className="rounded-2xl px-3.5 py-3"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                O que funcionou
              </p>
              <p className="mt-1 text-sm text-text-primary leading-snug">
                {debrief.whatWorkedPt}
              </p>
            </li>
            <li
              className="rounded-2xl px-3.5 py-3"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                Para melhorar
              </p>
              <p className="mt-1 text-sm text-text-primary leading-snug">
                {debrief.recurringIssuePt}
              </p>
            </li>
            {debrief.phraseToPractice ? (
              <li
                className="rounded-2xl px-3.5 py-3"
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                  Frase para repetir
                </p>
                <p className="mt-1 text-sm font-bold text-text-primary leading-snug">
                  {debrief.phraseToPractice}
                </p>
                {debrief.phraseToPracticePt ? (
                  <p className="mt-1 text-xs text-text-secondary">
                    {debrief.phraseToPracticePt}
                  </p>
                ) : null}
              </li>
            ) : null}
          </ul>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onAgain}
            className="flex-1 rounded-2xl py-3 text-sm font-bold text-white cursor-pointer"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Repetir cena
          </button>
          <button
            type="button"
            onClick={onChangeScenario}
            className="rounded-2xl px-4 py-3 text-sm font-bold cursor-pointer"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Cenários
          </button>
        </div>

        {canIncreaseIntensity && (
          <button
            type="button"
            onClick={onAgainHarder}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold cursor-pointer"
            style={{
              backgroundColor: 'transparent',
              border: '1.5px dashed var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Flame size={14} />
            Repetir com mais desafio
          </button>
        )}
      </div>
    </div>
  );
}
