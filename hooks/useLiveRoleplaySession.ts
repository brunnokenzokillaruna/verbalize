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
import { LIVE_INPUT_SAMPLE_RATE } from '@/features/roleplay-chat/constants';
import type {
  LiveSessionStatus,
  LiveTokenResponse,
  RoleplayChatMessage,
  RoleplayScenario,
} from '@/features/roleplay-chat/types';
import type { ProficiencyLevel, SupportedLanguage } from '@/types';

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Support both camelCase (SDK) and snake_case (raw wire) transcription fields. */
function readTranscription(content: Record<string, unknown>, kind: 'input' | 'output'): string {
  const camel = kind === 'input' ? 'inputTranscription' : 'outputTranscription';
  const snake = kind === 'input' ? 'input_transcription' : 'output_transcription';
  const block = (content[camel] ?? content[snake]) as { text?: string } | undefined;
  return typeof block?.text === 'string' ? block.text : '';
}

interface UseLiveRoleplaySessionParams {
  language: SupportedLanguage;
  level: ProficiencyLevel;
  scenario: RoleplayScenario | null;
}

export function useLiveRoleplaySession({
  language,
  level,
  scenario,
}: UseLiveRoleplaySessionParams) {
  const [status, setStatus] = useState<LiveSessionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<RoleplayChatMessage[]>([]);
  const [micEnabled, setMicEnabled] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);

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
  const micEnabledRef = useRef(false);
  const intentionalCloseRef = useRef(false);
  const greetingDoneRef = useRef(false);
  const startMicAfterGreetingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    scenarioRef.current = scenario;
    languageRef.current = language;
    levelRef.current = level;
  }, [scenario, language, level]);

  useEffect(() => {
    micEnabledRef.current = micEnabled;
  }, [micEnabled]);

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

      const currentScenario = scenarioRef.current;
      if (!currentScenario || grammarInFlightRef.current.has(id)) return;

      grammarInFlightRef.current.add(id);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, grammarLoading: true } : m)),
      );

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
    },
    [],
  );

  const handleServerMessage = useCallback(
    (message: LiveServerMessage) => {
      const content = message.serverContent as Record<string, unknown> | undefined;
      if (!content) return;

      if (content.interrupted) {
        playbackRef.current.clear();
        setIsAssistantSpeaking(false);
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
        setIsAssistantSpeaking(true);
      }

      const modelTurn = content.modelTurn as
        | { parts?: Array<{ inlineData?: { data?: string }; text?: string }> }
        | undefined;
      if (modelTurn?.parts) {
        for (const part of modelTurn.parts) {
          if (part.text?.trim()) {
            assistantAccumRef.current += part.text;
            upsertStreaming('assistant', assistantAccumRef.current, assistantDraftIdRef);
          }
          const data = part.inlineData?.data;
          if (data) {
            ensureAssistantPlaceholder();
            void playbackRef.current.enqueueBase64Pcm(data);
            setIsAssistantSpeaking(true);
          }
        }
      }

      if (content.turnComplete || content.turn_complete) {
        if (userAccumRef.current.trim() && userDraftIdRef.current) {
          void finalizeTurn('user', userDraftIdRef, userAccumRef);
        }
        if (assistantDraftIdRef.current) {
          void finalizeTurn('assistant', assistantDraftIdRef, assistantAccumRef);
        }
        setIsAssistantSpeaking(false);

        if (!greetingDoneRef.current) {
          greetingDoneRef.current = true;
          startMicAfterGreetingRef.current?.();
          startMicAfterGreetingRef.current = null;
        }
      }
    },
    [ensureAssistantPlaceholder, finalizeTurn, upsertStreaming],
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
    setIsAssistantSpeaking(false);
    setMicEnabled(false);
    micEnabledRef.current = false;
    setStatus((s) => (s === 'error' ? 'error' : 'ended'));
  }, []);

  const reset = useCallback(async () => {
    await stop();
    setMessages([]);
    setError(null);
    setStatus('idle');
  }, [stop]);

  const start = useCallback(async () => {
    if (!scenario) {
      setError('Escolha um cenário para começar.');
      return;
    }

    intentionalCloseRef.current = false;
    greetingDoneRef.current = false;
    setError(null);
    setMessages([]);
    setStatus('connecting');
    setMicEnabled(false);
    micEnabledRef.current = false;

    try {
      await playbackRef.current.ensureContext();

      const tokenRes = await fetch('/api/live-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          scenarioId: scenario.id,
          level,
        }),
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
  }, [language, level, openMic, scenario]);

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
    return () => {
      void stop();
      void playbackRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount cleanup only
  }, []);

  return {
    status,
    error,
    messages,
    micEnabled,
    isAssistantSpeaking,
    start,
    stop,
    reset,
    toggleMic,
  };
}
