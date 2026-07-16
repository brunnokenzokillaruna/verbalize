'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Volume2, VolumeX, MessageSquare, Eye } from 'lucide-react';
import { ClickableSentence } from './ClickableSentence';
import { LessonSceneBanner } from './LessonSceneBanner';
import type { WordClickPayload } from './ClickableWord';
import type { VocabImageResult } from '@/types';

interface LessonHookScreenProps {
  dialogue: string;
  newVocabulary: string[];
  newVerbs?: string[];
  dialogueTranslations?: string[];
  isPlaying: boolean;
  isLoadingAudio: boolean;
  playingLineIdx: number;
  onAudioButton: () => void;
  onWordClick: (payload: WordClickPayload) => void;
  listenFirstEnabled?: boolean;
  sceneImage?: VocabImageResult | null;
}

const SPEAKER_COLORS = {
  first: 'var(--color-primary)',
  second: '#ec4899',
} as const;

function stripSpeakerPrefix(translation: string, speakerName: string): string {
  if (!speakerName) return translation;
  return translation.replace(new RegExp(`^${speakerName}\\s*:\\s*`, 'i'), '').trim();
}

export function LessonHookScreen({
  dialogue,
  newVocabulary,
  newVerbs,
  dialogueTranslations,
  isPlaying,
  isLoadingAudio,
  playingLineIdx,
  onAudioButton,
  onWordClick,
  listenFirstEnabled = false,
  sceneImage = null,
}: LessonHookScreenProps) {
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [textRevealed, setTextRevealed] = useState(!listenFirstEnabled);
  const [hasListenedOnce, setHasListenedOnce] = useState(false);

  useEffect(() => {
    if (isPlaying) setHasListenedOnce(true);
    if (listenFirstEnabled && hasListenedOnce && !isPlaying) {
      setTextRevealed(true);
    }
  }, [isPlaying, hasListenedOnce, listenFirstEnabled]);

  function handleAudioClick() {
    setHasListenedOnce(true);
    onAudioButton();
  }

  const hideText = listenFirstEnabled && !textRevealed;

  useEffect(() => {
    if (playingLineIdx < 0) return;

    const lineEl = lineRefs.current[playingLineIdx];
    if (!lineEl) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    lineEl.scrollIntoView({
      behavior: prefersReducedMotion ? 'instant' : 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }, [playingLineIdx]);

  const lines = dialogue.split('\n').filter((l) => l.trim());

  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-slide-up-spring">
      {sceneImage?.imageUrl && (
        <LessonSceneBanner
          sceneImage={sceneImage}
          title="Diálogo Contextual"
          subtitle="Ouça e aprenda na prática"
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!sceneImage?.imageUrl && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-border border-b-[3px] shadow-sm">
              <MessageSquare size={18} className="text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="font-display text-xl sm:text-2xl font-black italic tracking-tight text-text-primary">
                Diálogo Contextual
              </h2>
              <p className="text-xs font-semibold text-text-muted mt-0.5">
                Ouça e aprenda na prática
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleAudioClick}
          disabled={isLoadingAudio}
          className={[
            'flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold',
            'transition-all duration-100 active:translate-y-[2px]',
            sceneImage?.imageUrl ? 'sm:ml-auto' : '',
            isLoadingAudio
              ? 'cursor-not-allowed opacity-50 border border-border bg-surface'
              : 'cursor-pointer border border-b-[3px]',
            isPlaying
              ? 'bg-primary border-primary text-white shadow-md shadow-primary/15'
              : 'bg-surface text-text-primary border-border hover:bg-surface-raised',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {isLoadingAudio ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isPlaying ? (
            <VolumeX size={16} />
          ) : (
            <Volume2 size={16} />
          )}
          <span>
            {isPlaying
              ? 'Parar áudio'
              : isLoadingAudio
                ? 'Carregando…'
                : listenFirstEnabled && !hasListenedOnce
                  ? 'Ouvir diálogo completo'
                  : 'Ouvir diálogo'}
          </span>
        </button>

        {listenFirstEnabled && !textRevealed && (
          <button
            type="button"
            onClick={() => setTextRevealed(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-muted"
          >
            <Eye size={14} />
            Mostrar texto
          </button>
        )}
      </div>

      {hideText ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-10 text-center">
          <p className="text-sm text-text-muted">
            Ouça o diálogo completo para treinar a compreensão. O texto aparece depois.
          </p>
        </div>
      ) : (
        <div className="relative flex flex-col gap-3 sm:gap-4">
          {lines.map((line, i) => {
            const match = line.match(/^([^:]+):\s*(.+)/);
            const speakerName = match?.[1]?.trim() ?? '';
            const text = match?.[2]?.trim() ?? line;
            const isSecondSpeaker = i % 2 !== 0;
            const isActive = playingLineIdx === i;
            const speakerInitials = speakerName.substring(0, 1).toUpperCase();
            const speakerColor = isSecondSpeaker ? SPEAKER_COLORS.second : SPEAKER_COLORS.first;
            const rawTranslation = dialogueTranslations?.[i]?.trim();
            const translation = rawTranslation
              ? stripSpeakerPrefix(rawTranslation, speakerName)
              : '';

            return (
              <div
                key={i}
                ref={(node) => {
                  lineRefs.current[i] = node;
                }}
                className={`flex w-full scroll-mt-24 ${
                  isSecondSpeaker ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex items-start gap-2.5 w-full max-w-[20.5rem] sm:max-w-[22rem] ${
                    isSecondSpeaker ? 'flex-row-reverse ml-auto' : 'mr-auto'
                  }`}
                >
                  <div
                    className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: isActive ? speakerColor : 'var(--color-surface-raised)',
                      color: isActive ? '#fff' : 'var(--color-text-muted)',
                      border: isActive ? 'none' : '1px solid var(--color-border)',
                    }}
                  >
                    {speakerInitials}
                  </div>

                  <div
                    className={[
                      'min-w-0 flex-1 rounded-2xl border px-4 py-3 transition-all duration-300',
                      isSecondSpeaker ? 'rounded-tr-md' : 'rounded-tl-md',
                      isActive
                        ? 'bg-surface border-border shadow-md ring-2'
                        : 'bg-surface border-border/80',
                    ].join(' ')}
                    style={{
                      borderLeftWidth: isSecondSpeaker ? undefined : '3px',
                      borderRightWidth: isSecondSpeaker ? '3px' : undefined,
                      borderLeftColor: isSecondSpeaker ? undefined : speakerColor,
                      borderRightColor: isSecondSpeaker ? speakerColor : undefined,
                      ...(isActive
                        ? {
                            boxShadow: `0 4px 16px ${speakerColor}18`,
                            ringColor: `${speakerColor}33`,
                          }
                        : {}),
                    }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="text-xs font-bold uppercase tracking-wide"
                        style={{ color: speakerColor }}
                      >
                        {speakerName}
                      </span>
                      {isActive && (
                        <span className="flex h-2.5 items-end gap-0.5" aria-hidden>
                          <span
                            className="h-full w-0.5 animate-bounce [animation-duration:0.6s]"
                            style={{ backgroundColor: speakerColor }}
                          />
                          <span
                            className="h-2/3 w-0.5 animate-bounce [animation-duration:0.8s]"
                            style={{ backgroundColor: speakerColor }}
                          />
                          <span
                            className="h-1/2 w-0.5 animate-bounce [animation-duration:1.0s]"
                            style={{ backgroundColor: speakerColor }}
                          />
                        </span>
                      )}
                    </div>

                    <ClickableSentence
                      text={text}
                      newVocabulary={[...new Set(newVocabulary)]}
                      newVerbs={newVerbs ? [...new Set(newVerbs)] : []}
                      onWordClick={onWordClick}
                      className={`dialogue-french text-left leading-[1.65] ${isActive ? 'font-bold' : ''}`}
                    />

                    {translation && (
                      <>
                        <div
                          className="my-3 h-px"
                          style={{ backgroundColor: 'var(--color-border)' }}
                          aria-hidden
                        />
                        <p className="dialogue-translation text-left">{translation}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
