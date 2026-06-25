'use client';

import {
  Mic,
  Square,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  SkipForward,
} from 'lucide-react';
import type { UseOralProductionReturn } from '@/hooks/useOralProduction';

interface OralProductionShellProps {
  state: UseOralProductionReturn;
  /** Shown while idle — e.g. "Grave sua resposta:" */
  recordLabel?: string;
  /** Shown during transcribing step. */
  transcribingLabel?: string;
  /** Shown during semantic evaluation. */
  evaluatingLabel?: string;
  /** Optional content above the record controls (prompt card, etc.). */
  children?: React.ReactNode;
  /** When mic unavailable, call to continue without audio. */
  onContinueWithoutMic?: () => void;
  continueWithoutMicLabel?: string;
}

export function OralProductionShell({
  state,
  recordLabel = 'Grave sua resposta',
  transcribingLabel = 'Transcrevendo sua fala…',
  evaluatingLabel = 'Analisando sua resposta…',
  children,
  onContinueWithoutMic,
  continueWithoutMicLabel = 'Continuar sem áudio',
}: OralProductionShellProps) {
  const {
    phase,
    transcript,
    recordError,
    evalFeedback,
    evalCorrected,
    hasSpeechAPI,
    isBusy,
    startRecording,
    stopRecording,
    retry,
    confirm,
    skip,
  } = state;

  return (
    <div className="flex flex-col gap-4">
      {children}

      <div className="flex flex-wrap items-center gap-3">
        {phase === 'idle' && hasSpeechAPI && (
          <button
            type="button"
            onClick={() => void startRecording()}
            className="flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 active:scale-95 shadow-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Mic size={16} />
            {recordLabel}
          </button>
        )}

        {phase === 'requesting-mic' && (
          <div className="flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-semibold bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]">
            <Loader2 size={14} className="animate-spin" />
            Liberando microfone…
          </div>
        )}

        {phase === 'recording' && (
          <button
            type="button"
            onClick={() => void stopRecording()}
            className="flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 active:scale-95 shadow-sm"
            style={{ backgroundColor: 'var(--color-error)' }}
          >
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            Gravando
            <Square size={12} fill="currentColor" />
            Parar
          </button>
        )}

        {(phase === 'transcribing' || phase === 'evaluating') && (
          <div className="flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-semibold bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]">
            <Loader2 size={14} className="animate-spin" />
            {phase === 'transcribing' ? transcribingLabel : evaluatingLabel}
          </div>
        )}
      </div>

      {recordError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100">
          <p className="text-[11px] font-medium text-red-600">{recordError}</p>
        </div>
      )}

      {phase === 'idle' && !hasSpeechAPI && onContinueWithoutMic && (
        <button
          type="button"
          onClick={onContinueWithoutMic}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white bg-[var(--color-primary)]"
        >
          {continueWithoutMicLabel}
        </button>
      )}

      {(phase === 'review-correct' || phase === 'review-retry') && (
        <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-500">
          <div
            className={`flex items-start gap-4 rounded-xl p-5 border ${
              phase === 'review-correct'
                ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/5'
                : 'border-[var(--color-error)]/30 bg-[var(--color-error)]/5'
            }`}
          >
            <div className="mt-0.5">
              {phase === 'review-correct' ? (
                <CheckCircle2 size={20} className="text-[var(--color-success)]" />
              ) : (
                <XCircle size={20} className="text-[var(--color-error)]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1 opacity-60">
                Você disse
              </p>
              <p className="text-base font-semibold text-[var(--color-text-primary)] leading-relaxed italic">
                &ldquo;{transcript}&rdquo;
              </p>
              {evalFeedback && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-2">{evalFeedback}</p>
              )}
              {evalCorrected && (
                <p
                  className={`text-sm mt-2 font-semibold ${
                    phase === 'review-correct'
                      ? 'text-[var(--color-success)]'
                      : 'text-[var(--color-error)]'
                  }`}
                >
                  {phase === 'review-correct' ? 'Dica: ' : 'Tente dizer: '}
                  {evalCorrected}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={confirm}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white bg-[var(--color-primary)]"
            >
              {phase === 'review-correct' ? 'Continuar' : 'Continuar mesmo assim'}
            </button>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={retry}
                disabled={isBusy}
                className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold uppercase tracking-widest border border-[var(--color-border)] bg-[var(--color-surface-raised)]"
              >
                <RefreshCw size={14} />
                Refazer
              </button>
              <button
                type="button"
                onClick={skip}
                className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold uppercase tracking-widest border border-[var(--color-border)] bg-[var(--color-surface-raised)]"
              >
                Pular
                <SkipForward size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'answered' && transcript && (
        <div className="flex items-start gap-4 rounded-xl p-5 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]/50 opacity-80">
          <CheckCircle2 size={18} className="text-[var(--color-success)] shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1 opacity-60">
              Resposta registrada
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] italic">
              &ldquo;{transcript}&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
