'use client';

import { useState, useCallback, useRef } from 'react';
import type { SupportedLanguage } from '@/types';

const LANG_CODE: Record<SupportedLanguage, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
};

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, lang: SupportedLanguage) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any current speech first
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LANG_CODE[lang];
    utter.rate = 0.85; // slightly slower for language learning
    utter.pitch = 1;
    utter.volume = 1;

    utter.onstart = () => setIsPlaying(true);
    utter.onend = () => setIsPlaying(false);
    utter.onerror = () => setIsPlaying(false);
    utter.onpause = () => setIsPlaying(false);

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

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

  return { speak, stop, toggle, isPlaying };
}
