'use client';

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { LiveServerMessage } from '@google/genai';
import { correctRoleplayGrammar } from '@/app/actions/correctRoleplayGrammar';
import { translateRoleplayLine } from '@/app/actions/translateRoleplayLine';
import { AudioPlaybackQueue } from '@/features/roleplay-chat/audio/AudioPlaybackQueue';
import { MicPcmStreamer } from '@/features/roleplay-chat/audio/MicPcmStreamer';
import {
  connectBrowserLiveSession,
  type BrowserLiveSession,
} from '@/features/roleplay-chat/live/connectBrowserLiveSession';
import {
  boundOneLine,
  createCustomScenario,
  CUSTOM_SCENARIO_LIMITS,
} from '@/features/roleplay-chat/buildCustomScenario';
import { buildCoachNote } from '@/features/roleplay-chat/coachNotes';
import { LIVE_INPUT_SAMPLE_RATE } from '@/features/roleplay-chat/constants';
import type {
  CoachNoteKind,
  CorrectionMode,
  LiveSessionStatus,
  LiveTokenRequest,
  LiveTokenResponse,
  RoleplayChatMessage,
  RoleplayIntensity,
  RoleplayScenario,
} from '@/features/roleplay-chat/types';
import {
  alignNarratedRangeToText,
  buildEstimatedNarrationTimeline,
  findEstimatedNarratedRange,
  type NarratedTextRange,
} from '@/lib/dialogueNarration';
import type { ProficiencyLevel, SupportedLanguage } from '@/types';

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isFarewell(text: string, hasConversationHistory: boolean): boolean {
  const normalized = text
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return [
    /\b(goodbye|bye(?: bye)?|see you(?: soon| later| tomorrow)?|talk to you later)\b/,
    /\b(have a (?:good|nice) (?:day|evening|night)|that's all for today)\b/,
    /\b(i have to go|i need to go|gotta go|i should get going)\b/,
    /\b(au revoir|à bientôt|a bientôt|à plus tard|a plus tard|à la prochaine)\b/,
    /\b(bonne journée|bonne journee|bonne soirée|bonne soiree|bonne nuit)\b/,
    /\b(je dois y aller|il faut que j'y aille|je vais y aller)\b/,
    /\b(tchau|adeus|até logo|ate logo|até mais|ate mais|até a próxima|ate a proxima)\b/,
    /\b(preciso ir|tenho que ir|vou indo)\b/,
  ].some((pattern) => pattern.test(normalized)) ||
    (hasConversationHistory && /^(salut|ciao)[!. ]*$/.test(normalized));
}

/** Support both camelCase (SDK) and snake_case (raw wire) transcription fields. */
function readTranscription(content: Record<string, unknown>, kind: 'input' | 'output'): string {
  const camel = kind === 'input' ? 'inputTranscription' : 'outputTranscription';
  const snake = kind === 'input' ? 'input_transcription' : 'output_transcription';
  const block = (content[camel] ?? content[snake]) as { text?: string } | undefined;
  return typeof block?.text === 'string' ? block.text : '';
}

/** Cap on deferred corrections so fluency mode stays inside free-tier quotas. */
const MAX_DEFERRED_CORRECTIONS = 8;

interface UseLiveRoleplaySessionParams {
  language: SupportedLanguage;
  level: ProficiencyLevel;
  scenario: RoleplayScenario | null;
  userRolePt?: string;
  objectivePt?: string;
  intensity?: RoleplayIntensity;
  /** `fluency` defers grammar feedback until the conversation ends. */
  correctionMode?: CorrectionMode;
}

export function useLiveRoleplaySession({
  language,
  level,
  scenario,
  userRolePt,
  objectivePt,
  intensity = 'normal',
  correctionMode = 'study',
}: UseLiveRoleplaySessionParams) {
  const [status, setStatus] = useState<LiveSessionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<RoleplayChatMessage[]>([]);
  const [micEnabled, setMicEnabled] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [narratedRange, setNarratedRange] = useState<NarratedTextRange | null>(null);
  const [reviewingCorrections, setReviewingCorrections] = useState(false);

  const sessionRef = useRef<BrowserLiveSession | null>(null);
  const playbackRef = useRef(new AudioPlaybackQueue());
  const micRef = useRef(new MicPcmStreamer());
  const userDraftIdRef = useRef<string | null>(null);
  const assistantDraftIdRef = useRef<string | null>(null);
  const userAccumRef = useRef('');
  const assistantAccumRef = useRef('');
  const messagesRef = useRef<RoleplayChatMessage[]>([]);
  const grammarInFlightRef = useRef(new Set<string>());
  const scenarioRef = useRef(scenario);
  const languageRef = useRef(language);
  const levelRef = useRef(level);
  const correctionModeRef = useRef(correctionMode);
  const reviewInFlightRef = useRef(false);
  const micEnabledRef = useRef(false);
  const intentionalCloseRef = useRef(false);
  const greetingDoneRef = useRef(false);
  const startMicAfterGreetingRef = useRef<(() => void) | null>(null);
  const farewellPendingRef = useRef(false);
  const farewellFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishSessionRef = useRef<(() => Promise<void>) | null>(null);
  const speakingMessageIdRef = useRef<string | null>(null);
  const narrationFrameRef = useRef<number | null>(null);
  const utteranceGenerationRef = useRef(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    scenarioRef.current = scenario;
    languageRef.current = language;
    levelRef.current = level;
    correctionModeRef.current = correctionMode;
  }, [scenario, language, level, correctionMode]);

  useEffect(() => {
    micEnabledRef.current = micEnabled;
  }, [micEnabled]);

  useEffect(() => {
    speakingMessageIdRef.current = speakingMessageId;
  }, [speakingMessageId]);

  const clearNarration = useCallback(() => {
    if (narrationFrameRef.current !== null) {
      cancelAnimationFrame(narrationFrameRef.current);
      narrationFrameRef.current = null;
    }
    setNarratedRange(null);
  }, []);

  const markAssistantSpeaking = useCallback((messageId: string | null) => {
    if (messageId) {
      speakingMessageIdRef.current = messageId;
      setSpeakingMessageId(messageId);
      setIsAssistantSpeaking(true);
    }
  }, []);

  const endAssistantUtterance = useCallback(
    (generation: number) => {
      void playbackRef.current.waitUntilIdle().then(() => {
        if (utteranceGenerationRef.current !== generation) return;
        setIsAssistantSpeaking(false);
        speakingMessageIdRef.current = null;
        setSpeakingMessageId(null);
        clearNarration();
      });
    },
    [clearNarration],
  );

  // Karaoke cursor: map PCM playback clock → word range on the speaking bubble.
  useEffect(() => {
    if (!speakingMessageId) {
      clearNarration();
      return;
    }

    let active = true;

    const tick = () => {
      if (!active) return;

      const message = messagesRef.current.find((m) => m.id === speakingMessageId);
      const text = message?.text?.trim() ?? '';
      const elapsed = playbackRef.current.getUtteranceElapsed();
      const duration = playbackRef.current.getUtteranceDuration();

      if (
        text &&
        text !== '…' &&
        elapsed !== null &&
        duration !== null &&
        duration > 0
      ) {
        const timeline = buildEstimatedNarrationTimeline(
          [text],
          Math.max(duration, elapsed + 0.05),
        );
        const estimated = findEstimatedNarratedRange(timeline, elapsed);
        const aligned = alignNarratedRangeToText(text, estimated);
        setNarratedRange((current) => {
          if (
            current?.start === aligned?.start &&
            current?.end === aligned?.end &&
            current?.text === aligned?.text
          ) {
            return current;
          }
          return aligned;
        });
      }

      if (!playbackRef.current.isActivelyPlaying() && elapsed !== null && duration !== null && elapsed >= duration - 0.05) {
        clearNarration();
        return;
      }

      narrationFrameRef.current = requestAnimationFrame(tick);
    };

    narrationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      if (narrationFrameRef.current !== null) {
        cancelAnimationFrame(narrationFrameRef.current);
        narrationFrameRef.current = null;
      }
    };
  }, [speakingMessageId, clearNarration]);

  const upsertStreaming = useCallback(
    (role: 'user' | 'assistant', text: string, draftIdRef: MutableRefObject<string | null>) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setMessages((prev) => {
        // Prefer updating an existing draft already present in state.
        let id = draftIdRef.current;
        if (id) {
          const idx = prev.findIndex((m) => m.id === id);
          if (idx !== -1) {
            const next = prev.slice();
            next[idx] = { ...next[idx], text: trimmed, streaming: true };
            return next;
          }
        }

        // Reuse any in-flight streaming bubble for this role (avoids duplicates
        // when placeholder + transcript race across setState updaters).
        const streamingIdx = prev.findIndex((m) => m.role === role && m.streaming);
        if (streamingIdx !== -1) {
          id = prev[streamingIdx].id;
          draftIdRef.current = id;
          const next = prev.slice();
          next[streamingIdx] = { ...next[streamingIdx], text: trimmed, streaming: true };
          return next;
        }

        id = id ?? makeId();
        draftIdRef.current = id;
        return [
          ...prev,
          {
            id,
            role,
            text: trimmed,
            streaming: true,
            createdAt: Date.now(),
          },
        ];
      });
    },
    [],
  );

  const ensureAssistantPlaceholder = useCallback(() => {
    setMessages((prev) => {
      if (assistantDraftIdRef.current) {
        const exists = prev.some((m) => m.id === assistantDraftIdRef.current);
        if (exists) return prev;
      }

      const streaming = prev.find((m) => m.role === 'assistant' && m.streaming);
      if (streaming) {
        assistantDraftIdRef.current = streaming.id;
        return prev;
      }

      const newId = makeId();
      assistantDraftIdRef.current = newId;
      return [
        ...prev,
        {
          id: newId,
          role: 'assistant' as const,
          text: '…',
          streaming: true,
          createdAt: Date.now(),
        },
      ];
    });
  }, []);

  const runGrammarCheck = useCallback(async (id: string, text: string) => {
    const currentScenario = scenarioRef.current;
    if (!currentScenario || !text || grammarInFlightRef.current.has(id)) return;

    grammarInFlightRef.current.add(id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, grammarLoading: true } : m)));

    const recentContext = messagesRef.current
      .filter((m) => m.role !== 'system' && !m.streaming)
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'Learner' : currentScenario.characterName}: ${m.text}`);

    try {
      const result = await correctRoleplayGrammar({
        transcript: text,
        language: languageRef.current,
        level: levelRef.current,
        scenarioTitle: currentScenario.titlePt,
        recentContext,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                grammarLoading: false,
                grammar: {
                  hasIssues: result.hasIssues,
                  correctedSentence: result.correctedSentence,
                  feedbackPt: result.feedbackPt,
                  issueTags: result.issueTags,
                },
              }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                grammarLoading: false,
                grammar: {
                  hasIssues: false,
                  feedbackPt: 'Correção temporariamente indisponível.',
                },
              }
            : m,
        ),
      );
    } finally {
      grammarInFlightRef.current.delete(id);
    }
  }, []);

  /** Fluency mode holds feedback back — this fills it in once the scene is over. */
  const reviewCorrections = useCallback(async () => {
    if (reviewInFlightRef.current) return;

    const pending = messagesRef.current
      .filter(
        (m) =>
          m.role === 'user' &&
          !m.streaming &&
          !m.grammar &&
          !m.grammarLoading &&
          m.text &&
          !m.text.startsWith('('),
      )
      .slice(-MAX_DEFERRED_CORRECTIONS);

    if (pending.length === 0) return;

    reviewInFlightRef.current = true;
    setReviewingCorrections(true);
    try {
      // Sequential on purpose: keeps the free-tier request rate predictable.
      for (const message of pending) {
        await runGrammarCheck(message.id, message.text);
      }
    } finally {
      reviewInFlightRef.current = false;
      setReviewingCorrections(false);
    }
  }, [runGrammarCheck]);

  const finalizeTurn = useCallback(
    async (
      role: 'user' | 'assistant',
      draftIdRef: MutableRefObject<string | null>,
      accumRef: MutableRefObject<string>,
    ) => {
      const text = accumRef.current.trim();
      const id = draftIdRef.current;
      draftIdRef.current = null;
      accumRef.current = '';

      if (!id) return;

      const finalText =
        text || (role === 'assistant' ? '(resposta em áudio)' : '');
      if (!finalText) return;

      setMessages((prev) => {
        const seen = new Set<string>();
        const deduped = prev.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
        return deduped.map((m) =>
          m.id === id
            ? {
                ...m,
                text: finalText,
                streaming: false,
                translationLoading: Boolean(text) && !finalText.startsWith('('),
              }
            : m,
        );
      });

      const shouldTranslate = Boolean(text) && !finalText.startsWith('(');

      if (
        role === 'user' &&
        isFarewell(text, messagesRef.current.filter((message) => !message.streaming).length >= 2)
      ) {
        farewellPendingRef.current = true;
        micEnabledRef.current = false;
        setMicEnabled(false);
        try {
          sessionRef.current?.sendRealtimeInput({ audioStreamEnd: true });
        } catch {
          // The model may already be producing its farewell response.
        }
        void micRef.current.stop();
        if (!farewellFallbackTimerRef.current) {
          farewellFallbackTimerRef.current = setTimeout(() => {
            farewellFallbackTimerRef.current = null;
            farewellPendingRef.current = false;
            void playbackRef.current
              .waitUntilIdle()
              .then(() => finishSessionRef.current?.());
          }, 12_000);
        }
      }

      if (shouldTranslate) {
        void translateRoleplayLine({
          text: finalText,
          language: languageRef.current,
        }).then((result) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id
                ? {
                    ...m,
                    translationLoading: false,
                    translationPt: result.translationPt || undefined,
                  }
                : m,
            ),
          );
        });
      }

      if (role !== 'user' || !text) return;
      // Fluency mode keeps the scene uninterrupted; feedback lands after the goodbye.
      if (correctionModeRef.current === 'fluency') return;

      await runGrammarCheck(id, text);
    },
    [runGrammarCheck],
  );

  const handleServerMessage = useCallback(
    (message: LiveServerMessage) => {
      const content = message.serverContent as Record<string, unknown> | undefined;
      if (!content) return;

      if (content.interrupted) {
        utteranceGenerationRef.current += 1;
        playbackRef.current.clear();
        setIsAssistantSpeaking(false);
        speakingMessageIdRef.current = null;
        setSpeakingMessageId(null);
        clearNarration();
      }

      const inputText = readTranscription(content, 'input');
      if (inputText) {
        userAccumRef.current += inputText;
        upsertStreaming('user', userAccumRef.current, userDraftIdRef);
      }

      const outputText = readTranscription(content, 'output');
      if (outputText) {
        if (userAccumRef.current.trim() && userDraftIdRef.current) {
          void finalizeTurn('user', userDraftIdRef, userAccumRef);
        }
        // Grow the bubble as transcript chunks arrive so the learner can follow audio.
        assistantAccumRef.current += outputText;
        upsertStreaming('assistant', assistantAccumRef.current, assistantDraftIdRef);
        markAssistantSpeaking(assistantDraftIdRef.current);
      }

      const modelTurn = content.modelTurn as
        | { parts?: Array<{ inlineData?: { data?: string }; text?: string }> }
        | undefined;
      if (modelTurn?.parts) {
        for (const part of modelTurn.parts) {
          if (part.text?.trim()) {
            assistantAccumRef.current += part.text;
            upsertStreaming('assistant', assistantAccumRef.current, assistantDraftIdRef);
            markAssistantSpeaking(assistantDraftIdRef.current);
          }
          const data = part.inlineData?.data;
          if (data) {
            ensureAssistantPlaceholder();
            void playbackRef.current.enqueueBase64Pcm(data);
            markAssistantSpeaking(assistantDraftIdRef.current);
          }
        }
      }

      if (content.turnComplete || content.turn_complete) {
        if (userAccumRef.current.trim() && userDraftIdRef.current) {
          void finalizeTurn('user', userDraftIdRef, userAccumRef);
        }
        const shouldAutoFinish =
          farewellPendingRef.current && Boolean(assistantDraftIdRef.current);
        const speakingId = assistantDraftIdRef.current;
        if (speakingId) {
          markAssistantSpeaking(speakingId);
          void finalizeTurn('assistant', assistantDraftIdRef, assistantAccumRef);
          const generation = ++utteranceGenerationRef.current;
          endAssistantUtterance(generation);
        } else {
          setIsAssistantSpeaking(false);
          clearNarration();
        }

        if (!greetingDoneRef.current) {
          greetingDoneRef.current = true;
          startMicAfterGreetingRef.current?.();
          startMicAfterGreetingRef.current = null;
        }

        if (shouldAutoFinish) {
          farewellPendingRef.current = false;
          if (farewellFallbackTimerRef.current) {
            clearTimeout(farewellFallbackTimerRef.current);
            farewellFallbackTimerRef.current = null;
          }
          void playbackRef.current
            .waitUntilIdle()
            .then(() => finishSessionRef.current?.());
        }
      }
    },
    [
      clearNarration,
      endAssistantUtterance,
      ensureAssistantPlaceholder,
      finalizeTurn,
      markAssistantSpeaking,
      upsertStreaming,
    ],
  );

  const handleServerMessageRef = useRef(handleServerMessage);
  useEffect(() => {
    handleServerMessageRef.current = handleServerMessage;
  }, [handleServerMessage]);

  const openMic = useCallback(async () => {
    if (!sessionRef.current || micRef.current.isRunning) return;
    await micRef.current.start((base64) => {
      if (!sessionRef.current || !micEnabledRef.current) return;
      sessionRef.current.sendRealtimeInput({
        audio: {
          data: base64,
          mimeType: `audio/pcm;rate=${LIVE_INPUT_SAMPLE_RATE}`,
        },
      });
    });
    micEnabledRef.current = true;
    setMicEnabled(true);
  }, []);

  const stop = useCallback(async () => {
    intentionalCloseRef.current = true;
    startMicAfterGreetingRef.current = null;
    try {
      if (micRef.current.isRunning) {
        sessionRef.current?.sendRealtimeInput({ audioStreamEnd: true });
      }
    } catch {
      // ignore
    }

    await micRef.current.stop();
    playbackRef.current.clear();
    try {
      sessionRef.current?.close();
    } catch {
      // ignore
    }
    sessionRef.current = null;
    userDraftIdRef.current = null;
    assistantDraftIdRef.current = null;
    userAccumRef.current = '';
    assistantAccumRef.current = '';
    greetingDoneRef.current = false;
    farewellPendingRef.current = false;
    if (farewellFallbackTimerRef.current) {
      clearTimeout(farewellFallbackTimerRef.current);
      farewellFallbackTimerRef.current = null;
    }
    setIsAssistantSpeaking(false);
    speakingMessageIdRef.current = null;
    setSpeakingMessageId(null);
    clearNarration();
    setMicEnabled(false);
    micEnabledRef.current = false;
    setStatus((s) => (s === 'error' ? 'error' : 'ended'));
  }, [clearNarration]);

  finishSessionRef.current = stop;

  const reset = useCallback(async () => {
    await stop();
    setMessages([]);
    setError(null);
    setStatus('idle');
  }, [stop]);

  /** `overrides` lets callers replay a scene with a different intensity immediately. */
  const start = useCallback(async (overrides?: { intensity?: RoleplayIntensity }) => {
    if (!scenario) {
      setError('Escolha um cenário para começar.');
      return;
    }

    const effectiveIntensity = overrides?.intensity ?? intensity;

    intentionalCloseRef.current = false;
    greetingDoneRef.current = false;
    farewellPendingRef.current = false;
    if (farewellFallbackTimerRef.current) {
      clearTimeout(farewellFallbackTimerRef.current);
      farewellFallbackTimerRef.current = null;
    }
    setError(null);
    setMessages([]);
    setStatus('connecting');
    setMicEnabled(false);
    micEnabledRef.current = false;

    try {
      await playbackRef.current.ensureContext();

      const resolvedUserRole = boundOneLine(
        userRolePt,
        CUSTOM_SCENARIO_LIMITS.userRolePt,
        boundOneLine(scenario.userRolePt, CUSTOM_SCENARIO_LIMITS.userRolePt, 'aprendiz'),
      );
      const resolvedObjective = boundOneLine(
        objectivePt,
        CUSTOM_SCENARIO_LIMITS.objectivePt,
        boundOneLine(
          scenario.objectivePt,
          CUSTOM_SCENARIO_LIMITS.objectivePt,
          'Manter uma conversa natural',
        ),
      );
      let tokenBody: LiveTokenRequest;
      if (scenario.id === 'custom') {
        const customScenario = createCustomScenario({
          titlePt: scenario.titlePt,
          descriptionPt: scenario.descriptionPt,
          settingPt: scenario.settingPt,
          characterName: scenario.characterName,
          characterRolePt: scenario.characterRolePt,
          userRolePt: resolvedUserRole,
          objectivePt: resolvedObjective,
          level,
        });
        tokenBody = {
          language,
          level,
          intensity: effectiveIntensity,
          customScenario: {
            titlePt: customScenario.titlePt,
            descriptionPt: customScenario.descriptionPt,
            settingPt: customScenario.settingPt,
            characterName: customScenario.characterName,
            characterRolePt: customScenario.characterRolePt,
            userRolePt: customScenario.userRolePt,
            objectivePt: customScenario.objectivePt,
          },
        };
      } else {
        tokenBody = {
          language,
          level,
          intensity: effectiveIntensity,
          scenarioId: scenario.id,
          userRolePt: resolvedUserRole,
          objectivePt: resolvedObjective,
        };
      }

      const tokenRes = await fetch('/api/live-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenBody),
      });

      const tokenJson = (await tokenRes.json()) as LiveTokenResponse & { error?: string };
      if (!tokenRes.ok || !tokenJson.token) {
        throw new Error(tokenJson.error || 'Falha ao obter token da sessão.');
      }

      const session = await connectBrowserLiveSession({
        token: tokenJson.token,
        model: tokenJson.model,
        systemInstruction: tokenJson.systemInstruction,
        onMessage: (msg) => handleServerMessageRef.current(msg),
        onError: (message) => {
          if (intentionalCloseRef.current) return;
          setError(message);
          setStatus('error');
        },
        onClose: (code, reason) => {
          void micRef.current.stop();
          if (intentionalCloseRef.current) return;
          if (code !== 1000) {
            setError(`Sessão encerrada (código ${code}: ${reason}).`);
            setStatus('error');
            return;
          }
          setStatus((s) => (s === 'error' ? 'error' : 'ended'));
        },
      });

      sessionRef.current = session;
      setStatus('live');

      // Open mic only after the first assistant turn finishes (avoids VAD barge-in
      // eating the greeting + missing on-screen transcript).
      startMicAfterGreetingRef.current = () => {
        void openMic();
      };

      session.sendRealtimeInput({
        text: 'Please greet me in character and start the roleplay.',
      });

      // Fallback: if turnComplete never arrives, open mic after a short delay.
      window.setTimeout(() => {
        if (!greetingDoneRef.current && sessionRef.current && !intentionalCloseRef.current) {
          greetingDoneRef.current = true;
          void openMic();
        }
      }, 8_000);
    } catch (err) {
      console.warn('[live roleplay start]', err);
      await micRef.current.stop();
      const message =
        err instanceof Error ? err.message : 'Não foi possível iniciar o roleplay por voz.';
      setError(message);
      setStatus('error');
    }
  }, [intensity, language, level, openMic, objectivePt, scenario, userRolePt]);

  const sendCoachNote = useCallback(
    (kind: CoachNoteKind) => {
      if (status !== 'live' || !sessionRef.current) return false;
      try {
        sessionRef.current.sendRealtimeInput({ text: buildCoachNote(kind) });
        return true;
      } catch {
        return false;
      }
    },
    [status],
  );

  const toggleMic = useCallback(async () => {
    if (status !== 'live' || !sessionRef.current) return;

    if (micEnabledRef.current) {
      micEnabledRef.current = false;
      setMicEnabled(false);
      await micRef.current.stop();
      try {
        sessionRef.current.sendRealtimeInput({ audioStreamEnd: true });
      } catch {
        // ignore
      }
      return;
    }

    await openMic();
  }, [openMic, status]);

  useEffect(() => {
    const playback = playbackRef.current;
    return () => {
      void stop();
      void playback.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount cleanup only
  }, []);

  return {
    status,
    error,
    messages,
    micEnabled,
    isAssistantSpeaking,
    speakingMessageId,
    narratedRange,
    reviewingCorrections,
    start,
    stop,
    reset,
    toggleMic,
    sendCoachNote,
    reviewCorrections,
  };
}
