import React, { useState, useEffect } from 'react';
import { ScrambledConversationData } from '@/types';
import { GripVertical, CheckCircle2 } from 'lucide-react';

interface ScrambledConversationProps {
  data: ScrambledConversationData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
}

export function ScrambledConversation({ data, onAnswer, answered, setIsExerciseReady }: ScrambledConversationProps) {
  const [currentOrder, setCurrentOrder] = useState<string[]>([]);
  
  useEffect(() => {
    setCurrentOrder(data.shuffledLines);
    setIsExerciseReady(true);
  }, [data]);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (answered) return;
    const newOrder = [...currentOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    setCurrentOrder(newOrder);
    
    // Auto-check if the order is correct
    const isCorrect = JSON.stringify(newOrder) === JSON.stringify(data.lines);
    if (isCorrect) onAnswer(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center mb-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
          Coloque o diálogo na ordem correta
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        {currentOrder.map((line, index) => {
          const isCorrectPos = answered && line === data.lines[index];
          
          return (
            <div
              key={line}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                answered 
                  ? isCorrectPos ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : 'bg-red-500/10 ring-1 ring-red-500/30'
                  : 'bg-white/5 ring-1 ring-white/10'
              }`}
            >
              {!answered && (
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => index > 0 && moveItem(index, index - 1)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <GripVertical size={14} className="text-[var(--color-text-muted)]" />
                  </button>
                </div>
              )}
              <span className="flex-1 text-sm md:text-base leading-relaxed">{line}</span>
              {isCorrectPos && <CheckCircle2 size={16} className="text-emerald-500" />}
            </div>
          );
        })}
      </div>
      
      {!answered && (
        <button 
          onClick={() => onAnswer(JSON.stringify(currentOrder) === JSON.stringify(data.lines))}
          className="mt-4 py-3 px-6 rounded-xl bg-[var(--color-primary)] text-white font-bold shadow-lg shadow-[var(--color-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Verificar Ordem
        </button>
      )}
    </div>
  );
}
