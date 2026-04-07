import React from 'react';
import { Loader2, Volume2, VolumeX } from 'lucide-react';
import { ClickableSentence } from './ClickableSentence';
import type { WordClickPayload } from './ClickableWord';

interface LessonHookScreenProps {
  dialogue: string;
  newVocabulary: string[];
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
  dialogueTranslations,
  isPlaying,
  isLoadingAudio,
  playingLineIdx,
  onAudioButton,
  onWordClick,
}: LessonHookScreenProps) {
  return (
    <div className="flex flex-col gap-5 animate-slide-up-spring">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
            Diálogo
          </p>
        </div>
        <button
          type="button"
          onClick={onAudioButton}
          disabled={isLoadingAudio}
          aria-label={isPlaying ? 'Parar áudio' : 'Ouvir diálogo'}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all active:scale-90 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isPlaying ? 'var(--color-primary)' : 'var(--color-surface)',
            border: `1.5px solid ${isPlaying ? 'var(--color-primary)' : 'var(--color-border)'}`,
            color: isPlaying ? '#fff' : 'var(--color-text-muted)',
          }}
        >
          {isLoadingAudio ? (
            <Loader2 size={13} className="animate-spin" />
          ) : isPlaying ? (
            <VolumeX size={13} />
          ) : (
            <Volume2 size={13} />
          )}
          {isPlaying ? 'Parar' : isLoadingAudio ? 'Carregando…' : 'Ouvir'}
        </button>
      </div>

      {/* Dialogue bubbles */}
      <div className="flex flex-col gap-3">
        {dialogue.split('\n').filter((l) => l.trim()).map((line, i) => {
          const match = line.match(/^([^:]+):\s*(.+)/);
          const speakerName = match?.[1]?.trim();
          const text = match?.[2]?.trim() ?? line;
          const isEven = i % 2 === 0;
          const isActive = playingLineIdx === i;

          const speakerColor = isEven ? 'var(--color-primary)' : '#d97706';
          const bubbleBg = isEven ? 'var(--color-primary-light)' : 'var(--color-vocab-bg)';
          const bubbleBorder = isEven
            ? `1.5px solid ${isActive ? 'var(--color-primary)' : 'rgba(29,94,212,0.2)'}`
            : `1.5px solid ${isActive ? '#d97706' : 'rgba(217,119,6,0.2)'}`;

          return (
            <div
              key={i}
              className={`flex flex-col ${isEven ? 'items-start' : 'items-end'} animate-slide-up`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
            >
              {speakerName && (
                <p
                  className="mb-1 px-1 text-xs font-bold uppercase tracking-wide"
                  style={{ color: speakerColor }}
                >
                  {speakerName}
                </p>
              )}
              <div
                className="max-w-[88%] rounded-2xl px-4 py-3 transition-all duration-300"
                style={{
                  backgroundColor: bubbleBg,
                  border: bubbleBorder,
                  borderRadius: isEven
                    ? '4px 18px 18px 18px'
                    : '18px 4px 18px 18px',
                  boxShadow: isActive
                    ? `0 4px 16px ${isEven ? 'rgba(29,94,212,0.2)' : 'rgba(217,119,6,0.2)'}`
                    : 'none',
                }}
              >
                <ClickableSentence
                  text={text}
                  newVocabulary={[...new Set(newVocabulary)]}
                  onWordClick={onWordClick}
                  className="text-lg"
                />
                {dialogueTranslations?.[i]?.trim() && (
                  <p
                    className="mt-1.5 text-sm italic border-t pt-1.5"
                    style={{
                      color: 'var(--color-bridge)',
                      borderColor: isEven ? 'rgba(29,94,212,0.15)' : 'rgba(217,119,6,0.15)',
                    }}
                  >
                    {dialogueTranslations[i]}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p
        className="text-center text-xs italic"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Toque nas palavras destacadas para ver a tradução
      </p>
    </div>
  );
}
