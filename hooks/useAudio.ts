'use client';

import { useState, useCallback, useRef } from 'react';
import { synthesizeSpeech } from '@/app/actions/synthesizeSpeech';
import type { SupportedLanguage } from '@/types';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Cache base64 per "lang:text" to avoid re-fetching the same word
  const cacheRef = useRef<Map<string, string>>(new Map());

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (text: string, lang: SupportedLanguage) => {
    stop();
    const key = `${lang}:${text}`;
    let base64 = cacheRef.current.get(key) ?? null;

    if (!base64) {
      setIsLoading(true);
      try {
        base64 = await synthesizeSpeech(text, lang);
        if (base64) cacheRef.current.set(key, base64);
      } catch {
        // silently fail — button resets to idle
      } finally {
        setIsLoading(false);
      }
    }

    if (!base64) return;
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audioRef.current = audio;
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
    audio.onerror = () => { setIsPlaying(false); audioRef.current = null; };
    audio.play().catch(() => { setIsPlaying(false); audioRef.current = null; });
  }, [stop]);

  const toggle = useCallback(
    (text: string, lang: SupportedLanguage) => {
      if (isPlaying) { stop(); } else { speak(text, lang); }
    },
    [isPlaying, speak, stop],
  );

  return { speak, stop, toggle, isPlaying, isLoading };
}
