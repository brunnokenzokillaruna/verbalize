import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import type { ProficiencyLevel, SupportedLanguage } from '@/types';

interface Lesson {
  id: string;
  level: string;
  grammarFocus: string;
}

interface LessonBrowserProps {
  allLessons: Lesson[];
  frontierIndex: number;
  initialLevel: ProficiencyLevel;
}

function MarqueeText({ text, className, style }: { text: string; className?: string; style?: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [scrollDist, setScrollDist] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && contentRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const contentWidth = contentRef.current.scrollWidth;
        // Small buffer to avoid unnecessary scrolling
        if (contentWidth > containerWidth + 2) {
          setScrollDist(containerWidth - contentWidth);
        } else {
          setScrollDist(0);
        }
      }
    };

    checkOverflow();
    const timer = setTimeout(checkOverflow, 100); // Small delay for layout
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden whitespace-nowrap ${className}`}
      style={style}
    >
      <span
        ref={contentRef}
        className="inline-block"
        style={{
          animation: scrollDist < 0 ? `marquee-slide ${Math.abs(scrollDist) / 25 + 6}s linear infinite` : 'none',
          '--scroll-dist': `${scrollDist}px`,
        } as any}
      >
        {text}
      </span>
    </div>
  );
}

const ALL_LEVELS: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LESSONS_PER_PAGE = 6;

export function LessonBrowser({
  allLessons,
  frontierIndex,
  initialLevel,
}: LessonBrowserProps) {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel>(initialLevel);
  const [page, setPage] = useState(0);

  const levelsWithLessons = new Set(allLessons.map((l) => l.level));

  function handleSelectLevel(level: ProficiencyLevel) {
    setSelectedLevel(level);
    setPage(0);
  }

  const levelLessons = allLessons.filter((l) => l.level === selectedLevel);
  const totalPages = Math.max(1, Math.ceil(levelLessons.length / LESSONS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const visibleLessons = levelLessons.slice(
    safePage * LESSONS_PER_PAGE,
    (safePage + 1) * LESSONS_PER_PAGE,
  );

  return (
    <div className="mt-10 animate-slide-up-spring delay-450">
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Explorar lições
        </p>
      </div>

      {/* Level selector chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-5 lg:flex-wrap lg:overflow-visible lg:pb-0"
        style={{ scrollbarWidth: 'none' }}
      >
        {ALL_LEVELS.map((level) => {
          const hasLessons = levelsWithLessons.has(level);
          const isSelected = selectedLevel === level;

          return (
            <button
              key={level}
              type="button"
              disabled={!hasLessons}
              onClick={() => handleSelectLevel(level)}
              className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isSelected
                  ? 'var(--color-primary)'
                  : hasLessons
                    ? 'var(--color-surface)'
                    : 'var(--color-surface-raised)',
                color: isSelected
                  ? '#fff'
                  : hasLessons
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                opacity: !hasLessons ? 0.5 : 1,
                boxShadow: isSelected ? '0 4px 12px rgba(29,94,212,0.25)' : 'none',
              }}
            >
              {level}
              {!hasLessons && <Lock size={11} style={{ flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      {/* Empty state for locked levels */}
      {levelLessons.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 rounded-3xl py-14 animate-fade-in"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1.5px dashed var(--color-border)',
          }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <Lock size={24} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Nível {selectedLevel} — Em breve
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Este nível ainda está sendo preparado.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Lesson list */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {visibleLessons.map((lesson, idx) => {
              const i = allLessons.findIndex((l) => l.id === lesson.id);
              const isCompleted = i < frontierIndex;
              const isCurrent = i === frontierIndex;
              const isLocked = i > frontierIndex;
              const title = lesson.grammarFocus.split(' — ')[0];

              return (
                <button
                  key={lesson.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => router.push(`/lesson?id=${lesson.id}`)}
                  className="card-lift group flex items-center gap-4 rounded-2xl p-4 text-left disabled:cursor-not-allowed animate-slide-up"
                  style={{
                    animationDelay: `${idx * 60}ms`,
                    animationFillMode: 'both',
                    backgroundColor: isCurrent
                      ? 'var(--color-primary-light)'
                      : 'var(--color-surface)',
                    border: `1.5px solid ${
                      isCurrent ? 'var(--color-primary)' : 'var(--color-border)'
                    }`,
                    opacity: isLocked ? 0.45 : 1,
                  }}
                >
                  {/* Status badge */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold${isCurrent ? ' lesson-current-dot' : ''}`}
                    style={{
                      background: isCompleted
                        ? 'linear-gradient(135deg, #059669, #10b981)'
                        : isCurrent
                          ? 'var(--color-primary)'
                          : 'var(--color-surface-raised)',
                      color: isCompleted || isCurrent ? '#fff' : 'var(--color-text-muted)',
                      boxShadow: isCompleted
                        ? '0 2px 8px rgba(5,150,105,0.3)'
                        : isCurrent
                          ? '0 2px 8px rgba(29,94,212,0.3)'
                          : 'none',
                    }}
                  >
                    {isCompleted ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                  </div>

                  {/* Lesson info */}
                  <div className="flex-1 min-w-0">
                    <MarqueeText
                      text={title}
                      className="text-sm font-semibold"
                      style={{
                        color: isLocked
                          ? 'var(--color-text-muted)'
                          : isCurrent
                            ? 'var(--color-primary)'
                            : 'var(--color-text-primary)',
                      }}
                    />
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {lesson.level}
                      {isCurrent && (
                        <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                          {' '}· Próxima
                        </span>
                      )}
                      {isCompleted && (
                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                          {' '}· Concluída
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Right icon */}
                  {isLocked
                    ? <Lock size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    : (
                      <ChevronRight
                        size={16}
                        style={{
                          color: isCurrent ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          flexShrink: 0,
                          transition: 'transform 200ms ease',
                        }}
                        className="group-hover:translate-x-0.5"
                      />
                    )}
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: safePage === 0 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                  border: '1.5px solid var(--color-border)',
                  opacity: safePage === 0 ? 0.45 : 1,
                }}
              >
                <ChevronLeft size={15} />
                Anterior
              </button>

              <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
                {safePage + 1} / {totalPages}
              </span>

              <button
                type="button"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: safePage >= totalPages - 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                  border: '1.5px solid var(--color-border)',
                  opacity: safePage >= totalPages - 1 ? 0.45 : 1,
                }}
              >
                Próxima
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
