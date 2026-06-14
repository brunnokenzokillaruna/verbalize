import { Search, X, LayoutGrid, List } from 'lucide-react';
import type { SrsFilter } from '@/utils/vocabPageHelpers';

type VocabularyToolbarProps = {
  searchQuery: string;
  layoutMode: 'grid' | 'list';
  srsFilter: SrsFilter;
  totalCount: number;
  newCount: number;
  learningCount: number;
  masteredCount: number;
  onSearchChange: (query: string) => void;
  onLayoutChange: (mode: 'grid' | 'list') => void;
  onSrsFilterChange: (filter: SrsFilter) => void;
};

export function VocabularyToolbar({
  searchQuery,
  layoutMode,
  srsFilter,
  totalCount,
  newCount,
  learningCount,
  masteredCount,
  onSearchChange,
  onLayoutChange,
  onSrsFilterChange,
}: VocabularyToolbarProps) {
  return (
    <div
      className="flex flex-col gap-4 p-4 rounded-2xl border border-border"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar palavra ou tradução..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border text-text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
            style={{ backgroundColor: 'var(--color-bg)' }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-primary"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div
          className="flex rounded-xl p-1 border border-border self-start sm:self-auto shrink-0"
          style={{ backgroundColor: 'var(--color-bg)' }}
        >
          <button
            type="button"
            onClick={() => onLayoutChange('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              layoutMode === 'grid'
                ? 'bg-surface text-text-primary shadow-sm border border-border'
                : 'text-text-muted hover:text-text-primary'
            }`}
            title="Visualização em Grid"
          >
            <LayoutGrid size={13} /> Grid
          </button>
          <button
            type="button"
            onClick={() => onLayoutChange('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              layoutMode === 'list'
                ? 'bg-surface text-text-primary shadow-sm border border-border'
                : 'text-text-muted hover:text-text-primary'
            }`}
            title="Visualização em Lista Compacta"
          >
            <List size={13} /> Lista
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {(
          [
            { key: 'all' as const, label: 'Tudo', count: totalCount, active: 'bg-primary text-white border-primary' },
            { key: 'new' as const, label: 'Novas', count: newCount, active: 'bg-vocab text-white border-vocab' },
            { key: 'learning' as const, label: 'Praticando', count: learningCount, active: 'bg-verb text-white border-verb' },
            { key: 'mastered' as const, label: 'Dominadas', count: masteredCount, active: 'bg-success text-white border-success' },
          ] as const
        ).map(({ key, label, count, active }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSrsFilterChange(key)}
            className={`duo-level-chip shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
              srsFilter === key
                ? `${active} shadow-sm`
                : 'bg-surface text-text-secondary border-border hover:bg-surface-raised'
            }`}
          >
            {label} <span className="text-[10px] opacity-75 font-extrabold">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
