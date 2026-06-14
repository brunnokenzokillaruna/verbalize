'use client';

import { X, Book, MessageSquare, Mic, Target, Zap, Repeat, Sparkles, BookOpen, Volume2, VolumeX, type LucideIcon } from 'lucide-react';
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
    { key: 'grammar',    label: 'Gramática' },
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
    { key: 'grammar',    label: 'Gramática' },
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
    { key: 'grammar',    label: 'Gramática' },
    { key: 'practice',   label: 'Prática' },
  ],
  CULT: [
    { key: 'vocabulary', label: 'Vocabulário' },
    { key: 'hook',       label: 'Diálogo' },
    { key: 'grammar',    label: 'Cultura' },
    { key: 'practice',   label: 'Prática' },
  ],
};

const TAG_CONFIG: Record<LessonTag, { label: string; icon: LucideIcon; color: string; bg: string }> = {
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
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export function LessonProgressHeader({
  currentStage,
  tag,
  onExit,
  onComplete,
  isMuted = false,
  onToggleMute,
}: LessonProgressHeaderProps) {
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
            className="group flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-100 active:translate-y-[2px] active:border-b-[1px] bg-[var(--color-surface)] border border-[var(--color-border)] border-b-[3px] hover:bg-[var(--color-surface-raised)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2"
            title="Sair da lição"
            aria-label="Sair da lição"
          >
            <X size={20} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] group-hover:rotate-90 transition-all duration-300" />
          </button>

          {onToggleMute !== undefined && (
            <button
              type="button"
              onClick={onToggleMute}
              className="group flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-100 active:translate-y-[2px] active:border-b-[1px] bg-[var(--color-surface)] border border-[var(--color-border)] border-b-[3px] hover:bg-[var(--color-surface-raised)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2"
              title={isMuted ? 'Ativar som' : 'Desativar som'}
              aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
            >
              {isMuted ? (
                <VolumeX size={20} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-all" />
              ) : (
                <Volume2 size={20} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-all" />
              )}
            </button>
          )}

          {onComplete && (
            <button
              type="button"
              onClick={onComplete}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--color-success)] bg-[var(--color-success-bg)] border border-[var(--color-success)] border-b-[3px] transition-all duration-100 active:translate-y-[2px] active:border-b-[1px] cta-shimmer relative overflow-hidden"
            >
              <Zap size={12} fill="currentColor" />
              <span>Concluir</span>
            </button>
          )}
        </div>

        {/* Progress Track - Premium Milestone Design */}
        <div className="flex flex-1 items-center gap-1.5 min-w-0 max-w-lg">
          <div className="flex flex-1 items-center gap-2 h-4 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-[3px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
            {stages.map((stage, i) => {
              const isCompleted = i < currentIndex;
              const isActive    = i === currentIndex;
              const isFuture    = i > currentIndex;

              return (
                <div
                  key={stage.key}
                  className="relative h-full flex-1 rounded-lg overflow-hidden bg-[var(--color-border)]/20 border border-black/5"
                >
                  <div
                    className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      isActive ? 'after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent after:translate-x-[-200%] after:animate-[shimmer-sweep_2s_infinite]' : ''
                    }`}
                    style={{
                      backgroundColor: isFuture ? 'transparent' : 'var(--color-primary)',
                      width: (isCompleted || isActive) ? '100%' : '0%',
                      boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 0 8px var(--color-primary)' : 'none',
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-b-[3px] shadow-sm transition-all hover:scale-105"
                style={{ 
                  backgroundColor: 'var(--color-surface)', 
                  borderColor: `${tagInfo.color}30`,
                  borderBottomColor: tagInfo.color, 
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
