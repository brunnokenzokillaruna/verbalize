import { FastForward, Lock } from 'lucide-react';
import { ALL_LEVELS } from '@/components/dashboard/constants';
import type { ProficiencyLevel } from '@/types';

type DashboardBannerProps = {
  langFlag: string;
  selectedLevel: ProficiencyLevel;
  activeThemeTitle: string;
  activeLessonTitle: string;
  bannerColors: readonly [string, string];
  levelsWithLessons: Set<ProficiencyLevel>;
  switchingLang: boolean;
  onSelectLevel: (level: ProficiencyLevel) => void;
  onOpenSkipModal: () => void;
};

export function DashboardBanner({
  langFlag,
  selectedLevel,
  activeThemeTitle,
  activeLessonTitle,
  bannerColors,
  levelsWithLessons,
  switchingLang,
  onSelectLevel,
  onOpenSkipModal,
}: DashboardBannerProps) {
  return (
    <div className="sticky top-[61px] z-20 px-0 sm:px-4 pt-2 pb-4 animate-fade-in" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div
        className="rounded-2xl p-4.5 shadow-xl transition-all duration-500"
        style={{
          background: `linear-gradient(135deg, ${bannerColors[0]} 0%, ${bannerColors[1]} 100%)`,
          borderBottom: '4px solid rgba(0,0,0,0.2)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-colors duration-500 line-clamp-1 text-white/85">
              {langFlag} SEÇÃO {selectedLevel} · {activeThemeTitle}
            </p>
            <h1 className="font-display text-lg sm:text-[1.4rem] leading-tight font-black mt-1 text-white line-clamp-2">
              {activeLessonTitle}
            </h1>
          </div>

          <button
            onClick={onOpenSkipModal}
            disabled={switchingLang}
            className="duo-btn-flat shrink-0 flex flex-col items-center gap-0.5 sm:gap-1 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-tighter transition-all active:scale-90 disabled:opacity-50 cursor-pointer active:translate-y-[2px]"
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'var(--color-text-inverse)',
              boxShadow: '0 2px 0 rgba(0,0,0,0.1)',
            }}
            title="Pular esta lição"
          >
            <FastForward size={20} strokeWidth={2.5} />
            <span>Pular</span>
          </button>
        </div>

        <div
          className="mt-4 pt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.2)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {ALL_LEVELS.map((level) => {
            const hasLessons = levelsWithLessons.has(level);
            const isSelected = selectedLevel === level;

            return (
              <button
                key={level}
                type="button"
                disabled={!hasLessons}
                onClick={() => onSelectLevel(level)}
                className="shrink-0 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-extrabold active:scale-95 transition-all disabled:cursor-not-allowed cursor-pointer active:translate-y-[1px]"
                style={{
                  backgroundColor: isSelected ? 'var(--color-surface)' : 'rgba(255,255,255,0.12)',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text-inverse)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: isSelected ? '0 2px 0 var(--color-border-strong)' : '0 2px 0 rgba(0,0,0,0.1)',
                  opacity: !hasLessons ? 0.35 : 1,
                }}
              >
                <span className="flex items-center gap-1 sm:gap-1.5">
                  {level}
                  {!hasLessons && <Lock size={10} className="sm:w-3 sm:h-3" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
