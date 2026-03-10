'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AudioPlayerButton } from './AudioPlayerButton';
import type { DictationData, SupportedLanguage } from '@/types';
import { isAccentOnlyDiff } from '@/utils/accent';

interface DictationInputProps {
  data: DictationData;
  language: SupportedLanguage;
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

export function DictationInput({ data, language, onAnswer, answered }: DictationInputProps) {
  const [input, setInput] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');

  const isCorrect = normalize(input) === normalize(data.text);
  const isAccentWarning = !isCorrect && isAccentOnlyDiff(input, data.text);

  function handleSubmit() {
    if (input.trim() === '' || answered) return;
    const status: AnswerStatus = isCorrect ? 'correct' : isAccentWarning ? 'accent-warning' : 'wrong';
    setAnswerStatus(status);
    onAnswer(status === 'correct' || status === 'accent-warning');
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Instruction */}
      <div
        className="flex flex-col items-center gap-4 rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Ouça e escreva o que ouvir
        </p>
        <AudioPlayerButton text={data.text} language={language} size="lg" />
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Toque para ouvir (pode ouvir quantas vezes quiser)
        </p>
      </div>

      {/* Text input */}
      <textarea
        rows={3}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={answered}
        placeholder="Escreva o que ouviu..."
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
        onFocus={(e) => !answered && (e.target.style.borderColor = 'var(--color-primary)')}
        onBlur={(e) => !answered && (e.target.style.borderColor = 'var(--color-border)')}
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
          <span className="font-semibold">{data.text}</span>
        </div>
      )}

      {/* Show correct text on wrong */}
      {answered && answerStatus === 'wrong' && (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Texto correto:{' '}
          <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {data.text}
          </span>
        </p>
      )}

      {/* Translation hint */}
      <button
        type="button"
        onClick={() => setHintOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm font-medium"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {hintOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        {hintOpen ? 'Ocultar tradução' : 'Ver tradução'}
      </button>
      {hintOpen && (
        <p
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary-dark)',
          }}
        >
          {data.translation}
        </p>
      )}

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
          Verificar
        </button>
      )}
    </div>
  );
}
