import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAudio } from '@/hooks/useAudio';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useAuthStore } from '@/store/authStore';
import { incrementProductionStats } from '@/services/firestore';
import { markSpontaneousProductionAccepted } from '@/lib/sessionProductionTracking';
import { transcribeSpeech } from '@/app/actions/transcribeSpeech';
import { evaluateFreeResponse } from '@/app/actions/evaluateFreeResponse';
import { getFixedVoiceName } from '@/lib/voiceConfig';
import {
  CORRECT_THRESHOLD,
  parseDialogueLines,
  similarity,
} from '@/components/lesson/mission-roleplay/utils';
import type { RecState } from '@/components/lesson/mission-roleplay/types';
import {
  buildMissionRoleFlipCopy,
  invertMissionSpeakableLines,
  type MissionRoleFlipCopy,
} from '@/lib/pedagogy/dialogueRoles';
import type { RolePlayConsequence, SupportedLanguage } from '@/types';

export type MissionRolePlayRound = 'primary' | 'inverted';

type UseMissionRolePlayOptions = {
  dialogue: string;
  dialogueTranslations?: string[];
  language: SupportedLanguage;
  intentMode: boolean;
  rolePlayConsequences?: RolePlayConsequence[];
  /** Theme / title / grammar used to detect dual-role scenes for the flip beat. */
  sceneHints?: {
    theme?: string;
    uiTitle?: string;
    grammarFocus?: string;
  };
  onComplete: (spoken: number, totalSpeakable: number) => void;
};

function buildConsequenceMap(
  consequences: RolePlayConsequence[] | undefined,
): Map<number, RolePlayConsequence> {
  const map = new Map<number, RolePlayConsequence>();
  for (const c of consequences ?? []) {
    map.set(c.npcLineIndex, c);
  }
  return map;
}

export function useMissionRolePlay({
  dialogue,
  dialogueTranslations,
  language,
  intentMode,
  rolePlayConsequences,
  sceneHints,
  onComplete,
}: UseMissionRolePlayOptions) {
  const { user } = useAuthStore();
  const statsLoggedRef = useRef(false);
  const parsedLines = useMemo(
    () => parseDialogueLines(dialogue, dialogueTranslations),
    [dialogue, dialogueTranslations],
  );
  const flipCopy = useMemo(
    () =>
      buildMissionRoleFlipCopy(
        sceneHints?.theme,
        sceneHints?.uiTitle,
        sceneHints?.grammarFocus,
        dialogue,
      ),
    [sceneHints?.theme, sceneHints?.uiTitle, sceneHints?.grammarFocus, dialogue],
  );

  const [round, setRound] = useState<MissionRolePlayRound>('primary');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [spokenCount, setSpokenCount] = useState(0);
  const [primarySpoken, setPrimarySpoken] = useState(0);
  const [primaryTotal, setPrimaryTotal] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [recState, setRecState] = useState<RecState>('idle');
  const [transcript, setTranscript] = useState('');
  const [recordError, setRecordError] = useState('');
  const [evalFeedback, setEvalFeedback] = useState('');
  const [evalCorrected, setEvalCorrected] = useState('');
  const [consequenceIndices, setConsequenceIndices] = useState<Set<number>>(() => new Set());
  const [flipOffered, setFlipOffered] = useState(false);

  const baseLines = useMemo(() => {
    if (round === 'inverted') return invertMissionSpeakableLines(parsedLines);
    return parsedLines;
  }, [parsedLines, round]);

  const consequenceMap = useMemo(
    () => (round === 'primary' ? buildConsequenceMap(rolePlayConsequences) : new Map()),
    [rolePlayConsequences, round],
  );
  const totalSpeakable = useMemo(() => baseLines.filter((l) => l.isUserLine).length, [baseLines]);

  const lines = useMemo(() => {
    return baseLines.map((line) => {
      if (!consequenceIndices.has(line.rawIndex)) return line;
      const alt = consequenceMap.get(line.rawIndex);
      if (!alt) return line;
      return {
        ...line,
        text: alt.alternateText,
        translation: alt.alternateTranslation ?? line.translation,
        isConsequenceTone: true,
      };
    });
  }, [baseLines, consequenceIndices, consequenceMap]);

  const fixedVoice = useMemo(() => getFixedVoiceName(language), [language]);
  const { speak, stop: stopAudio } = useAudio(fixedVoice);
  const recorder = useVoiceRecorder();
  const hasSpeechAPI = recorder.isSupported;
  const { play: playSound } = useSoundEffects();
  const prevRecStateRef = useRef<RecState>('idle');
  const completedRef = useRef(false);

  const current = lines[currentIdx];
  const isLast = currentIdx >= lines.length - 1;
  const score = transcript && current ? similarity(current.text, transcript) : 0;

  const pastLineCount = recState === 'done' ? lines.length : currentIdx;
  const awaitingFlip = recState === 'done' && flipOffered && round === 'primary' && !!flipCopy;

  useEffect(() => {
    if (!current || current.isUserLine) return;
    const t = setTimeout(() => {
      speak(current.text, language).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [currentIdx, current, language, speak]);

  useEffect(() => {
    if (recState === 'review-correct' && prevRecStateRef.current !== 'review-correct') {
      playSound('correct');
    } else if (recState === 'review-retry' && prevRecStateRef.current !== 'review-retry') {
      playSound('incorrect', { soft: true });
    }
    prevRecStateRef.current = recState;
  }, [recState, playSound]);

  useEffect(() => {
    setRecState('idle');
    setTranscript('');
    setRecordError('');
    setShowHint(false);
    setEvalFeedback('');
    setEvalCorrected('');
    statsLoggedRef.current = false;
  }, [currentIdx]);

  const finishMission = useCallback(
    (spoken: number, total: number) => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete(spoken, total);
      setRecState('done');
      setFlipOffered(false);
    },
    [onComplete],
  );

  const scheduleConsequenceForFailedTurn = useCallback(
    (userLineIndex: number) => {
      if (round !== 'primary') return;
      const nextNpcIdx = baseLines.findIndex(
        (l, i) => i > userLineIndex && !l.isUserLine && consequenceMap.has(i),
      );
      if (nextNpcIdx < 0) return;
      setConsequenceIndices((prev) => {
        if (prev.has(nextNpcIdx)) return prev;
        const next = new Set(prev);
        next.add(nextNpcIdx);
        return next;
      });
    },
    [baseLines, consequenceMap, round],
  );

  const advance = useCallback(
    (accepted: boolean) => {
      if (current?.isUserLine && !accepted) {
        scheduleConsequenceForFailedTurn(currentIdx);
      }
      const nextSpoken = accepted ? spokenCount + 1 : spokenCount;
      if (accepted) setSpokenCount(nextSpoken);
      if (isLast) {
        if (round === 'primary' && flipCopy) {
          setPrimarySpoken(nextSpoken);
          setPrimaryTotal(totalSpeakable);
          setFlipOffered(true);
          setRecState('done');
          return;
        }
        if (round === 'inverted') {
          finishMission(primarySpoken + nextSpoken, primaryTotal + totalSpeakable);
          return;
        }
        finishMission(nextSpoken, totalSpeakable);
        return;
      }
      setCurrentIdx((i) => i + 1);
    },
    [
      current,
      currentIdx,
      isLast,
      scheduleConsequenceForFailedTurn,
      spokenCount,
      totalSpeakable,
      round,
      flipCopy,
      finishMission,
      primarySpoken,
      primaryTotal,
    ],
  );

  const startRoleFlip = useCallback(() => {
    if (!flipCopy || round !== 'primary') return;
    stopAudio();
    setRound('inverted');
    setCurrentIdx(0);
    setSpokenCount(0);
    setConsequenceIndices(new Set());
    setFlipOffered(false);
    setTranscript('');
    setRecordError('');
    setEvalFeedback('');
    setEvalCorrected('');
    setShowHint(true);
    setRecState('idle');
    statsLoggedRef.current = false;
  }, [flipCopy, round, stopAudio]);

  const skipRoleFlip = useCallback(() => {
    if (!awaitingFlip) return;
    finishMission(primarySpoken || spokenCount, primaryTotal || totalSpeakable);
  }, [awaitingFlip, finishMission, primarySpoken, spokenCount, primaryTotal, totalSpeakable]);

  const startRecording = useCallback(async () => {
    if (!current || !current.isUserLine) return;
    if (recState === 'recording' || recState === 'transcribing') return;
    stopAudio();
    setRecordError('');
    setTranscript('');
    setRecState('requesting-mic');
    await recorder.start();
    if (recorder.error) {
      setRecState('idle');
      setRecordError(recorder.error);
      return;
    }
    setRecState('recording');
  }, [current, recState, stopAudio, recorder]);

  const stopRecording = useCallback(async () => {
    if (!current || !current.isUserLine) return;
    if (recState !== 'recording') return;
    setRecState('transcribing');
    const blob = await recorder.stop();
    if (!blob) {
      setRecState('idle');
      setRecordError(recorder.error || 'Nenhuma fala detectada. Tente de novo.');
      return;
    }

    try {
      const form = new FormData();
      form.append('file', blob, 'utterance.webm');
      form.append('language', language);
      form.append('prompt', current.text);

      const result = await transcribeSpeech(form);
      if ('error' in result) {
        setRecState('idle');
        setRecordError(result.error);
        return;
      }

      const said = result.text.trim();
      setTranscript(said);

      if (intentMode) {
        const contextLines = lines
          .slice(Math.max(0, currentIdx - 3), currentIdx)
          .map((l) => `${l.speaker}: ${l.text}`);
        const npcLine = lines.slice(0, currentIdx).reverse().find((l) => !l.isUserLine);
        const evalResult = await evaluateFreeResponse({
          transcript: said,
          intent: current.translation || '',
          language,
          previousContext: contextLines,
          expectedLine: current.text,
          promptLine: npcLine?.text,
          preferGemini: true,
        });

        if (evalResult.error) {
          setRecState('idle');
          setRecordError(evalResult.feedback);
          return;
        }

        setEvalFeedback(evalResult.feedback);
        setEvalCorrected(evalResult.correctedSentence || '');
        const accepted = evalResult.isCorrect;
        if (user && !statsLoggedRef.current) {
          statsLoggedRef.current = true;
          incrementProductionStats(user.uid, 'oralSpontaneous', accepted).catch(console.error);
          if (accepted) {
            markSpontaneousProductionAccepted('oralSpontaneous');
          }
        }
        setRecState(accepted ? 'review-correct' : 'review-retry');
      } else {
        const matchScore = similarity(current.text, said);
        const accepted = matchScore >= CORRECT_THRESHOLD;
        if (user && !statsLoggedRef.current) {
          statsLoggedRef.current = true;
          incrementProductionStats(user.uid, 'oral', accepted).catch(console.error);
        }
        setRecState(accepted ? 'review-correct' : 'review-retry');
      }
    } catch (err) {
      console.error('[LessonMissionRolePlay] transcription failed:', err);
      setRecState('idle');
      setRecordError('Erro ao transcrever. Tente de novo.');
    }
  }, [current, recState, recorder, language, intentMode, lines, currentIdx, user]);

  const playCurrentLine = useCallback(() => {
    if (!current) return;
    speak(current.text, language).catch(() => {});
  }, [current, speak, language]);

  return {
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
    round,
    flipCopy: flipCopy as MissionRoleFlipCopy | null,
    awaitingFlip,
    setShowHint,
    advance,
    startRecording,
    stopRecording,
    playCurrentLine,
    startRoleFlip,
    skipRoleFlip,
  };
}
