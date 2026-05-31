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

export function InteractiveSubtitles({ data, onAnswer, answered, setIsExerciseReady, submitTrigger }: InteractiveSubtitlesProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  
  const words = data.errorText.split(' ');
  
  const cleanWord = (w: string) => w.replace(/[.,!?;:'"]/g, '').toLowerCase();

  const toggleWord = (index: number) => {
    if (answered) return;
    const newSelected = selectedIndices.includes(index) 
      ? selectedIndices.filter(i => i !== index)
      : [...selectedIndices, index];
    
    setSelectedIndices(newSelected);
    setIsExerciseReady(newSelected.length > 0);
  };

  const handleCheck = () => {
    const normalizedWrongWords = data.wrongWords.map(cleanWord);
    const chosenWords = selectedIndices.map(idx => cleanWord(words[idx]));
    
    const isCorrect = selectedIndices.length === data.wrongWords.length && 
                      chosenWords.every(w => normalizedWrongWords.includes(w));
    onAnswer(isCorrect);
  };

  // Listen for global submit
  useEffect(() => {
    if (submitTrigger > 0 && !answered && selectedIndices.length > 0) {
      handleCheck();
    }
  }, [submitTrigger]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Elegant Translation Prompt Card */}
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
            &ldquo;{data.translations || (data as any).translation || ''}&rdquo;
          </p>
        </div>
      </div>

      {/* 2. Interactive Sentence Box */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-1">
          <AlertCircle size={14} className="text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Toque nas palavras erradas</span>
        </div>
        
        <div className="flex flex-wrap gap-x-2 gap-y-3.5 p-6 rounded-2xl bg-white/5 border border-[var(--color-border)] backdrop-blur-md shadow-inner">
          {words.map((word, idx) => {
            const isSelected = selectedIndices.includes(idx);
            const isWrongWord = data.wrongWords.some(ww => cleanWord(ww) === cleanWord(word));
            
            let btnStyles = "rounded-lg px-2.5 py-1 transition-all duration-200 border-b-2 border-transparent select-none ";
            
            if (answered) {
              if (isWrongWord) {
                // Red highlight indicating the word was indeed wrong
                btnStyles += "bg-red-500/10 border-red-500 text-red-200 font-bold shadow-inner ";
              } else if (isSelected) {
                // Selected incorrectly (false positive)
                btnStyles += "bg-white/5 text-[var(--color-text-muted)] border-white/10 opacity-30 pointer-events-none ";
              } else {
                btnStyles += "opacity-35 pointer-events-none ";
              }
            } else if (isSelected) {
              // High-fidelity selection styling before checking
              btnStyles += "bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary-dark)] font-bold shadow-md scale-[1.02] ";
            } else {
              btnStyles += "hover:bg-white/10 cursor-pointer text-[var(--color-text-primary)] ";
            }

            return (
              <span 
                key={`${word}-${idx}`} 
                onClick={() => toggleWord(idx)}
                className={`text-lg md:text-xl font-medium leading-normal ${btnStyles}`}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>

      {/* 3. Feedback Correct sentence */}
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
