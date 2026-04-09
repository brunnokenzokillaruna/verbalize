import React, { useState } from 'react';
import { LogicConnectorsData } from '@/types';
import { CheckCircle2, XCircle, Link } from 'lucide-react';

interface LogicConnectorsProps {
  data: LogicConnectorsData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
}

export function LogicConnectors({ data, onAnswer, answered, setIsExerciseReady }: LogicConnectorsProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    onAnswer(option === data.correctConnector);
    setIsExerciseReady(true);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 p-8 rounded-[2rem] bg-white/5 ring-1 ring-white/10 backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Link size={80} />
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <p className="text-xl md:text-2xl font-display font-medium text-[var(--color-text-primary)] leading-tight">
            {data.partA}
          </p>
          
          <div className="h-14 flex items-center justify-center">
            <div className={`px-6 py-2 rounded-full border-2 border-dashed transition-all duration-300 min-w-[120px] text-center ${
              selected 
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold scale-110' 
                : 'border-white/20 text-transparent'
            }`}>
              {selected || '...'}
            </div>
          </div>

          <p className="text-xl md:text-2xl font-display font-medium text-[var(--color-text-primary)] leading-tight">
            {data.partB}
          </p>
        </div>
      </div>

      <div className="text-center italic text-sm text-[var(--color-text-muted)] mb-2">
        "{data.translation}"
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.options.map((option) => {
          const isSelected = selected === option;
          const isCorrect = option === data.correctConnector;
          
          let stateStyles = "bg-white/5 ring-1 ring-white/10 hover:bg-white/10 active:scale-95";
          if (answered) {
            if (isCorrect) stateStyles = "bg-emerald-500/20 ring-1 ring-emerald-500/50 text-emerald-200 shadow-lg shadow-emerald-500/10";
            else if (isSelected) stateStyles = "bg-red-500/20 ring-1 ring-red-500/50 text-red-200";
            else stateStyles = "opacity-30 grayscale blur-[1px]";
          }

          return (
            <button
              key={option}
              disabled={answered}
              onClick={() => handleSelect(option)}
              className={`py-4 px-6 rounded-2xl text-lg font-bold transition-all duration-300 ${stateStyles}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
