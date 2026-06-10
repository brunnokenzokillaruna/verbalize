'use client';

import { useMemo, useState, useEffect } from 'react';
import type { ConjugationSpeedData, SupportedLanguage } from '@/types';
import {
  inferLanguageFromPronoun,
  stripPronounPrefix,
  TENSE_LABELS,
} from '@/utils/conjugationHelper';

interface ConjugationSpeedExerciseProps {
  data: ConjugationSpeedData;
  language?: SupportedLanguage;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function ConjugationSpeedExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: ConjugationSpeedExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const lang = language ?? inferLanguageFromPronoun(data.pronoun);
  const correctVerbForm = useMemo(
    () => stripPronounPrefix(data.correctForm, lang, data.pronoun),
    [data.correctForm, data.pronoun, lang],
  );
  const tenseLabel = TENSE_LABELS[data.tense] ?? data.tense;

  // Deduplicate verb-only options, then shuffle once
  const shuffledOptions = useMemo(() => {
    const seen = new Set<string>();
    const uniqueOptions = data.options
      .map((opt) => stripPronounPrefix(opt, lang, data.pronoun))
      .filter((opt) => {
        if (!opt || seen.has(opt)) return false;
        seen.add(opt);
        return true;
      });
    const opts = uniqueOptions.map((text) => ({ text }));
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [data.options, data.pronoun, lang]);

  useEffect(() => {
    if (!answered) {
      setIsExerciseReady(selectedIndex !== null);
    } else {
      setIsExerciseReady(false);
    }
  }, [selectedIndex, answered, setIsExerciseReady]);

  useEffect(() => {
    if (submitTrigger > 0 && !answered && selectedIndex !== null) {
      onAnswer(shuffledOptions[selectedIndex].text === correctVerbForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  function handleSelect(index: number) {
    if (answered || selectedIndex !== null) return;
    setSelectedIndex(index);
    onAnswer(shuffledOptions[index].text === correctVerbForm);
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Header badge */}
      <div
        className="flex items-start gap-3 rounded-xl p-4"
        style={{
          backgroundColor: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.25)',
        }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
          style={{ backgroundColor: 'rgba(99,102,241,0.15)' }}
        >
          ⚡
        </div>
        <div className="flex flex-col gap-1">
          <span
            className="text-[9px] font-black uppercase tracking-[0.2em]"
            style={{ color: '#6366f1' }}
          >
            Conjugação Relâmpago
          </span>
          <p
            className="text-sm font-medium leading-relaxed"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Conjugue o verbo rapidamente!
          </p>
        </div>
      </div>

      {/* Verb + pronoun challenge card */}
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.06) 100%)',
          border: '2px solid rgba(99,102,241,0.2)',
        }}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3 opacity-60" style={{ color: 'var(--color-text-muted)' }}>
          {tenseLabel}
        </p>
        <div className="flex items-baseline justify-center gap-3">
          <span
            className="text-2xl font-black"
            style={{ color: '#6366f1' }}
          >
            {data.pronoun}
          </span>
          <span className="text-lg text-[var(--color-text-muted)]">+</span>
          <span
            className="text-2xl font-black italic"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {data.verb}
          </span>
          <span className="text-lg text-[var(--color-text-muted)]">=</span>
          <span className="text-2xl font-black text-[var(--color-text-muted)]">?</span>
        </div>
      </div>

      {/* 4 option buttons — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {shuffledOptions.map((opt, i) => {
          const isSelected = selectedIndex === i;
          const isCorrectOpt = opt.text === correctVerbForm;

          let bgColor = 'var(--color-surface)';
          let borderColor = 'var(--color-border)';
          let textColor = 'var(--color-text-primary)';

          if (answered && isCorrectOpt) {
            bgColor = 'var(--color-success-bg)';
            borderColor = 'var(--color-success)';
            textColor = 'var(--color-success)';
          } else if (answered && isSelected && !isCorrectOpt) {
            bgColor = 'var(--color-error-bg)';
            borderColor = 'var(--color-error)';
            textColor = 'var(--color-error)';
          } else if (!answered && isSelected) {
            bgColor = 'var(--color-primary-light)';
            borderColor = 'var(--color-primary)';
            textColor = 'var(--color-primary-dark)';
          }

          return (
            <button
              key={i}
              type="button"
              disabled={answered || selectedIndex !== null}
              onClick={() => handleSelect(i)}
              className="rounded-xl px-4 py-3.5 text-center text-base font-bold transition-all duration-300 active:scale-[0.97]"
              style={{
                backgroundColor: bgColor,
                border: `2px solid ${borderColor}`,
                color: textColor,
                cursor: answered || selectedIndex !== null ? 'default' : 'pointer',
              }}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p className="text-sm font-semibold italic leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
              {data.exampleSentence}
            </p>
            <p className="mt-1.5 text-xs italic text-[var(--color-text-muted)]">
              {data.translation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
