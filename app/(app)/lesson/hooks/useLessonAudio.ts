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
  const playSessionRef = useRef(0);

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
   * Fetches dialogue audio — tries ElevenLabs first, falls back to Google TTS.
   * Results are cached client-side in `cachedChunksRef` so replays are instant.
   */
  async function fetchDialogueAudio(lines: string[], language: SupportedLanguage): Promise<string[]> {
    // 1️⃣ Try ElevenLabs
    try {
      const elChunks = await synthesizeDialogueElevenLabs(lines, language);
      if (elChunks.length > 0) {
        console.log(
          '%c🎙️ [Audio Provider] SUCCESS: ElevenLabs premium dialogue voices generated successfully! ✓',
          'color: #10b981; font-weight: bold; background-color: #ecfdf5; padding: 4px 8px; border-radius: 4px; border: 1px solid #a7f3d0;'
        );
        return elChunks;
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

  function handleAudioButton() {
    if (isPlaying) { stopAudio(); return; }
    if (!hook) return;

    // Client-side cache hit → replay instantly (zero API calls, zero credit/quota cost)
    if (cachedChunksRef.current) {
      console.log(
        '%c⚡ [Audio Cache] Client Cache Hit! Replaying current dialogue audio instantly without server requests (0 credits used)',
        'color: #0284c7; font-weight: bold; background-color: #f0f9ff; padding: 4px 8px; border-radius: 4px; border: 1px solid #bae6fd;'
      );
      startAudio(cachedChunksRef.current);
      return;
    }
    if (!lesson || isLoadingAudio) return;
    
    const lines = hook.dialogue.split('\n').filter((l: string) => l.trim().length > 0);
    const language = lesson.language;
    
    (async () => {
      setIsLoadingAudio(true);
      try {
        const chunks = await fetchDialogueAudio(lines, language);
        if (chunks.length > 0) { cachedChunksRef.current = chunks; startAudio(chunks); }
      } finally {
        setIsLoadingAudio(false);
      }
    })();
  }

  // Auto-play when entering the hook phase
  useEffect(() => {
    if (phase !== 'hook') {
      stopAudio();
      cachedChunksRef.current = null;
      return;
    }
    if (!hook || !lesson) return;
    
    const lines = hook.dialogue.split('\n').filter((l: string) => l.trim().length > 0);
    const language = lesson.language;
    let cancelled = false;

    (async () => {
      setIsLoadingAudio(true);
      try {
        const chunks = await fetchDialogueAudio(lines, language);
        if (!cancelled && chunks.length > 0) {
          cachedChunksRef.current = chunks;
          startAudio(chunks);
        }
      } catch (err) {
        console.error('[useLessonAudio] TTS error:', err);
      } finally {
        if (!cancelled) setIsLoadingAudio(false);
      }
    })();

    return () => { cancelled = true; stopAudio(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]); // Deliberately omit hook/lesson to avoid over-fetching

  return {
    isPlaying,
    playingLineIdx,
    isLoadingAudio,
    handleAudioButton,
    stopAudio,
  };
}
