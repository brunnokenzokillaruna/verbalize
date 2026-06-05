import React, { useState, useEffect } from 'react';
import { ScrambledConversationData } from '@/types';
import { ChevronUp, ChevronDown, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';

interface ScrambledConversationProps {
  data: ScrambledConversationData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

interface ConversationItemProps {
  line: string;
  index: number;
  totalLines: number;
  answered: boolean;
  isCorrectPos: boolean;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

function ConversationItem({
  line,
  index,
  totalLines,
  answered,
  isCorrectPos,
  onMoveUp,
  onMoveDown,
}: ConversationItemProps) {
  const match = line.match(/^([^:]+):\s*(.+)/);
  const speaker = match ? match[1].trim() : '';
  const text = match ? match[2].trim() : line;

  let stateStyles = "border border-white/5 bg-white/5 text-[var(--color-text-primary)]";
  
  if (answered) {
    if (isCorrectPos) {
      stateStyles = "bg-[rgba(16,185,129,0.08)] border border-emerald-500/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.03)]";
    } else {
      stateStyles = "bg-[rgba(239,68,68,0.08)] border border-red-500/40 text-red-200";
    }
  } else {
    stateStyles = "border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-[var(--color-text-primary)]";
  }

  return (
    <div
      className={`flex items-center gap-3.5 p-4 rounded-xl transition-all duration-200 ${stateStyles}`}
    >
      {!answered && (
        <div className="flex flex-col gap-1 shrink-0">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveUp(index)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronUp size={14} className="text-[var(--color-text-secondary)]" />
          </button>
          <button
            type="button"
            disabled={index === totalLines - 1}
            onClick={() => onMoveDown(index)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronDown size={14} className="text-[var(--color-text-secondary)]" />
          </button>
        </div>
      )}
      
      {/* Small number badge inside sorting area */}
      <span className="text-[10px] font-black tracking-widest text-[var(--color-text-muted)] opacity-60 shrink-0">
        #{index + 1}
      </span>
      
      {/* Speaker and speech text */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3.5 flex-1">
        {speaker && (
          <span 
            className="inline-flex self-start sm:self-auto items-center rounded-md px-2 py-0.5 text-[10.5px] font-black uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 shrink-0"
          >
            {speaker}
          </span>
        )}
        <span className="text-[15px] font-semibold leading-relaxed flex-1">{text}</span>
      </div>
      
      {answered && isCorrectPos && <CheckCircle2 size={18} className="text-emerald-500 shrink-0 ml-3" />}
      {answered && !isCorrectPos && <XCircle size={18} className="text-red-500 shrink-0 ml-3" />}
    </div>
  );
}

export function ScrambledConversation({ data, onAnswer, answered, setIsExerciseReady, submitTrigger }: ScrambledConversationProps) {
  const [currentOrder, setCurrentOrder] = useState<string[]>([]);
  
  useEffect(() => {
    setCurrentOrder(data.shuffledLines);
    setIsExerciseReady(true);
  }, [data, setIsExerciseReady]);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setCurrentOrder((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === currentOrder.length - 1) return;
    setCurrentOrder((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  const handleCheck = () => {
    const isCorrect = JSON.stringify(currentOrder) === JSON.stringify(data.lines);
    onAnswer(isCorrect);
  };

  // Listen for global submit
  useEffect(() => {
    if (submitTrigger > 0 && !answered && currentOrder.length > 0) {
      handleCheck();
    }
  }, [submitTrigger]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Instruction Card */}
      <div 
        className="rounded-2xl p-4.5 border border-dashed border-[var(--color-border)] backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)' }}
      >
        <div className="flex items-center gap-2 mb-2.5 text-[var(--color-text-muted)]">
          <MessageSquare size={15} className="text-[var(--color-vocab)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Desafio de Diálogo</span>
        </div>
        <div className="border-l-4 border-[var(--color-vocab)] pl-3.5 py-1">
          <p className="text-base font-semibold text-[var(--color-text-secondary)] leading-relaxed">
            Ordene as falas abaixo para formar uma conversa lógica e natural.
          </p>
        </div>
      </div>

      {/* 2. Sorting List */}
      <div className="flex flex-col gap-3">
        {currentOrder.map((line, index) => {
          const isCorrectPos = answered && line === data.lines[index];
          return (
            <ConversationItem 
              key={line} 
              line={line} 
              index={index}
              totalLines={currentOrder.length}
              answered={answered} 
              isCorrectPos={isCorrectPos} 
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          );
        })}
      </div>
      
      {/* 3. Correct Answer Feedback when Answered Incorrectly */}
      {answered && JSON.stringify(currentOrder) !== JSON.stringify(data.lines) && (
        <div className="mt-2 rounded-xl p-4 bg-[rgba(16,185,129,0.04)] border border-emerald-500/20 animate-slide-up-spring">
          <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
            <span>💡</span> Ordem Correta da Conversa:
          </h4>
          <div className="flex flex-col gap-2.5 pl-3 border-l-2 border-emerald-500/30">
            {data.lines.map((line, idx) => {
              const match = line.match(/^([^:]+):\s*(.+)/);
              const speaker = match ? match[1].trim() : '';
              const text = match ? match[2].trim() : line;
              return (
                <div key={idx} className="flex items-center gap-2.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <span className="font-bold text-emerald-500/80 tabular-nums shrink-0">#{idx + 1}</span>
                  {speaker && (
                    <span 
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0"
                    >
                      {speaker}
                    </span>
                  )}
                  <span className="flex-1">{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
    </div>
  );
}
