import { BookOpen, Loader2 } from 'lucide-react';

export function VocabularyLoadingState() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-4"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl animate-pulse"
        style={{ backgroundColor: 'var(--color-primary-light)' }}
      >
        <BookOpen size={28} style={{ color: 'var(--color-primary)' }} />
      </div>
      <div className="flex items-center gap-2">
        <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Carregando vocabulário…
        </p>
      </div>
    </div>
  );
}
