'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  FileText,
  Headphones,
  Loader2,
  Mic,
  SlidersHorizontal,
} from 'lucide-react';
import { generateRoleplayDebrief } from '@/app/actions/generateRoleplayDebrief';
import { useAuthStore } from '@/store/authStore';
import { useLiveRoleplaySession } from '@/hooks/useLiveRoleplaySession';
import { ChatTranscript } from '@/features/roleplay-chat/components/ChatTranscript';
import { CustomScenarioSetup } from '@/features/roleplay-chat/components/CustomScenarioSetup';
import { LevelSelector } from '@/features/roleplay-chat/components/LevelSelector';
import { RoleplayDebrief } from '@/features/roleplay-chat/components/RoleplayDebrief';
import { ScenarioBrief } from '@/features/roleplay-chat/components/ScenarioBrief';
import { ScenarioPicker } from '@/features/roleplay-chat/components/ScenarioPicker';
import { SegmentedControl } from '@/features/roleplay-chat/components/SegmentedControl';
import { SessionContextBar } from '@/features/roleplay-chat/components/SessionContextBar';
import { SessionControls } from '@/features/roleplay-chat/components/SessionControls';
import { SupportButtons } from '@/features/roleplay-chat/components/SupportButtons';
import {
  getDefaultScenarioForLevel,
  getScenarioById,
} from '@/features/roleplay-chat/scenarios';
import type {
  CorrectionMode,
  PresetScenarioId,
  RoleplayDebriefResult,
  RoleplayIntensity,
  RoleplayScenario,
} from '@/features/roleplay-chat/types';
import { levelFromLessonId } from '@/lib/curriculum/levelFromLessonId';
import type { ProficiencyLevel } from '@/types';

type SetupMode = 'presets' | 'custom';

const CORRECTION_OPTIONS = [
  { value: 'fluency' as CorrectionMode, labelPt: 'Fluência' },
  { value: 'study' as CorrectionMode, labelPt: 'Estudo' },
];

const INTENSITY_OPTIONS = [
  { value: 'gentle' as RoleplayIntensity, labelPt: 'Tranquilo' },
  { value: 'normal' as RoleplayIntensity, labelPt: 'Normal' },
  { value: 'challenging' as RoleplayIntensity, labelPt: 'Desafiador' },
];

const CORRECTION_HINT: Record<CorrectionMode, string> = {
  fluency: 'Nada interrompe a cena — as correções aparecem no fim da conversa.',
  study: 'A correção aparece embaixo de cada fala sua, durante a conversa.',
};

const INTENSITY_HINT: Record<RoleplayIntensity, string> = {
  gentle: 'O personagem fala pouco por vez e ajuda antes de você pedir.',
  normal: 'Ritmo natural para o seu nível.',
  challenging: 'O personagem cobra respostas mais completas e cria imprevistos.',
};

export function RoleplayChatPage() {
  const profile = useAuthStore((s) => s.profile);
  const language = profile?.currentTargetLanguage ?? 'fr';

  const profileLevel = useMemo<ProficiencyLevel | null>(() => {
    if (!profile) return null;
    const lang = profile.currentTargetLanguage ?? 'fr';
    return levelFromLessonId(profile.lessonProgress?.[lang]);
  }, [profile]);

  const [level, setLevel] = useState<ProficiencyLevel>(profileLevel ?? 'A1');
  const levelTouchedRef = useRef(false);
  const [intensity, setIntensity] = useState<RoleplayIntensity>('normal');
  const [correctionMode, setCorrectionMode] = useState<CorrectionMode>('study');
  const [showSettings, setShowSettings] = useState(false);
  const [setupMode, setSetupMode] = useState<SetupMode>('presets');
  const [scenario, setScenario] = useState<RoleplayScenario | null>(
    () => getDefaultScenarioForLevel(profileLevel ?? 'A1') ?? null,
  );
  const [debrief, setDebrief] = useState<RoleplayDebriefResult | null>(null);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [showDebrief, setShowDebrief] = useState(false);

  const {
    status,
    error,
    messages,
    micEnabled,
    isAssistantSpeaking,
    reviewingCorrections,
    start,
    stop,
    reset,
    toggleMic,
    sendCoachNote,
    reviewCorrections,
  } = useLiveRoleplaySession({
    language,
    level,
    scenario,
    userRolePt: scenario?.userRolePt,
    objectivePt: scenario?.objectivePt,
    intensity,
    correctionMode,
  });

  const sessionFinished = status === 'ended' || status === 'error';
  const showSetup = status === 'idle' || (sessionFinished && messages.length === 0);
  const goalsPt = scenario?.goalsPt ?? [];

  // The level follows the learner's curriculum progress until they override it.
  useEffect(() => {
    if (!profileLevel || levelTouchedRef.current) return;
    setLevel(profileLevel);
  }, [profileLevel]);

  // Presets are level-exclusive, so keep the selection valid for the current level.
  useEffect(() => {
    setScenario((current) => {
      if (current?.id === 'custom') return current;
      if (current && current.level === level) return current;
      return getDefaultScenarioForLevel(level) ?? null;
    });
  }, [level]);

  // Fluency mode holds feedback back — fill it in once the scene is over.
  const reviewRequestedRef = useRef(false);
  useEffect(() => {
    if (status === 'idle' || status === 'live') {
      reviewRequestedRef.current = false;
      return;
    }
    if (
      sessionFinished &&
      correctionMode === 'fluency' &&
      messages.length > 0 &&
      !reviewRequestedRef.current
    ) {
      reviewRequestedRef.current = true;
      void reviewCorrections();
    }
  }, [correctionMode, messages.length, reviewCorrections, sessionFinished, status]);

  async function handleOpenDebrief() {
    if (!scenario || messages.length === 0) return;

    setShowDebrief(true);
    if (debrief || debriefLoading) return;

    setDebriefLoading(true);
    const result = await generateRoleplayDebrief({
      language,
      level,
      scenarioTitle: scenario.titlePt,
      userRolePt: scenario.userRolePt,
      objectivePt: scenario.objectivePt,
      goalsPt: scenario.goalsPt,
      lines: messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          text: m.text,
          issueTags: m.grammar?.issueTags,
        })),
    });
    setDebrief(result);
    setDebriefLoading(false);
  }

  function handleLevelChange(next: ProficiencyLevel) {
    levelTouchedRef.current = true;
    setLevel(next);
  }

  function handlePresetSelect(id: PresetScenarioId) {
    setSetupMode('presets');
    setScenario(getScenarioById(id) ?? null);
  }

  function handleCustomReady(next: RoleplayScenario) {
    setSetupMode('presets');
    setScenario(next);
  }

  async function handleAgain(nextIntensity?: RoleplayIntensity) {
    setShowDebrief(false);
    setDebrief(null);
    if (nextIntensity) setIntensity(nextIntensity);
    await start(nextIntensity ? { intensity: nextIntensity } : undefined);
  }

  async function handleChangeScenario() {
    setShowDebrief(false);
    setDebrief(null);
    await reset();
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[600px] flex-col">
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
              Conversa por voz com correção na tela
            </p>
          </div>
        </div>
      </header>

      {showSetup ? (
        <>
          <div className="flex flex-1 flex-col gap-6 px-4 py-5 pb-6">
            <LevelSelector
              level={level}
              fromProfile={!levelTouchedRef.current && profileLevel === level}
              onChange={handleLevelChange}
            />

            {setupMode === 'custom' ? (
              <CustomScenarioSetup
                level={level}
                onReady={handleCustomReady}
                onCancel={() => setSetupMode('presets')}
              />
            ) : (
              <>
                <section className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted">
                      Escolha a cena
                    </h2>
                    <span className="text-[11px] text-text-muted">{level}</span>
                  </div>
                  <ScenarioPicker
                    level={level}
                    selectedId={scenario?.id ?? null}
                    onSelect={handlePresetSelect}
                    onCreateCustom={() => setSetupMode('custom')}
                  />
                </section>

                {scenario && (
                  <section
                    className="pt-1"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                  >
                    <div className="pt-4">
                      <ScenarioBrief scenario={scenario} />
                    </div>
                  </section>
                )}
              </>
            )}

            {error && (
              <p
                className="rounded-xl px-3 py-2 text-sm"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--color-error, #ef4444) 12%, transparent)',
                  color: 'var(--color-error, #ef4444)',
                }}
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          {setupMode === 'presets' && (
            <div
              className="sticky bottom-0 flex flex-col gap-2.5 px-4 pt-3"
              style={{
                backgroundColor: 'var(--color-bg)',
                borderTop: '1px solid var(--color-border)',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              }}
            >
              <section
                className="rounded-2xl"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1.5px solid var(--color-border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowSettings((v) => !v)}
                  aria-expanded={showSettings}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left cursor-pointer"
                >
                  <SlidersHorizontal
                    size={15}
                    style={{ color: 'var(--color-text-secondary)' }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-text-primary">
                      Como você quer praticar
                    </span>
                    <span className="block text-[11px] text-text-muted">
                      {correctionMode === 'fluency' ? 'Fluência' : 'Estudo'} ·{' '}
                      {INTENSITY_OPTIONS.find((o) => o.value === intensity)?.labelPt}
                    </span>
                  </span>
                  <ChevronDown
                    size={17}
                    className="shrink-0 transition-transform"
                    style={{
                      color: 'var(--color-text-muted)',
                      transform: showSettings ? 'rotate(180deg)' : 'none',
                    }}
                  />
                </button>

                {showSettings && (
                  <div
                    className="flex flex-col gap-4 px-3.5 pb-3.5 animate-fade-in"
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: '0.875rem',
                    }}
                  >
                    <SegmentedControl
                      label="Correções"
                      hint={CORRECTION_HINT[correctionMode]}
                      options={CORRECTION_OPTIONS}
                      value={correctionMode}
                      onChange={setCorrectionMode}
                    />
                    <SegmentedControl
                      label="Intensidade"
                      hint={INTENSITY_HINT[intensity]}
                      options={INTENSITY_OPTIONS}
                      value={intensity}
                      onChange={setIntensity}
                    />
                  </div>
                )}
              </section>

              <button
                type="button"
                disabled={!scenario}
                onClick={() => void start()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold text-white transition-transform active:translate-y-[2px] disabled:opacity-40 cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  boxShadow: '0 4px 0 color-mix(in srgb, var(--color-primary) 70%, black)',
                }}
              >
                <Mic size={17} />
                Iniciar conversa
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {scenario && (
            <SessionContextBar
              titlePt={scenario.titlePt}
              userRolePt={scenario.userRolePt}
              aiRolePt={scenario.characterRolePt}
              objectivePt={scenario.objectivePt}
              goalsPt={goalsPt}
              level={level}
            />
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

          {reviewingCorrections && (
            <p className="flex items-center justify-center gap-2 px-4 pb-2 text-xs text-text-muted">
              <Loader2 size={14} className="animate-spin" />
              Revisando suas falas…
            </p>
          )}

          {sessionFinished ? (
            <div
              className="mx-4 mb-3 rounded-2xl p-3.5"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
              }}
            >
              <p className="text-sm font-bold text-text-primary">Conversa concluída</p>
              <p className="mt-0.5 text-xs text-text-secondary leading-snug">
                Releia as falas e as correções acima. Quando quiser, veja seu resumo.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleOpenDebrief()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white cursor-pointer"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <FileText size={17} />
                  Ver resumo
                </button>
                <button
                  type="button"
                  onClick={() => void handleChangeScenario()}
                  className="rounded-xl px-4 py-3 text-sm font-bold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1.5px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Cenários
                </button>
              </div>
            </div>
          ) : (
            <>
              <SupportButtons disabled={status !== 'live'} onSend={sendCoachNote} />
              <SessionControls
                status={status}
                micEnabled={micEnabled}
                isAssistantSpeaking={isAssistantSpeaking}
                onToggleMic={() => void toggleMic()}
                onEnd={() => void stop()}
              />
            </>
          )}
        </>
      )}

      <RoleplayDebrief
        isOpen={showDebrief}
        debrief={debrief}
        loading={debriefLoading}
        goalsPt={goalsPt}
        canIncreaseIntensity={intensity !== 'challenging'}
        onClose={() => setShowDebrief(false)}
        onAgain={() => void handleAgain()}
        onAgainHarder={() =>
          void handleAgain(intensity === 'gentle' ? 'normal' : 'challenging')
        }
        onChangeScenario={() => void handleChangeScenario()}
      />
    </div>
  );
}
