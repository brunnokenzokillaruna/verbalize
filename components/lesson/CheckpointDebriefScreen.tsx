'use client';

import { CheckCircle2, RefreshCw } from 'lucide-react';

interface CheckpointDebriefScreenProps {
  comprehensionCorrect: number;
  comprehensionTotal: number;
  productionCorrect: number;
  productionTotal: number;
  passed: boolean;
  overallPct: number;
  strongTopics?: string[];
  weakTopics?: string[];
  onReviewMistakes?: () => void;
}

export function CheckpointDebriefScreen({
  comprehensionCorrect,
  comprehensionTotal,
  productionCorrect,
  productionTotal,
  passed,
  overallPct,
  strongTopics = [],
  weakTopics = [],
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
          {passed ? 'Checkpoint concluído!' : 'Ainda não passou'}
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          {passed
            ? 'Você mostrou retenção sólida neste trecho — compreensão e produção no nível esperado.'
            : 'O critério ficou mais exigente. Revise os pontos fracos; você ainda pode seguir o caminho.'}
        </p>
        <p className="mt-3 text-3xl font-black text-text-primary">{overallPct}%</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Resultado geral
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

      {(strongTopics.length > 0 || weakTopics.length > 0) && (
        <div className="grid gap-3 text-left">
          {strongTopics.length > 0 && (
            <div className="rounded-xl border border-success/30 bg-success/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-success mb-2">
                Firmes
              </p>
              <ul className="flex flex-col gap-1">
                {strongTopics.map((topic) => (
                  <li key={topic} className="text-sm text-text-primary">
                    • {topic}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {weakTopics.length > 0 && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-warning mb-2">
                Revisar
              </p>
              <ul className="flex flex-col gap-1">
                {weakTopics.map((topic) => (
                  <li key={topic} className="text-sm text-text-primary">
                    • {topic}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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
