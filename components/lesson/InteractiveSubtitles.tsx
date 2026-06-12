'use client';

import React, { useState, useEffect } from 'react';
import { InteractiveSubtitlesData } from '@/types';
import { CheckCircle2, AlertCircle, Languages } from 'lucide-react';

interface InteractiveSubtitlesProps {
  data: InteractiveSubtitlesData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

type Phase = 'detect' | 'correct';

export function InteractiveSubtitles({ data, onAnswer, answered, setIsExerciseReady, submitTrigger }: InteractiveSubtitlesProps) {
  const [phase, setPhase] = useState<Phase>('detect');
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [detectCorrect, setDetectCorrect] = useState<boolean | null>(null);

  const words = data.errorText.split(' ');
  const correctionEntries = data.corrections ?? [];

  const cleanWord = (w: string) => w.replace(/[.,!?;:'"]/g, '').toLowerCase();

  const toggleWord = (index: number) => {
    if (answered || phase !== 'detect') return;
    const newSelected = selectedIndices.includes(index)
      ? selectedIndices.filter(i => i !== index)
      : [...selectedIndices, index];
    setSelectedIndices(newSelected);
    setIsExerciseReady(newSelected.length > 0);
  };

  const handleDetectCheck = () => {
    const normalizedWrongWords = data.wrongWords.map(cleanWord);
    const chosenWords = selectedIndices.map(idx => cleanWord(words[idx]));
    const isCorrect =
      selectedIndices.length === data.wrongWords.length &&
      chosenWords.every(w => normalizedWrongWords.includes(w));
    setDetectCorrect(isCorrect);
    if (!isCorrect) {
      onAnswer(false);
      return;
    }
    if (correctionEntries.length === 0) {
      onAnswer(true);
      return;
    }
    setPhase('correct');
    setIsExerciseReady(false);
  };

  const handleCorrectionSelect = (wrong: string, chosen: string) => {
    if (answered) return;
    setCorrections(prev => ({ ...prev, [wrong]: chosen }));
  };

  useEffect(() => {
    if (phase !== 'correct' || answered) return;
    const allDone = correctionEntries.every((c) => corrections[c.wrong]);
    setIsExerciseReady(allDone);
  }, [corrections, correctionEntries, phase, answered, setIsExerciseReady]);

  const handleFinalCheck = () => {
    const allCorrect = correctionEntries.every(
      (c) => corrections[c.wrong] === c.correct,
    );
    onAnswer(allCorrect);
  };

  useEffect(() => {
    if (submitTrigger === 0 || answered) return;
    if (phase === 'detect' && selectedIndices.length > 0) {
      handleDetectCheck();
    } else if (phase === 'correct') {
      handleFinalCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div
        className="rounded-2xl p-4.5 border border-dashed border-[var(--color-border)] backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)' }}
      >
        <div className="flex items-center gap-2 mb-2.5 text-[var(--color-text-muted)]">
          <Languages size={15} className="text-[var(--color-vocab)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Frase em português:</span>
        </div>
        <div className="border-l-4 border-[var(--color-vocab)] pl-3.5 py-1">
          <p className="text-[17px] font-semibold text-[var(--color-text-primary)] leading-relaxed italic">
            &ldquo;{data.translations}&rdquo;
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-1">
          <AlertCircle size={14} className="text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">
            {phase === 'detect' ? 'Toque nas palavras erradas' : 'Escolha a correção para cada palavra'}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-2 gap-y-3.5 p-6 rounded-2xl bg-white/5 border border-[var(--color-border)] backdrop-blur-md shadow-inner">
          {words.map((word, idx) => {
            const isSelected = selectedIndices.includes(idx);
            const isWrongWord = data.wrongWords.some(ww => cleanWord(ww) === cleanWord(word));

            let btnStyles = "rounded-lg px-2.5 py-1 transition-all duration-200 border-b-2 border-transparent select-none ";

            if (answered) {
              if (isWrongWord) {
                btnStyles += "bg-red-500/10 border-red-500 text-red-200 font-bold shadow-inner ";
              } else if (isSelected) {
                btnStyles += "bg-white/5 text-[var(--color-text-muted)] border-white/10 opacity-30 pointer-events-none ";
              } else {
                btnStyles += "opacity-35 pointer-events-none ";
              }
            } else if (phase === 'detect') {
              if (isSelected) {
                btnStyles += "bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary-dark)] font-bold shadow-md scale-[1.02] ";
              } else {
                btnStyles += "hover:bg-white/10 cursor-pointer text-[var(--color-text-primary)] ";
              }
            } else {
              btnStyles += isWrongWord
                ? "bg-amber-500/10 border-amber-500/40 text-amber-200 font-bold "
                : "opacity-50 pointer-events-none ";
            }

            return (
              <span
                key={`${word}-${idx}`}
                onClick={() => toggleWord(idx)}
                className={`text-lg md:text-xl font-medium leading-normal ${btnStyles}`}
              >
                {phase === 'correct' && isWrongWord && corrections[data.wrongWords.find(w => cleanWord(w) === cleanWord(word)) ?? '']
                  ? corrections[data.wrongWords.find(w => cleanWord(w) === cleanWord(word)) ?? '']
                  : word}
              </span>
            );
          })}
        </div>
      </div>

      {phase === 'correct' && !answered && (
        <div className="flex flex-col gap-4">
          {correctionEntries.map((entry) => (
            <div key={entry.wrong} className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Corrija: <span className="text-red-400">{entry.wrong}</span>
              </p>
              <div className="grid grid-cols-1 gap-2">
                {entry.options.map((opt) => {
                  const picked = corrections[entry.wrong] === opt;
                  const isCorrectOpt = opt === entry.correct;
                  let styles = "rounded-xl px-4 py-3 text-sm font-semibold border transition-all ";
                  if (answered) {
                    styles += isCorrectOpt
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : picked
                        ? "border-red-500/40 bg-red-500/10"
                        : "opacity-40";
                  } else {
                    styles += picked
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-primary)]/30";
                  }
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={answered}
                      onClick={() => handleCorrectionSelect(entry.wrong, opt)}
                      className={styles}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {answered && detectCorrect === false && (
        <p className="text-sm text-[var(--color-text-muted)]">
          Palavras erradas: {data.wrongWords.join(', ')}
        </p>
      )}

      {answered && (
        <div className="flex flex-col gap-2.5 p-5 rounded-2xl bg-[rgba(16,185,129,0.04)] border border-emerald-500/30 animate-in slide-in-from-top-2 duration-400">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 opacity-90">Frase Correta</span>
          </div>
          <p className="text-lg text-[var(--color-text-primary)] leading-relaxed font-bold italic pl-0.5">
            {data.correctText}
          </p>
        </div>
      )}
    </div>
  );
}
