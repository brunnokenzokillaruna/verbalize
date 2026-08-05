'use client';

import { useEffect, useState, useTransition, type CSSProperties } from 'react';
import { suggestRoleplayRoles } from '@/app/actions/suggestRoleplayRoles';
import { buildCustomScenario } from '@/features/roleplay-chat/buildCustomScenario';
import { userRolesForAiRole } from '@/features/roleplay-chat/roleSuggestions';
import type { RoleplayRolePair, RoleplayScenario } from '@/features/roleplay-chat/types';
import type { ProficiencyLevel } from '@/types';

const fieldStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1.5px solid var(--color-border)',
  color: 'var(--color-text-primary)',
};

export function CustomScenarioSetup({
  level,
  onReady,
  onCancel,
}: {
  level: ProficiencyLevel;
  onReady: (scenario: RoleplayScenario) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState('');
  const [pairs, setPairs] = useState<RoleplayRolePair[]>([]);
  const [aiRole, setAiRole] = useState('');
  const [userRole, setUserRole] = useState('');
  const [objective, setObjective] = useState('');
  const [pending, startTransition] = useTransition();
  const [hint, setHint] = useState<string | null>(null);

  const userOptions = aiRole ? userRolesForAiRole(pairs, aiRole) : [];

  useEffect(() => {
    setUserRole('');
  }, [aiRole]);

  function requestRoles() {
    const trimmed = text.trim();
    if (trimmed.length < 8) {
      setHint('Descreva o cenário com pelo menos uma frase curta.');
      return;
    }
    setHint(null);
    startTransition(async () => {
      const result = await suggestRoleplayRoles(trimmed);
      setPairs(result.pairs);
      setAiRole(result.pairs[0]?.aiRolePt ?? '');
      setUserRole('');
      if (result.usedFallback) {
        setHint('Sugestões locais — você ainda pode escolher e ajustar.');
      }
    });
  }

  function confirm() {
    if (!aiRole || !userRole || objective.trim().length < 4) return;
    onReady(
      buildCustomScenario({
        scenarioText: text,
        aiRolePt: aiRole,
        userRolePt: userRole,
        objectivePt: objective.trim(),
        level,
      }),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted">
          Criar cenário
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-text-secondary cursor-pointer"
        >
          Voltar aos prontos
        </button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text-secondary">
          Descreva a situação
        </span>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPairs([]);
            setAiRole('');
            setUserRole('');
          }}
          rows={3}
          maxLength={280}
          placeholder="Ex.: Quero praticar pedir comida num restaurante barato em Lyon…"
          className="w-full resize-none rounded-2xl px-3.5 py-3 text-sm outline-none"
          style={fieldStyle}
        />
      </label>

      <button
        type="button"
        disabled={pending || text.trim().length < 8}
        onClick={requestRoles}
        className="w-full rounded-2xl py-3 text-sm font-bold cursor-pointer disabled:opacity-40"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          boxShadow: '0 2px 0 var(--color-border)',
        }}
      >
        {pending ? 'Pensando nos papéis…' : 'Sugerir papéis'}
      </button>

      {hint && <p className="text-xs text-text-muted">{hint}</p>}

      {pairs.length > 0 && (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-secondary">Papel da IA</span>
            <select
              value={aiRole}
              onChange={(e) => setAiRole(e.target.value)}
              className="w-full rounded-2xl px-3.5 py-3 text-sm cursor-pointer"
              style={fieldStyle}
            >
              {pairs.map((p) => (
                <option key={p.aiRolePt} value={p.aiRolePt}>
                  {p.aiRolePt}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-secondary">Seu papel</span>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              disabled={!aiRole}
              className="w-full rounded-2xl px-3.5 py-3 text-sm cursor-pointer disabled:opacity-40"
              style={fieldStyle}
            >
              <option value="">Escolha…</option>
              {userOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-secondary">
              Objetivo da conversa
            </span>
            <input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              maxLength={160}
              placeholder="Ex.: Pedir o prato do dia e a conta"
              className="w-full rounded-2xl px-3.5 py-3 text-sm outline-none"
              style={fieldStyle}
            />
          </label>

          <button
            type="button"
            disabled={!aiRole || !userRole || objective.trim().length < 4}
            onClick={confirm}
            className="w-full rounded-2xl py-3.5 text-sm font-extrabold text-white cursor-pointer disabled:opacity-40"
            style={{
              backgroundColor: 'var(--color-primary)',
              boxShadow: '0 4px 0 color-mix(in srgb, var(--color-primary) 70%, black)',
            }}
          >
            Usar este cenário
          </button>
        </>
      )}
    </div>
  );
}
