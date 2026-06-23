'use client';

import { CheckCircle2, RefreshCw } from 'lucide-react';

interface CheckpointDebriefScreenProps {
  comprehensionCorrect: number;
  comprehensionTotal: number;
  productionCorrect: number;
  productionTotal: number;
  passed: boolean;
  onReviewMistakes?: () => void;
}

export function CheckpointDebriefScreen({
  comprehensionCorrect,
  comprehensionTotal,
  productionCorrect,
  productionTotal,
  passed,
  onReviewMistakes,
}: CheckpointDebriefScreenProps) {
  const comprehensionPct =
    comprehensionTotal > 0 ? Math.round((comprehensionCorrect / comprehensionTotal) * 100) : 0;
  const productionPct =
    productionTotal > 0 ? Math.round((productionCorrect / productionTotal) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        {passed ? (
          <CheckCircle2 size={32} className="text-success" />
        ) : (
          <RefreshCw size={32} className="text-warning" />
        )}
      </div>

      <div>
        <h2 className="font-display text-2xl font-black italic text-text-primary">
          {passed ? 'Checkpoint concluído!' : 'Quase lá!'}
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          {passed
            ? 'Você demonstrou compreensão e produção neste trecho do curso.'
            : 'Revise os tópicos fracos antes de seguir — você pode continuar mesmo assim.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-bold uppercase text-text-muted">Compreensão</p>
          <p className="text-2xl font-black text-text-primary">{comprehensionPct}%</p>
          <p className="text-xs text-text-muted">
            {comprehensionCorrect}/{comprehensionTotal} corretas
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-bold uppercase text-text-muted">Produção</p>
          <p className="text-2xl font-black text-text-primary">{productionPct}%</p>
          <p className="text-xs text-text-muted">
            {productionCorrect}/{productionTotal} aceitas
          </p>
        </div>
      </div>

      {!passed && onReviewMistakes && (
        <button
          type="button"
          onClick={onReviewMistakes}
          className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
        >
          Ver erros pendentes no perfil
        </button>
      )}
    </div>
  );
}
