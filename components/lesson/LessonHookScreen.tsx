import React from 'react';
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

      {/* Dialogue area with alternating conversation flow */}
      <div className="relative flex flex-col gap-8">
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
              className={`group flex transition-all duration-300 ${isSecondSpeaker ? 'flex-row-reverse' : 'flex-row'} gap-4 ${isActive ? 'scale-[1.01] opacity-100' : 'opacity-85'}`}
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
            >
              {/* Refined Speaker Avatar */}
              <div className="shrink-0 pt-1">
                <div 
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-xs font-black transition-all duration-300 border border-[var(--color-border)] border-b-[3px] active:translate-y-[2px] active:border-b-[1px] ${
                    isActive 
                      ? 'text-white scale-105 shadow-sm' 
                      : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-surface)]'
                  }`}
                  style={{ 
                    backgroundColor: isActive ? speakerColor : undefined,
                    borderColor: isActive ? speakerColor : undefined,
                    borderBottomColor: isActive ? 'rgba(0,0,0,0.3)' : undefined,
                  }}
                >
                  {speakerInitials}
                </div>
              </div>

              {/* Message Content Bubble */}
              <div className={`flex flex-col gap-2 flex-1 min-w-0 ${isSecondSpeaker ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-2.5 ${isSecondSpeaker ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span 
                    className="text-[10px] font-black uppercase tracking-widest transition-colors duration-300"
                    style={{ color: isActive ? speakerColor : 'var(--color-text-muted)' }}
                  >
                    {speakerName}
                  </span>
                  {isActive && (
                    <span className="flex gap-0.5 h-2.5 items-end mb-[2px]">
                      <span className="w-0.5 h-full animate-bounce [animation-duration:0.6s]" style={{ backgroundColor: speakerColor }}></span>
                      <span className="w-0.5 h-2/3 animate-bounce [animation-duration:0.8s]" style={{ backgroundColor: speakerColor }}></span>
                      <span className="w-0.5 h-1/2 animate-bounce [animation-duration:1.0s]" style={{ backgroundColor: speakerColor }}></span>
                    </span>
                  )}
                </div>

                <div 
                  className={[
                    "w-full max-w-[95%] rounded-2xl p-4 border transition-all duration-300",
                    isSecondSpeaker ? "rounded-tr-none" : "rounded-tl-none",
                    isActive 
                      ? "bg-[var(--color-surface)] shadow-md border-b-[4px]" 
                      : "bg-[var(--color-surface-raised)]/45 border-[var(--color-border)] border-b-[3px]"
                  ].join(" ")}
                  style={{
                    borderColor: isActive ? speakerColor : undefined,
                    borderBottomColor: isActive ? 'rgba(0,0,0,0.2)' : undefined,
                  }}
                >
                  <ClickableSentence
                    text={text}
                    newVocabulary={[...new Set(newVocabulary)]}
                    newVerbs={newVerbs ? [...new Set(newVerbs)] : []}
                    onWordClick={onWordClick}
                    className={`leading-relaxed transition-all duration-300 ${isSecondSpeaker ? 'text-right' : 'text-left'} ${isActive ? 'text-[1.02rem] font-bold text-[var(--color-text-primary)]' : 'text-base font-medium opacity-95'}`}
                  />
                  
                  {dialogueTranslations?.[i]?.trim() && (
                    <div className="mt-2.5 border-t border-[var(--color-border)]/50 pt-2.5 transition-all duration-500">
                      <p 
                        className={`text-xs italic text-[var(--color-text-secondary)] leading-relaxed transition-colors ${isSecondSpeaker ? 'text-right' : 'text-left'}`}
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
