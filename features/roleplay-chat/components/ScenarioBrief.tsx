'use client';

import { Target } from 'lucide-react';
import type { RoleplayScenario } from '@/features/roleplay-chat/types';

export function ScenarioBrief({ scenario }: { scenario: RoleplayScenario }) {
  return (
    <div
      className="rounded-2xl px-3.5 py-3"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-2">
        <Target size={15} style={{ color: 'var(--color-primary)' }} />
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
          Sua missão
        </p>
      </div>
      <p className="mt-1 text-sm font-semibold text-text-primary leading-snug">
        {scenario.objectivePt}
      </p>

      {scenario.goalsPt.length > 0 && (
        <ol className="mt-2.5 flex flex-col gap-1.5">
          {scenario.goalsPt.map((goal, index) => (
            <li key={goal} className="flex items-start gap-2 text-xs text-text-secondary">
              <span
                className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                }}
              >
                {index + 1}
              </span>
              <span className="leading-snug">{goal}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
