import { Zap, ChevronRight } from 'lucide-react';
import { REVIEW_SESSION_SIZE } from '@/utils/reviewSession';

type VocabularyReviewBannerProps = {
  dueCount: number;
  onStartReview: () => void;
};

export function VocabularyReviewBanner({ dueCount, onStartReview }: VocabularyReviewBannerProps) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-5 animate-slide-up-spring border-2"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-error)',
        boxShadow: '0 4px 0 var(--color-error-bg), 0 8px 16px rgba(220, 38, 38, 0.05)',
      }}
    >
      <div className="flex items-center gap-4 w-full md:w-auto flex-1">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: 'var(--color-error)',
            color: '#fff',
            boxShadow: '0 3px 0 #b91c1c',
          }}
        >
          <Zap size={22} className="animate-float" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-1.5">
            <span>Revisão Pendente</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-error-bg text-error">
              {dueCount}
            </span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {Math.min(dueCount, REVIEW_SESSION_SIZE)} palavras nesta sessão · escolha cartões ou frases em contexto
          </p>
        </div>
      </div>
      <div className="w-full md:w-auto mt-2 md:mt-0 shrink-0">
        <button
          type="button"
          onClick={onStartReview}
          className="w-full md:w-auto flex justify-center items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all active:scale-95 cursor-pointer bg-error text-white shadow-sm hover:brightness-105 active:translate-y-[2px]"
          style={{ boxShadow: '0 3px 0 #b91c1c' }}
        >
          Revisar agora
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
