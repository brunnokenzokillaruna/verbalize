'use client';

import { Volume2, Square, Loader2 } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';
import type { SupportedLanguage } from '@/types';

interface AudioPlayerButtonProps {
  text: string;
  language: SupportedLanguage;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE = {
  sm: { btn: 32, icon: 14, ring: 40 },
  md: { btn: 44, icon: 18, ring: 56 },
  lg: { btn: 56, icon: 24, ring: 72 },
};

export function AudioPlayerButton({
  text,
  language,
  size = 'md',
}: AudioPlayerButtonProps) {
  const { toggle, isPlaying, isLoading } = useAudio();
  const s = SIZE[size];
  const busy = isPlaying || isLoading;

  return (
    <button
      type="button"
      onClick={() => toggle(text, language)}
      disabled={isLoading}
      aria-label={isPlaying ? 'Parar áudio' : 'Ouvir pronúncia'}
      className="relative flex items-center justify-center rounded-full transition-transform duration-150 active:scale-90 disabled:cursor-not-allowed"
      style={{
        width: s.btn,
        height: s.btn,
        backgroundColor: busy ? 'var(--color-primary)' : 'var(--color-primary-light)',
        color: busy ? 'var(--color-text-inverse)' : 'var(--color-primary)',
      }}
    >
      {/* Pulsing ring while playing */}
      {isPlaying && (
        <span
          className="absolute rounded-full"
          style={{
            width: s.ring,
            height: s.ring,
            border: '2px solid var(--color-primary)',
            opacity: 0.35,
            animation: 'pulse-ring 1.4s ease-out infinite',
          }}
        />
      )}

      {isLoading
        ? <Loader2 size={s.icon} className="animate-spin" />
        : isPlaying
          ? <Square size={s.icon} fill="currentColor" />
          : <Volume2 size={s.icon} />}
    </button>
  );
}
