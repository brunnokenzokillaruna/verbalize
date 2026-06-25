'use client';

import { MissionRolePlayHeader } from '@/components/lesson/mission-roleplay/MissionRolePlayHeader';
import { MissionRolePlayDone } from '@/components/lesson/mission-roleplay/MissionRolePlayDone';
import { MissionContextBar } from '@/components/lesson/mission-roleplay/MissionContextBar';
import { PastLineBubble } from '@/components/lesson/mission-roleplay/PastLineBubble';
import { LocalTurn } from '@/components/lesson/mission-roleplay/LocalTurn';
import { UserTurn } from '@/components/lesson/mission-roleplay/UserTurn';
import { MAX_PAST_LINES } from '@/components/lesson/mission-roleplay/missionTheme';
import type { LessonMissionRolePlayProps } from '@/components/lesson/mission-roleplay/types';
import { useMissionRolePlay } from '@/hooks/useMissionRolePlay';
import { recordOralExerciseOutcome } from '@/lib/oralExerciseTracking';
import { useAuthStore } from '@/store/authStore';
import type { MissionBriefingResult } from '@/types';

export type { LessonMissionRolePlayProps } from '@/components/lesson/mission-roleplay/types';

type Props = LessonMissionRolePlayProps & {
  briefing?: MissionBriefingResult | null;
};

export function LessonMissionRolePlay({
  dialogue,
  dialogueTranslations,
  language,
  intentMode = false,
  briefing,
  rolePlayConsequences,
  onComplete,
}: Props) {
  const { user } = useAuthStore();
  const {
    lines,
    totalSpeakable,
    current,
    currentIdx,
    spokenCount,
    showHint,
    recState,
    transcript,
    recordError,
    evalFeedback,
    evalCorrected,
    hasSpeechAPI,
    score,
    pastLineCount,
    setShowHint,
    advance,
    startRecording,
    stopRecording,
    playCurrentLine,
  } = useMissionRolePlay({
    dialogue,
    dialogueTranslations,
    language,
    intentMode,
    rolePlayConsequences,
    onComplete,
  });

  const pastStart = Math.max(0, pastLineCount - MAX_PAST_LINES);
  const visiblePastLines = lines.slice(pastStart, pastLineCount);

  return (
    <div className="flex flex-col gap-5 sm:gap-6 animate-fade-in">
      <MissionRolePlayHeader
        currentStep={Math.min(currentIdx + 1, lines.length)}
        totalSteps={lines.length}
        spokenCount={spokenCount}
        totalSpeakable={totalSpeakable}
      />

      {briefing && recState !== 'done' && (
        <MissionContextBar
          briefing={briefing}
          spokenCount={spokenCount}
          totalSpeakable={totalSpeakable}
        />
      )}

      {visiblePastLines.length > 0 && (
        <div className="flex flex-col gap-2 sm:gap-2.5">
          {pastLineCount > MAX_PAST_LINES && (
            <p className="text-[10px] font-semibold text-text-muted text-center">
              … {pastLineCount - MAX_PAST_LINES} falas anteriores
            </p>
          )}
          {visiblePastLines.map((line) => (
            <PastLineBubble key={line.rawIndex} line={line} />
          ))}
        </div>
      )}

      {current && recState !== 'done' && (
        <div className="flex flex-col gap-4 animate-slide-up">
          {current.isUserLine ? (
            <UserTurn
              line={current}
              showHint={showHint}
              hasSpeechAPI={hasSpeechAPI}
              recState={recState}
              transcript={transcript}
              recordError={recordError}
              score={score}
              intentMode={intentMode}
              evalFeedback={evalFeedback}
              evalCorrected={evalCorrected}
              onToggleHint={() => setShowHint((s) => !s)}
              onRecord={startRecording}
              onStopRecord={stopRecording}
              onSkip={() => {
                recordOralExerciseOutcome(user?.uid, 'skipped');
                advance(false);
              }}
              onConfirm={() => {
                recordOralExerciseOutcome(user?.uid, 'completed');
                advance(recState === 'review-correct');
              }}
              onRetry={startRecording}
              onPlayTarget={playCurrentLine}
            />
          ) : (
            <LocalTurn
              line={current}
              language={language}
              onReplay={playCurrentLine}
              onNext={() => advance(false)}
            />
          )}
        </div>
      )}

      {recState === 'done' && (
        <MissionRolePlayDone spokenCount={spokenCount} totalSpeakable={totalSpeakable} />
      )}
    </div>
  );
}
