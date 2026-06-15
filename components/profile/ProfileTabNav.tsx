import type { ReactNode } from 'react';
import { User, GraduationCap, Settings } from 'lucide-react';

export type ProfileTab = 'overview' | 'learning' | 'account';

type ProfileTabNavProps = {
  activeTab: ProfileTab;
  mistakeCount?: number;
  onTabChange: (tab: ProfileTab) => void;
};

export function ProfileTabNav({
  activeTab,
  mistakeCount = 0,
  onTabChange,
}: ProfileTabNavProps) {
  const tabs: {
    key: ProfileTab;
    label: string;
    icon: ReactNode;
    badge?: number;
  }[] = [
    { key: 'overview', label: 'Resumo', icon: <User size={14} /> },
    {
      key: 'learning',
      label: 'Aprendizado',
      icon: <GraduationCap size={14} />,
    },
    { key: 'account', label: 'Conta', icon: <Settings size={14} /> },
  ];

  return (
    <nav
      className="flex rounded-xl p-1 border border-border"
      style={{ backgroundColor: 'var(--color-bg)' }}
      role="tablist"
      aria-label="Seções do perfil"
    >
      {tabs.map(({ key, label, icon }) => {
        const isActive = activeTab === key;
        const showMistakeBadge = key === 'overview' && mistakeCount > 0;

        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive
                ? 'bg-surface text-text-primary shadow-sm border border-border'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {icon}
            <span className="truncate">{label}</span>
            {showMistakeBadge && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none"
                style={{
                  backgroundColor: isActive ? 'var(--color-error-bg)' : 'var(--color-surface-raised)',
                  color: 'var(--color-error)',
                }}
              >
                {mistakeCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
