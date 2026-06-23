'use client';

import { useState } from 'react';
import { Ear, Volume2 } from 'lucide-react';
import type { CheckpointComprehensionQuestion, SupportedLanguage } from '@/types';

interface CheckpointListeningScreenProps {
  dialogueAudio: string;
  questions: CheckpointComprehensionQuestion[];
  questionIndex: number;
  language: SupportedLanguage;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  onPlayAudio: () => void;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  lastCorrect: boolean | null;
}

export function CheckpointListeningScreen({
  dialogueAudio,
  questions,
  questionIndex,
  isPlaying,
  isLoadingAudio,
  onPlayAudio,
  onAnswer,
  answered,
  lastCorrect,
}: CheckpointListeningScreenProps) {
  const [hasListened, setHasListened] = useState(false);
  const current = questions[questionIndex];

  if (!current) return null;

  function handlePlay() {
    setHasListened(true);
    onPlayAudio();
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Ear size={20} className="text-primary" />
        <div>
          <h2 className="font-display text-lg font-black italic text-text-primary">
            Compreensão auditiva
          </h2>
          <p className="text-xs text-text-muted">
            Pergunta {questionIndex + 1} de {questions.length} — ouça sem ler o texto
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePlay}
        disabled={isLoadingAudio}
        className="flex items-center justify-center gap-2 rounded-xl border border-b-[3px] border-border bg-surface px-4 py-4 text-sm font-bold transition-all active:translate-y-[2px]"
      >
        <Volume2 size={18} className={isPlaying ? 'text-primary animate-pulse' : ''} />
        {isLoadingAudio ? 'Carregando áudio…' : isPlaying ? 'Reproduzindo…' : 'Ouvir diálogo completo'}
      </button>

      {!hasListened && (
        <p className="text-xs text-center text-text-muted">
          Ouça o diálogo inteiro antes de responder — o texto fica oculto de propósito.
        </p>
      )}

      {hasListened && (
        <div className="flex flex-col gap-4 animate-slide-up">
          <p className="text-sm font-semibold text-text-primary">{current.questionPt}</p>
          <div className="flex flex-col gap-2">
            {current.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => onAnswer(i === current.correctIndex)}
                className={[
                  'rounded-xl border border-b-[3px] px-4 py-3 text-left text-sm font-medium transition-all',
                  answered
                    ? i === current.correctIndex
                      ? 'border-success bg-success/10 text-success'
                      : lastCorrect === false && i !== current.correctIndex
                        ? 'border-border bg-surface opacity-60'
                        : 'border-border bg-surface'
                    : 'border-border bg-surface hover:bg-surface-raised active:translate-y-[2px]',
                ].join(' ')}
              >
                {opt}
              </button>
            ))}
          </div>
          {answered && (
            <p className="text-xs text-text-muted">{current.explanationPt}</p>
          )}
        </div>
      )}

      {/* dialogue text intentionally hidden for comprehension assessment */}
      <span className="sr-only">{dialogueAudio}</span>
    </div>
  );
}
