import { Search } from 'lucide-react';

type VocabularyNoResultsProps = {
  searchQuery: string;
  onClear: () => void;
};

export function VocabularyNoResults({ searchQuery, onClear }: VocabularyNoResultsProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-raised border border-border text-text-muted mb-4">
        <Search size={24} />
      </div>
      <h3 className="font-display text-xl font-bold text-text-primary">Nenhum resultado encontrado</h3>
      <p className="text-sm text-text-secondary mt-1 max-w-xs leading-relaxed">
        Não encontramos nenhuma palavra correspondente a &ldquo;{searchQuery}&rdquo;. Tente outra busca ou limpe os filtros.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 px-5 py-2.5 text-xs font-bold text-primary bg-primary-light hover:brightness-95 rounded-xl transition-all active:scale-95 cursor-pointer border border-primary/10"
      >
        Limpar busca e filtros
      </button>
    </div>
  );
}
