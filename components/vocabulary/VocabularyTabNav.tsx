import type { ReactNode } from 'react';
import { Clock, Library } from 'lucide-react';

export type VocabularyTab = 'review' | 'library';

type VocabularyTabNavProps = {
  activeTab: VocabularyTab;
  dueCount: number;
  totalCount: number;
  onTabChange: (tab: VocabularyTab) => void;
};

export function VocabularyTabNav({
  activeTab,
  dueCount,
  totalCount,
  onTabChange,
}: VocabularyTabNavProps) {
  const tabs: { key: VocabularyTab; label: string; icon: ReactNode; badge?: number; badgeColor?: string }[] = [
    {
      key: 'review',
      label: 'Revisão',
      icon: <Clock size={14} />,
      badge: dueCount > 0 ? dueCount : undefined,
      badgeColor: 'var(--color-error)',
    },
    {
      key: 'library',
      label: 'Biblioteca',
      icon: <Library size={14} />,
      badge: totalCount > 0 ? totalCount : undefined,
      badgeColor: 'var(--color-vocab)',
    },
  ];

  return (
    <nav
      className="flex rounded-xl p-1 border border-border"
      style={{ backgroundColor: 'var(--color-bg)' }}
      role="tablist"
      aria-label="Seções do vocabulário"
    >
      {tabs.map(({ key, label, icon, badge, badgeColor }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive
                ? 'bg-surface text-text-primary shadow-sm border border-border'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {icon}
            {label}
            {badge !== undefined && badge > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none"
                style={{
                  backgroundColor: isActive ? `${badgeColor}18` : 'var(--color-surface-raised)',
                  color: isActive ? badgeColor : 'var(--color-text-muted)',
                }}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
