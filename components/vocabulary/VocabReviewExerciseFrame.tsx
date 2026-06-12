'use client';

import React from 'react';
import Image from 'next/image';
import { Book } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { ExerciseTypeShell } from '@/components/lesson/ExerciseTypeShell';
import type { SupportedLanguage } from '@/types';

interface VocabReviewExerciseFrameProps {
  exerciseType: 'context-choice' | 'reverse-translation' | 'word-bank-translation';
  word: string;
  wordImage?: string;
  language: SupportedLanguage;
  children: React.ReactNode;
}

export function VocabReviewExerciseFrame({
  exerciseType,
  word,
  wordImage,
  language,
  children,
}: VocabReviewExerciseFrameProps) {
  return (
    <div className="flex flex-col gap-5">
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

      <ExerciseTypeShell type={exerciseType} hideInstruction>
        {children}
      </ExerciseTypeShell>
    </div>
  );
}
