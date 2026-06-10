'use client';

import React from 'react';
import Image from 'next/image';
import { Book } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import type { SupportedLanguage } from '@/types';

interface VocabReviewExerciseFrameProps {
  exerciseType: 'context-choice' | 'reverse-translation';
  word: string;
  wordImage?: string;
  language: SupportedLanguage;
  children: React.ReactNode;
}

const TYPE_LABELS: Record<VocabReviewExerciseFrameProps['exerciseType'], string> = {
  'context-choice': 'Complete a frase',
  'reverse-translation': 'Traduza para o idioma',
};

export function VocabReviewExerciseFrame({
  exerciseType,
  word,
  wordImage,
  language,
  children,
}: VocabReviewExerciseFrameProps) {
  return (
    <div className="flex flex-col gap-5">
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2"
        style={{
          backgroundColor: 'var(--color-primary-light)',
          border: '1px solid rgba(29, 94, 212, 0.2)',
        }}
      >
        <span
          className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: 'var(--color-primary)' }}
        >
          {TYPE_LABELS[exerciseType]}
        </span>
      </div>

      {exerciseType === 'reverse-translation' && (
        <div
          className="flex items-center gap-3 rounded-2xl p-3"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
          }}
        >
          {wordImage ? (
            <div
              className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <Image src={wordImage} alt={word} fill className="object-cover" sizes="48px" />
            </div>
          ) : (
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}
            >
              <Book size={20} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Revisando
            </p>
            <p className="font-display text-lg font-bold truncate" style={{ color: 'var(--color-vocab)' }}>
              {word}
            </p>
          </div>
          <AudioPlayerButton text={word} language={language} size="sm" />
        </div>
      )}

      {children}
    </div>
  );
}
