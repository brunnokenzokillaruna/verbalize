import {
  Mic,
  CheckCircle2,
  XCircle,
  RefreshCw,
  SkipForward,
  Eye,
  EyeOff,
  Volume2,
  Square,
  Loader2,
} from 'lucide-react';
import { FallbackNoMic } from '@/components/lesson/mission-roleplay/FallbackNoMic';
import { WordDiff } from '@/components/lesson/mission-roleplay/WordDiff';
import type { DialogueLine, RecState } from '@/components/lesson/mission-roleplay/types';

type UserTurnProps = {
  line: DialogueLine;
  showHint: boolean;
  hasSpeechAPI: boolean;
  recState: RecState;
  transcript: string;
  recordError: string;
  score: number;
  intentMode: boolean;
  evalFeedback: string;
  evalCorrected: string;
  onToggleHint: () => void;
  onRecord: () => void;
  onStopRecord: () => void;
  onSkip: () => void;
  onConfirm: () => void;
  onRetry: () => void;
  onPlayTarget: () => void;
};

export function UserTurn({
  line,
  showHint,
  hasSpeechAPI,
  recState,
  transcript,
  recordError,
  score,
  intentMode,
  evalFeedback,
  evalCorrected,
  onToggleHint,
  onRecord,
  onStopRecord,
  onSkip,
  onConfirm,
  onRetry,
  onPlayTarget,
}: UserTurnProps) {
  return (
    <div className="flex flex-row gap-3 animate-slide-up">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-md"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        V
      </div>
      <div className="flex-1">
        <p
          className="text-[10px] font-black uppercase tracking-widest mb-1.5"
          style={{ color: 'var(--color-primary)' }}
        >
          Você · Sua vez 🎙️
        </p>

        <div
          className="rounded-2xl p-4 transition-all"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            border: '2px dashed var(--color-primary)',
          }}
        >
          {intentMode ? (
            <>
              <p className="text-base font-semibold leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                {line.translation}
              </p>
              {showHint && (
                <p className="mt-2 text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
                  Dica de como falar: &ldquo;{line.text}&rdquo;
                </p>
              )}
            </>
          ) : showHint ? (
            <>
              <p className="text-base font-semibold leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                {line.text}
              </p>
              {line.translation && (
                <p className="mt-2 text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
                  {line.translation}
                </p>
              )}
            </>
          ) : line.translation ? (
            <p className="text-sm italic leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              &ldquo;{line.translation}&rdquo;
            </p>
          ) : (
            <p className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>
              Fale o que você diria nessa situação.
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleHint}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              border: '1.5px solid var(--color-border)',
            }}
          >
            {showHint ? <EyeOff size={12} /> : <Eye size={12} />}
            {showHint ? 'Esconder frase' : 'Ver frase'}
          </button>
          {showHint && (
            <button
              type="button"
              onClick={onPlayTarget}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                border: '1.5px solid var(--color-border)',
              }}
            >
              <Volume2 size={12} />
              Ouvir modelo
            </button>
          )}
        </div>

        <div className="mt-4">
          {recState === 'idle' && !hasSpeechAPI && <FallbackNoMic onSkip={onSkip} />}

          {recState === 'idle' && hasSpeechAPI && (
            <div className="flex flex-col gap-2.5">
              {recordError && (
                <p className="text-[11px] font-medium" style={{ color: 'var(--color-error)' }}>
                  {recordError}
                </p>
              )}
              <button
                type="button"
                onClick={onRecord}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-black text-white transition active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, var(--color-success) 0%, #059669 100%)',
                  boxShadow: '0 6px 18px rgba(16,185,129,0.35)',
                }}
              >
                <Mic size={16} />
                Gravar minha fala
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition active:scale-95"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-muted)',
                }}
              >
                Pular fala
                <SkipForward size={12} />
              </button>
            </div>
          )}

          {recState === 'requesting-mic' && (
            <div
              className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-semibold"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Loader2 size={16} className="animate-spin" />
              Liberando microfone…
            </div>
          )}

          {recState === 'recording' && (
            <button
              type="button"
              onClick={onStopRecord}
              className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-black text-white transition active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                boxShadow: '0 6px 18px rgba(239,68,68,0.35)',
              }}
            >
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                Gravando —
              </span>
              <Square size={14} fill="currentColor" />
              Parar e enviar
            </button>
          )}

          {recState === 'transcribing' && (
            <div
              className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-semibold"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Loader2 size={16} className="animate-spin" />
              Analisando sua fala (Whisper)…
            </div>
          )}

          {recState === 'review-correct' && (
            <div className="flex flex-col gap-2.5 animate-slide-up">
              <div
                className="flex items-start gap-3 rounded-2xl p-4"
                style={{
                  backgroundColor: 'var(--color-success-bg)',
                  border: '2px solid var(--color-success)',
                }}
              >
                <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} strokeWidth={2.5} />
                <div>
                  <p className="text-xs font-black" style={{ color: 'var(--color-success)' }}>
                    {intentMode ? 'Perfeito!' : `Perfeito! (${Math.round(score * 100)}% de precisão)`}
                  </p>
                  <div className="mt-1.5">
                    {intentMode ? (
                      <p className="text-sm">{evalFeedback}</p>
                    ) : (
                      <WordDiff target={line.text} transcript={transcript} />
                    )}
                  </div>
                  {intentMode && evalCorrected && (
                    <p className="mt-2 text-xs font-bold text-[var(--color-success)] opacity-90">
                      Dica: {evalCorrected}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onConfirm}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white transition active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, var(--color-success) 0%, #059669 100%)',
                  boxShadow: '0 6px 18px rgba(16,185,129,0.35)',
                }}
              >
                Continuar →
              </button>
            </div>
          )}

          {recState === 'review-retry' && (
            <div className="flex flex-col gap-2.5 animate-slide-up">
              <div
                className="flex items-start gap-3 rounded-2xl p-4"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.06)',
                  border: '2px solid rgba(239,68,68,0.4)',
                }}
              >
                <XCircle size={20} style={{ color: '#ef4444' }} strokeWidth={2.5} />
                <div>
                  <p className="text-xs font-black" style={{ color: '#ef4444' }}>
                    {intentMode ? 'Precisa melhorar' : `Quase lá (${Math.round(score * 100)}%)`}
                  </p>
                  <div className="mt-1.5">
                    {intentMode ? (
                      <p className="text-sm">{evalFeedback}</p>
                    ) : (
                      <WordDiff target={line.text} transcript={transcript} />
                    )}
                  </div>
                  {intentMode && evalCorrected && (
                    <p className="mt-2 text-xs font-bold text-[#ef4444] opacity-90">
                      Tente dizer: {evalCorrected}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition active:scale-95"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    border: '1.5px solid var(--color-border)',
                  }}
                >
                  <RefreshCw size={12} />
                  Tentar de novo
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-white transition active:scale-95"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Continuar
                  <SkipForward size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
