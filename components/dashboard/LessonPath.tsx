import type { RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { TAG_LABELS, THEME_COLORS } from '@/components/dashboard/constants';
import { LessonNodePopover } from '@/components/dashboard/LessonNodePopover';
import { LessonStamp } from '@/components/dashboard/LessonStamp';
import { STAMP_CURRENT_COLOR, STAMP_STYLES } from '@/components/dashboard/lessonStampConfig';
import { getPathOffset } from '@/components/dashboard/utils';
import type { LessonModalState } from '@/components/dashboard/types';
import type { LessonDefinition, LessonTag } from '@/types';
import { getTopicStage } from '@/lib/curriculum/lessonTopic';

type ThemeGroup = { title: string; lessons: LessonDefinition[] };

type LessonPathProps = {
  themes: ThemeGroup[];
  allLessons: LessonDefinition[];
  /** Lessons for the selected CEFR level (for topicKey stage labels). */
  levelLessons: LessonDefinition[];
  frontierIndex: number;
  isMobile: boolean;
  langName: string;
  selectedLevel: string;
  modalState: LessonModalState;
  currentLessonRef: RefObject<HTMLDivElement | null>;
  popoverRef: RefObject<HTMLDivElement | null>;
  onNodeKeyDown: (e: React.KeyboardEvent, index: number) => void;
  onToggleModal: (lesson: LessonDefinition, state: Omit<LessonModalState, 'isOpen'>) => void;
  onCloseModal: () => void;
};

function stampStatus(isCompleted: boolean, isCurrent: boolean) {
  if (isCompleted) return 'completed' as const;
  if (isCurrent) return 'current' as const;
  return 'locked' as const;
}

export function LessonPath({
  themes,
  allLessons,
  levelLessons,
  frontierIndex,
  isMobile,
  langName,
  selectedLevel,
  modalState,
  currentLessonRef,
  popoverRef,
  onNodeKeyDown,
  onToggleModal,
  onCloseModal,
}: LessonPathProps) {
  const router = useRouter();

  if (themes.length === 0) {
    return (
      <div
        className="mx-4 mt-6 flex flex-col items-center gap-4 rounded-3xl py-16 animate-fade-in"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '2px dashed var(--color-border)',
        }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          <Lock size={28} style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <div className="text-center">
          <p className="font-display text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {allLessons.length === 0 ? `Idioma ${langName} não possui lições` : `Nível ${selectedLevel}`}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            {allLessons.length === 0
              ? 'Mude para o Francês na bandeirinha acima!'
              : 'Em breve — continue praticando!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pb-[calc(11rem+env(safe-area-inset-bottom,0px))] md:pb-20">
      {themes.map((themeGroup, themeIdx) => {
        const bgColors = THEME_COLORS[themeIdx % THEME_COLORS.length];
        return (
          <div key={themeIdx} className="w-full flex flex-col items-center theme-section" data-theme-idx={themeIdx}>
            <div className="flex items-center gap-3 w-full px-4 sm:gap-4 sm:px-6 mt-14 mb-8">
              <div className="flex-1 h-[3px]" style={{ backgroundColor: bgColors[0], borderRadius: 3, opacity: 0.3 }} />
              <h2 className="text-xl sm:text-2xl font-display font-black text-center tracking-tight" style={{ color: bgColors[0] }}>
                {themeGroup.title}
              </h2>
              <div className="flex-1 h-[3px]" style={{ backgroundColor: bgColors[0], borderRadius: 3, opacity: 0.3 }} />
            </div>

            <div className="flex flex-col items-center w-full overflow-visible">
              {themeGroup.lessons.map((lesson, localIdx) => {
                const globalIdx = allLessons.findIndex((l) => l.id === lesson.id);
                const isCompleted = globalIdx < frontierIndex;
                const isCurrent = globalIdx === frontierIndex;
                const isLocked = globalIdx > frontierIndex;
                const isMission = lesson.tag === 'MISS';
                const tag = (lesson.tag ?? 'GRAM') as LessonTag;
                const stampMeta = STAMP_STYLES[tag] ?? STAMP_STYLES.GRAM;

                const offset = getPathOffset(localIdx, isMobile);
                const nodeSize = isMobile ? 74 : 84;
                const nodeSizeActual = isMission || tag === 'REVIEW' ? nodeSize + 8 : nodeSize;
                const tagLabel = TAG_LABELS[tag] ?? 'Gramática';
                const topicStage = getTopicStage(lesson, levelLessons);
                const isPopoverOpen = modalState.isOpen && modalState.lesson?.id === lesson.id;
                const status = stampStatus(isCompleted, isCurrent);

                const labelColor = isLocked
                  ? 'var(--color-text-muted)'
                  : isCurrent
                    ? STAMP_CURRENT_COLOR
                    : stampMeta.color;

                return (
                  <div
                    key={lesson.id}
                    ref={isCurrent ? currentLessonRef : undefined}
                    className="relative flex flex-col items-center animate-scale-in scroll-mt-36 scroll-mb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:scroll-mb-10"
                    style={{
                      animationDelay: `${localIdx * 40}ms`,
                      animationFillMode: 'both',
                      zIndex: isPopoverOpen ? 50 : 10,
                    }}
                  >
                    <div
                      className="relative shrink-0 flex flex-col items-center mb-6 animate-fade-in"
                      style={{ transform: `translateX(${offset}px)` }}
                    >
                      <button
                        id={`lesson-node-${lesson.id}`}
                        type="button"
                        tabIndex={isLocked ? -1 : 0}
                        aria-label={`${tagLabel}${isLocked ? ' (bloqueada)' : isCompleted ? ' (concluída)' : isCurrent ? ' — Começar' : ''}`}
                        onKeyDown={(e) => onNodeKeyDown(e, globalIdx)}
                        onClick={() =>
                          isPopoverOpen
                            ? onCloseModal()
                            : onToggleModal(lesson, {
                                lesson,
                                isCompleted,
                                isCurrent,
                                isLocked,
                                tagLabel,
                              })
                        }
                        className={`relative flex items-center justify-center bg-transparent border-0 p-0 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${isLocked ? 'cursor-default' : 'hover:scale-[1.04] cursor-pointer'} ${isCurrent ? 'lesson-current-stamp' : ''}`}
                        style={{
                          width: nodeSizeActual,
                          height: nodeSizeActual,
                          marginBottom: isCurrent ? 10 : 0,
                        }}
                      >
                        <LessonStamp
                          tag={tag}
                          status={status}
                          size={nodeSizeActual}
                          lessonNumber={localIdx + 1}
                          seed={lesson.id}
                        />
                      </button>

                      <span
                        className="text-[10px] font-black uppercase tracking-wider mt-2 select-none transition-colors duration-200"
                        style={{ color: labelColor }}
                      >
                        {tagLabel}
                      </span>
                      {topicStage && (
                        <span
                          className="text-[9px] font-semibold tracking-wide mt-0.5 select-none"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {topicStage.label}
                        </span>
                      )}

                      {isPopoverOpen && (
                        <LessonNodePopover
                          lesson={lesson}
                          isLocked={isLocked}
                          isCompleted={isCompleted}
                          isMission={isMission}
                          levelLessons={levelLessons}
                          popoverRef={popoverRef}
                          onStart={() => {
                            if (!isLocked) {
                              router.push(isCurrent ? '/lesson' : `/lesson?id=${lesson.id}`);
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
