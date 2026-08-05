'use client';

import { CheckCircle2, Loader2, RefreshCw, SkipForward, XCircle } from 'lucide-react';
import type { FreeWrittenPhase } from '@/hooks/useFreeWrittenProduction';

interface FreeWrittenProductionFieldProps {
  input: string;
  onInputChange: (value: string) => void;
  phase: FreeWrittenPhase;
  feedback: string;
  suggested: string;
  isBusy: boolean;
  isLocked: boolean;
  placeholder: string;
  helperLabel: string;
  onSubmit: () => void;
  onContinueAnyway: () => void;
  onRetry: () => void;
  language?: string;
}

const FRENCH_ACCENTS = ['é', 'à', 'è', 'ù', 'ç', 'œ', 'ê', 'â', 'ô', 'î', 'ë', 'ï'];

export function FreeWrittenProductionField({
  input,
  onInputChange,
  phase,
  feedback,
  suggested,
  isBusy,
  isLocked,
  placeholder,
  helperLabel,
  onSubmit,
  onContinueAnyway,
  onRetry,
  language,
}: FreeWrittenProductionFieldProps) {
  function insertAccent(char: string) {
    if (isLocked) return;
    onInputChange(input + char);
  }

  const borderColor =
    phase === 'correct'
      ? 'var(--color-success)'
      : phase === 'retry'
        ? 'var(--color-error)'
        : 'var(--color-border)';

  const wasAccepted = phase === 'correct';
  // 'answered' with feedback means the learner moved on after a failed attempt —
  // the correction still belongs on screen.
  const isSettled = phase === 'correct' || phase === 'answered';

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex items-center justify-center my-1">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[var(--color-border)] opacity-30" />
        </div>
        <span className="relative rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] opacity-85">
          {helperLabel}
        </span>
      </div>

      <textarea
        rows={3}
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={isLocked}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        className="w-full resize-none rounded-2xl bg-[var(--color-surface-raised)] px-6 py-5 text-base font-semibold outline-none transition-all duration-300 ring-1 shadow-inner leading-relaxed"
        style={{
          borderColor,
          color: 'var(--color-text-primary)',
          caretColor: 'var(--color-primary)',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />

      {!isLocked && language === 'fr' && (
        <div className="flex items-center gap-1.5 flex-wrap px-1">
          {FRENCH_ACCENTS.map((char) => (
            <button
              key={char}
              type="button"
              onClick={() => insertAccent(char)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-semibold"
            >
              {char}
            </button>
          ))}
        </div>
      )}

      {isBusy && (
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Loader2 size={16} className="animate-spin" />
          Analisando sua resposta…
        </div>
      )}

      {phase === 'retry' && (
        <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start gap-3 rounded-2xl p-4 border-2 border-[var(--color-error)]/30 bg-[var(--color-error)]/5">
            <XCircle size={20} className="text-[var(--color-error)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[var(--color-error)]">Precisa melhorar</p>
              {feedback && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{feedback}</p>
              )}
              {suggested && (
                <p className="text-sm font-semibold text-[var(--color-error)] mt-2">
                  Tente: {suggested}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold border border-[var(--color-border)]"
            >
              <RefreshCw size={14} />
              Refazer
            </button>
            <button
              type="button"
              onClick={onContinueAnyway}
              className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold text-white bg-[var(--color-primary)]"
            >
              Continuar
              <SkipForward size={14} />
            </button>
          </div>
        </div>
      )}

      {isSettled && (feedback || suggested) && (
        <div
          className={[
            'flex items-start gap-3 rounded-2xl p-4 border-2',
            wasAccepted
              ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/5'
              : 'border-[var(--color-border)] bg-[var(--color-surface-raised)]',
          ].join(' ')}
        >
          {wasAccepted ? (
            <CheckCircle2 size={20} className="text-[var(--color-success)] shrink-0 mt-0.5" />
          ) : (
            <XCircle size={20} className="text-[var(--color-text-muted)] shrink-0 mt-0.5" />
          )}
          <div>
            {feedback && (
              <p className="text-sm text-[var(--color-text-secondary)]">{feedback}</p>
            )}
            {suggested &&
              suggested.trim().toLowerCase() !== input.trim().toLowerCase() && (
                <p
                  className={`text-sm font-semibold mt-2 ${
                    wasAccepted
                      ? 'text-[var(--color-success)]'
                      : 'text-[var(--color-text-primary)]'
                  }`}
                >
                  {wasAccepted ? 'Sua frase corrigida' : 'Como ficaria melhor'}: {suggested}
                </p>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
