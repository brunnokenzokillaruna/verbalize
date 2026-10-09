'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
import type { LessonDefinition } from '@/types';
import { getCheckpointPopoverCopy } from '@/lib/curriculum/checkpointPresentation';
import { getTopicStage } from '@/lib/curriculum/lessonTopic';

/** Mobile BottomNav ≈ 4rem + home-indicator safe area. */
const MOBILE_BOTTOM_CLEARANCE = 'calc(4.5rem + env(safe-area-inset-bottom, 0px))';
const POPOVER_GAP_PX = 12;
const ESTIMATED_POPOVER_HEIGHT = 168;

type LessonNodePopoverProps = {
  lesson: LessonDefinition;
  isLocked: boolean;
  isCompleted: boolean;
  isMission: boolean;
  /** Same CEFR level lessons — used to compute Etapa N/M for topicKey families. */
  levelLessons?: LessonDefinition[];
  popoverRef: RefObject<HTMLDivElement | null>;
  onStart: () => void;
};

function getBottomClearancePx(): number {
  if (typeof window === 'undefined') return 16;
  // md:hidden BottomNav — leave room for bar + iOS home indicator
  if (window.matchMedia('(max-width: 767px)').matches) return 96;
  return 16;
}

export function LessonNodePopover({
  lesson,
  isLocked,
  isCompleted,
  isMission,
  levelLessons = [],
  popoverRef,
  onStart,
}: LessonNodePopoverProps) {
  const isCheckpoint = lesson.tag === 'REVIEW';
  const checkpointCopy = isCheckpoint ? getCheckpointPopoverCopy(lesson) : null;
  const [mainTitle, subTitle] = lesson.grammarFocus.split(' — ');
  const topicStage = !isCheckpoint ? getTopicStage(lesson, levelLessons) : null;
  const [placement, setPlacement] = useState<'below' | 'above'>('below');

  const title = checkpointCopy?.title ?? lesson.uiTitle ?? mainTitle;
  const baseSubtitle = checkpointCopy?.subtitle
    ?? (lesson.uiTitle ? lesson.grammarFocus : subTitle || lesson.theme);
  const subtitle = isLocked
    ? 'Complete todos os níveis acima pra desbloquear esse aqui!'
    : topicStage
      ? `${topicStage.label} — ${baseSubtitle}`
      : baseSubtitle;

  const startLabel = isLocked
    ? 'Bloqueado'
    : isCheckpoint
      ? (isCompleted ? 'Refazer checkpoint' : checkpointCopy!.startLabel)
      : (isCompleted ? 'Revisar' : 'Começar');

  useLayoutEffect(() => {
    const popover = popoverRef.current;
    const anchor = popover?.offsetParent instanceof HTMLElement
      ? popover.offsetParent
      : popover?.parentElement;
    if (!popover || !anchor) return;

    const updatePlacement = () => {
      const anchorRect = anchor.getBoundingClientRect();
      const popoverHeight = popover.offsetHeight || ESTIMATED_POPOVER_HEIGHT;
      const bottomClearance = getBottomClearancePx();
      const spaceBelow = window.innerHeight - anchorRect.bottom - bottomClearance;
      const spaceAbove = anchorRect.top - 8;
      const needsFlip =
        spaceBelow < popoverHeight + POPOVER_GAP_PX &&
        spaceAbove > spaceBelow;

      setPlacement(needsFlip ? 'above' : 'below');
    };

    updatePlacement();

    // After paint, remeasure with real height and keep fully in view above the nav.
    requestAnimationFrame(() => {
      updatePlacement();
      const rect = popover.getBoundingClientRect();
      const bottomClearance = getBottomClearancePx();
      const overflowBottom = rect.bottom - (window.innerHeight - bottomClearance);
      const overflowTop = 8 - rect.top;
      if (overflowBottom > 0 || overflowTop > 0) {
        const node = document.getElementById(`lesson-node-${lesson.id}`);
        node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    window.addEventListener('resize', updatePlacement);
    return () => window.removeEventListener('resize', updatePlacement);
  }, [lesson.id, popoverRef]);

  const isAbove = placement === 'above';

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 flex flex-col items-stretch w-[min(260px,calc(100vw-2rem))] p-4.5 rounded-2xl shadow-2xl animate-fade-in border"
      style={{
        ...(isAbove
          ? { bottom: `calc(100% + ${POPOVER_GAP_PX}px)` }
          : { top: `calc(100% + ${POPOVER_GAP_PX}px)` }),
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        cursor: 'default',
        // Keep clear of the fixed BottomNav if layout still clips the last node.
        maxHeight: `calc(100dvh - ${isAbove ? '2rem' : MOBILE_BOTTOM_CLEARANCE} - 2rem)`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 ${
          isAbove ? '-bottom-[9px] border-r border-b' : '-top-[9px] border-t border-l'
        }`}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      />

      <h3 className="text-[17px] font-display font-extrabold mb-1.5 text-left text-text-primary leading-tight">
        {title}
      </h3>
      <p className="text-xs font-semibold mb-4 leading-relaxed text-left text-text-muted">
        {subtitle}
      </p>

      <button
        onClick={onStart}
        disabled={isLocked}
        className={`w-full rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer active:translate-y-[2px] ${
          isLocked ? 'opacity-85 cursor-not-allowed' : 'active:scale-95'
        }`}
        style={{
          backgroundColor: isLocked ? 'var(--color-surface-raised)' : isMission ? 'var(--color-vocab)' : isCheckpoint ? '#0d9488' : 'var(--color-primary)',
          color: isLocked ? 'var(--color-text-muted)' : 'var(--color-on-accent)',
          boxShadow: isLocked ? 'none' : isMission ? '0 3px 0 var(--color-warning)' : isCheckpoint ? '0 3px 0 #0f766e' : '0 3px 0 var(--color-primary-dark)',
        }}
      >
        {startLabel}
      </button>
    </div>
  );
}
