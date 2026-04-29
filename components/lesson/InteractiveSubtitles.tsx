import React, { useState } from 'react';
import { InteractiveSubtitlesData } from '@/types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface InteractiveSubtitlesProps {
  data: InteractiveSubtitlesData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
}

export function InteractiveSubtitles({ data, onAnswer, answered, setIsExerciseReady }: InteractiveSubtitlesProps) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  
  const words = data.errorText.split(' ');
  
  const cleanWord = (w: string) => w.replace(/[.,!?;:'"]/g, '').toLowerCase();

  const toggleWord = (word: string) => {
    if (answered) return;
    const newSelected = selectedWords.includes(word) 
      ? selectedWords.filter(w => w !== word)
      : [...selectedWords, word];
    
    setSelectedWords(newSelected);
    setIsExerciseReady(newSelected.length > 0);
  };

  const handleCheck = () => {
    const normalizedWrongWords = data.wrongWords.map(cleanWord);
    const isCorrect = selectedWords.length === data.wrongWords.length && 
                      selectedWords.every(w => normalizedWrongWords.includes(cleanWord(w)));
    onAnswer(isCorrect);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <AlertCircle size={14} />
          <span className="text-xs font-semibold uppercase tracking-widest">Toque nas palavras erradas</span>
        </div>
        
        <div className="flex flex-wrap gap-x-2 gap-y-3 p-6 rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-md">
          {words.map((word, idx) => {
            const isSelected = selectedWords.includes(word);
            const isWrong = data.wrongWords.some(ww => cleanWord(ww) === cleanWord(word));
            
            let btnStyles = "px-1.5 py-0.5 rounded-md transition-all duration-200 border-b-2 border-transparent ";
            if (isSelected) btnStyles += "bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-[var(--color-primary)] font-bold ";
            else btnStyles += "hover:bg-white/10 cursor-pointer ";
            
            if (answered) {
              if (isWrong) btnStyles = "px-1.5 py-0.5 rounded-md bg-red-500/20 border-b-2 border-red-500 text-red-200 font-bold ";
              else if (isSelected) btnStyles = "px-1.5 py-0.5 rounded-md bg-white/10 opacity-50 ";
            }

            return (
              <span 
                key={`${word}-${idx}`} 
                onClick={() => toggleWord(word)}
                className={`text-lg md:text-xl ${btnStyles}`}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/5 italic text-sm text-[var(--color-text-muted)]">
        &quot;{data.translations}&quot;
      </div>

      {!answered && (
        <button 
          onClick={handleCheck}
          className="py-4 px-8 rounded-2xl bg-white text-black font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Confirmar Seleção
        </button>
      )}

      {answered && (
        <div className="flex flex-col gap-2 p-5 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 size={16} />
            <span>Frase Correta:</span>
          </div>
          <p className="text-lg text-emerald-200/90 leading-relaxed font-medium">
            {data.correctText}
          </p>
        </div>
      )}
    </div>
  );
}
