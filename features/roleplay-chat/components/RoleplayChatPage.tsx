'use client';

import { useMemo, useState } from 'react';
import { Headphones } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLiveRoleplaySession } from '@/hooks/useLiveRoleplaySession';
import { ChatTranscript } from '@/features/roleplay-chat/components/ChatTranscript';
import { ScenarioPicker } from '@/features/roleplay-chat/components/ScenarioPicker';
import { SessionControls } from '@/features/roleplay-chat/components/SessionControls';
import { getScenarioById } from '@/features/roleplay-chat/scenarios';
import type { RoleplayScenarioId } from '@/features/roleplay-chat/types';
import type { ProficiencyLevel } from '@/types';

const LEVELS: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function RoleplayChatPage() {
  const profile = useAuthStore((s) => s.profile);
  const language = profile?.currentTargetLanguage ?? 'fr';

  const [level, setLevel] = useState<ProficiencyLevel>('A2');
  const [scenarioId, setScenarioId] = useState<RoleplayScenarioId | null>('cafe');

  const scenario = useMemo(
    () => (scenarioId ? getScenarioById(scenarioId) ?? null : null),
    [scenarioId],
  );

  const {
    status,
    error,
    messages,
    micEnabled,
    isAssistantSpeaking,
    start,
    stop,
    reset,
    toggleMic,
  } = useLiveRoleplaySession({ language, level, scenario });

  const showSetup = status === 'idle' || (status === 'error' && messages.length === 0);
  const showSession = !showSetup;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[600px] flex-col md:min-h-[calc(100dvh)]">
      <header
        className="sticky top-0 z-10 px-4 py-3"
        style={{
          backgroundColor: 'var(--color-bg)',
          borderBottom: '2px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
            }}
          >
            <Headphones size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-bold text-text-primary truncate">
              Roleplay ao vivo
            </h1>
            <p className="text-[11px] text-text-muted truncate">
              Voz em tempo real · correção gramatical na tela
            </p>
          </div>
        </div>
      </header>

      {showSetup ? (
        <div className="flex flex-1 flex-col gap-5 px-4 py-5 pb-28">
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
              Seu nível
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((l) => {
                const active = level === l;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      setLevel(l);
                      setScenarioId(null);
                    }}
                    className="rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
                    style={{
                      backgroundColor: active
                        ? 'var(--color-primary)'
                        : 'var(--color-surface)',
                      color: active ? '#fff' : 'var(--color-text-secondary)',
                      border: '1.5px solid var(--color-border)',
                    }}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
              Cenário
            </h2>
            <ScenarioPicker
              level={level}
              selectedId={scenarioId}
              onSelect={setScenarioId}
            />
          </section>

          {error && (
            <p
              className="rounded-xl px-3 py-2 text-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-error, #ef4444) 12%, transparent)',
                color: 'var(--color-error, #ef4444)',
              }}
              role="alert"
            >
              {error}
            </p>
          )}

          <div
            className="rounded-2xl px-3.5 py-3 text-xs text-text-secondary leading-relaxed"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            Use fones de ouvido para evitar eco. Fale com naturalidade — a correção aparece sob
            suas falas sem interromper o personagem.
          </div>

          <button
            type="button"
            disabled={!scenario}
            onClick={() => void start()}
            className="mt-auto w-full rounded-2xl py-3.5 text-sm font-extrabold text-white transition-transform active:translate-y-[2px] disabled:opacity-40 cursor-pointer"
            style={{
              backgroundColor: 'var(--color-primary)',
              boxShadow: '0 4px 0 color-mix(in srgb, var(--color-primary) 70%, black)',
            }}
          >
            Iniciar conversa por voz
          </button>
        </div>
      ) : showSession ? (
        <>
          {scenario && (
            <div
              className="px-4 py-2 text-xs text-text-secondary"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <span className="font-bold text-text-primary">{scenario.titlePt}</span>
              {' · '}
              {scenario.characterName} · {level}
            </div>
          )}

          {error && (
            <p className="px-4 py-2 text-sm text-[var(--color-error,#ef4444)]" role="alert">
              {error}
            </p>
          )}

          <ChatTranscript
            messages={messages}
            characterName={scenario?.characterName ?? 'Parceiro'}
          />

          {(status === 'ended' || status === 'error') && (
            <div className="flex gap-2 px-4 pb-2">
              <button
                type="button"
                onClick={() => void start()}
                className="flex-1 rounded-2xl py-3 text-sm font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                }}
              >
                Nova conversa
              </button>
              <button
                type="button"
                onClick={() => void reset()}
                className="rounded-2xl px-4 py-3 text-sm font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Cenários
              </button>
            </div>
          )}

          <SessionControls
            status={status}
            micEnabled={micEnabled}
            isAssistantSpeaking={isAssistantSpeaking}
            onToggleMic={() => void toggleMic()}
            onEnd={() => void stop()}
          />
        </>
      ) : null}
    </div>
  );
}
