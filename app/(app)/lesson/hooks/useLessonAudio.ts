import { useState, useRef, useEffect } from 'react';
import { synthesizeDialogue } from '@/app/actions/synthesizeSpeech';
import { synthesizeDialogueElevenLabs } from '@/app/actions/synthesizeElevenLabs';
import type { SupportedLanguage } from '@/types';

/**
 * Manages dialogue audio playback for the lesson hook screen.
 *
 * Provider priority:
 *   1. ElevenLabs (if ELEVENLABS_API_KEY is set server-side)
 *   2. Google Cloud TTS (original fallback)
 *
 * Caching strategy (two layers — zero wasted credits on replay):
 *   • Server-side: in-memory Map in synthesizeElevenLabs.ts keyed by
 *     (text + voiceId + language). Survives across requests within the
 *     same server process / warm Vercel function.
 *   • Client-side: `cachedChunksRef` below — once audio is fetched for
 *     the current dialogue, pressing "play" again never hits the server.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useLessonAudio(phase: string, lesson: any, hook: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingLineIdx, setPlayingLineIdx] = useState(-1);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cachedChunksRef = useRef<string[] | null>(null);
  const lastHookRef = useRef<any>(null);
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

      setPlayingLineIdx(i);
      audio.onended = () => setTimeout(() => playIndex(i + 1), 300);
      audio.onerror = () => {
        if (session === playSessionRef.current) { setIsPlaying(false); setPlayingLineIdx(-1); }
      };
      audio.src = `data:audio/mp3;base64,${chunks[i]}`;
      audio.play().catch(() => {
        if (session === playSessionRef.current) { setIsPlaying(false); setPlayingLineIdx(-1); }
      });
    }

    playIndex(0);
  }

  /**
   * Fetches dialogue audio — tries ElevenLabs first, falls back to Google TTS
   * when ElevenLabs is unavailable or returns fewer lines than expected.
   * Results are cached client-side in `cachedChunksRef` so replays are instant.
   */
  async function fetchDialogueAudio(lines: string[], language: SupportedLanguage): Promise<string[]> {
    const expectedLines = lines.filter((l) => l.trim().length > 0).length;

    // 1️⃣ Try ElevenLabs
    try {
      const elChunks = await synthesizeDialogueElevenLabs(lines, language);
      if (elChunks.length === expectedLines) {
        console.log(
          '%c🎙️ [Audio Provider] SUCCESS: ElevenLabs premium dialogue voices generated successfully! ✓',
          'color: #10b981; font-weight: bold; background-color: #ecfdf5; padding: 4px 8px; border-radius: 4px; border: 1px solid #a7f3d0;'
        );
        return elChunks;
      }
      if (elChunks.length > 0) {
        console.warn(
          `[useLessonAudio] ElevenLabs partial failure (${elChunks.length}/${expectedLines} lines), falling back to Google TTS`,
        );
      }
    } catch (err) {
      console.warn('[useLessonAudio] ElevenLabs failed, falling back to Google TTS:', err);
    }

    // 2️⃣ Fallback to Google Cloud TTS
    console.log(
      '%c🎙️ [Audio Provider] FALLBACK: ElevenLabs unavailable or disabled. Using Google TTS (Studio/Chirp voices) instead.',
      'color: #d97706; font-weight: bold; background-color: #fffbeb; padding: 4px 8px; border-radius: 4px; border: 1px solid #fef3c7;'
    );
    return synthesizeDialogue(lines, language);
  }

  // Clear client cache and reset when a new lesson / hook is loaded
  if (hook !== lastHookRef.current) {
    cachedChunksRef.current = null;
    fetchPromiseRef.current = null;
    lastHookRef.current = hook;
    stopAudio();
  }

  // Background Prefetching Effect - runs as soon as hook & lesson are available (e.g. in vocabulary phase)
  useEffect(() => {
    if (!hook || !lesson) return;

    const lines = hook.dialogue.split('\n').filter((l: string) => l.trim().length > 0);
    const language = lesson.language;

    if (!fetchPromiseRef.current && !cachedChunksRef.current) {
      console.log(`[Audio Prefetch] 🚀 Iniciar prefetch de áudio em background para o diálogo...`);
      setIsLoadingAudio(true);
      fetchPromiseRef.current = fetchDialogueAudio(lines, language)
        .then((chunks) => {
          cachedChunksRef.current = chunks;
          setIsLoadingAudio(false);
          console.log(`[Audio Prefetch] ✅ Prefetch concluído e cacheado no cliente.`);
          return chunks;
        })
        .catch((err) => {
          console.error('[Audio Prefetch] Erro no prefetch de áudio:', err);
          setIsLoadingAudio(false);
          return [];
        });
    }
  }, [hook, lesson]);

  function handleAudioButton() {
    if (isPlaying) { stopAudio(); return; }
    if (!hook || !lesson) return;

    if (cachedChunksRef.current) {
      console.log(
        '%c⚡ [Audio Cache] Client Cache Hit! Replaying current dialogue audio instantly without server requests (0 credits used)',
        'color: #0284c7; font-weight: bold; background-color: #f0f9ff; padding: 4px 8px; border-radius: 4px; border: 1px solid #bae6fd;'
      );
      startAudio(cachedChunksRef.current);
      return;
    }

    if (fetchPromiseRef.current) {
      console.log(`[Audio Play] Aguardando prefetch em andamento finalizar...`);
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
      console.log(`[Audio Auto-Play] Cache hit! Tocando diálogo instantaneamente.`);
      startAudio(cachedChunksRef.current);
    } else if (fetchPromiseRef.current) {
      console.log(`[Audio Auto-Play] Aguardando prefetch em andamento para auto-play...`);
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
