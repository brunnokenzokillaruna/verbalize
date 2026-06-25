'use client';

import { useEffect } from 'react';
import { Ear, Volume2 } from 'lucide-react';
import { useDialoguePlayback } from '@/hooks/useDialoguePlayback';
import type { ListeningComprehensionData, ProficiencyLevel, SupportedLanguage } from '@/types';

interface ListeningComprehensionExerciseProps {
  data: ListeningComprehensionData;
  language: SupportedLanguage;
  level?: ProficiencyLevel;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
}

export function ListeningComprehensionExercise({
  data,
  language,
  level = 'A1',
  onAnswer,
  answered,
  setIsExerciseReady,
}: ListeningComprehensionExerciseProps) {
  const dialogue = useDialoguePlayback({
    dialogueAudio: data.dialogueAudio,
    language,
    level,
  });

  useEffect(() => {
    setIsExerciseReady(false);
  }, [setIsExerciseReady]);

  function handleOptionClick(index: number) {
    if (answered || !dialogue.hasListened) return;
    onAnswer(index === data.correctIndex);
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={dialogue.handlePlay}
        disabled={dialogue.isLoadingAudio}
        className="flex items-center justify-center gap-2 rounded-xl border border-b-[3px] border-border bg-surface px-4 py-4 text-sm font-bold transition-all active:translate-y-[2px]"
      >
        <Volume2 size={18} className={dialogue.isPlaying ? 'text-primary animate-pulse' : ''} />
        {dialogue.isLoadingAudio
          ? 'Carregando áudio…'
          : dialogue.isPlaying
            ? 'Reproduzindo…'
            : 'Ouvir diálogo completo'}
      </button>

      {!dialogue.hasListened && (
        <p className="flex items-center justify-center gap-2 text-xs text-center text-text-muted">
          <Ear size={14} />
          Ouça o diálogo inteiro antes de responder — o texto fica oculto de propósito.
        </p>
      )}

      {dialogue.hasListened && (
        <div className="flex flex-col gap-4 animate-slide-up">
          <p className="text-sm font-semibold text-text-primary">{data.questionPt}</p>
          <div className="flex flex-col gap-2">
            {data.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => handleOptionClick(i)}
                className={[
                  'rounded-xl border border-b-[3px] px-4 py-3 text-left text-sm font-medium transition-all',
                  answered
                    ? i === data.correctIndex
                      ? 'border-success bg-success/10 text-success'
                      : 'border-border bg-surface opacity-60'
                    : 'border-border bg-surface hover:bg-surface-raised active:translate-y-[2px]',
                ].join(' ')}
              >
                {opt}
              </button>
            ))}
          </div>
          {answered && (
            <p className="text-xs text-text-muted">{data.explanationPt}</p>
          )}
        </div>
      )}

      <span className="sr-only">{data.dialogueAudio}</span>
    </div>
  );
}
