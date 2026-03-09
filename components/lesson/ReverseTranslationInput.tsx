'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ReverseTranslationData } from '@/types';
import { isAccentOnlyDiff } from '@/utils/accent';

interface ReverseTranslationInputProps {
  data: ReverseTranslationData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"-]/g, '')
    .replace(/\s+/g, ' ');
}

type AnswerStatus = 'idle' | 'correct' | 'accent-warning' | 'wrong';

export function ReverseTranslationInput({ data, onAnswer, answered }: ReverseTranslationInputProps) {
  const [input, setInput] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');

  const userNorm = normalize(input);
  const isCorrect =
    userNorm === normalize(data.target_translation) ||
    data.acceptable_variants.some((v) => userNorm === normalize(v));

  const isAccentWarning =
    !isCorrect &&
    (isAccentOnlyDiff(input, data.target_translation) ||
      data.acceptable_variants.some((v) => isAccentOnlyDiff(input, v)));

  function handleSubmit() {
    if (input.trim() === '' || answered) return;
    const status: AnswerStatus = isCorrect ? 'correct' : isAccentWarning ? 'accent-warning' : 'wrong';
    setAnswerStatus(status);
    onAnswer(status !== 'wrong');
  }

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
        disabled={answered}
        placeholder="Digite sua tradução aqui..."
        className="w-full resize-none rounded-2xl px-4 py-3 text-base outline-none transition-all"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: `2px solid ${
            !answered
              ? 'var(--color-border)'
              : answerStatus === 'correct'
                ? 'var(--color-success)'
                : answerStatus === 'accent-warning'
                  ? '#d97706'
                  : 'var(--color-error)'
          }`,
          color: 'var(--color-text-primary)',
          caretColor: 'var(--color-primary)',
        }}
        onFocus={(e) =>
          !answered &&
          (e.target.style.borderColor = 'var(--color-primary)')
        }
        onBlur={(e) =>
          !answered &&
          (e.target.style.borderColor = 'var(--color-border)')
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />

      {/* Accent warning */}
      {answered && answerStatus === 'accent-warning' && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
        >
          Quase! Verifique os acentos:{' '}
          <span className="font-semibold">{data.target_translation}</span>
        </div>
      )}

      {/* Show correct answer on wrong */}
      {answered && answerStatus === 'wrong' && (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Resposta certa:{' '}
          <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {data.target_translation}
          </span>
        </p>
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
      {!answered && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={input.trim() === ''}
          className="self-end rounded-xl px-5 py-2 text-sm font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: input.trim() ? 'var(--color-primary)' : 'var(--color-surface-raised)',
            color: input.trim() ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Verificar resposta
        </button>
      )}
    </div>
  );
}
