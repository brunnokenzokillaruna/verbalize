'use client';

import { X, Book, MessageSquare, Mic, Target, Zap, Repeat, Sparkles, BookOpen } from 'lucide-react';
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
    { key: 'role-play',  label: 'Role-play' },
    { key: 'practice',   label: 'Prática' },
  ],
  VERB: [
    { key: 'vocabulary', label: 'Vocabulário' },
    { key: 'hook',       label: 'Diálogo' },
    { key: 'grammar',    label: 'Gramática' },
    { key: 'practice',   label: 'Prática' },
  ],
  EXPR: [
    { key: 'vocabulary', label: 'Vocabulário' },
    { key: 'hook',       label: 'Diálogo' },
    { key: 'practice',   label: 'Prática' },
  ],
  CULT: [
    { key: 'vocabulary', label: 'Vocabulário' },
    { key: 'hook',       label: 'Diálogo' },
    { key: 'grammar',    label: 'Cultura' },
    { key: 'practice',   label: 'Prática' },
  ],
};

const TAG_CONFIG: Record<LessonTag, { label: string; icon: any; color: string; bg: string }> = {
  GRAM: { label: 'Gramática',   icon: Book,          color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
  VOC:  { label: 'Vocabulário', icon: Zap,           color: 'var(--color-vocab)',   bg: 'var(--color-vocab-bg)' },
  DIAL: { label: 'Diálogo',     icon: MessageSquare, color: '#9333ea',              bg: '#f5f3ff' },
  PRON: { label: 'Pronúncia',   icon: Mic,           color: '#ea580c',              bg: '#fff7ed' },
  MISS: { label: 'Missão',      icon: Target,        color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  VERB: { label: 'Verbos',      icon: Repeat,        color: '#0369a1',              bg: '#e0f2fe' },
  EXPR: { label: 'Expressões',  icon: Sparkles,      color: '#be185d',              bg: '#fce7f3' },
  CULT: { label: 'Cultura',     icon: BookOpen,      color: '#6d28d9',              bg: '#ede9fe' },
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
    <header className="sticky top-0 z-50 w-full px-4 py-3 sm:px-8 overflow-hidden">
      {/* Premium Glassmorphic Layering */}
      <div 
        className="absolute inset-0 backdrop-blur-2xl pointer-events-none" 
        style={{ 
          backgroundColor: 'rgba(var(--color-bg-rgb), 0.85)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)'
        }} 
      />
      
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-10 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-3xl flex items-center justify-between gap-6">
        {/* Actions Group */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="group flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 active:scale-90 bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:shadow-sm"
            title="Sair da lição"
          >
            <X size={20} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] group-hover:rotate-90 transition-all duration-300" />
          </button>

          {onComplete && (
            <button
              type="button"
              onClick={onComplete}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--color-success)] bg-[var(--color-success-bg)] hover:brightness-95 transition-all active:scale-95 border border-[var(--color-success)]/10 cta-shimmer relative overflow-hidden"
            >
              <Zap size={14} fill="currentColor" />
              <span>Concluir</span>
            </button>
          )}
        </div>

        {/* Progress Track - Premium Milestone Design */}
        <div className="flex flex-1 items-center gap-1 min-w-0 max-w-lg">
          <div className="flex flex-1 items-center gap-1.5 h-[6px]">
            {stages.map((stage, i) => {
              const isCompleted = i < currentIndex;
              const isActive    = i === currentIndex;
              const isFuture    = i > currentIndex;

              return (
                <div
                  key={stage.key}
                  className="relative h-full flex-1 rounded-full overflow-hidden bg-[var(--color-border)]/50 border border-black/5"
                >
                  <div
                    className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      isActive ? 'after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent after:translate-x-[-200%] after:animate-[shimmer-sweep_2s_infinite]' : ''
                    }`}
                    style={{
                      backgroundColor: isFuture ? 'transparent' : 'var(--color-primary)',
                      width: (isCompleted || isActive) ? '100%' : '0%',
                      boxShadow: isActive ? '0 0 10px var(--color-primary)' : 'none',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Indicator Group */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block h-8 w-px bg-[var(--color-border)] opacity-60 mr-1" />
          
          <div className="flex items-center gap-2 animate-scale-in">
            {tagInfo && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shadow-sm"
                style={{ 
                  backgroundColor: 'var(--color-surface)', 
                  borderColor: `${tagInfo.color}30`, 
                  color: tagInfo.color 
                }}
              >
                {TagIcon && <TagIcon size={12} strokeWidth={2.5} />}
                <span className="text-[10px] font-black uppercase tracking-widest">{tagInfo.label}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
