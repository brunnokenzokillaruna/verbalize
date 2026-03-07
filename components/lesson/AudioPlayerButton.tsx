'use client';

import { Volume2, Square } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';
import type { SupportedLanguage } from '@/types';

interface AudioPlayerButtonProps {
  text: string;
  language: SupportedLanguage;
  size?: 'sm' | 'md' | 'lg';
  /** If true, plays immediately on mount */
  autoPlay?: boolean;
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
  const { toggle, isPlaying } = useAudio();
  const s = SIZE[size];

  return (
    <button
      type="button"
      onClick={() => toggle(text, language)}
      aria-label={isPlaying ? 'Parar áudio' : 'Ouvir pronúncia'}
      className="relative flex items-center justify-center rounded-full transition-transform duration-150 active:scale-90"
      style={{
        width: s.btn,
        height: s.btn,
        backgroundColor: isPlaying
          ? 'var(--color-primary)'
          : 'var(--color-primary-light)',
        color: isPlaying ? 'var(--color-text-inverse)' : 'var(--color-primary)',
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

      {isPlaying ? <Square size={s.icon} fill="currentColor" /> : <Volume2 size={s.icon} />}
    </button>
  );
}
