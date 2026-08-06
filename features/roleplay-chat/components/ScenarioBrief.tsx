'use client';

import type { RoleplayScenario } from '@/features/roleplay-chat/types';

/** Compact mission strip for the selected scene — sits under the picker, not as another heavy card. */
export function ScenarioBrief({ scenario }: { scenario: RoleplayScenario }) {
  return (
    <div className="px-0.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
        Sua missão
      </p>
      <p className="mt-1 text-sm font-semibold text-text-primary leading-snug">
        {scenario.objectivePt}
      </p>

      {scenario.goalsPt.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {scenario.goalsPt.map((goal, index) => (
            <li
              key={goal}
              className="rounded-lg px-2 py-1 text-[11px] leading-snug text-text-secondary"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <span className="font-bold" style={{ color: 'var(--color-primary)' }}>
                {index + 1}.
              </span>{' '}
              {goal}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
