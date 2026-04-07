import { Flame, ArrowLeftRight } from 'lucide-react';
import type { UserDocument } from '@/types';

export interface LangLabel {
  name: string;
  flag: string;
  countryCode: string;
}

interface StatsRowProps {
  profile: UserDocument;
  lang: LangLabel;
  theme: string;
  onShowLangSheet: () => void;
}

export function StatsRow({ profile, lang, theme, onShowLangSheet }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4 md:gap-4">
      {/* Streak card */}
      <div
        className="card-lift relative overflow-hidden rounded-2xl p-5 animate-slide-up-spring delay-75 flex flex-col"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(135deg, #3d2e00 0%, #4a3800 100%)'
            : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '1px solid',
          borderColor: theme === 'dark' ? 'rgba(251,191,36,0.2)' : 'rgba(217,119,6,0.2)',
        }}
      >
        {/* Decorative orbs */}
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -left-4 bottom-0 h-16 w-16 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #d97706 0%, transparent 70%)' }}
        />

        {/* Top row: label + flame */}
        <div className="relative flex items-center justify-between mb-3">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: theme === 'dark' ? 'rgba(251,191,36,0.55)' : '#b45309' }}
          >
            Sequência
          </span>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl animate-glow-amber shrink-0"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 4px 12px rgba(217,119,6,0.4)',
            }}
          >
            <Flame size={16} color="#fff" />
          </div>
        </div>

        {/* Big number */}
        <p
          className="relative text-4xl font-bold leading-none tabular-nums"
          style={{ color: theme === 'dark' ? '#fbbf24' : '#92400e' }}
        >
          {profile.currentStreak}
        </p>
        <p
          className="relative text-xs mt-0.5 font-medium"
          style={{ color: theme === 'dark' ? 'rgba(251,191,36,0.65)' : '#b45309' }}
        >
          {profile.currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
        </p>

        {/* Weekly progress dots */}
        <div className="relative flex gap-1 mt-4">
          {Array.from({ length: 7 }).map((_, i) => {
            const currentStreak = profile.currentStreak ?? 0;
            const filled = currentStreak === 0 ? 0
              : currentStreak % 7 === 0 ? 7
              : currentStreak % 7;
            const isActive = i < filled;
            return (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: isActive
                    ? (theme === 'dark' ? '#fbbf24' : '#d97706')
                    : (theme === 'dark' ? 'rgba(251,191,36,0.15)' : 'rgba(217,119,6,0.2)'),
                  boxShadow: isActive ? '0 0 4px rgba(217,119,6,0.5)' : 'none',
                }}
              />
            );
          })}
        </div>
        <p
          className="relative text-xs mt-1"
          style={{ color: theme === 'dark' ? 'rgba(251,191,36,0.35)' : 'rgba(180,83,9,0.55)' }}
        >
          Meta semanal
        </p>
      </div>

      {/* Language card */}
      <div
        className="card-lift flex flex-col justify-between rounded-2xl p-5 animate-slide-up-spring delay-150"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w40/${lang.countryCode}.png`}
            alt={lang.name}
            className="h-7 w-auto object-contain rounded-sm"
          />
          <button
            type="button"
            onClick={onShowLangSheet}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
            }}
          >
            <ArrowLeftRight size={11} />
            Trocar
          </button>
        </div>
        <div className="mt-2">
          <p className="font-semibold text-sm leading-none" style={{ color: 'var(--color-text-primary)' }}>
            {lang.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Idioma atual
          </p>
        </div>
      </div>
    </div>
  );
}
