import type { ReactNode } from 'react';
import { Flame, BookOpen } from 'lucide-react';
import { LanguageFlag } from '@/components/LanguageFlag';
import { getEffectiveStreak } from '@/lib/stats';
import type { UserDocument, SupportedLanguage } from '@/types';

type ProfileHeroProps = {
  profile: UserDocument;
  mistakeCount?: number;
};

export function ProfileHero({ profile, mistakeCount = 0 }: ProfileHeroProps) {
  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const streak = getEffectiveStreak(profile);
  const language = profile.currentTargetLanguage as SupportedLanguage;

  return (
    <div
      className="rounded-2xl border border-border bg-surface p-5 animate-slide-up-spring"
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-extrabold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
            boxShadow: '0 2px 0 var(--color-primary-dark)',
          }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold text-text-primary truncate">
            {profile.name}
          </p>
          <p className="text-xs text-text-muted truncate">{profile.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <LanguageFlag language={language} size="sm" />
            {profile.profession && (
              <span className="text-[10px] font-bold text-text-secondary truncate">
                {profile.profession}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <InlineStat
          icon={<Flame size={13} />}
          value={streak}
          label={streak === 1 ? 'dia seguido' : 'dias seguidos'}
          accent="var(--color-warning)"
          bg="var(--color-warning-bg)"
        />
        <InlineStat
          icon={<BookOpen size={13} />}
          value={profile.totalLessonsCompleted}
          label={profile.totalLessonsCompleted === 1 ? 'lição' : 'lições'}
          accent="var(--color-primary)"
          bg="var(--color-primary-light)"
        />
        {mistakeCount > 0 && (
          <InlineStat
            icon={<span className="text-[11px] font-extrabold">!</span>}
            value={mistakeCount}
            label={mistakeCount === 1 ? 'erro' : 'erros'}
            accent="var(--color-error)"
            bg="var(--color-error-bg)"
          />
        )}
      </div>
    </div>
  );
}

function InlineStat({
  icon,
  value,
  label,
  accent,
  bg,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  accent: string;
  bg: string;
}) {
  return (
    <div
      className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 border border-border min-w-0"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: bg, color: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-none text-text-primary">{value}</p>
        <p className="text-[10px] font-medium text-text-muted truncate mt-0.5">{label}</p>
      </div>
    </div>
  );
}
