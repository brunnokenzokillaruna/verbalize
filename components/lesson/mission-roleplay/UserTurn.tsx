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
  const isRecording = recState === 'recording' || recState === 'requesting-mic' || recState === 'transcribing';

  return (
    <div className="flex items-start gap-2.5 sm:gap-3 animate-slide-up">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white shadow-sm">
        V
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          Sua vez de falar
        </p>

        <div className="rounded-2xl rounded-tl-md border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3.5">
          {intentMode ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-text-muted mb-1.5">
                O que você precisa comunicar
              </p>
              <p className="grammar-body font-semibold text-text-primary leading-relaxed">
                {line.translation}
              </p>
              {showHint && (
                <>
                  <div className="my-3 h-px bg-border" aria-hidden />
                  <p className="text-xs font-bold uppercase tracking-wide text-text-muted mb-1">
                    Como falar
                  </p>
                  <p className="grammar-body font-semibold text-primary">{line.text}</p>
                </>
              )}
            </>
          ) : showHint ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-text-muted mb-1.5">
                Fale esta frase
              </p>
              <p className="grammar-body font-semibold text-text-primary leading-relaxed">
                {line.text}
              </p>
              {line.translation && (
                <>
                  <div className="my-3 h-px bg-border" aria-hidden />
                  <p className="grammar-secondary">{line.translation}</p>
                </>
              )}
            </>
          ) : line.translation ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-text-muted mb-1.5">
                Lembre-se do sentido
              </p>
              <p className="grammar-secondary">{line.translation}</p>
            </>
          ) : (
            <p className="grammar-secondary">Fale o que você diria nesta situação.</p>
          )}
        </div>

        {!isRecording && recState === 'idle' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleHint}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold border border-border bg-surface text-text-secondary min-h-[44px] active:scale-95"
            >
              {showHint ? <EyeOff size={14} /> : <Eye size={14} />}
              {showHint
                ? intentMode
                  ? 'Esconder modelo'
                  : 'Esconder frase'
                : intentMode
                  ? 'Ver como falar'
                  : 'Ver frase'}
            </button>
            {(showHint || intentMode) && (
              <button
                type="button"
                onClick={onPlayTarget}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold border border-border bg-surface text-text-secondary min-h-[44px] active:scale-95"
              >
                <Volume2 size={14} />
                Ouvir modelo
              </button>
            )}
          </div>
        )}

        <div>
          {recState === 'idle' && !hasSpeechAPI && <FallbackNoMic onSkip={onSkip} />}

          {recState === 'idle' && hasSpeechAPI && (
            <div className="flex flex-col gap-2.5">
              {recordError && (
                <p className="text-sm font-medium text-error">{recordError}</p>
              )}
              <button
                type="button"
                onClick={onRecord}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-bold text-white transition active:scale-[0.98] min-h-[48px] bg-success shadow-md"
              >
                <Mic size={18} />
                Gravar minha fala
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-text-muted min-h-[44px] active:scale-95"
              >
                Pular esta fala
                <SkipForward size={14} />
              </button>
            </div>
          )}

          {recState === 'requesting-mic' && (
            <div className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 grammar-secondary bg-surface-raised min-h-[48px]">
              <Loader2 size={18} className="animate-spin" />
              Liberando microfone…
            </div>
          )}

          {recState === 'recording' && (
            <button
              type="button"
              onClick={onStopRecord}
              className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-bold text-white transition active:scale-[0.98] min-h-[52px] bg-error shadow-md"
            >
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                Gravando
              </span>
              <Square size={14} fill="currentColor" />
              Parar e enviar
            </button>
          )}

          {recState === 'transcribing' && (
            <div className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 grammar-secondary bg-surface-raised min-h-[48px]">
              <Loader2 size={18} className="animate-spin" />
              Analisando sua fala…
            </div>
          )}

          {recState === 'review-correct' && (
            <div className="flex flex-col gap-2.5 animate-slide-up">
              <div className="flex items-start gap-3 rounded-2xl p-4 border-2 border-success bg-success/10">
                <CheckCircle2 size={22} className="text-success shrink-0" strokeWidth={2.5} />
                <div>
                  <p className="text-sm font-bold text-success">
                    {intentMode ? 'Perfeito!' : `Perfeito! (${Math.round(score * 100)}% de precisão)`}
                  </p>
                  <div className="mt-2">
                    {intentMode ? (
                      <p className="grammar-secondary">{evalFeedback}</p>
                    ) : (
                      <WordDiff target={line.text} transcript={transcript} />
                    )}
                  </div>
                  {intentMode && evalCorrected && (
                    <p className="grammar-secondary mt-2 text-success font-semibold">
                      Dica: {evalCorrected}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onConfirm}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white min-h-[48px] bg-success active:scale-[0.98]"
              >
                Continuar
              </button>
            </div>
          )}

          {recState === 'review-retry' && (
            <div className="flex flex-col gap-2.5 animate-slide-up">
              <div className="flex items-start gap-3 rounded-2xl p-4 border-2 border-error/30 bg-error/5">
                <XCircle size={22} className="text-error shrink-0" strokeWidth={2.5} />
                <div>
                  <p className="text-sm font-bold text-error">
                    {intentMode ? 'Precisa melhorar' : `Quase lá (${Math.round(score * 100)}%)`}
                  </p>
                  <div className="mt-2">
                    {intentMode ? (
                      <p className="grammar-secondary">{evalFeedback}</p>
                    ) : (
                      <WordDiff target={line.text} transcript={transcript} />
                    )}
                  </div>
                  {intentMode && evalCorrected && (
                    <p className="grammar-secondary mt-2 text-error font-semibold">
                      Tente dizer: {evalCorrected}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold border border-border bg-surface min-h-[48px] active:scale-95"
                >
                  <RefreshCw size={14} />
                  Tentar de novo
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold text-white bg-primary min-h-[48px] active:scale-95"
                >
                  Continuar mesmo assim
                  <SkipForward size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
