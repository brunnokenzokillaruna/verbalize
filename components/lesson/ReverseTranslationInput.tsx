'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import type { ReverseTranslationData } from '@/types';
import { isAccentOnlyDiff } from '@/utils/accent';
import { validateReverseTranslation } from '@/app/actions/validateAnswer';

interface ReverseTranslationInputProps {
  data: ReverseTranslationData;
  language: string;
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

export function ReverseTranslationInput({ 
  data, 
  language, 
  onAnswer, 
  answered,
  setIsExerciseReady,
  submitTrigger
}: ReverseTranslationInputProps) {
  const [input, setInput] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');
  const [aiNote, setAiNote] = useState<string | undefined>();

  // Notify parent of readiness
  useEffect(() => {
    if (!answered) {
      setIsExerciseReady(input.trim().length > 0);
    } else {
      setIsExerciseReady(false);
    }
  }, [input, answered, setIsExerciseReady]);

  // Listen for global submit
  useEffect(() => {
    if (submitTrigger > 0 && !answered) {
      handleSubmit();
    }
  }, [submitTrigger]);

  const userNorm = normalize(input);
  const isCorrect =
    userNorm === normalize(data.target_translation) ||
    data.acceptable_variants.some((v) => userNorm === normalize(v));

  const isAccentWarning =
    !isCorrect &&
    (isAccentOnlyDiff(input, data.target_translation) ||
      data.acceptable_variants.some((v) => isAccentOnlyDiff(input, v)));

  async function handleSubmit() {
    if (input.trim() === '' || answered || answerStatus === 'validating') return;

    if (isCorrect) {
      setAnswerStatus('correct');
      onAnswer(true);
      return;
    }

    if (isAccentWarning) {
      setAnswerStatus('accent-warning');
      onAnswer(true);
      return;
    }

    setAnswerStatus('validating');
    const result = await validateReverseTranslation(
      input,
      data.target_translation,
      data.portuguese_sentence,
      language,
    );

    if (result.accepted) {
      setAnswerStatus('correct');
      onAnswer(true);
    } else {
      setAiNote(result.note);
      setAnswerStatus('wrong');
      onAnswer(false);
    }
  }

  const isSubmitting = answerStatus === 'validating';
  const isAnswered = answered || (answerStatus !== 'idle' && answerStatus !== 'validating');

  return (
    <div className="flex flex-col gap-6">
      {/* Portuguese source */}
      <div className="rounded-xl p-5 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]">
        <div className="flex items-center gap-2 mb-2 opacity-60">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Traduza para o idioma alvo
          </span>
        </div>
        <p className="font-display text-lg font-bold leading-relaxed text-[var(--color-text-primary)]">
          {data.portuguese_sentence}
        </p>
      </div>

      {/* Text input container */}
      <div className="relative group">
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isAnswered || isSubmitting}
          placeholder="Digite sua tradução aqui..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className="w-full resize-none rounded-xl bg-[var(--color-surface-raised)] px-6 py-5 text-base font-medium outline-none transition-all duration-300 ring-1 shadow-inner"
          style={{
            borderColor: 
              answerStatus === 'correct'
                ? 'var(--color-success)'
                : answerStatus === 'accent-warning'
                  ? '#d97706'
                  : answerStatus === 'wrong'
                    ? 'var(--color-error)'
                    : 'var(--color-border)',
            boxShadow: 
              answerStatus === 'correct'
                ? '0 0 0 3px rgba(34, 197, 94, 0.1), inset 0 2px 4px rgba(0,0,0,0.05)'
                : answerStatus === 'accent-warning'
                  ? '0 0 0 3px rgba(217, 119, 6, 0.1), inset 0 2px 4px rgba(0,0,0,0.05)'
                  : answerStatus === 'wrong'
                    ? '0 0 0 3px rgba(239, 68, 68, 0.1), inset 0 2px 4px rgba(0,0,0,0.05)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.02)',
            color: 'var(--color-text-primary)',
            caretColor: 'var(--color-primary)',
          }}
          onFocus={(e) => {
            if (!isAnswered && !isSubmitting) {
              e.target.style.borderColor = 'var(--color-primary)';
            }
          }}
          onBlur={(e) => {
            if (!isAnswered && !isSubmitting) {
              e.target.style.borderColor = 'var(--color-border)';
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        
        {isSubmitting && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center animate-in fade-in duration-300">
            <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
              <Loader2 size={12} className="animate-spin text-[var(--color-primary)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Verificando</span>
            </div>
          </div>
        )}
      </div>

      {/* Accent warning */}
      {isAnswered && answerStatus === 'accent-warning' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 animate-in fade-in zoom-in-95 duration-300">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1 opacity-80">
            Quase lá! Atenção aos acentos:
          </p>
          <p className="text-sm font-semibold text-amber-900 italic">
            {data.target_translation}
          </p>
        </div>
      )}

      {/* Correct answer display on wrong */}
      {isAnswered && answerStatus === 'wrong' && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-400">
          <div className="p-4 rounded-xl bg-[var(--color-error-bg)]/30 border border-[var(--color-error)]/20">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-error)] mb-1 opacity-70">
              Resposta sugerida:
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-relaxed italic">
              {data.target_translation}
            </p>
          </div>
          
          {aiNote && (
            <div className="px-1">
              <p className="text-xs leading-relaxed text-[var(--color-text-muted)] italic opacity-80">
                <span className="font-bold mr-1 opacity-50">Note:</span> {aiNote}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Optional hint (collapsible) */}
      {data.hint && (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setHintOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors uppercase tracking-widest group"
          >
            <div className={`transition-transform duration-300 ${hintOpen ? 'rotate-180' : ''}`}>
              <ChevronDown size={14} />
            </div>
            {hintOpen ? 'Esconder ajuda' : 'Precisa de uma dica?'}
          </button>
          
          {hintOpen && (
            <div className="p-4 rounded-xl bg-[var(--color-primary-light)] ring-1 ring-[var(--color-primary)]/10 animate-in slide-in-from-top-2 duration-300">
              <p className="text-xs italic leading-relaxed text-[var(--color-primary-dark)]">
                {data.hint}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
