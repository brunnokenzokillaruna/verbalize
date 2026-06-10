import { Loader2, Sparkles } from 'lucide-react';

interface VocabEnrichButtonProps {
  onClick: () => void;
  loading?: boolean;
  missingTranslation: boolean;
  missingImage: boolean;
  variant?: 'card' | 'inline';
}

function getLabel(missingTranslation: boolean, missingImage: boolean): string {
  if (missingTranslation && missingImage) return 'Completar';
  if (missingTranslation) return 'Traduzir';
  return 'Gerar imagem';
}

export function VocabEnrichButton({
  onClick,
  loading = false,
  missingTranslation,
  missingImage,
  variant = 'card',
}: VocabEnrichButtonProps) {
  const label = getLabel(missingTranslation, missingImage);

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all active:scale-95 disabled:opacity-60 shrink-0"
        style={{
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          border: '1px solid rgba(29, 94, 212, 0.2)',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-60"
      style={{
        backgroundColor: 'var(--color-primary)',
        color: '#fff',
        boxShadow: '0 2px 0 rgba(29, 94, 212, 0.35)',
        cursor: loading ? 'wait' : 'pointer',
      }}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
      {label}
    </button>
  );
}
