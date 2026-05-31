import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Loader2, Languages, Lightbulb, CheckCircle2, XCircle } from 'lucide-react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const frenchAccents = ['é', 'à', 'è', 'ù', 'ç', 'œ', 'ê', 'â', 'ô', 'î', 'ë', 'ï'];

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

  function insertAccent(char: string) {
    if (isAnswered || isSubmitting) return;
    setInput((prev) => prev + char);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }

  const isSubmitting = answerStatus === 'validating';
  const isAnswered = answered || (answerStatus !== 'idle' && answerStatus !== 'validating');

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Elegant Translation Prompt Card */}
      <div 
        className="rounded-2xl p-4.5 border border-dashed border-[var(--color-border)] backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)' }}
      >
        <div className="flex items-center gap-2 mb-2.5 text-[var(--color-text-muted)]">
          <Languages size={15} className="text-[var(--color-vocab)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Como se diz em francês?</span>
        </div>
        <div className="border-l-4 border-[var(--color-vocab)] pl-3.5 py-1">
          <p className="text-[17px] font-semibold text-[var(--color-text-primary)] leading-relaxed">
            {data.portuguese_sentence}
          </p>
        </div>
      </div>

      {/* 2. Text input container */}
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
            boxShadow: 
              answerStatus === 'correct'
                ? '0 0 15px rgba(34, 197, 94, 0.05), inset 0 2px 4px rgba(0,0,0,0.05)'
                : answerStatus === 'accent-warning'
                  ? '0 0 15px rgba(217, 119, 6, 0.05), inset 0 2px 4px rgba(0,0,0,0.05)'
                  : answerStatus === 'wrong'
                    ? '0 0 15px rgba(239, 68, 68, 0.05), inset 0 2px 4px rgba(0,0,0,0.05)'
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
            <div className="flex items-center gap-2 rounded-full bg-white/80 dark:bg-zinc-800/80 px-3.5 py-1 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
              <Loader2 size={12} className="animate-spin text-[var(--color-primary)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Verificando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Accent helper keyboard for French */}
      {!isAnswered && language === 'fr' && (
        <div className="flex items-center gap-1.5 flex-wrap px-1 animate-in fade-in duration-300">
          {frenchAccents.map((char) => (
            <button
              key={char}
              type="button"
              onClick={() => insertAccent(char)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-primary)] transition-all duration-100 hover:bg-[var(--color-surface-raised)] hover:scale-105 active:scale-95 shadow-sm"
            >
              {char}
            </button>
          ))}
        </div>
      )}

      {/* Accent warning */}
      {isAnswered && answerStatus === 'accent-warning' && (
        <div className="p-4.5 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-in fade-in zoom-in-95 duration-300">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-500 mb-1 opacity-90">
            Quase lá! Atenção aos acentos:
          </p>
          <p className="text-sm font-bold text-[var(--color-text-primary)] italic">
            {data.target_translation}
          </p>
        </div>
      )}

      {/* Correct answer display on wrong */}
      {isAnswered && answerStatus === 'wrong' && (
        <div className="flex flex-col gap-4.5 animate-in fade-in slide-in-from-top-2 duration-400">
          <div className="p-4.5 rounded-xl bg-[var(--color-error-bg)]/30 border border-[var(--color-error)]/20">
            <div className="flex items-center gap-2 mb-1.5">
              <XCircle size={15} className="text-[var(--color-error)]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-error)] opacity-70">
                Resposta sugerida:
              </span>
            </div>
            <p className="text-base font-semibold text-[var(--color-text-primary)] leading-relaxed italic pl-0.5">
              {data.target_translation}
            </p>
          </div>
          
          {aiNote && (
            <div 
              className="rounded-xl p-4.5 border-l-4 border-amber-500/40"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={15} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                  Análise Gramatical
                </span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
                {aiNote}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Optional hint (collapsible) */}
      {data.hint && (
        <div className="flex flex-col gap-2.5 mt-1">
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
            <div className="p-4.5 rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/10 animate-in slide-in-from-top-2 duration-300">
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
