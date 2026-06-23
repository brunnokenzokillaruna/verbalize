'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Ear, Volume2 } from 'lucide-react';
import { synthesizeDialogueGemini } from '@/app/actions/synthesizeGeminiTts';
import { synthesizeDialogue } from '@/app/actions/synthesizeSpeech';
import { synthesizeDialogueElevenLabs } from '@/app/actions/synthesizeElevenLabs';
import { getPlaybackRateForLevel } from '@/lib/immersion';
import type { ListeningComprehensionData, ProficiencyLevel, SupportedLanguage } from '@/types';

interface ListeningComprehensionExerciseProps {
  data: ListeningComprehensionData;
  language: SupportedLanguage;
  level?: ProficiencyLevel;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
}

async function fetchDialogueAudio(
  lines: string[],
  language: SupportedLanguage,
): Promise<string[]> {
  const expectedLines = lines.filter((l) => l.trim().length > 0).length;

  try {
    const elChunks = await synthesizeDialogueElevenLabs(lines, language);
    if (elChunks.length === expectedLines) return elChunks;
  } catch {
    /* try next provider */
  }

  try {
    const geminiResult = await synthesizeDialogueGemini(lines, language);
    if (geminiResult?.chunks.length) return geminiResult.chunks;
  } catch {
    /* try next provider */
  }

  return synthesizeDialogue(lines, language);
}

export function ListeningComprehensionExercise({
  data,
  language,
  level = 'A1',
  onAnswer,
  answered,
  setIsExerciseReady,
}: ListeningComprehensionExerciseProps) {
  const [hasListened, setHasListened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cachedChunksRef = useRef<string[] | null>(null);
  const fetchPromiseRef = useRef<Promise<string[]> | null>(null);
  const playSessionRef = useRef(0);

  const lines = data.dialogueAudio
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

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
    if (lines.length === 0) return;

    if (!fetchPromiseRef.current && !cachedChunksRef.current) {
      setIsLoadingAudio(true);
      fetchPromiseRef.current = fetchDialogueAudio(lines, language)
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
  }, [data.dialogueAudio, language, lines.length, stopAudio]);

  useEffect(() => {
    setIsExerciseReady(false);
  }, [setIsExerciseReady]);

  function handlePlay() {
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
  }

  function handleOptionClick(index: number) {
    if (answered || !hasListened) return;
    onAnswer(index === data.correctIndex);
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={handlePlay}
        disabled={isLoadingAudio}
        className="flex items-center justify-center gap-2 rounded-xl border border-b-[3px] border-border bg-surface px-4 py-4 text-sm font-bold transition-all active:translate-y-[2px]"
      >
        <Volume2 size={18} className={isPlaying ? 'text-primary animate-pulse' : ''} />
        {isLoadingAudio
          ? 'Carregando áudio…'
          : isPlaying
            ? 'Reproduzindo…'
            : 'Ouvir diálogo completo'}
      </button>

      {!hasListened && (
        <p className="flex items-center justify-center gap-2 text-xs text-center text-text-muted">
          <Ear size={14} />
          Ouça o diálogo inteiro antes de responder — o texto fica oculto de propósito.
        </p>
      )}

      {hasListened && (
        <div className="flex flex-col gap-4 animate-slide-up">
          <p className="text-sm font-semibold text-text-primary">{data.questionPt}</p>
          <div className="flex flex-col gap-2">
            {data.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => handleOptionClick(i)}
                className={[
                  'rounded-xl border border-b-[3px] px-4 py-3 text-left text-sm font-medium transition-all',
                  answered
                    ? i === data.correctIndex
                      ? 'border-success bg-success/10 text-success'
                      : 'border-border bg-surface opacity-60'
                    : 'border-border bg-surface hover:bg-surface-raised active:translate-y-[2px]',
                ].join(' ')}
              >
                {opt}
              </button>
            ))}
          </div>
          {answered && (
            <p className="text-xs text-text-muted">{data.explanationPt}</p>
          )}
        </div>
      )}

      <span className="sr-only">{data.dialogueAudio}</span>
    </div>
  );
}
