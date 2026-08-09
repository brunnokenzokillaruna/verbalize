import { devLog } from '@/lib/devLog';
import { useState, useRef, useEffect } from 'react';
import { synthesizeDialogueGemini } from '@/app/actions/synthesizeGeminiTts';
import { synthesizeDialogueWithVoices } from '@/app/actions/synthesizeSpeech';
import { synthesizeDialogueElevenLabsWithVoices } from '@/app/actions/synthesizeElevenLabs';
import { getPlaybackRateForLevel } from '@/lib/immersion';
import {
  buildEstimatedNarrationTimeline,
  findEstimatedNarratedRange,
  findNarratedRangeFromAlignment,
  type CharacterAlignment,
  type NarratedTextRange,
  type TimedNarratedRange,
} from '@/lib/dialogueNarration';
import type { DialogueSpeakerVoice } from '@/lib/dialogueVoiceAvatars';
import type { SupportedLanguage, HookResult, LessonDefinition } from '@/types';

type FetchedDialogueAudio = {
  chunks: string[];
  alignments: Array<CharacterAlignment | null>;
};

/**
 * Manages dialogue audio playback for the lesson hook screen.
 *
 * Provider priority:
 *   1. ElevenLabs (if ELEVENLABS_API_KEY is set server-side)
 *   2. Gemini Flash TTS — multi-speaker, 1 API call (separate TTS quota)
 *   3. Google Cloud TTS (last resort)
 *
 * Caching strategy (two layers — zero wasted credits on replay):
 *   • Server-side: in-memory Maps in synthesizeElevenLabs.ts /
 *     synthesizeGeminiTts.ts. Survives across requests within the same
 *     server process / warm Vercel function.
 *   • Client-side: `cachedAudioRef` below — once audio is fetched for
 *     the current dialogue, pressing "play" again never hits the server.
 */
export function useLessonAudio(
  phase: string,
  lesson: LessonDefinition | null,
  hook: HookResult | null | undefined,
  dialogueOverride?: string | null,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingLineIdx, setPlayingLineIdx] = useState(-1);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [speakerVoices, setSpeakerVoices] = useState<DialogueSpeakerVoice[]>([]);
  const [narratedRange, setNarratedRange] = useState<NarratedTextRange | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cachedAudioRef = useRef<FetchedDialogueAudio | null>(null);
  const audioMimeRef = useRef<'audio/mpeg' | 'audio/wav'>('audio/mpeg');
  const monolithicAudioRef = useRef(false);
  const lastHookRef = useRef<HookResult | null | undefined>(null);
  const playSessionRef = useRef(0);
  const fetchPromiseRef = useRef<Promise<FetchedDialogueAudio> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const estimatedTimelineRef = useRef<TimedNarratedRange[]>([]);

  function stopAudio() {
    playSessionRef.current++; // invalidate any in-flight callbacks
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setPlayingLineIdx(-1);
    setNarratedRange(null);
    estimatedTimelineRef.current = [];
  }

  function startAudio(result: FetchedDialogueAudio, lines: string[]) {
    stopAudio(); // increments playSessionRef.current
    const { chunks, alignments } = result;
    if (chunks.length === 0) return;
    const session = playSessionRef.current;
    setIsPlaying(true);

    const audio = new Audio();
    audioRef.current = audio;

    function updateNarration(chunkIndex: number) {
      if (session !== playSessionRef.current) return;

      const exact = monolithicAudioRef.current
        ? null
        : findNarratedRangeFromAlignment(
            alignments[chunkIndex],
            audio.currentTime,
            chunkIndex,
          );
      const range =
        exact ??
        findEstimatedNarratedRange(
          estimatedTimelineRef.current,
          audio.currentTime,
        );

      setNarratedRange((current) => {
        if (
          current?.lineIndex === range?.lineIndex &&
          current?.start === range?.start &&
          current?.end === range?.end
        ) {
          return current;
        }
        return range;
      });
      if (monolithicAudioRef.current && range) {
        setPlayingLineIdx((current) =>
          current === range.lineIndex ? current : range.lineIndex,
        );
      }

      animationFrameRef.current = requestAnimationFrame(() =>
        updateNarration(chunkIndex),
      );
    }

    function playIndex(i: number) {
      if (session !== playSessionRef.current) return;
      if (i >= chunks.length) {
        setIsPlaying(false);
        setPlayingLineIdx(-1);
        setNarratedRange(null);
        return;
      }

      if (!monolithicAudioRef.current) setPlayingLineIdx(i);
      audio.onloadedmetadata = () => {
        estimatedTimelineRef.current = buildEstimatedNarrationTimeline(
          monolithicAudioRef.current ? lines : [lines[i] ?? ''],
          audio.duration,
        ).map((range) =>
          monolithicAudioRef.current
            ? range
            : { ...range, lineIndex: i },
        );
      };
      audio.onended = () => {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        setNarratedRange(null);
        setTimeout(() => playIndex(i + 1), 300);
      };
      audio.onerror = () => {
        if (session === playSessionRef.current) {
          setIsPlaying(false);
          setPlayingLineIdx(-1);
          setNarratedRange(null);
        }
      };
      audio.src = `data:${audioMimeRef.current};base64,${chunks[i]}`;
      if (lesson) audio.playbackRate = getPlaybackRateForLevel(lesson.level);
      audio
        .play()
        .then(() => updateNarration(i))
        .catch(() => {
          if (session === playSessionRef.current) {
            setIsPlaying(false);
            setPlayingLineIdx(-1);
            setNarratedRange(null);
          }
        });
    }

    playIndex(0);
  }

  /**
   * Fetches dialogue audio — ElevenLabs → Gemini TTS → Google Cloud TTS.
   * Results are cached client-side in `cachedAudioRef` so replays are instant.
   */
  async function fetchDialogueAudio(
    lines: string[],
    language: SupportedLanguage,
  ): Promise<FetchedDialogueAudio> {
    const expectedLines = lines.filter((l) => l.trim().length > 0).length;

    // 1️⃣ Try ElevenLabs
    try {
      const elevenLabsResult = await synthesizeDialogueElevenLabsWithVoices(lines, language);
      if (elevenLabsResult.chunks.length === expectedLines) {
        audioMimeRef.current = 'audio/mpeg';
        monolithicAudioRef.current = false;
        setSpeakerVoices(elevenLabsResult.speakerVoices);
        devLog(
          '%c🎙️ [Audio Provider] SUCCESS: ElevenLabs premium dialogue voices generated successfully! ✓',
          'color: #10b981; font-weight: bold; background-color: #ecfdf5; padding: 4px 8px; border-radius: 4px; border: 1px solid #a7f3d0;'
        );
        return {
          chunks: elevenLabsResult.chunks,
          alignments: elevenLabsResult.alignments,
        };
      }
      if (elevenLabsResult.chunks.length > 0) {
        console.warn(
          `[useLessonAudio] ElevenLabs partial failure (${elevenLabsResult.chunks.length}/${expectedLines} lines), trying Gemini TTS`,
        );
      }
    } catch (err) {
      console.warn('[useLessonAudio] ElevenLabs failed, trying Gemini TTS:', err);
    }

    // 2️⃣ Try Gemini Flash TTS (1 multi-speaker call — separate model quota)
    try {
      const geminiResult = await synthesizeDialogueGemini(lines, language);
      if (geminiResult && geminiResult.chunks.length > 0) {
        audioMimeRef.current = geminiResult.mimeType;
        monolithicAudioRef.current = geminiResult.monolithic;
        setSpeakerVoices(geminiResult.speakerVoices);
        devLog(
          '%c🎙️ [Audio Provider] SUCCESS: Gemini Flash TTS dialogue generated (1 API call) ✓',
          'color: #059669; font-weight: bold; background-color: #ecfdf5; padding: 4px 8px; border-radius: 4px; border: 1px solid #a7f3d0;'
        );
        return { chunks: geminiResult.chunks, alignments: [] };
      }
    } catch (err) {
      console.warn('[useLessonAudio] Gemini TTS failed, falling back to Google Cloud TTS:', err);
    }

    // 3️⃣ Last resort — Google Cloud TTS
    audioMimeRef.current = 'audio/mpeg';
    monolithicAudioRef.current = false;
    devLog(
      '%c🎙️ [Audio Provider] FALLBACK: Using Google Cloud TTS (Studio/Chirp voices).',
      'color: #d97706; font-weight: bold; background-color: #fffbeb; padding: 4px 8px; border-radius: 4px; border: 1px solid #fef3c7;'
    );
    const googleResult = await synthesizeDialogueWithVoices(lines, language);
    if (googleResult.chunks.length === expectedLines) {
      setSpeakerVoices(googleResult.speakerVoices);
      return { chunks: googleResult.chunks, alignments: [] };
    }
    console.warn(
      `[useLessonAudio] Google Cloud TTS incomplete (${googleResult.chunks.length}/${expectedLines} lines)`,
    );
    return { chunks: [], alignments: [] };
  }

  function getDialogueLines(): string[] {
    if (phase === 'comprehension' && dialogueOverride?.trim()) {
      return dialogueOverride.split('\n').filter((l) => l.trim().length > 0);
    }
    if (!hook) return [];
    return hook.dialogue.split('\n').filter((l) => l.trim().length > 0);
  }

  // Clear client cache and reset when dialogue source changes
  const dialogueKey = dialogueOverride ?? hook?.dialogue ?? '';
  if (dialogueKey !== lastHookRef.current?.dialogue) {
    if (dialogueOverride || hook) {
      cachedAudioRef.current = null;
      fetchPromiseRef.current = null;
      audioMimeRef.current = 'audio/mpeg';
      monolithicAudioRef.current = false;
      setSpeakerVoices([]);
      lastHookRef.current = hook ?? ({ dialogue: dialogueOverride ?? '' } as HookResult);
      stopAudio();
    }
  }

  // Background Prefetching Effect
  useEffect(() => {
    const lines = getDialogueLines();
    if (lines.length === 0 || !lesson) return;
    const language = lesson.language;

    if (!fetchPromiseRef.current && !cachedAudioRef.current) {
      devLog(`[Audio Prefetch] 🚀 Iniciar prefetch de áudio em background para o diálogo...`);
      setIsLoadingAudio(true);
      fetchPromiseRef.current = fetchDialogueAudio(lines, language)
        .then((result) => {
          cachedAudioRef.current = result;
          setIsLoadingAudio(false);
          devLog(`[Audio Prefetch] ✅ Prefetch concluído e cacheado no cliente.`);
          return result;
        })
        .catch((err) => {
          console.error('[Audio Prefetch] Erro no prefetch de áudio:', err);
          setIsLoadingAudio(false);
          return { chunks: [], alignments: [] };
        });
    }
  }, [hook, lesson, phase, dialogueOverride]);

  function handleAudioButton() {
    if (isPlaying) { stopAudio(); return; }
    if (!lesson) return;
    const lines = getDialogueLines();
    if (lines.length === 0) return;

    if (cachedAudioRef.current) {
      devLog(
        '%c⚡ [Audio Cache] Client Cache Hit! Replaying current dialogue audio instantly without server requests (0 credits used)',
        'color: #0284c7; font-weight: bold; background-color: #f0f9ff; padding: 4px 8px; border-radius: 4px; border: 1px solid #bae6fd;'
      );
      startAudio(cachedAudioRef.current, lines);
      return;
    }

    if (fetchPromiseRef.current) {
      devLog(`[Audio Play] Aguardando prefetch em andamento finalizar...`);
      setIsLoadingAudio(true);
      fetchPromiseRef.current.then((result) => {
        setIsLoadingAudio(false);
        if (result.chunks.length > 0) {
          startAudio(result, lines);
        }
      });
    }
  }

  // Auto-play when entering the hook phase
  useEffect(() => {
    if (phase !== 'hook') {
      stopAudio();
      return;
    }
    if (!hook || !lesson) return;

    const lines = getDialogueLines();
    if (cachedAudioRef.current) {
      devLog(`[Audio Auto-Play] Cache hit! Tocando diálogo instantaneamente.`);
      startAudio(cachedAudioRef.current, lines);
    } else if (fetchPromiseRef.current) {
      devLog(`[Audio Auto-Play] Aguardando prefetch em andamento para auto-play...`);
      setIsLoadingAudio(true);
      fetchPromiseRef.current.then((result) => {
        setIsLoadingAudio(false);
        if (result.chunks.length > 0) {
          startAudio(result, lines);
        }
      });
    }

    return () => { stopAudio(); };
  }, [phase, hook, lesson]);

  return {
    isPlaying,
    playingLineIdx,
    narratedRange,
    isLoadingAudio,
    speakerVoices,
    handleAudioButton,
    stopAudio,
  };
}
