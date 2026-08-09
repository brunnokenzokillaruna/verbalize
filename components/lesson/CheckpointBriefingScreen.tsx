'use client';

import { Target } from 'lucide-react';

interface CheckpointBriefingScreenProps {
  briefing: string;
  coveredTopics: string[];
  assessedTopics?: string[];
}

export function CheckpointBriefingScreen({
  briefing,
  coveredTopics,
  assessedTopics = [],
}: CheckpointBriefingScreenProps) {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
          <Target size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-black italic tracking-tight text-text-primary">
            Checkpoint
          </h2>
          <p className="text-xs font-semibold text-text-muted">
            Avaliação densa por amostragem — sem reexplicar a gramática
          </p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-text-primary">{briefing}</p>

      {assessedTopics.length > 0 && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2">
            Foco desta prova
          </p>
          <ul className="flex flex-col gap-1.5">
            {assessedTopics.map((topic) => (
              <li key={topic} className="text-sm font-medium text-text-primary">
                • {topic}
              </li>
            ))}
          </ul>
        </div>
      )}

      {coveredTopics.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted mb-1">
            Lembrete do bloco
          </p>
          <p className="text-xs text-text-muted mb-2">
            Não vamos reensinar tudo aqui — use só como âncora de memória.
          </p>
          <ul className="flex flex-col gap-1.5">
            {coveredTopics.map((topic) => (
              <li key={topic} className="text-sm text-text-primary">
                • {topic}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
