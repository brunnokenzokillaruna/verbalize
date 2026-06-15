'use client';

import Image from 'next/image';
import { Book, Sparkles } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { ExerciseTypeShell } from '@/components/lesson/ExerciseTypeShell';
import { EXERCISE_TYPE_LABELS } from '@/components/vocabulary/reviewThemes';
import type { ReviewTheme } from '@/components/vocabulary/reviewThemes';
import type { SupportedLanguage } from '@/types';

interface VocabReviewExerciseFrameProps {
  theme: ReviewTheme;
  exerciseType: 'context-choice' | 'reverse-translation' | 'word-bank-translation';
  word: string;
  translation?: string;
  wordImage?: string;
  language: SupportedLanguage;
  children: React.ReactNode;
}

export function VocabReviewExerciseFrame({
  theme,
  exerciseType,
  word,
  translation,
  wordImage,
  language,
  children,
}: VocabReviewExerciseFrameProps) {
  const typeMeta = EXERCISE_TYPE_LABELS[exerciseType];

  return (
    <div className="flex flex-col gap-5">
      {/* Scene header */}
      <div
        className="rounded-2xl overflow-hidden border-2"
        style={{ borderColor: theme.accent, backgroundColor: 'var(--color-surface)' }}
      >
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ backgroundColor: theme.accentLight }}
        >
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
            <Sparkles size={11} style={{ color: theme.accent }} />
            Palavra em foco
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: theme.accent, color: '#fff' }}
          >
            {typeMeta.label}
          </span>
        </div>

        <div className="flex items-center gap-3 p-4">
          {wordImage ? (
            <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-border">
              <Image src={wordImage} alt={word} fill className="object-cover" sizes="56px" />
            </div>
          ) : (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border"
              style={{ backgroundColor: theme.accentBg, color: theme.accent }}
            >
              <Book size={22} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-display text-xl font-bold truncate" style={{ color: theme.accent }}>
              {word}
            </p>
            {translation && (
              <p className="text-sm text-text-secondary truncate mt-0.5">{translation}</p>
            )}
          </div>
          <AudioPlayerButton text={word} language={language} size="sm" />
        </div>
      </div>

      {/* Exercise prompt */}
      <div
        className="rounded-xl px-4 py-3 border border-border"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <p className="text-sm font-semibold text-text-primary">{typeMeta.hint}</p>
      </div>

      <ExerciseTypeShell type={exerciseType} hideInstruction>
        {children}
      </ExerciseTypeShell>
    </div>
  );
}
