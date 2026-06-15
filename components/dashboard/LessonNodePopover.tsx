import type { RefObject } from 'react';
import type { LessonDefinition } from '@/types';

type LessonNodePopoverProps = {
  lesson: LessonDefinition;
  isLocked: boolean;
  isCompleted: boolean;
  isMission: boolean;
  popoverRef: RefObject<HTMLDivElement | null>;
  onStart: () => void;
};

export function LessonNodePopover({
  lesson,
  isLocked,
  isCompleted,
  isMission,
  popoverRef,
  onStart,
}: LessonNodePopoverProps) {
  const [mainTitle, subTitle] = lesson.grammarFocus.split(' — ');

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 flex flex-col items-stretch w-[260px] p-4.5 rounded-2xl shadow-2xl animate-fade-in border"
      style={{
        top: '120%',
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        cursor: 'default',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute left-1/2 -top-[9px] -translate-x-1/2 w-4 h-4 rotate-45 border-t border-l"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      />

      <h3 className="text-[17px] font-display font-extrabold mb-1.5 text-left text-text-primary leading-tight">
        {lesson.uiTitle || mainTitle}
      </h3>
      <p className="text-xs font-semibold mb-4 leading-relaxed text-left text-text-muted">
        {isLocked
          ? 'Complete todos os níveis acima pra desbloquear esse aqui!'
          : lesson.uiTitle
            ? lesson.grammarFocus
            : subTitle || lesson.theme}
      </p>

      <button
        onClick={onStart}
        disabled={isLocked}
        className={`w-full rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer active:translate-y-[2px] ${
          isLocked ? 'opacity-85 cursor-not-allowed' : 'active:scale-95'
        }`}
        style={{
          backgroundColor: isLocked ? 'var(--color-surface-raised)' : isMission ? 'var(--color-vocab)' : 'var(--color-primary)',
          color: isLocked ? 'var(--color-text-muted)' : 'var(--color-on-accent)',
          boxShadow: isLocked ? 'none' : isMission ? '0 3px 0 var(--color-warning)' : '0 3px 0 var(--color-primary-dark)',
        }}
      >
        {isLocked ? 'Bloqueado' : isCompleted ? 'Revisar' : 'Começar'}
      </button>
    </div>
  );
}
