import React, { useState, useEffect } from 'react';
import type { SentenceBuilderData } from '@/types';
import { Languages, CheckCircle2, XCircle } from 'lucide-react';

interface SentenceBuilderProps {
  data: SentenceBuilderData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function SentenceBuilder({ 
  data, 
  onAnswer, 
  answered,
  setIsExerciseReady,
  submitTrigger
}: SentenceBuilderProps) {
  // Store the randomized list of words once, so they stay at static positions.
  const [shuffled] = useState<string[]>(() => {
    const wordsFromCorrect = [...data.correctOrder];
    // Shuffle
    return wordsFromCorrect.sort(() => Math.random() - 0.5);
  });

  // Track the indices of selected words in the order they were selected.
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Notify parent of readiness
  useEffect(() => {
    if (!answered) {
      setIsExerciseReady(selectedIndices.length > 0);
    } else {
      setIsExerciseReady(false);
    }
  }, [selectedIndices, answered, setIsExerciseReady]);

  // Listen for global submit
  useEffect(() => {
    if (submitTrigger > 0 && !answered && selectedIndices.length > 0) {
      handleSubmit();
    }
  }, [submitTrigger]);

  const assembledSentence = selectedIndices.map(idx => shuffled[idx]).join(' ');
  const correctAnswer = data.correctOrder.join(' ');

  function handleSubmit() {
    onAnswer(assembledSentence.toLowerCase() === correctAnswer.toLowerCase());
  }

  function handleWordClick(index: number) {
    if (answered) return;
    
    const isAlreadySelected = selectedIndices.includes(index);
    if (isAlreadySelected) {
      // Remove from selected (return to bank)
      const newSelected = selectedIndices.filter(idx => idx !== index);
      setSelectedIndices(newSelected);
    } else {
      // Add to selected (move to assembled)
      const newSelected = [...selectedIndices, index];
      setSelectedIndices(newSelected);
      // Auto-check when all words are placed
      if (newSelected.length === shuffled.length) {
        onAnswer(newSelected.map(idx => shuffled[idx]).join(' ').toLowerCase() === correctAnswer.toLowerCase());
      }
    }
  }

  const isCorrect = assembledSentence.toLowerCase() === correctAnswer.toLowerCase();

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
            {data.translation}
          </p>
        </div>
      </div>

      {/* 2. Assembled Area (The Sentence Desk) */}
      <div
        className="min-h-[120px] w-full flex items-center justify-center rounded-2xl p-6 transition-all duration-300 relative overflow-hidden"
        style={{
          backgroundColor: 'var(--color-surface-raised)',
          border: `1.5px solid ${answered ? (isCorrect ? 'var(--color-success)' : 'var(--color-error)') : 'var(--color-border)'}`,
          boxShadow: answered 
            ? (isCorrect ? '0 0 20px rgba(16, 185, 129, 0.05)' : '0 0 20px rgba(239, 68, 68, 0.05)')
            : 'inset 0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        {selectedIndices.length === 0 ? (
          <p className="text-xs text-center font-bold opacity-30 text-[var(--color-text-muted)] uppercase tracking-[0.15em] leading-relaxed max-w-[250px] select-none">
            Toque nas palavras abaixo para montar a frase
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
            {selectedIndices.map((shuffledIndex, i) => {
              const word = shuffled[shuffledIndex];
              return (
                <button
                  key={i}
                  type="button"
                  disabled={answered}
                  onClick={() => handleWordClick(shuffledIndex)}
                  className="group relative rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 shadow-sm border"
                  style={{
                    backgroundColor: answered
                      ? isCorrect
                        ? 'var(--color-success-bg)'
                        : 'var(--color-error-bg)'
                      : 'var(--color-surface)',
                    color: answered
                      ? isCorrect
                        ? 'var(--color-success)'
                        : 'var(--color-error)'
                      : 'var(--color-text-primary)',
                    borderColor: answered
                      ? (isCorrect ? 'var(--color-success)' : 'var(--color-error)')
                      : 'var(--color-border)',
                  }}
                >
                  {word}
                  {!answered && (
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Correct order shown on incorrect answer */}
      {answered && !isCorrect && (
        <div 
          className="rounded-xl p-4.5 border-l-4 border-[var(--color-error)] animate-in slide-in-from-top-2 duration-300"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <XCircle size={15} className="text-[var(--color-error)]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
              Ordem correta:
            </span>
          </div>
          <p className="text-base font-semibold text-[var(--color-text-primary)] pl-0.5">
            {correctAnswer}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="relative my-1 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[var(--color-border)] opacity-30"></div>
        </div>
        <span className="relative rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] opacity-85 select-none">
          Banco de palavras
        </span>
      </div>

      {/* 3. Word Bank (Stable layouts with ghost cards) */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 px-2 mt-1 min-h-[50px]">
        {shuffled.map((word, index) => {
          const isSelected = selectedIndices.includes(index);

          if (isSelected) {
            // Render a pixel-perfect matching ghost card to preserve layout spacing
            return (
              <div
                key={index}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold select-none border border-dashed border-white/5 text-transparent pointer-events-none"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.015)',
                  userSelect: 'none',
                }}
              >
                {word}
              </div>
            );
          }

          return (
            <button
              key={index}
              type="button"
              disabled={answered}
              onClick={() => handleWordClick(index)}
              className="group relative rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 active:scale-95 shadow-sm border border-white/5"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                borderColor: 'var(--color-border)',
                cursor: answered ? 'default' : 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
              }}
            >
              {word}
              {!answered && (
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}
