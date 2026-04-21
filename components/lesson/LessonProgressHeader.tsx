'use client';

import { X, Book, MessageSquare, Mic, Target, Zap } from 'lucide-react';
import type { LessonStage, LessonTag } from '@/types';

const STAGES_BY_TAG: Record<LessonTag, { key: LessonStage; label: string }[]> = {
  GRAM: [
    { key: 'vocabulary', label: 'Vocabulário' },
    { key: 'hook',       label: 'Diálogo' },
    { key: 'grammar',    label: 'Gramática' },
    { key: 'practice',   label: 'Prática' },
  ],
  VOC: [
    { key: 'vocabulary', label: 'Vocabulário' },
    { key: 'hook',       label: 'Diálogo' },
    { key: 'practice',   label: 'Prática' },
  ],
  PRON: [
    { key: 'vocabulary', label: 'Vocabulário' },
    { key: 'hook',       label: 'Diálogo' },
    { key: 'phonetics',  label: 'Fonética' },
    { key: 'practice',   label: 'Prática' },
  ],
  DIAL: [
    { key: 'vocabulary', label: 'Vocabulário' },
    { key: 'hook',       label: 'Diálogo' },
    { key: 'practice',   label: 'Prática' },
  ],
  MISS: [
    { key: 'mission',    label: 'Missão' },
    { key: 'vocabulary', label: 'Vocabulário' },
    { key: 'hook',       label: 'Diálogo' },
    { key: 'practice',   label: 'Prática' },
  ],
};

const TAG_CONFIG: Record<LessonTag, { label: string; icon: any; color: string; bg: string }> = {
  GRAM: { label: 'Gramática',   icon: Book,          color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
  VOC:  { label: 'Vocabulário', icon: Zap,           color: 'var(--color-vocab)',   bg: 'var(--color-vocab-bg)' },
  DIAL: { label: 'Diálogo',     icon: MessageSquare, color: '#9333ea',              bg: '#f5f3ff' },
  PRON: { label: 'Pronúncia',   icon: Mic,           color: '#ea580c',              bg: '#fff7ed' },
  MISS: { label: 'Missão',      icon: Target,        color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
};

interface LessonProgressHeaderProps {
  currentStage: LessonStage;
  tag?: LessonTag;
  onExit: () => void;
  onComplete?: () => void;
}

export function LessonProgressHeader({ currentStage, tag, onExit, onComplete }: LessonProgressHeaderProps) {
  const stages = tag ? (STAGES_BY_TAG[tag] ?? STAGES_BY_TAG['GRAM']) : STAGES_BY_TAG['GRAM'];
  const currentIndex = stages.findIndex((s) => s.key === currentStage);
  const tagInfo = tag ? TAG_CONFIG[tag] : null;
  const TagIcon = tagInfo?.icon;

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-4 sm:px-8">
      {/* Glassmorphic Background */}
      <div className="absolute inset-0 bg-[var(--color-bg)]/90 backdrop-blur-xl shadow-md border-b border-[var(--color-border)]/60 pointer-events-none" />

      <div className="relative mx-auto max-w-2xl flex items-center gap-4">
        {/* Actions Group */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExit}
            className="group flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 active:scale-95 hover:bg-[var(--color-surface-raised)]"
            title="Sair da lição"
          >
            <X size={20} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors" />
          </button>

          {onComplete && (
            <button
              type="button"
              onClick={onComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[var(--color-success)] bg-[var(--color-success-bg)] hover:brightness-95 transition-all active:scale-95"
            >
              <Zap size={12} fill="currentColor" />
              <span>Concluir</span>
            </button>
          )}
        </div>

        {/* Progress Track */}
        <div className="flex flex-1 items-center gap-1.5 h-1.5">
          {stages.map((stage, i) => {
            const isCompleted = i < currentIndex;
            const isActive    = i === currentIndex;
            const isFuture    = i > currentIndex;

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

        {/* Stage Counter + Tag Badge */}
        <div className="flex flex-col items-end min-w-[80px]">
          {tagInfo && (
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full mb-1 border"
              style={{ backgroundColor: tagInfo.bg, borderColor: `${tagInfo.color}40`, color: tagInfo.color }}
            >
              {TagIcon && <TagIcon size={10} />}
              <span className="text-[9px] font-black uppercase tracking-wider">{tagInfo.label}</span>
            </div>
          )}
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">
            ETAPA {Math.max(1, currentIndex + 1)}
          </span>
          <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase whitespace-nowrap opacity-80">
            {stages[Math.max(0, currentIndex)]?.label}
          </span>
        </div>
      </div>
    </header>
  );
}
