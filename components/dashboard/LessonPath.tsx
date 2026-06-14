import type { RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { TAG_LABELS, THEME_COLORS } from '@/components/dashboard/constants';
import { getTagIcon } from '@/components/dashboard/dashboardTagIcons';
import { LessonNodePopover } from '@/components/dashboard/LessonNodePopover';
import { getLessonNodeColors, getPathOffset } from '@/components/dashboard/utils';
import type { LessonModalState } from '@/components/dashboard/types';
import type { LessonDefinition } from '@/types';

type ThemeGroup = { title: string; lessons: LessonDefinition[] };

type LessonPathProps = {
  themes: ThemeGroup[];
  allLessons: LessonDefinition[];
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

export function LessonPath({
  themes,
  allLessons,
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
    <div className="flex flex-col items-center pb-28 md:pb-12">
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

                const offset = getPathOffset(localIdx, isMobile);
                const nodeSize = isMobile ? 64 : 72;
                const nodeSizeActual = isMission ? 80 : nodeSize;
                const iconSize = isMission ? 34 : 28;
                const nodeIcon = getTagIcon(lesson.tag ?? 'GRAM', iconSize);
                const finalNodeColors = getLessonNodeColors(isCompleted, isCurrent, isMission);
                const tagLabel = TAG_LABELS[lesson.tag ?? ''] ?? 'Gramática';
                const isPopoverOpen = modalState.isOpen && modalState.lesson?.id === lesson.id;

                return (
                  <div
                    key={lesson.id}
                    ref={isCurrent ? currentLessonRef : undefined}
                    className="relative flex flex-col items-center animate-scale-in"
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
                      {isCurrent && !isPopoverOpen && (
                        <div
                          className="duo-tooltip mb-3 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap border-2"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            color: isMission ? 'var(--color-warning)' : 'var(--color-primary)',
                            borderColor: 'var(--color-border)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            animation: 'float 2.5s ease-in-out infinite',
                          }}
                        >
                          {isMission ? '⭐ Missão!' : 'Começar'}
                          <div
                            className="absolute left-1/2 -translate-x-1/2 -bottom-[7px] w-3 h-3 rotate-45 border-r-2 border-b-2"
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              borderColor: 'var(--color-border)',
                            }}
                          />
                        </div>
                      )}

                      <button
                        id={`lesson-node-${lesson.id}`}
                        type="button"
                        tabIndex={isLocked ? -1 : 0}
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
                        className={`relative flex items-center justify-center rounded-full transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isLocked ? 'cursor-default' : 'hover:scale-[1.03] cursor-pointer'} ${isCurrent ? 'lesson-current-dot' : ''}`}
                        style={{
                          width: nodeSizeActual,
                          height: nodeSizeActual,
                          ...finalNodeColors,
                        }}
                      >
                        <div
                          className="absolute inset-2 rounded-full pointer-events-none"
                          style={{
                            background: isLocked
                              ? 'transparent'
                              : 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%)',
                          }}
                        />
                        <div className="relative z-10 translate-y-[-2px]">{nodeIcon}</div>
                      </button>

                      <span
                        className="text-[10px] font-black uppercase tracking-wider mt-2 select-none transition-colors duration-200"
                        style={{
                          color: isLocked ? 'var(--color-text-muted)' : isCurrent ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        }}
                      >
                        {tagLabel}
                      </span>

                      {isPopoverOpen && (
                        <LessonNodePopover
                          lesson={lesson}
                          isLocked={isLocked}
                          isCompleted={isCompleted}
                          isMission={isMission}
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
