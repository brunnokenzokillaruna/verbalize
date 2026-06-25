'use client';

import { useState, useEffect } from 'react';
import { Loader2, Voicemail, Lightbulb, XCircle } from 'lucide-react';
import { AudioPlayerButton } from './AudioPlayerButton';
import type { SupportedLanguage, VoicemailDictationData } from '@/types';
import { validateReverseTranslation } from '@/app/actions/validateAnswer';
import { incrementProductionStats } from '@/services/firestore';
import { useAuthStore } from '@/store/authStore';

interface VoicemailDictationExerciseProps {
  data: VoicemailDictationData;
  language: SupportedLanguage;
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

type AnswerStatus = 'idle' | 'validating' | 'correct' | 'wrong';

export function VoicemailDictationExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: VoicemailDictationExerciseProps) {
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');
  const [aiNote, setAiNote] = useState<string | undefined>();

  function reportProduction(correct: boolean) {
    if (user) incrementProductionStats(user.uid, 'freeWrite', correct).catch(console.error);
    onAnswer(correct);
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
    userNorm === normalize(data.expected_summary) ||
    data.acceptable_summaries.some((v) => userNorm === normalize(v));

  async function handleSubmit() {
    if (input.trim() === '' || answered || answerStatus === 'validating') return;

    if (isExactMatch) {
      setAnswerStatus('correct');
      reportProduction(true);
      return;
    }

    setAnswerStatus('validating');
    const result = await validateReverseTranslation(
      input,
      data.expected_summary,
      data.contextPt,
      language,
      data.acceptable_summaries,
    );

    if (result.accepted) {
      setAnswerStatus('correct');
      reportProduction(true);
    } else {
      setAnswerStatus('wrong');
      setAiNote(result.note);
      reportProduction(false);
    }
  }

  const isAnswered = answered || (answerStatus !== 'idle' && answerStatus !== 'validating');
  const isSubmitting = answerStatus === 'validating';

  return (
    <div className="flex flex-col gap-7">
      <div
        className="flex items-start gap-3 rounded-xl p-4"
        style={{
          backgroundColor: 'rgba(8, 145, 178, 0.08)',
          border: '1px solid rgba(8, 145, 178, 0.25)',
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'rgba(8, 145, 178, 0.15)', color: '#0891b2' }}
        >
          <Voicemail size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#0891b2] mb-1">
            Correio de voz
          </p>
          <p className="text-sm font-medium leading-relaxed text-[var(--color-text-primary)]">
            {data.contextPt}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 rounded-xl p-8 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]">
        <AudioPlayerButton text={data.audioText} language={language} size="lg" />
        <p className="text-xs font-medium text-center text-[var(--color-text-muted)] max-w-xs leading-relaxed">
          Ouça a mensagem completa. Depois escreva um resumo em português (1–2 frases).
        </p>
      </div>

      <div className="relative">
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isAnswered || isSubmitting}
          placeholder="Resuma em português o que a pessoa disse..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full resize-none rounded-2xl bg-[var(--color-surface-raised)] px-6 py-5 text-base font-medium outline-none ring-1 shadow-inner leading-relaxed"
          style={{
            borderColor:
              answerStatus === 'correct'
                ? 'var(--color-success)'
                : answerStatus === 'wrong'
                  ? 'var(--color-error)'
                  : 'var(--color-border)',
            color: 'var(--color-text-primary)',
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
            <div className="flex items-center gap-2 rounded-full px-3.5 py-1 bg-[var(--color-surface)] shadow-sm ring-1 ring-black/5">
              <Loader2 size={12} className="animate-spin text-[var(--color-primary)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                Verificando…
              </span>
            </div>
          </div>
        )}
      </div>

      {isAnswered && answerStatus === 'wrong' && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-400">
          <div className="p-4.5 rounded-xl bg-[var(--color-error-bg)]/30 border border-[var(--color-error)]/20">
            <div className="flex items-center gap-2 mb-1.5">
              <XCircle size={15} className="text-[var(--color-error)]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-error)] opacity-70">
                Resumo sugerido:
              </span>
            </div>
            <p className="text-base font-semibold text-[var(--color-text-primary)] leading-relaxed">
              {data.expected_summary}
            </p>
          </div>

          {data.key_points && data.key_points.length > 0 && (
            <div className="rounded-xl p-4 border-l-4 border-[#0891b2]/40 bg-[var(--color-surface-raised)]">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                Pontos principais
              </p>
              <ul className="list-disc pl-4 space-y-1 text-sm text-[var(--color-text-secondary)]">
                {data.key_points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {aiNote && (
            <div className="rounded-xl p-4.5 border-l-4 border-amber-500/40 bg-[var(--color-surface-raised)]">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={15} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                  Dica
                </span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
                {aiNote}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
