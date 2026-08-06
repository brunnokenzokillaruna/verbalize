import { ArrowLeftRight, Flame, Zap } from 'lucide-react';

type DashboardTopBarProps = {
  langName: string;
  countryCode: string;
  currentStreak: number;
  totalLessonsCompleted: number;
  firstName: string;
  onOpenLanguageSheet: () => void;
  onOpenProfile: () => void;
};

export function DashboardTopBar({
  langName,
  countryCode,
  currentStreak,
  totalLessonsCompleted,
  firstName,
  onOpenLanguageSheet,
  onOpenProfile,
}: DashboardTopBarProps) {
  return (
    <header
      className="sticky top-0 z-[60] flex items-center justify-between px-4 py-3"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderBottom: '2px solid var(--color-border)',
      }}
    >
      <button
        onClick={onOpenLanguageSheet}
        className="duo-btn-flat flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold active:translate-y-[2px] active:shadow-none sm:gap-2 sm:px-3 sm:py-2 sm:text-sm cursor-pointer"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          boxShadow: '0 3px 0 var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://flagcdn.com/w40/${countryCode}.png`}
          alt={langName}
          className="h-4 w-auto rounded-[2px] sm:h-5 sm:rounded-[3px]"
        />
        <span className="hidden xs:inline">{langName}</span>
        <ArrowLeftRight size={10} style={{ color: 'var(--color-text-muted)' }} className="sm:w-3 sm:h-3" />
      </button>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 border border-border bg-surface"
          style={{ boxShadow: '0 2px 0 var(--color-border)' }}
        >
          <Flame size={16} className="sm:w-5 sm:h-5 text-amber-500" />
          <span className="text-xs font-extrabold tabular-nums sm:text-sm text-amber-500">
            {currentStreak}
          </span>
        </div>

        <div
          className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 border border-border bg-surface"
          style={{ boxShadow: '0 2px 0 var(--color-border)' }}
        >
          <Zap size={16} className="sm:w-[18px] sm:h-[18px] text-primary" />
          <span className="text-xs font-extrabold tabular-nums sm:text-sm text-primary">
            {totalLessonsCompleted}
          </span>
        </div>

        <button
          onClick={onOpenProfile}
          className="duo-icon-btn flex h-11 w-11 items-center justify-center rounded-xl font-extrabold text-sm uppercase transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:translate-y-[2px] active:shadow-none cursor-pointer"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            boxShadow: '0 3px 0 var(--color-border)',
            color: 'var(--color-primary)',
          }}
          aria-label="Abrir Perfil"
        >
          {firstName ? firstName[0] : 'U'}
        </button>
      </div>
    </header>
  );
}
