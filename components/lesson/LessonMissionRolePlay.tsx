'use client';

import { MissionRolePlayHeader } from '@/components/lesson/mission-roleplay/MissionRolePlayHeader';
import { MissionRolePlayDone } from '@/components/lesson/mission-roleplay/MissionRolePlayDone';
import { PastLineBubble } from '@/components/lesson/mission-roleplay/PastLineBubble';
import { LocalTurn } from '@/components/lesson/mission-roleplay/LocalTurn';
import { UserTurn } from '@/components/lesson/mission-roleplay/UserTurn';
import type { LessonMissionRolePlayProps } from '@/components/lesson/mission-roleplay/types';
import { useMissionRolePlay } from '@/hooks/useMissionRolePlay';

export type { LessonMissionRolePlayProps } from '@/components/lesson/mission-roleplay/types';

export function LessonMissionRolePlay({
  dialogue,
  dialogueTranslations,
  language,
  intentMode = false,
  onComplete,
}: LessonMissionRolePlayProps) {
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
    onComplete,
  });

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <MissionRolePlayHeader
        currentStep={Math.min(currentIdx + 1, lines.length)}
        totalSteps={lines.length}
      />

      <div className="flex flex-col gap-3">
        {lines.slice(0, pastLineCount).map((line, i) => (
          <PastLineBubble key={i} line={line} />
        ))}
      </div>

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
              onSkip={() => advance(false)}
              onConfirm={() => advance(true)}
              onRetry={startRecording}
              onPlayTarget={playCurrentLine}
            />
          ) : (
            <LocalTurn
              line={current}
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
