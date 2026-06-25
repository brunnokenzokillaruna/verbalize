'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown, Waves } from 'lucide-react';
import { AudioPlayerButton } from './AudioPlayerButton';
import type { ConnectedSpeechData, SupportedLanguage } from '@/types';
import { isAccentOnlyDiff } from '@/utils/accent';
import { incrementProductionStats } from '@/services/firestore';
import { useAuthStore } from '@/store/authStore';

interface ConnectedSpeechExerciseProps {
  data: ConnectedSpeechData;
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

type AnswerStatus = 'idle' | 'correct' | 'accent-warning' | 'wrong';

export function ConnectedSpeechExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: ConnectedSpeechExerciseProps) {
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');

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

  const isCorrect =
    normalize(input) === normalize(data.expected_transcription) ||
    data.acceptable_variants.some((v) => normalize(input) === normalize(v));

  const isAccentWarning =
    !isCorrect &&
    (isAccentOnlyDiff(input, data.expected_transcription) ||
      data.acceptable_variants.some((v) => isAccentOnlyDiff(input, v)));

  function handleSubmit() {
    if (input.trim() === '' || answered) return;
    const status: AnswerStatus = isCorrect ? 'correct' : isAccentWarning ? 'accent-warning' : 'wrong';
    setAnswerStatus(status);
    reportProduction(status === 'correct' || status === 'accent-warning');
  }

  const isAnswered = answered || answerStatus !== 'idle';

  return (
    <div className="flex flex-col gap-7">
      <div
        className="flex items-start gap-3 rounded-xl p-4 border"
        style={{
          backgroundColor: 'rgba(13, 148, 136, 0.08)',
          borderColor: 'rgba(13, 148, 136, 0.25)',
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'rgba(13, 148, 136, 0.15)', color: '#0d9488' }}
        >
          <Waves size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#0d9488] mb-1">
            Fala conectada
          </p>
          <p className="text-sm font-medium leading-relaxed text-[var(--color-text-primary)] mb-1">
            {data.contextPt}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">{data.phenomenonPt}</p>
        </div>
      </div>

      <div
        className="flex flex-col items-center gap-3 rounded-xl p-5 border border-dashed"
        style={{
          backgroundColor: 'rgba(13, 148, 136, 0.04)',
          borderColor: 'rgba(13, 148, 136, 0.2)',
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          Segmentado → ligado
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold">
          <span className="rounded-lg bg-[var(--color-surface)] px-3 py-1.5 border border-[var(--color-border)]">
            {data.segmentedForm}
          </span>
          <ArrowRight size={16} className="text-[#0d9488] shrink-0" />
          <span
            className="rounded-lg px-3 py-1.5 border"
            style={{
              backgroundColor: 'rgba(13, 148, 136, 0.12)',
              borderColor: 'rgba(13, 148, 136, 0.35)',
              color: '#0f766e',
            }}
          >
            {data.linkedForm}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 rounded-xl p-8 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]">
        <AudioPlayerButton text={data.audioText} language={language} size="lg" />
        <p className="text-xs font-medium text-center leading-relaxed text-[var(--color-text-muted)] opacity-70 max-w-[240px]">
          Ouça e escreva a frase completa em ortografia padrão.
        </p>
      </div>

      <div className="relative group">
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isAnswered}
          placeholder="Escreva o que ouviu..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className="w-full resize-none rounded-xl bg-[var(--color-surface-raised)] px-6 py-5 text-base font-medium outline-none transition-all duration-300 ring-1 shadow-inner"
          style={{
            borderColor: !isAnswered
              ? 'var(--color-border)'
              : answerStatus === 'correct'
                ? 'var(--color-success)'
                : answerStatus === 'accent-warning'
                  ? '#d97706'
                  : 'var(--color-error)',
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
      </div>

      {isAnswered && answerStatus === 'accent-warning' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 animate-in fade-in zoom-in-95 duration-300">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1 opacity-80">
            Quase lá! Atenção aos acentos:
          </p>
          <p className="text-sm font-semibold text-amber-900 italic">{data.expected_transcription}</p>
        </div>
      )}

      {isAnswered && answerStatus === 'wrong' && (
        <div className="p-4 rounded-xl bg-[var(--color-error-bg)]/30 border border-[var(--color-error)]/20 animate-in fade-in slide-in-from-top-2 duration-400">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-error)] mb-1 opacity-70">
            Transcrição correta:
          </p>
          <p className="text-sm font-semibold text-[var(--color-text-primary)] italic mb-2">
            {data.expected_transcription}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            <span className="font-semibold">Como soa:</span> {data.linkedForm}
          </p>
        </div>
      )}

      {isAnswered && (answerStatus === 'correct' || answerStatus === 'accent-warning') && (
        <div
          className="p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-400"
          style={{
            backgroundColor: 'rgba(13, 148, 136, 0.08)',
            borderColor: 'rgba(13, 148, 136, 0.25)',
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#0d9488] mb-1">
            Por que funciona
          </p>
          <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">{data.explanationPt}</p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => setHintOpen((o) => !o)}
          className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors uppercase tracking-widest group"
        >
          <div className={`transition-transform duration-300 ${hintOpen ? 'rotate-180' : ''}`}>
            <ChevronDown size={14} />
          </div>
          {hintOpen ? 'Esconder tradução' : 'Ver tradução'}
        </button>
        {hintOpen && (
          <div className="p-4 rounded-xl bg-[var(--color-primary-light)] ring-1 ring-[var(--color-primary)]/10 animate-in slide-in-from-top-2 duration-300">
            <p className="text-xs italic leading-relaxed text-[var(--color-primary-dark)]">{data.translation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
