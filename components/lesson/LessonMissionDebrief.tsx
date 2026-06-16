'use client';

import { CheckCircle2, MapPin, Mic, Target, Sparkles } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { MissionStepGuide } from '@/components/lesson/mission-roleplay/MissionStepGuide';
import type { MissionBriefingResult, SupportedLanguage } from '@/types';

interface LessonMissionDebriefProps {
  briefing: MissionBriefingResult;
  language: SupportedLanguage;
  totalExercises: number;
  correctExercises: number;
  newVocabulary: string[];
  linesSpoken?: number;
  totalSpeakable?: number;
  onExit: () => void;
}

export function LessonMissionDebrief({
  briefing,
  language,
  totalExercises,
  correctExercises,
  newVocabulary,
  linesSpoken = 0,
  totalSpeakable = 0,
  onExit,
}: LessonMissionDebriefProps) {
  const pct = totalExercises > 0
    ? Math.min(Math.round((correctExercises / totalExercises) * 100), 100)
    : 100;
  const isPerfect = pct === 100;
  const allSpoken = totalSpeakable > 0 && linesSpoken >= totalSpeakable;

  return (
    <div
      className="relative min-h-dvh overflow-hidden px-4 sm:px-5 py-8 sm:py-10"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 h-96 w-96 rounded-full blur-3xl opacity-25 bg-success/40" />
      </div>

      <div className="relative mx-auto flex max-w-lg flex-col gap-5 sm:gap-6">
        <div className="flex flex-col items-center gap-3 pt-2 animate-scale-in">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-success to-emerald-600 shadow-lg shadow-success/30">
            <Target size={36} color="white" strokeWidth={2.5} />
            <span className="absolute -top-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md">
              <CheckCircle2 size={18} className="text-success" />
            </span>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-success">
              Missão cumprida
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-black text-text-primary">
              Você sobreviveu!
            </h1>
            {isPerfect && (
              <p className="mt-1.5 text-sm font-semibold text-vocab flex items-center justify-center gap-1">
                <Sparkles size={14} />
                Execução perfeita na prática
              </p>
            )}
          </div>
        </div>

        <MissionStepGuide activeStep="practice" />

        <div className="rounded-2xl p-4 border-2 border-success bg-success/10 flex gap-3">
          <MapPin size={20} className="shrink-0 mt-0.5 text-success" />
          <p className="grammar-secondary text-text-primary leading-relaxed line-clamp-4">
            {briefing.scenario}
          </p>
        </div>

        <div className="rounded-2xl p-4 border border-border bg-surface">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted mb-3">
            Objetivos alcançados
          </p>
          <div className="flex flex-col gap-2.5">
            {briefing.objectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-white">
                  <CheckCircle2 size={13} strokeWidth={3} />
                </div>
                <p className="grammar-secondary text-text-secondary line-through decoration-success/60 decoration-2">
                  {obj}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {totalSpeakable > 0 && (
            <div className="rounded-2xl px-4 py-3.5 border border-border bg-surface flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                <Mic size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
                  Falas em voz
                </p>
                <p className="text-lg font-black tabular-nums text-text-primary">
                  {linesSpoken}/{totalSpeakable}
                </p>
                {allSpoken && (
                  <p className="text-xs text-success font-semibold mt-0.5">Todas completas</p>
                )}
              </div>
            </div>
          )}

          <div className="rounded-2xl px-4 py-3.5 border border-border bg-surface flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
                Prática escrita
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {Math.min(correctExercises, totalExercises)} de {totalExercises} corretos
              </p>
            </div>
            <span
              className="font-display text-2xl font-black tabular-nums"
              style={{ color: isPerfect ? 'var(--color-vocab)' : 'var(--color-success)' }}
            >
              {pct}%
            </span>
          </div>
        </div>

        {briefing.keyPhrases.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
              Frases que você dominou
            </p>
            {briefing.keyPhrases.map((phrase, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl p-3.5 border border-success/30 bg-surface"
              >
                <CheckCircle2 size={16} className="shrink-0 text-success" />
                <p className="flex-1 grammar-body font-semibold text-text-primary min-w-0">
                  {phrase}
                </p>
                <AudioPlayerButton text={phrase} language={language} size="sm" />
              </div>
            ))}
          </div>
        )}

        {newVocabulary.length > 0 && (
          <div className="rounded-2xl p-4 border border-border bg-surface">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-text-muted">
              Vocabulário adquirido
            </p>
            <div className="flex flex-wrap gap-2">
              {newVocabulary.map((w) => (
                <span
                  key={w}
                  className="rounded-xl px-3 py-1.5 text-sm font-semibold bg-vocab/10 text-vocab border border-vocab/20"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onExit}
          className="cta-shimmer relative w-full overflow-hidden rounded-2xl py-4 text-base font-bold text-white transition-all active:scale-[0.98] min-h-[52px] bg-gradient-to-r from-success to-emerald-600 shadow-lg shadow-success/25"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
