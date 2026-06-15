'use client';

import { useState, useCallback, useRef } from 'react';
import { synthesizeSpeech } from '@/app/actions/synthesizeSpeech';
import { playTrimmedMp3Base64, type TtsPlaybackHandle } from '@/utils/ttsPlayback';
import type { SupportedLanguage } from '@/types';

/**
 * Plays TTS audio for arbitrary text.
 *
 * @param fixedVoice  If provided, every call to `speak` will use this exact
 *                    Google TTS voice name instead of picking a random one.
 */
export function useAudio(fixedVoice?: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackRef = useRef<TtsPlaybackHandle | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());

  const stop = useCallback(() => {
    playbackRef.current?.stop();
    playbackRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (text: string, lang: SupportedLanguage) => {
    stop();
    const key = `${lang}:${fixedVoice ?? 'auto'}:${text}:v2`;
    let base64 = cacheRef.current.get(key) ?? null;

    if (!base64) {
      setIsLoading(true);
      try {
        base64 = await synthesizeSpeech(text, lang, fixedVoice);
        if (base64) cacheRef.current.set(key, base64);
      } catch {
        // silently fail — button resets to idle
      } finally {
        setIsLoading(false);
      }
    }

    if (!base64) return;

    const onEnded = () => {
      setIsPlaying(false);
      playbackRef.current = null;
      audioRef.current = null;
    };

    try {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        const handle = await playTrimmedMp3Base64(
          base64,
          audioContextRef.current,
          onEnded,
        );
        playbackRef.current = handle;
        setIsPlaying(true);
        return;
      }
    } catch {
      // Fall back to HTMLAudioElement below
    }

    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audioRef.current = audio;
    audio.onplay = () => setIsPlaying(true);
    audio.onended = onEnded;
    audio.onerror = onEnded;
    audio.play().catch(onEnded);
  }, [stop, fixedVoice]);

  const toggle = useCallback(
    (text: string, lang: SupportedLanguage) => {
      if (isPlaying) {
        stop();
      } else {
        speak(text, lang);
      }
    },
    [isPlaying, speak, stop],
  );

  return { speak, stop, toggle, isPlaying, isLoading };
}
