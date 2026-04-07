import { useState, useRef, useEffect } from 'react';
import { synthesizeDialogue } from '@/app/actions/synthesizeSpeech';

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

  function handleAudioButton() {
    if (isPlaying) { stopAudio(); return; }
    if (!hook) return;
    if (cachedChunksRef.current) { startAudio(cachedChunksRef.current); return; }
    if (!lesson || isLoadingAudio) return;
    
    const lines = hook.dialogue.split('\n').filter((l: string) => l.trim().length > 0);
    const language = lesson.language;
    
    (async () => {
      setIsLoadingAudio(true);
      try {
        const chunks = await synthesizeDialogue(lines, language);
        if (chunks.length > 0) { cachedChunksRef.current = chunks; startAudio(chunks); }
      } finally {
        setIsLoadingAudio(false);
      }
    })();
  }

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
        const chunks = await synthesizeDialogue(lines, language);
        if (!cancelled && chunks.length > 0) {
          cachedChunksRef.current = chunks;
          startAudio(chunks);
        }
      } catch (err) {
        console.error('[LessonPage] TTS error:', err);
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
