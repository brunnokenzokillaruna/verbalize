'use client';

import { useEffect, useMemo, useRef } from 'react';
import { generateRoleplayDebrief } from '@/app/actions/generateRoleplayDebrief';
import { MissionContextBar } from '@/components/lesson/mission-roleplay/MissionContextBar';
import { MissionRolePlayHeader } from '@/components/lesson/mission-roleplay/MissionRolePlayHeader';
import {
  buildMissionLiveConfig,
  buildMissionLiveConstraints,
} from '@/features/mission-live';
import { ChatTranscript } from '@/features/roleplay-chat/components/ChatTranscript';
import { SessionControls } from '@/features/roleplay-chat/components/SessionControls';
import { SupportButtons } from '@/features/roleplay-chat/components/SupportButtons';
import type { RoleplayChatMessage, RoleplayDebriefResult } from '@/features/roleplay-chat/types';
import { useLiveRoleplaySession } from '@/hooks/useLiveRoleplaySession';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { markSpontaneousProductionAccepted } from '@/lib/sessionProductionTracking';
import { incrementProductionStats } from '@/services/firestore';
import { useAuthStore } from '@/store/authStore';
import type { MissionBriefingResult, ProficiencyLevel, SupportedLanguage } from '@/types';

type Props = {
  briefing: MissionBriefingResult;
  dialogue: string;
  language: SupportedLanguage;
  level: ProficiencyLevel;
  lessonTitlePt?: string;
  onComplete: (result: {
    userTurns: number;
    debrief: RoleplayDebriefResult | null;
    completedGoalIndexes: number[];
  }) => void;
  /** Called when Live cannot start — parent should render scripted player instead. */
  onFallbackToScripted: () => void;
};

function toDebriefLines(messages: RoleplayChatMessage[]) {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      text: m.text,
      issueTags: m.grammar?.issueTags,
    }));
}

export function LessonMissionLiveRolePlay({
  briefing,
  dialogue,
  language,
  level,
  lessonTitlePt,
  onComplete,
  onFallbackToScripted,
}: Props) {
  const { user } = useAuthStore();
  const { play } = useSoundEffects();
  const startedRef = useRef(false);
  const finishedRef = useRef(false);
  const fallbackRef = useRef(false);
  const statsLoggedRef = useRef(false);
  const isMountedRef = useRef(true);

  const config = useMemo(
    () => buildMissionLiveConfig({ briefing, dialogue, language, level, lessonTitlePt }),
    [briefing, dialogue, language, level, lessonTitlePt],
  );
  const constraints = useMemo(
    () => buildMissionLiveConstraints({ briefing, dialogue, language, level, lessonTitlePt }),
    [briefing, dialogue, language, level, lessonTitlePt],
  );

  const session = useLiveRoleplaySession({
    language,
    level,
    scenario: config.scenario,
    userRolePt: config.userRolePt,
    objectivePt: config.objectivePt,
    intensity: config.intensity,
    correctionMode: config.correctionMode,
    missionConstraints: constraints,
    goalsPtOverride: config.scenario.goalsPt,
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-start once on mount
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void session.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once
  }, []);

  const spokenCount = session.messages.filter((m) => m.role === 'user' && m.text.trim()).length;
  const totalSpeakable = Math.max(config.scenario.goalsPt.length, 1);
  const live = session.status === 'live';
  const midSessionError = session.status === 'error' && spokenCount > 0;
  const connectFailure = session.status === 'error' && spokenCount === 0;

  // Connect-time failure only: no user speech yet → scripted fallback
  useEffect(() => {
    if (
      session.status !== 'error' ||
      fallbackRef.current ||
      finishedRef.current ||
      spokenCount > 0
    ) {
      return;
    }
    fallbackRef.current = true;
    void (async () => {
      try {
        await session.stop();
      } catch (err) {
        console.error('[LessonMissionLiveRolePlay] stop before fallback failed', err);
      }
      if (!isMountedRef.current) return;
      onFallbackToScripted();
    })();
    // session.stop is stable enough; omit session object to avoid re-running
    // eslint-disable-next-line react-hooks/exhaustive-deps -- connect-time fallback once
  }, [session.status, spokenCount, onFallbackToScripted]);

  async function finishSession() {
    // Fallback owns connect-time errors; don't complete into live debrief
    if (finishedRef.current || fallbackRef.current) return;
    if (session.status === 'error' && spokenCount === 0) {
      // Don't set finishedRef — fallback effect (or a later End) must not be blocked
      return;
    }

    finishedRef.current = true;

    // stop() keeps messages; reset() clears them — snapshot before async work
    const linesSnapshot = toDebriefLines(session.messages);
    const userTurns = linesSnapshot.filter((m) => m.role === 'user' && m.text.trim()).length;

    const finish = (debrief: RoleplayDebriefResult | null) => {
      if (!isMountedRef.current) return;
      const completedGoalIndexes = debrief?.completedGoalIndexes ?? [];
      const goalTotal = config.scenario.goalsPt.length;
      const goalDone = completedGoalIndexes.length;
      if (goalTotal > 0 && goalDone >= goalTotal) {
        play('perfect');
      } else if (goalDone > 0 || userTurns > 0) {
        play('complete');
      } else {
        play('session-end');
      }
      onComplete({
        userTurns,
        debrief,
        completedGoalIndexes,
      });
    };

    try {
      await session.stop();
      if (!isMountedRef.current) return;

      if (config.correctionMode === 'fluency' && userTurns > 0) {
        try {
          await session.reviewCorrections();
        } catch (err) {
          console.error('[LessonMissionLiveRolePlay] reviewCorrections failed', err);
        }
        if (!isMountedRef.current) return;
      }

      if (user && !statsLoggedRef.current && userTurns > 0) {
        statsLoggedRef.current = true;
        incrementProductionStats(user.uid, 'oralSpontaneous', true).catch(console.error);
        markSpontaneousProductionAccepted('oralSpontaneous');
      }

      let debrief: RoleplayDebriefResult | null = null;
      if (userTurns > 0 || linesSnapshot.length > 0) {
        try {
          debrief = await generateRoleplayDebrief({
            language,
            level,
            scenarioTitle: config.scenario.titlePt,
            userRolePt: config.userRolePt,
            objectivePt: config.objectivePt,
            goalsPt: config.scenario.goalsPt,
            lines: linesSnapshot,
          });
        } catch (err) {
          console.error('[LessonMissionLiveRolePlay] debrief failed', err);
        }
        if (!isMountedRef.current) return;
      }

      finish(debrief);
    } catch (err) {
      console.error('[LessonMissionLiveRolePlay] finishSession failed', err);
      // Advance the lesson even if stop/debrief blew up — don't leave End stuck
      finish(null);
    }
  }

  // Farewell auto-stop sets status 'ended' without pressing End — complete the same path
  useEffect(() => {
    if (session.status !== 'ended' || finishedRef.current || fallbackRef.current) return;
    void finishSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- complete once on farewell end
  }, [session.status]);

  return (
    <div className="flex flex-col gap-5 sm:gap-6 animate-fade-in">
      <MissionRolePlayHeader
        currentStep={1}
        totalSteps={1}
        spokenCount={spokenCount}
        totalSpeakable={totalSpeakable}
      />

      <MissionContextBar
        briefing={briefing}
        spokenCount={spokenCount}
        totalSpeakable={totalSpeakable}
      />

      <div className="flex min-h-[14rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface sm:min-h-[16rem]">
        <ChatTranscript
          messages={session.messages}
          characterName={config.scenario.characterName}
          speakingMessageId={session.speakingMessageId}
          narratedRange={session.narratedRange}
        />
      </div>

      <SupportButtons disabled={!live} onSend={session.sendCoachNote} />

      <SessionControls
        status={session.status}
        micEnabled={session.micEnabled}
        isAssistantSpeaking={session.isAssistantSpeaking}
        onToggleMic={session.toggleMic}
        onEnd={() => void finishSession()}
        endDisabled={connectFailure}
      />

      {session.status === 'connecting' && (
        <p className="text-center text-sm text-text-muted">Conectando a conversa ao vivo…</p>
      )}

      {midSessionError && (
        <p className="text-center text-sm text-error px-4">
          A conexão caiu. Encerrar ainda gera o feedback da conversa até aqui.
          {session.error ? ` (${session.error})` : ''}
        </p>
      )}
    </div>
  );
}
