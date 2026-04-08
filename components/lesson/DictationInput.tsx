'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AudioPlayerButton } from './AudioPlayerButton';
import type { DictationData, SupportedLanguage } from '@/types';
import { isAccentOnlyDiff } from '@/utils/accent';

interface DictationInputProps {
  data: DictationData;
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

export function DictationInput({ 
  data, 
  language, 
  onAnswer, 
  answered,
  setIsExerciseReady,
  submitTrigger
}: DictationInputProps) {
  const [input, setInput] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');

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

  const isCorrect = normalize(input) === normalize(data.text);
  const isAccentWarning = !isCorrect && isAccentOnlyDiff(input, data.text);

  function handleSubmit() {
    if (input.trim() === '' || answered) return;
    const status: AnswerStatus = isCorrect ? 'correct' : isAccentWarning ? 'accent-warning' : 'wrong';
    setAnswerStatus(status);
    onAnswer(status === 'correct' || status === 'accent-warning');
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Instruction */}
      <div
        className="flex flex-col items-center gap-5 rounded-xl p-8 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]"
      >
        <div className="flex items-center gap-2 opacity-60">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Ditado Inteligente
          </span>
        </div>
        
        <AudioPlayerButton text={data.text} language={language} size="lg" />
        
        <p className="text-xs font-medium text-center leading-relaxed text-[var(--color-text-muted)] opacity-70 max-w-[200px]">
          Ouça e escreva o que ouvir. Você pode repetir quantas vezes precisar.
        </p>
      </div>

      {/* Text input container */}
      <div className="relative group">
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={answered}
          placeholder="Escreva o que ouviu..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className="w-full resize-none rounded-xl bg-[var(--color-surface-raised)] px-6 py-5 text-base font-medium outline-none transition-all duration-300 ring-1 shadow-inner"
          style={{
            borderColor: 
              !answered
                ? 'var(--color-border)'
                : answerStatus === 'correct'
                  ? 'var(--color-success)'
                  : answerStatus === 'accent-warning'
                    ? '#d97706'
                    : 'var(--color-error)',
            boxShadow: 
              answered && answerStatus === 'correct'
                ? '0 0 0 3px rgba(34, 197, 94, 0.1), inset 0 2px 4px rgba(0,0,0,0.05)'
                : answered && answerStatus === 'accent-warning'
                  ? '0 0 0 3px rgba(217, 119, 6, 0.1), inset 0 2px 4px rgba(0,0,0,0.05)'
                  : answered && answerStatus === 'wrong'
                    ? '0 0 0 3px rgba(239, 68, 68, 0.1), inset 0 2px 4px rgba(0,0,0,0.05)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.02)',
            color: 'var(--color-text-primary)',
            caretColor: 'var(--color-primary)',
          }}
          onFocus={(e) => {
            if (!answered) {
              e.target.style.borderColor = 'var(--color-primary)';
            }
          }}
          onBlur={(e) => {
            if (!answered) {
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
      </div>

      {/* Accent warning */}
      {answered && answerStatus === 'accent-warning' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 animate-in fade-in zoom-in-95 duration-300">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1 opacity-80">
            Quase lá! Atenção aos acentos:
          </p>
          <p className="text-sm font-semibold text-amber-900 italic">
            {data.text}
          </p>
        </div>
      )}

      {/* Show correct text on wrong */}
      {answered && answerStatus === 'wrong' && (
        <div className="p-4 rounded-xl bg-[var(--color-error-bg)]/30 border border-[var(--color-error)]/20 animate-in fade-in slide-in-from-top-2 duration-400">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-error)] mb-1 opacity-70">
            Texto correto:
          </p>
          <p className="text-sm font-semibold text-[var(--color-text-primary)] italic">
            {data.text}
          </p>
        </div>
      )}

      {/* Translation hint (collapsible) */}
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
            <p className="text-xs italic leading-relaxed text-[var(--color-primary-dark)]">
              {data.translation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
