'use client';

import { SentenceBuilder } from './SentenceBuilder';
import type { WordBankTranslationData } from '@/types';

function normalize(s: string): string {
  return s.toLowerCase().replace(/[.,!?;:'"-]/g, '').replace(/\s+/g, ' ').trim();
}

function isWordBankCorrect(data: WordBankTranslationData, assembled: string): boolean {
  const norm = normalize(assembled);
  if (norm === normalize(data.correctOrder.join(' '))) return true;
  return (data.acceptable_variants ?? []).some(
    (v) => normalize(v.join(' ')) === norm,
  );
}

interface WordBankTranslationProps {
  data: WordBankTranslationData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function WordBankTranslation({
  data,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: WordBankTranslationProps) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-xl px-4 py-3 border border-dashed"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
          Traduza montando a frase
        </p>
        <p className="text-base font-semibold italic text-[var(--color-text-primary)]">
          &ldquo;{data.portuguese_sentence}&rdquo;
        </p>
        {data.hint && (
          <p className="text-xs text-[var(--color-text-muted)] mt-2">{data.hint}</p>
        )}
      </div>
      <SentenceBuilder
        data={{
          words: data.words,
          correctOrder: data.correctOrder,
          translation: data.portuguese_sentence,
        }}
        onAnswer={(correct) => {
          if (correct) {
            onAnswer(true);
            return;
          }
          onAnswer(false);
        }}
        answered={answered}
        setIsExerciseReady={setIsExerciseReady}
        submitTrigger={submitTrigger}
      />
    </div>
  );
}

// Export helper for variant-aware grading if SentenceBuilder is extended later
export { isWordBankCorrect };
