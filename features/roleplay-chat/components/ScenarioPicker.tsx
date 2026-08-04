'use client';

import { ROLEPLAY_SCENARIOS } from '@/features/roleplay-chat/scenarios';
import type { RoleplayScenarioId } from '@/features/roleplay-chat/types';
import type { ProficiencyLevel } from '@/types';

export function ScenarioPicker({
  level,
  selectedId,
  onSelect,
}: {
  level: ProficiencyLevel;
  selectedId: RoleplayScenarioId | null;
  onSelect: (id: RoleplayScenarioId) => void;
}) {
  const scenarios = ROLEPLAY_SCENARIOS.filter((s) => s.levels.includes(level));

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {scenarios.map((scenario) => {
        const active = selectedId === scenario.id;
        return (
          <button
            key={scenario.id}
            type="button"
            onClick={() => onSelect(scenario.id)}
            className="rounded-2xl px-3.5 py-3 text-left transition-all active:scale-[0.98] cursor-pointer"
            style={{
              backgroundColor: active ? 'var(--color-primary-light)' : 'var(--color-surface)',
              border: active
                ? '2px solid var(--color-primary)'
                : '1.5px solid var(--color-border)',
              boxShadow: active ? 'none' : '0 2px 0 var(--color-border)',
            }}
          >
            <p className="text-sm font-bold text-text-primary">{scenario.titlePt}</p>
            <p className="mt-0.5 text-xs text-text-secondary leading-snug">
              {scenario.descriptionPt}
            </p>
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              {scenario.characterName} · {scenario.characterRolePt}
            </p>
          </button>
        );
      })}
    </div>
  );
}
