import { Loader2, Zap, Trophy } from 'lucide-react';

type VerbChallengeCardProps = {
  bestScore: number | null;
  loading: boolean;
  onStart: () => void;
};

export function VerbChallengeCard({
  bestScore,
  loading,
  onStart,
}: VerbChallengeCardProps) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 animate-slide-up-spring border-2"
      style={{
        background: 'linear-gradient(135deg, var(--color-verb-bg) 0%, var(--color-surface) 55%)',
        borderColor: 'var(--color-verb)',
        boxShadow: '0 4px 0 rgba(109, 40, 217, 0.25), 0 8px 20px rgba(124, 58, 237, 0.08)',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
          style={{
            backgroundColor: 'var(--color-verb)',
            boxShadow: '0 3px 0 #6d28d9',
          }}
        >
          <Zap size={22} fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-text-primary">
            Sprint de Conjugação
          </h3>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            60 segundos de múltipla escolha. Combos aumentam sua pontuação.
          </p>
          {bestScore !== null && bestScore > 0 && (
            <p
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold"
              style={{ color: 'var(--color-warning)' }}
            >
              <Trophy size={11} />
              Recorde: {bestScore} pts
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all active:scale-95 text-white active:translate-y-[2px] disabled:opacity-70 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verb"
        style={{
          backgroundColor: 'var(--color-verb)',
          boxShadow: loading ? 'none' : '0 3px 0 #6d28d9',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Preparando sprint…
          </>
        ) : (
          <>
            Iniciar Sprint
            <Zap size={14} fill="currentColor" />
          </>
        )}
      </button>
    </div>
  );
}
