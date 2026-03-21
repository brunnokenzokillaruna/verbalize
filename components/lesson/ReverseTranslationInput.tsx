'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { ReverseTranslationData } from '@/types';
import { isAccentOnlyDiff } from '@/utils/accent';
import { validateReverseTranslation } from '@/app/actions/validateAnswer';

interface ReverseTranslationInputProps {
  data: ReverseTranslationData;
  language: string;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:'"-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

type AnswerStatus = 'idle' | 'validating' | 'correct' | 'accent-warning' | 'wrong';

export function ReverseTranslationInput({ data, language, onAnswer, answered }: ReverseTranslationInputProps) {
  const [input, setInput] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');
  const [aiNote, setAiNote] = useState<string | undefined>();

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

    // String check failed — ask AI if it's semantically correct
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
    <div className="flex flex-col gap-5">
      {/* Portuguese source */}
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: 'var(--color-bridge-bg)',
          border: '1px solid var(--color-border)',
          borderLeft: '4px solid var(--color-bridge)',
        }}
      >
        <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-bridge)' }}>
          Traduza para o idioma alvo
        </p>
        <p className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {data.portuguese_sentence}
        </p>
      </div>

      {/* Text input */}
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
        className="w-full resize-none rounded-2xl px-4 py-3 text-base outline-none transition-all"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: `2px solid ${
            !isAnswered && !isSubmitting
              ? 'var(--color-border)'
              : answerStatus === 'correct'
                ? 'var(--color-success)'
                : answerStatus === 'accent-warning'
                  ? '#d97706'
                  : answerStatus === 'validating'
                    ? 'var(--color-border)'
                    : 'var(--color-error)'
          }`,
          color: 'var(--color-text-primary)',
          caretColor: 'var(--color-primary)',
        }}
        onFocus={(e) =>
          !isAnswered && !isSubmitting &&
          (e.target.style.borderColor = 'var(--color-primary)')
        }
        onBlur={(e) =>
          !isAnswered && !isSubmitting &&
          (e.target.style.borderColor = 'var(--color-border)')
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />

      {/* Validating state */}
      {answerStatus === 'validating' && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <Loader2 size={14} className="animate-spin" />
          Verificando...
        </div>
      )}

      {/* Accent warning */}
      {isAnswered && answerStatus === 'accent-warning' && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
        >
          Quase! Verifique os acentos:{' '}
          <span className="font-semibold">{data.target_translation}</span>
        </div>
      )}

      {/* Show correct answer on wrong */}
      {isAnswered && answerStatus === 'wrong' && (
        <div className="flex flex-col gap-1">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Resposta certa:{' '}
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {data.target_translation}
            </span>
          </p>
          {aiNote && (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {aiNote}
            </p>
          )}
        </div>
      )}

      {/* Optional hint (collapsible) */}
      {data.hint && (
        <button
          type="button"
          onClick={() => setHintOpen((o) => !o)}
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {hintOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {hintOpen ? 'Ocultar dica' : 'Ver dica gramatical'}
        </button>
      )}
      {hintOpen && data.hint && (
        <p
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary-dark)',
          }}
        >
          {data.hint}
        </p>
      )}

      {/* Submit trigger — pressing Enter works too */}
      {!isAnswered && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={input.trim() === '' || isSubmitting}
          className="self-end rounded-xl px-5 py-2 text-sm font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: input.trim() && !isSubmitting ? 'var(--color-primary)' : 'var(--color-surface-raised)',
            color: input.trim() && !isSubmitting ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
            cursor: input.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
          }}
        >
          Verificar resposta
        </button>
      )}
    </div>
  );
}
