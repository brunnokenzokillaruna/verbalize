import { devLog } from '@/lib/devLog';
import { useState, useRef, useEffect } from 'react';
import { synthesizeDialogueGemini } from '@/app/actions/synthesizeGeminiTts';
import { synthesizeDialogue } from '@/app/actions/synthesizeSpeech';
import { synthesizeDialogueElevenLabs } from '@/app/actions/synthesizeElevenLabs';
import { getPlaybackRateForLevel } from '@/lib/immersion';
import type { SupportedLanguage, HookResult, LessonDefinition } from '@/types';

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
 *   • Client-side: `cachedChunksRef` below — once audio is fetched for
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cachedChunksRef = useRef<string[] | null>(null);
  const audioMimeRef = useRef<'audio/mpeg' | 'audio/wav'>('audio/mpeg');
  const monolithicAudioRef = useRef(false);
  const lastHookRef = useRef<HookResult | null | undefined>(null);
  const playSessionRef = useRef(0);
  const fetchPromiseRef = useRef<Promise<string[]> | null>(null);

  function stopAudio() {
    playSessionRef.current++; // invalidate any in-flight callbacks
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setPlayingLineIdx(-1);
  }

  function startAudio(chunks: string[]) {
    stopAudio(); // increments playSessionRef.current
    if (chunks.length === 0) return;
    const session = playSessionRef.current;
    setIsPlaying(true);

    const audio = new Audio();
    audioRef.current = audio;

    function playIndex(i: number) {
      if (session !== playSessionRef.current) return;
      if (i >= chunks.length) { setIsPlaying(false); setPlayingLineIdx(-1); return; }

      if (!monolithicAudioRef.current) setPlayingLineIdx(i);
      audio.onended = () => setTimeout(() => playIndex(i + 1), 300);
      audio.onerror = () => {
        if (session === playSessionRef.current) { setIsPlaying(false); setPlayingLineIdx(-1); }
      };
      audio.src = `data:${audioMimeRef.current};base64,${chunks[i]}`;
      if (lesson) audio.playbackRate = getPlaybackRateForLevel(lesson.level);
      audio.play().catch(() => {
        if (session === playSessionRef.current) { setIsPlaying(false); setPlayingLineIdx(-1); }
      });
    }

    playIndex(0);
  }

  /**
   * Fetches dialogue audio — ElevenLabs → Gemini TTS → Google Cloud TTS.
   * Results are cached client-side in `cachedChunksRef` so replays are instant.
   */
  async function fetchDialogueAudio(lines: string[], language: SupportedLanguage): Promise<string[]> {
    const expectedLines = lines.filter((l) => l.trim().length > 0).length;

    // 1️⃣ Try ElevenLabs
    try {
      const elChunks = await synthesizeDialogueElevenLabs(lines, language);
      if (elChunks.length === expectedLines) {
        audioMimeRef.current = 'audio/mpeg';
        monolithicAudioRef.current = false;
        devLog(
          '%c🎙️ [Audio Provider] SUCCESS: ElevenLabs premium dialogue voices generated successfully! ✓',
          'color: #10b981; font-weight: bold; background-color: #ecfdf5; padding: 4px 8px; border-radius: 4px; border: 1px solid #a7f3d0;'
        );
        return elChunks;
      }
      if (elChunks.length > 0) {
        console.warn(
          `[useLessonAudio] ElevenLabs partial failure (${elChunks.length}/${expectedLines} lines), trying Gemini TTS`,
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
        devLog(
          '%c🎙️ [Audio Provider] SUCCESS: Gemini Flash TTS dialogue generated (1 API call) ✓',
          'color: #059669; font-weight: bold; background-color: #ecfdf5; padding: 4px 8px; border-radius: 4px; border: 1px solid #a7f3d0;'
        );
        return geminiResult.chunks;
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
    return synthesizeDialogue(lines, language);
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
      cachedChunksRef.current = null;
      fetchPromiseRef.current = null;
      audioMimeRef.current = 'audio/mpeg';
      monolithicAudioRef.current = false;
      lastHookRef.current = hook ?? ({ dialogue: dialogueOverride ?? '' } as HookResult);
      stopAudio();
    }
  }

  // Background Prefetching Effect
  useEffect(() => {
    const lines = getDialogueLines();
    if (lines.length === 0 || !lesson) return;
    const language = lesson.language;

    if (!fetchPromiseRef.current && !cachedChunksRef.current) {
      devLog(`[Audio Prefetch] 🚀 Iniciar prefetch de áudio em background para o diálogo...`);
      setIsLoadingAudio(true);
      fetchPromiseRef.current = fetchDialogueAudio(lines, language)
        .then((chunks) => {
          cachedChunksRef.current = chunks;
          setIsLoadingAudio(false);
          devLog(`[Audio Prefetch] ✅ Prefetch concluído e cacheado no cliente.`);
          return chunks;
        })
        .catch((err) => {
          console.error('[Audio Prefetch] Erro no prefetch de áudio:', err);
          setIsLoadingAudio(false);
          return [];
        });
    }
  }, [hook, lesson, phase, dialogueOverride]);

  function handleAudioButton() {
    if (isPlaying) { stopAudio(); return; }
    if (!lesson) return;
    const lines = getDialogueLines();
    if (lines.length === 0) return;

    if (cachedChunksRef.current) {
      devLog(
        '%c⚡ [Audio Cache] Client Cache Hit! Replaying current dialogue audio instantly without server requests (0 credits used)',
        'color: #0284c7; font-weight: bold; background-color: #f0f9ff; padding: 4px 8px; border-radius: 4px; border: 1px solid #bae6fd;'
      );
      startAudio(cachedChunksRef.current);
      return;
    }

    if (fetchPromiseRef.current) {
      devLog(`[Audio Play] Aguardando prefetch em andamento finalizar...`);
      setIsLoadingAudio(true);
      fetchPromiseRef.current.then((chunks) => {
        setIsLoadingAudio(false);
        if (chunks.length > 0) {
          startAudio(chunks);
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

    if (cachedChunksRef.current) {
      devLog(`[Audio Auto-Play] Cache hit! Tocando diálogo instantaneamente.`);
      startAudio(cachedChunksRef.current);
    } else if (fetchPromiseRef.current) {
      devLog(`[Audio Auto-Play] Aguardando prefetch em andamento para auto-play...`);
      setIsLoadingAudio(true);
      fetchPromiseRef.current.then((chunks) => {
        setIsLoadingAudio(false);
        if (chunks.length > 0) {
          startAudio(chunks);
        }
      });
    }

    return () => { stopAudio(); };
  }, [phase, hook, lesson]);

  return {
    isPlaying,
    playingLineIdx,
    isLoadingAudio,
    handleAudioButton,
    stopAudio,
  };
}
