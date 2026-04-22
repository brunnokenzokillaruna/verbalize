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
    <div className="flex flex-col gap-10 animate-slide-up-spring">
      {/* Refined Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-base shadow-inner ring-1 ring-white/10 backdrop-blur-md dark:bg-white/5">
            💬
          </div>
          <div className="flex flex-col">
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Diálogo contextual
            </h2>
            <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">
              Ouça e aprenda na prática
            </p>
          </div>
        </div>

        {/* Delicate Audio Pill */}
        <button
          type="button"
          onClick={onAudioButton}
          disabled={isLoadingAudio}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 ${
            isPlaying 
              ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20' 
              : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:bg-[var(--color-surface-raised)]'
          }`}
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

      {/* Dialogue area with alternating conversation flow */}
      <div className="relative flex flex-col gap-10">
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
              className={`group flex transition-all duration-500 ${isSecondSpeaker ? 'flex-row-reverse' : 'flex-row'} gap-4 ${isActive ? 'scale-[1.02]' : 'opacity-90'}`}
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
            >
              {/* Refined Speaker Avatar */}
              <div className="shrink-0 pt-0.5">
                <div 
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black shadow-sm ring-4 ring-[var(--color-bg)] transition-all duration-500 ${
                    isActive 
                      ? 'text-white scale-110' 
                      : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-surface)]'
                  }`}
                  style={{ backgroundColor: isActive ? speakerColor : undefined }}
                >
                  {speakerInitials}
                </div>
              </div>

              {/* Message Content */}
              <div className={`flex flex-col gap-2 flex-1 min-w-0 ${isSecondSpeaker ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-2.5 ${isSecondSpeaker ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span 
                    className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-300"
                    style={{ color: isActive ? speakerColor : 'var(--color-text-muted)' }}
                  >
                    {speakerName}
                  </span>
                  {isActive && (
                    <span className="flex gap-0.5 h-2 items-end">
                      <span className="w-0.5 h-full animate-bounce [animation-duration:0.6s]" style={{ backgroundColor: speakerColor }}></span>
                      <span className="w-0.5 h-2/3 animate-bounce [animation-duration:0.8s]" style={{ backgroundColor: speakerColor }}></span>
                      <span className="w-0.5 h-1/2 animate-bounce [animation-duration:1s]" style={{ backgroundColor: speakerColor }}></span>
                    </span>
                  )}
                </div>

                <div className={`max-w-[95%] transition-all duration-300 ${isActive ? (isSecondSpeaker ? '-translate-x-1' : 'translate-x-1') : ''}`}>
                  <ClickableSentence
                    text={text}
                    newVocabulary={[...new Set(newVocabulary)]}
                    onWordClick={onWordClick}
                    className={`leading-relaxed transition-all duration-300 ${isSecondSpeaker ? 'text-right' : 'text-left'} ${isActive ? 'text-[1.05rem] font-medium' : 'text-base opacity-90'}`}
                  />
                  
                  {dialogueTranslations?.[i]?.trim() && (
                    <div className="mt-2.5 transition-all duration-500">
                      <p 
                        className={`text-xs italic text-[var(--color-text-secondary)] px-4 leading-relaxed border-l-2 transition-colors ${isSecondSpeaker ? 'text-right border-r-2 border-l-0' : 'text-left border-l-2'}`}
                        style={{ borderColor: `${speakerColor}40` }}
                      >
                        {dialogueTranslations[i]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
