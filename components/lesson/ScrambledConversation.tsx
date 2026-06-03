import React, { useState, useEffect } from 'react';
import { ScrambledConversationData } from '@/types';
import { GripVertical, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

interface ScrambledConversationProps {
  data: ScrambledConversationData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

function SortableItem({ id, line, answered, isCorrectPos, index }: { id: string, line: string, answered: boolean, isCorrectPos: boolean, index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: answered });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? ('relative' as const) : undefined,
  };

  let stateStyles = "border border-white/5 bg-white/5 text-[var(--color-text-primary)]";
  
  if (answered) {
    if (isCorrectPos) {
      stateStyles = "bg-[rgba(16,185,129,0.08)] border border-emerald-500/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.03)]";
    } else {
      stateStyles = "bg-[rgba(239,68,68,0.08)] border border-red-500/40 text-red-200";
    }
  } else if (isDragging) {
    stateStyles = "shadow-2xl scale-[1.01] bg-[var(--color-surface-raised)] border border-[var(--color-primary)]/50 ring-2 ring-[var(--color-primary)]/20";
  } else {
    stateStyles = "border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-[var(--color-text-primary)]";
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${stateStyles}`}
    >
      {!answered && (
        <div 
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 cursor-grab active:cursor-grabbing touch-none transition-colors hover:bg-white/10" 
          {...attributes} 
          {...listeners}
        >
          <GripVertical size={16} className="text-[var(--color-text-muted)]" />
        </div>
      )}
      
      {/* Small number badge inside sorting area */}
      <span className="text-[10px] font-black tracking-widest text-[var(--color-text-muted)] opacity-60">
        #{index + 1}
      </span>
      
      <span className="flex-1 text-[15px] font-semibold leading-relaxed">{line}</span>
      
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts, to allow scrolling on mobile
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCurrentOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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

      {/* 2. Drag and Drop Context */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <div className="flex flex-col gap-3">
          <SortableContext 
            items={currentOrder}
            strategy={verticalListSortingStrategy}
          >
            {currentOrder.map((line, index) => {
              const isCorrectPos = answered && line === data.lines[index];
              return (
                <SortableItem 
                  key={line} 
                  id={line} 
                  line={line} 
                  answered={answered} 
                  isCorrectPos={isCorrectPos} 
                  index={index}
                />
              );
            })}
          </SortableContext>
        </div>
      </DndContext>
      
      {/* 3. Correct Answer Feedback when Answered Incorrectly */}
      {answered && JSON.stringify(currentOrder) !== JSON.stringify(data.lines) && (
        <div className="mt-2 rounded-xl p-4 bg-[rgba(16,185,129,0.04)] border border-emerald-500/20 animate-slide-up-spring">
          <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
            <span>💡</span> Ordem Correta da Conversa:
          </h4>
          <div className="flex flex-col gap-2.5 pl-3 border-l-2 border-emerald-500/30">
            {data.lines.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                <span className="font-bold text-emerald-500/80 tabular-nums">#{idx + 1}</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
}
