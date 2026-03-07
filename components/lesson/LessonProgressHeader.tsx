'use client';

import { X } from 'lucide-react';
import type { LessonStage } from '@/types';

const STAGES: { key: LessonStage; label: string }[] = [
  { key: 'hook', label: 'Diálogo' },
  { key: 'grammar', label: 'Gramática' },
  { key: 'vocabulary', label: 'Vocabulário' },
  { key: 'practice', label: 'Prática' },
  { key: 'review', label: 'Revisão' },
];

interface LessonProgressHeaderProps {
  currentStage: LessonStage;
  onExit: () => void;
}

export function LessonProgressHeader({ currentStage, onExit }: LessonProgressHeaderProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);
  const currentLabel = STAGES[currentIndex]?.label ?? '';

  return (
    <header
      className="sticky top-0 z-30 px-4 pt-4 pb-3"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Exit button */}
        <button
          type="button"
          onClick={onExit}
          aria-label="Sair da lição"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-150 active:scale-90 hover:opacity-70"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          <X size={18} style={{ color: 'var(--color-text-muted)' }} />
        </button>

        {/* Segmented progress track */}
        <div className="relative flex flex-1 items-center gap-1">
          {STAGES.map((stage, i) => {
            const isCompleted = i < currentIndex;
            const isActive = i === currentIndex;

            return (
              <div
                key={stage.key}
                className="relative h-2 flex-1 overflow-hidden rounded-full"
                style={{ backgroundColor: 'var(--color-border)' }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    width: isCompleted ? '100%' : isActive ? '50%' : '0%',
                    transition: 'width 400ms ease',
                    opacity: isActive ? 0.7 : 1,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Stage label */}
        <span
          className="shrink-0 text-sm font-medium"
          style={{ color: 'var(--color-text-muted)', minWidth: '72px', textAlign: 'right' }}
        >
          {currentLabel}
        </span>
      </div>
    </header>
  );
}
