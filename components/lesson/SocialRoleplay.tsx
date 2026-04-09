import React, { useState } from 'react';
import { SocialRoleplayData } from '@/types';
import { MessageSquare, CheckCircle2, XCircle } from 'lucide-react';

interface SocialRoleplayProps {
  data: SocialRoleplayData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
}

export function SocialRoleplay({ data, onAnswer, answered, setIsExerciseReady }: SocialRoleplayProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelectedIndex(index);
    onAnswer(index === data.correctIndex);
    setIsExerciseReady(true);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2 text-[var(--color-text-muted)]">
          <MessageSquare size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">{data.context}</span>
        </div>
        <p className="text-lg font-medium text-[var(--color-text-primary)] leading-relaxed">
          {data.promptLine}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {data.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = index === data.correctIndex;
          
          let stateStyles = "bg-white/5 ring-1 ring-white/10 hover:bg-white/10";
          if (answered) {
            if (isCorrect) stateStyles = "bg-emerald-500/20 ring-1 ring-emerald-500/50 text-emerald-200";
            else if (isSelected) stateStyles = "bg-red-500/20 ring-1 ring-red-500/50 text-red-200";
            else stateStyles = "opacity-40 grayscale-[0.5]";
          }

          return (
            <button
              key={index}
              disabled={answered}
              onClick={() => handleSelect(index)}
              className={`flex items-center justify-between w-full p-4 rounded-xl text-left transition-all duration-200 ${stateStyles}`}
            >
              <span className="text-base">{option}</span>
              {answered && isCorrect && <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />}
              {answered && isSelected && !isCorrect && <XCircle size={18} className="text-red-500 shrink-0" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-2 p-4 rounded-xl bg-[var(--color-primary-light)] ring-1 ring-[var(--color-primary)]/20 animate-in zoom-in-95 duration-300">
          <p className="text-sm text-[var(--color-primary)] font-medium leading-relaxed">
            &quot;{data.explanation}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
