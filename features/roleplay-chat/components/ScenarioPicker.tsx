'use client';

import { Check, Sparkles } from 'lucide-react';
import { getScenariosForLevel } from '@/features/roleplay-chat/scenarios';
import type { PresetScenarioId, RoleplayScenarioId } from '@/features/roleplay-chat/types';
import type { ProficiencyLevel } from '@/types';

export function ScenarioPicker({
  level,
  selectedId,
  onSelect,
  onCreateCustom,
}: {
  level: ProficiencyLevel;
  selectedId: RoleplayScenarioId | null;
  onSelect: (id: PresetScenarioId) => void;
  onCreateCustom: () => void;
}) {
  const scenarios = getScenariosForLevel(level);

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {scenarios.map((scenario) => {
        const active = selectedId === scenario.id;
        return (
          <button
            key={scenario.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(scenario.id as PresetScenarioId)}
            className="relative rounded-2xl px-3.5 py-3 text-left transition-all active:scale-[0.98] cursor-pointer"
            style={{
              backgroundColor: active ? 'var(--color-primary-light)' : 'var(--color-surface)',
              border: active
                ? '2px solid var(--color-primary)'
                : '1.5px solid var(--color-border)',
              boxShadow: active ? 'none' : '0 2px 0 var(--color-border)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-text-primary leading-snug">
                {scenario.titlePt}
              </p>
              {active && (
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                >
                  <Check size={13} />
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-text-secondary leading-snug">
              {scenario.descriptionPt}
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Você: {scenario.userRolePt} · IA: {scenario.characterRolePt}
            </p>
          </button>
        );
      })}

      <button
        type="button"
        aria-pressed={selectedId === 'custom'}
        onClick={onCreateCustom}
        className="relative flex flex-col justify-center rounded-2xl px-3.5 py-3 text-left transition-all active:scale-[0.98] cursor-pointer"
        style={{
          backgroundColor:
            selectedId === 'custom' ? 'var(--color-primary-light)' : 'var(--color-surface)',
          border:
            selectedId === 'custom'
              ? '2px solid var(--color-primary)'
              : '1.5px dashed var(--color-border)',
        }}
      >
        <span className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
            }}
          >
            <Sparkles size={14} />
          </span>
          <span className="text-sm font-bold text-text-primary leading-snug">
            Criar o meu cenário
          </span>
        </span>
        <p className="mt-1.5 text-xs text-text-secondary leading-snug">
          Descreva a situação e escolha os papéis.
        </p>
      </button>
    </div>
  );
}
