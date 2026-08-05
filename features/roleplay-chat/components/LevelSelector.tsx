'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import type { ProficiencyLevel } from '@/types';

const LEVELS: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const LEVEL_THEME_PT: Record<ProficiencyLevel, string> = {
  A1: 'primeiras trocas',
  A2: 'rotina do dia a dia',
  B1: 'resolver problemas',
  B2: 'negociar e argumentar',
  C1: 'nuance profissional',
  C2: 'ambiguidade e persuasão',
};

export function LevelSelector({
  level,
  fromProfile,
  onChange,
}: {
  level: ProficiencyLevel;
  /** True while the level still matches the one inferred from the user's progress. */
  fromProfile: boolean;
  onChange: (next: ProficiencyLevel) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section
      className="rounded-2xl px-3.5 py-3"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
            {fromProfile ? 'Nível do seu progresso' : 'Nível escolhido'}
          </p>
          <p className="mt-0.5 truncate font-display text-base font-bold text-text-primary">
            {level}{' '}
            <span className="font-sans text-sm font-medium text-text-secondary">
              · {LEVEL_THEME_PT[level]}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {open ? 'Pronto' : 'Alterar'}
        </button>
      </div>

      {open && (
        <div className="mt-3 flex flex-wrap gap-1.5 animate-fade-in">
          {LEVELS.map((option) => {
            const active = option === level;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
                style={{
                  backgroundColor: active ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: active ? '#fff' : 'var(--color-text-secondary)',
                  border: '1.5px solid var(--color-border)',
                }}
              >
                {active && <Check size={13} />}
                {option}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
