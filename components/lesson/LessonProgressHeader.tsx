'use client';

import { X } from 'lucide-react';
import type { LessonStage } from '@/types';

const STAGES: { key: LessonStage; label: string }[] = [
  { key: 'vocabulary', label: 'Vocabulário' },
  { key: 'hook', label: 'Diálogo' },
  { key: 'grammar', label: 'Gramática' },
  { key: 'practice', label: 'Prática' },
  { key: 'review', label: 'Revisão' },
];

interface LessonProgressHeaderProps {
  currentStage: LessonStage;
  onExit: () => void;
}

export function LessonProgressHeader({ currentStage, onExit }: LessonProgressHeaderProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-4 sm:px-8">
      {/* Glassmorphic Background */}
      <div className="absolute inset-0 bg-[var(--color-bg)]/90 backdrop-blur-xl shadow-md border-b border-[var(--color-border)]/60 pointer-events-none" />

      <div className="relative mx-auto max-w-2xl flex items-center gap-6">
        {/* Minimal Exit button */}
        <button
          type="button"
          onClick={onExit}
          className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 active:scale-95 hover:bg-[var(--color-surface-raised)]"
        >
          <X size={20} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors" />
        </button>

        {/* Improved Progress Track */}
        <div className="flex flex-1 items-center gap-1.5 h-1.5">
          {STAGES.map((stage, i) => {
            const isCompleted = i < currentIndex;
            const isActive = i === currentIndex;
            const isFuture = i > currentIndex;

            return (
              <div
                key={stage.key}
                className="relative h-1 flex-1 rounded-full overflow-hidden bg-[var(--color-border)]/40"
              >
                <div
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    isActive ? 'animate-pulse shadow-[0_0_8px_var(--color-primary)]' : ''
                  }`}
                  style={{
                    backgroundColor: isFuture ? 'transparent' : 'var(--color-primary)',
                    width: (isCompleted || isActive) ? '100%' : '0%',
                    opacity: isActive ? 0.8 : 1,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Delicate Stage Counter */}
        <div className="flex flex-col items-end min-w-[80px]">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">
            ETAPA {currentIndex + 1}
          </span>
          <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase whitespace-nowrap opacity-80">
            {STAGES[currentIndex]?.label}
          </span>
        </div>
      </div>
    </header>
  );
}
