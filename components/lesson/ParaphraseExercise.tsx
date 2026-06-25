import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Loader2, RefreshCw, Lightbulb, XCircle } from 'lucide-react';
import type { ParaphraseData, ProficiencyLevel } from '@/types';
import { isAccentOnlyDiff } from '@/utils/accent';
import { validateReverseTranslation } from '@/app/actions/validateAnswer';
import { incrementProductionStats } from '@/services/firestore';
import { useAuthStore } from '@/store/authStore';

interface ParaphraseExerciseProps {
  data: ParaphraseData;
  language: string;
  level?: ProficiencyLevel;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:'"-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

type AnswerStatus = 'idle' | 'validating' | 'correct' | 'accent-warning' | 'wrong';

export function ParaphraseExercise({
  data,
  language,
  level,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: ParaphraseExerciseProps) {
  const { user } = useAuthStore();
  const showHint =
    !!data.hint &&
    !!level &&
    !(['A2', 'B1', 'B2', 'C1', 'C2'] as ProficiencyLevel[]).includes(level);

  function reportProduction(correct: boolean) {
    if (user) incrementProductionStats(user.uid, 'freeWrite', correct).catch(console.error);
    onAnswer(correct);
  }

  const [input, setInput] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');
  const [aiNote, setAiNote] = useState<string | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const frenchAccents = ['é', 'à', 'è', 'ù', 'ç', 'œ', 'ê', 'â', 'ô', 'î', 'ë', 'ï'];

  useEffect(() => {
    setIsExerciseReady(!answered && input.trim().length > 0);
  }, [input, answered, setIsExerciseReady]);

  useEffect(() => {
    if (submitTrigger > 0 && !answered) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  const userNorm = normalize(input);
  const isCorrect =
    userNorm === normalize(data.target_paraphrase) ||
    data.acceptable_variants.some((v) => userNorm === normalize(v));

  const isAccentWarning =
    !isCorrect &&
    (isAccentOnlyDiff(input, data.target_paraphrase) ||
      data.acceptable_variants.some((v) => isAccentOnlyDiff(input, v)));

  async function handleSubmit() {
    if (input.trim() === '' || answered || answerStatus === 'validating') return;

    if (isCorrect) {
      setAnswerStatus('correct');
      reportProduction(true);
      return;
    }

    if (isAccentWarning) {
      setAnswerStatus('accent-warning');
      reportProduction(true);
      return;
    }

    setAnswerStatus('validating');
    const result = await validateReverseTranslation(
      input,
      data.target_paraphrase,
      data.source_translation,
      language,
      data.acceptable_variants,
    );

    if (result.accepted) {
      setAnswerStatus('correct');
      reportProduction(true);
    } else {
      setAiNote(result.note);
      setAnswerStatus('wrong');
      reportProduction(false);
    }
  }

  function insertAccent(char: string) {
    if (isAnswered || isSubmitting) return;
    setInput((prev) => prev + char);
    textareaRef.current?.focus();
  }

  const isSubmitting = answerStatus === 'validating';
  const isAnswered = answered || (answerStatus !== 'idle' && answerStatus !== 'validating');

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className="rounded-2xl p-4.5 border border-dashed border-[var(--color-border)]"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-2 mb-2.5 text-[var(--color-text-muted)]">
          <RefreshCw size={15} className="text-[var(--color-vocab)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">
            Parafraseie — mesmo sentido, palavras diferentes
          </span>
        </div>
        <p className="font-display text-lg font-bold text-[var(--color-text-primary)] leading-relaxed mb-2">
          {data.source_sentence}
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] italic border-l-4 border-[var(--color-vocab)] pl-3">
          {data.source_translation}
        </p>
      </div>

      <div className="relative group">
        <textarea
          ref={textareaRef}
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isAnswered || isSubmitting}
          placeholder="Escreva outra forma de dizer a mesma coisa..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className="w-full resize-none rounded-2xl bg-[var(--color-surface-raised)] px-6 py-5 text-base font-semibold outline-none transition-all duration-300 ring-1 shadow-inner leading-relaxed"
          style={{
            borderColor:
              answerStatus === 'correct'
                ? 'var(--color-success)'
                : answerStatus === 'accent-warning'
                  ? '#d97706'
                  : answerStatus === 'wrong'
                    ? 'var(--color-error)'
                    : 'var(--color-border)',
            color: 'var(--color-text-primary)',
            caretColor: 'var(--color-primary)',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        {isSubmitting && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <div className="flex items-center gap-2 rounded-full px-3.5 py-1 shadow-sm ring-1 ring-black/5 bg-[var(--color-surface)]">
              <Loader2 size={12} className="animate-spin text-[var(--color-primary)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                Verificando...
              </span>
            </div>
          </div>
        )}
      </div>

      {!isAnswered && language === 'fr' && (
        <div className="flex items-center gap-1.5 flex-wrap px-1">
          {frenchAccents.map((char) => (
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

      {isAnswered && answerStatus === 'accent-warning' && (
        <div className="p-4.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm font-bold text-[var(--color-text-primary)] italic">
            {data.target_paraphrase}
          </p>
        </div>
      )}

      {isAnswered && answerStatus === 'wrong' && (
        <div className="flex flex-col gap-4.5">
          <div className="p-4.5 rounded-xl bg-[var(--color-error-bg)]/30 border border-[var(--color-error)]/20">
            <div className="flex items-center gap-2 mb-1.5">
              <XCircle size={15} className="text-[var(--color-error)]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-error)]">
                Exemplo de paráfrase:
              </span>
            </div>
            <p className="text-base font-semibold italic">{data.target_paraphrase}</p>
          </div>
          {aiNote && (
            <div className="rounded-xl p-4.5 border-l-4 border-amber-500/40 bg-[var(--color-surface-raised)]">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={15} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                  Dica
                </span>
              </div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">{aiNote}</p>
            </div>
          )}
        </div>
      )}

      {showHint && (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setHintOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest"
          >
            <ChevronDown size={14} className={hintOpen ? 'rotate-180' : ''} />
            {hintOpen ? 'Esconder ajuda' : 'Precisa de uma dica?'}
          </button>
          {hintOpen && (
            <div className="p-4.5 rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/10">
              <p className="text-xs italic text-[var(--color-primary-dark)]">{data.hint}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
