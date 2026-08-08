import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Languages, Lightbulb, XCircle, Link2 } from 'lucide-react';
import type { TranslationWithConstraintData } from '@/types';
import { isAccentOnlyDiff } from '@/utils/accent';
import { validateReverseTranslation } from '@/app/actions/validateAnswer';
import { TranslationCorrectionList } from './TranslationCorrectionList';
import type { TranslationCorrection } from '@/lib/reverseTranslationCorrections';
import { formatTranslationCorrectionHint, answersDifferOnlyByForm } from '@/lib/elaborationHints';
import { incrementProductionStats } from '@/services/firestore';
import { useAuthStore } from '@/store/authStore';
import { useLessonStore } from '@/store/lessonStore';
import type { OnExerciseAnswer, ExerciseAnswerMeta } from '@/hooks/useSoundEffects';

interface TranslationWithConstraintExerciseProps {
  data: TranslationWithConstraintData;
  language: string;
  onAnswer: OnExerciseAnswer;
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

function includesRequiredChunk(text: string, chunk: string): boolean {
  return normalize(text).includes(normalize(chunk));
}

type AnswerStatus = 'idle' | 'validating' | 'correct' | 'soft' | 'accent-warning' | 'wrong';

export function TranslationWithConstraintExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: TranslationWithConstraintExerciseProps) {
  const { user } = useAuthStore();
  const setLastProductionPolishHint = useLessonStore((s) => s.setLastProductionPolishHint);
  const [input, setInput] = useState('');
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');
  const [chunkMissing, setChunkMissing] = useState(false);
  const [aiNote, setAiNote] = useState<string | undefined>();
  const [correctedSentence, setCorrectedSentence] = useState<string | undefined>();
  const [corrections, setCorrections] = useState<TranslationCorrection[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const frenchAccents = ['é', 'à', 'è', 'ù', 'ç', 'œ', 'ê', 'â', 'ô', 'î', 'ë', 'ï'];

  function reportProduction(correct: boolean, meta?: ExerciseAnswerMeta) {
    if (user) incrementProductionStats(user.uid, 'freeWrite', correct).catch(console.error);
    onAnswer(correct, meta);
  }

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
  const isExactMatch =
    userNorm === normalize(data.target_translation) ||
    data.acceptable_variants.some((v) => userNorm === normalize(v));

  const isAccentWarning =
    !isExactMatch &&
    (isAccentOnlyDiff(input, data.target_translation) ||
      data.acceptable_variants.some((v) => isAccentOnlyDiff(input, v)));

  async function handleSubmit() {
    if (input.trim() === '' || answered || answerStatus === 'validating') return;

    if (!includesRequiredChunk(input, data.required_chunk)) {
      setChunkMissing(true);
      setAnswerStatus('wrong');
      reportProduction(false);
      return;
    }

    setChunkMissing(false);

    if (isExactMatch) {
      setAnswerStatus('correct');
      reportProduction(true);
      return;
    }

    if (isAccentWarning) {
      setAnswerStatus('accent-warning');
      reportProduction(true, { accentOnly: true });
      return;
    }

    setAnswerStatus('validating');
    setLastProductionPolishHint(null);
    const result = await validateReverseTranslation(
      input,
      data.target_translation,
      data.portuguese_sentence,
      language,
      data.acceptable_variants,
    );
    if (result.accepted) {
      const hasFormFixes = answersDifferOnlyByForm(input, result.correctedSentence);
      const isSoft = result.verdict === 'soft' || hasFormFixes;
      const polish = formatTranslationCorrectionHint({
        learnerText: input,
        note: result.note,
        correctedSentence: result.correctedSentence,
      });
      setLastProductionPolishHint(polish);
      setAiNote(result.note);
      setCorrectedSentence(result.correctedSentence);
      setCorrections(result.corrections ?? []);
      setAnswerStatus(isSoft ? 'soft' : 'correct');
      reportProduction(true);
    } else {
      setAnswerStatus('wrong');
      setAiNote(result.note);
      setCorrectedSentence(result.correctedSentence || data.target_translation);
      setCorrections(result.corrections ?? []);
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
          <Languages size={15} className="text-[var(--color-vocab)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Traduza incluindo a expressão</span>
        </div>
        <div className="border-l-4 border-[var(--color-vocab)] pl-3.5 py-1 mb-4">
          <p className="text-[17px] font-semibold text-[var(--color-text-primary)] leading-relaxed">
            {data.portuguese_sentence}
          </p>
        </div>
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{
            backgroundColor: 'rgba(124, 58, 237, 0.08)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
          }}
        >
          <Link2 size={16} className="text-[#7c3aed] shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed] mb-1">
              Obrigatório na resposta
            </p>
            <p className="text-base font-bold text-[var(--color-text-primary)]">{data.required_chunk}</p>
            {data.constraint_explanation && (
              <p className="mt-1 text-xs text-[var(--color-text-muted)] italic">
                {data.constraint_explanation}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="relative group">
        <textarea
          ref={textareaRef}
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isAnswered || isSubmitting}
          placeholder="Digite sua tradução aqui..."
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
            <div
              className="flex items-center gap-2 rounded-full px-3.5 py-1 shadow-sm ring-1 ring-black/5"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <Loader2 size={12} className="animate-spin text-[var(--color-primary)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                Verificando…
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
            {data.target_translation}
          </p>
        </div>
      )}

      {isAnswered && answerStatus === 'soft' && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-400">
          <div className="p-4.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1.5">
              Aceita — com correções na sua frase
            </p>
            {aiNote && (
              <p className="text-sm font-medium leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line mb-2">
                {aiNote}
              </p>
            )}
            {corrections.length > 0 && (
              <div className="mb-3">
                <TranslationCorrectionList corrections={corrections} />
              </div>
            )}
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-600/80 mb-1">
              Sua frase corrigida
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] italic leading-relaxed">
              {correctedSentence || data.target_translation}
            </p>
          </div>
        </div>
      )}

      {isAnswered && answerStatus === 'wrong' && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-400">
          {chunkMissing && (
            <div className="p-4 rounded-xl bg-[var(--color-error-bg)]/30 border border-[var(--color-error)]/20">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Sua tradução precisa incluir{' '}
                <span className="font-bold text-[var(--color-text-primary)]">«{data.required_chunk}»</span>.
              </p>
            </div>
          )}
          <div className="p-4.5 rounded-xl bg-[var(--color-error-bg)]/30 border border-[var(--color-error)]/20">
            <div className="flex items-center gap-2 mb-1.5">
              <XCircle size={15} className="text-[var(--color-error)]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-error)] opacity-70">
                Resposta sugerida:
              </span>
            </div>
            <p className="text-base font-semibold text-[var(--color-text-primary)] leading-relaxed italic">
              {correctedSentence || data.target_translation}
            </p>
          </div>

          {(aiNote || corrections.length > 0) && (
            <div
              className="rounded-xl p-4.5 border-l-4 border-amber-500/40"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={15} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                  Análise gramatical
                </span>
              </div>
              {aiNote && (
                <p className="text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
                  {aiNote}
                </p>
              )}
              {corrections.length > 0 && (
                <div className={aiNote ? 'mt-3 border-t border-[var(--color-border)] pt-3' : ''}>
                  <TranslationCorrectionList corrections={corrections} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
