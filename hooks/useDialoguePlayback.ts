'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchDialogueAudioChunks, parseDialogueLines } from '@/lib/dialogueAudio';
import { getPlaybackRateForLevel } from '@/lib/immersion';
import type { ProficiencyLevel, SupportedLanguage } from '@/types';

interface UseDialoguePlaybackOptions {
  dialogueAudio: string;
  language: SupportedLanguage;
  level?: ProficiencyLevel;
}

export function useDialoguePlayback({
  dialogueAudio,
  language,
  level = 'A1',
}: UseDialoguePlaybackOptions) {
  const lines = parseDialogueLines(dialogueAudio);
  const [hasListened, setHasListened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cachedChunksRef = useRef<string[] | null>(null);
  const fetchPromiseRef = useRef<Promise<string[]> | null>(null);
  const playSessionRef = useRef(0);

  const stopAudio = useCallback(() => {
    playSessionRef.current++;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startAudio = useCallback(
    (chunks: string[]) => {
      stopAudio();
      if (chunks.length === 0) return;

      const session = playSessionRef.current;
      setIsPlaying(true);
      const audio = new Audio();
      audioRef.current = audio;

      function playIndex(i: number) {
        if (session !== playSessionRef.current) return;
        if (i >= chunks.length) {
          setIsPlaying(false);
          return;
        }

        audio.onended = () => setTimeout(() => playIndex(i + 1), 300);
        audio.onerror = () => {
          if (session === playSessionRef.current) setIsPlaying(false);
        };
        audio.src = `data:audio/mpeg;base64,${chunks[i]}`;
        audio.playbackRate = getPlaybackRateForLevel(level);
        audio.play().catch(() => {
          if (session === playSessionRef.current) setIsPlaying(false);
        });
      }

      playIndex(0);
    },
    [level, stopAudio],
  );

  useEffect(() => {
    cachedChunksRef.current = null;
    fetchPromiseRef.current = null;
    setHasListened(false);
    stopAudio();
  }, [dialogueAudio, language, stopAudio]);

  useEffect(() => {
    if (lines.length === 0) return;

    if (!fetchPromiseRef.current && !cachedChunksRef.current) {
      setIsLoadingAudio(true);
      fetchPromiseRef.current = fetchDialogueAudioChunks(lines, language)
        .then((chunks) => {
          cachedChunksRef.current = chunks;
          setIsLoadingAudio(false);
          return chunks;
        })
        .catch(() => {
          setIsLoadingAudio(false);
          return [];
        });
    }

    return () => {
      stopAudio();
    };
  }, [dialogueAudio, language, lines.length, stopAudio]);

  const handlePlay = useCallback(() => {
    setHasListened(true);

    if (cachedChunksRef.current) {
      startAudio(cachedChunksRef.current);
      return;
    }

    if (fetchPromiseRef.current) {
      setIsLoadingAudio(true);
      fetchPromiseRef.current.then((chunks) => {
        setIsLoadingAudio(false);
        if (chunks.length > 0) startAudio(chunks);
      });
    }
  }, [startAudio]);

  return {
    lines,
    hasListened,
    isPlaying,
    isLoadingAudio,
    handlePlay,
    stopAudio,
  };
}
