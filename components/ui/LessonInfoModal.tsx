'use client';

import { X, Play, RefreshCw, Lock } from 'lucide-react';
import type { LessonDefinition } from '@/types';

interface LessonInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  lesson: LessonDefinition | null;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  tagLabel: string;
}

export function LessonInfoModal({
  isOpen,
  onClose,
  onStart,
  lesson,
  isCompleted,
  isCurrent,
  isLocked,
  tagLabel,
}: LessonInfoModalProps) {
  if (!isOpen || !lesson) return null;

  const [mainTitle, subTitle] = lesson.grammarFocus.split(' — ');
  const displayTitle = lesson.uiTitle || mainTitle;
  const displaySubtitle = lesson.uiTitle ? lesson.grammarFocus : (subTitle || lesson.theme);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] p-8 text-center shadow-2xl animate-scale-in"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-2 text-muted transition-colors hover:bg-surface-raised active:scale-95"
        >
          <X size={20} />
        </button>

        <div className="mb-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            color: 'var(--color-text-muted)'
          }}
        >
          {tagLabel} • Nível {lesson.level}
        </div>

        <h2 className="font-display text-2xl font-black text-text-primary leading-tight">
          {displayTitle}
        </h2>
        
        <p className="mt-3 text-base font-medium text-muted leading-relaxed">
          {displaySubtitle}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={onStart}
            disabled={isLocked}
            className={`relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-white transition-all ${isLocked ? 'bg-gray-400 opacity-50 cursor-not-allowed hidden' : 'bg-primary active:scale-[0.98] cta-shimmer'}`}
            style={{
               boxShadow: isLocked ? 'none' : '0 8px 20px rgba(29, 94, 212, 0.3)',
               display: isLocked ? 'none' : 'flex'
            }}
          >
            {isLocked ? (
              <><Lock size={20} /> Bloqueado</>
            ) : isCompleted ? (
              <><RefreshCw size={20} /> Revisar Lição</>
            ) : (
              <><Play size={20} fill="currentColor" /> {lesson.tag === 'MISS' ? 'Iniciar Missão' : 'Começar Lição'}</>
            )}
          </button>
          
          {isLocked && (
            <div className="py-2 text-sm font-bold text-muted flex items-center justify-center gap-2">
              <Lock size={16} /> Complete as lições anteriores
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
