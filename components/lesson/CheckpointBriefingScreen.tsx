'use client';

import { Target } from 'lucide-react';

interface CheckpointBriefingScreenProps {
  briefing: string;
  coveredTopics: string[];
}

export function CheckpointBriefingScreen({ briefing, coveredTopics }: CheckpointBriefingScreenProps) {
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
          <p className="text-xs font-semibold text-text-muted">Hora de provar o que você aprendeu</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-text-primary">{briefing}</p>

      {coveredTopics.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted mb-2">
            Tópicos revisados
          </p>
          <ul className="flex flex-col gap-1.5">
            {coveredTopics.map((topic) => (
              <li key={topic} className="text-sm text-text-primary">• {topic}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
