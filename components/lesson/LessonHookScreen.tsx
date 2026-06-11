'use client';

import React, { useEffect, useRef } from 'react';
import { Loader2, Volume2, VolumeX, MessageSquare } from 'lucide-react';
import { ClickableSentence } from './ClickableSentence';
import type { WordClickPayload } from './ClickableWord';

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
}: LessonHookScreenProps) {
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  return (
    <div className="flex flex-col gap-10 animate-slide-up-spring">
      {/* Refined Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] border-b-[3px] text-lg shadow-sm">
            <MessageSquare size={18} className="text-[var(--color-primary)]" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-serif text-2xl font-black italic tracking-tight text-[var(--color-text-primary)]">
              Diálogo Contextual
            </h2>
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] mt-0.5">
              Ouça e aprenda na prática
            </p>
          </div>
        </div>

        {/* Delicate Audio Pill */}
        <button
          type="button"
          onClick={onAudioButton}
          disabled={isLoadingAudio}
          className={[
            'flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-wider',
            'transition-all duration-100 active:translate-y-[2px] active:border-b-[1px]',
            isLoadingAudio ? 'cursor-not-allowed opacity-50 border border-[var(--color-border)]' : 'cursor-pointer border border-b-[3px]',
            isPlaying
              ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/15'
              : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-raised)]'
          ].filter(Boolean).join(' ')}
          style={{
            borderBottomColor: 'rgba(0, 0, 0, 0.35)'
          }}
        >
          {isLoadingAudio ? (
            <Loader2 size={12} className="animate-spin" />
          ) : isPlaying ? (
            <VolumeX size={12} />
          ) : (
            <Volume2 size={12} />
          )}
          <span>{isPlaying ? 'Parar' : isLoadingAudio ? 'Carregando' : 'Ouvir Diálogo'}</span>
        </button>
      </div>

      {/* Dialogue area — WhatsApp-style alternating bubbles */}
      <div className="relative flex flex-col gap-3">
        {dialogue.split('\n').filter((l) => l.trim()).map((line, i) => {
          const match = line.match(/^([^:]+):\s*(.+)/);
          const speakerName = match?.[1]?.trim() ?? '';
          const text = match?.[2]?.trim() ?? line;
          const isSecondSpeaker = i % 2 !== 0;
          const isActive = playingLineIdx === i;
          
          const speakerInitials = speakerName.substring(0, 1).toUpperCase();
          const speakerColor = isSecondSpeaker ? '#ec4899' : 'var(--color-primary)';

          return (
            <div
              key={i}
              ref={(node) => {
                lineRefs.current[i] = node;
              }}
              className={`group flex w-full scroll-mt-28 transition-all duration-300 ${
                isSecondSpeaker ? 'justify-end' : 'justify-start'
              } ${isActive ? 'opacity-100' : 'opacity-90'}`}
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
            >
              <div
                className={`flex items-end gap-2 max-w-[82%] sm:max-w-[75%] ${
                  isSecondSpeaker ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar pinned to the outer edge */}
                <div className="shrink-0 pb-0.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black transition-all duration-300 ${
                      isActive
                        ? 'text-white shadow-sm'
                        : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]'
                    }`}
                    style={{
                      backgroundColor: isActive ? speakerColor : undefined,
                    }}
                  >
                    {speakerInitials}
                  </div>
                </div>

                {/* Bubble column — shrinks to content, capped by max-w on parent */}
                <div className={`flex min-w-0 flex-col gap-1 ${isSecondSpeaker ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 ${isSecondSpeaker ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider transition-colors duration-300"
                      style={{ color: isActive ? speakerColor : 'var(--color-text-muted)' }}
                    >
                      {speakerName}
                    </span>
                    {isActive && (
                      <span className="flex h-2.5 items-end gap-0.5">
                        <span className="h-full w-0.5 animate-bounce [animation-duration:0.6s]" style={{ backgroundColor: speakerColor }} />
                        <span className="h-2/3 w-0.5 animate-bounce [animation-duration:0.8s]" style={{ backgroundColor: speakerColor }} />
                        <span className="h-1/2 w-0.5 animate-bounce [animation-duration:1.0s]" style={{ backgroundColor: speakerColor }} />
                      </span>
                    )}
                  </div>

                  <div
                    className={[
                      'w-fit max-w-full rounded-2xl px-3.5 py-2.5 transition-all duration-300',
                      isSecondSpeaker ? 'rounded-br-sm' : 'rounded-bl-sm',
                      isActive
                        ? 'bg-[var(--color-surface)] shadow-md ring-1 ring-[var(--color-border)]'
                        : isSecondSpeaker
                          ? 'bg-[var(--color-primary)]/10'
                          : 'bg-[var(--color-surface-raised)]/80',
                    ].join(' ')}
                    style={{
                      ...(isActive ? { boxShadow: `0 2px 12px ${speakerColor}22` } : {}),
                    }}
                  >
                    <ClickableSentence
                      text={text}
                      newVocabulary={[...new Set(newVocabulary)]}
                      newVerbs={newVerbs ? [...new Set(newVerbs)] : []}
                      onWordClick={onWordClick}
                      className={`text-left leading-relaxed transition-all duration-300 ${
                        isActive
                          ? 'text-[1.02rem] font-bold text-[var(--color-text-primary)]'
                          : 'text-[0.95rem] font-medium text-[var(--color-text-primary)]'
                      }`}
                    />

                    {dialogueTranslations?.[i]?.trim() && (
                      <div className="mt-2 border-t border-[var(--color-border)]/40 pt-2">
                        <p className="text-left text-xs italic leading-relaxed text-[var(--color-text-secondary)]">
                          {dialogueTranslations[i]}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
