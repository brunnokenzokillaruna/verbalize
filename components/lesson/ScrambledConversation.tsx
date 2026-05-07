import React, { useState, useEffect } from 'react';
import { ScrambledConversationData } from '@/types';
import { GripVertical, CheckCircle2 } from 'lucide-react';
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
}

function SortableItem({ id, line, answered, isCorrectPos }: { id: string, line: string, answered: boolean, isCorrectPos: boolean }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
        isDragging 
          ? 'shadow-2xl scale-[1.02] bg-[var(--color-surface-raised)] ring-2 ring-[var(--color-primary)]/50' 
          : answered 
            ? isCorrectPos ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : 'bg-red-500/10 ring-1 ring-red-500/30'
            : 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10'
      }`}
    >
      {!answered && (
        <div 
          className="flex flex-col gap-1 cursor-grab active:cursor-grabbing touch-none p-2 -ml-2 rounded hover:bg-white/10" 
          {...attributes} 
          {...listeners}
        >
          <GripVertical size={18} className="text-[var(--color-text-muted)]" />
        </div>
      )}
      <span className="flex-1 text-sm md:text-base leading-relaxed">{line}</span>
      {answered && isCorrectPos && <CheckCircle2 size={16} className="text-emerald-500" />}
    </div>
  );
}

export function ScrambledConversation({ data, onAnswer, answered, setIsExerciseReady }: ScrambledConversationProps) {
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
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Auto-check if the order is correct
        const isCorrect = JSON.stringify(newOrder) === JSON.stringify(data.lines);
        if (isCorrect) onAnswer(true);
        
        return newOrder;
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center mb-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
          Coloque o diálogo na ordem correta
        </h3>
      </div>

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
                />
              );
            })}
          </SortableContext>
        </div>
      </DndContext>
      
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
