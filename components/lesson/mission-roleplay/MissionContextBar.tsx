import { Target } from 'lucide-react';
import type { MissionBriefingResult } from '@/types';

type MissionContextBarProps = {
  briefing: MissionBriefingResult;
  spokenCount: number;
  totalSpeakable: number;
};

export function MissionContextBar({
  briefing,
  spokenCount,
  totalSpeakable,
}: MissionContextBarProps) {
  const nextObjective = briefing.objectives[Math.min(spokenCount, briefing.objectives.length - 1)];

  return (
    <div
      className="rounded-xl border border-success/20 px-3.5 py-3 sm:px-4 sm:py-3.5"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-success-bg) 80%, transparent)' }}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
          <Target size={16} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-success">
            Objetivo agora
          </p>
          <p className="grammar-secondary text-text-primary mt-0.5 leading-snug line-clamp-2">
            {nextObjective}
          </p>
          {totalSpeakable > 0 && (
            <p className="text-xs text-text-muted mt-1.5">
              Suas falas: {spokenCount}/{totalSpeakable}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
