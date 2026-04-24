'use client';

import { CheckCircle2, MapPin, Mic, Target, Sparkles } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
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

  return (
    <div
      className="relative min-h-dvh overflow-hidden px-5 py-10"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 h-96 w-96 rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.5) 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative mx-auto flex max-w-md flex-col gap-6">

        {/* Accomplished stamp */}
        <div className="flex flex-col items-center gap-3 pt-4 animate-scale-in">
          <div
            className="relative flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, var(--color-success), #059669)',
              boxShadow: '0 12px 40px rgba(16,185,129,0.4)',
            }}
          >
            <Target size={38} color="white" strokeWidth={2.5} />
            <span className="absolute -top-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md">
              <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
            </span>
          </div>
          <div className="text-center">
            <p
              className="text-[11px] font-black uppercase tracking-[0.3em]"
              style={{ color: 'var(--color-success)' }}
            >
              Missão Cumprida
            </p>
            <h1
              className="mt-1 font-display text-3xl font-black"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Você sobreviveu! 🎯
            </h1>
            {isPerfect && (
              <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-vocab)' }}>
                <Sparkles size={12} className="inline -mt-0.5 mr-1" />
                Execução perfeita
              </p>
            )}
          </div>
        </div>

        {/* Scenario recap */}
        <div
          className="rounded-2xl p-4 flex gap-3 animate-slide-up delay-75"
          style={{
            backgroundColor: 'var(--color-success-bg)',
            border: '2px solid var(--color-success)',
          }}
        >
          <MapPin size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
          <div>
            <p
              className="text-[10px] font-black uppercase tracking-wider mb-1"
              style={{ color: 'var(--color-success)' }}
            >
              📍 Cenário concluído
            </p>
            <p
              className="text-sm font-medium leading-relaxed"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {briefing.scenario}
            </p>
          </div>
        </div>

        {/* Objectives — all checked */}
        <div
          className="rounded-2xl p-4 animate-slide-up delay-150"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-border)',
          }}
        >
          <p
            className="text-xs font-black uppercase tracking-wider mb-3"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Objetivos alcançados
          </p>
          <div className="flex flex-col gap-2.5">
            {briefing.objectives.map((obj, i) => (
              <div
                key={i}
                className="flex items-start gap-3 animate-scale-in"
                style={{ animationDelay: `${200 + i * 100}ms`, animationFillMode: 'both' }}
              >
                <div
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: 'var(--color-success)',
                    color: 'white',
                  }}
                >
                  <CheckCircle2 size={14} strokeWidth={3} />
                </div>
                <p
                  className="text-sm leading-snug line-through decoration-2"
                  style={{
                    color: 'var(--color-text-secondary)',
                    textDecorationColor: 'var(--color-success)',
                  }}
                >
                  {obj}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Key phrases mastered */}
        <div className="flex flex-col gap-3 animate-slide-up delay-225">
          <p
            className="text-xs font-black uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Frases que você dominou
          </p>
          {briefing.keyPhrases.map((phrase, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl p-4 animate-scale-in"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-success)',
                animationDelay: `${350 + i * 80}ms`,
                animationFillMode: 'both',
              }}
            >
              <CheckCircle2
                size={16}
                className="shrink-0"
                style={{ color: 'var(--color-success)' }}
              />
              <p
                className="flex-1 text-sm font-semibold italic"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {phrase}
              </p>
              <AudioPlayerButton text={phrase} language={language} size="sm" />
            </div>
          ))}
        </div>

        {/* Voice performance pill — only shown if user actually used the role-play */}
        {totalSpeakable > 0 && (
          <div
            className="flex items-center justify-between rounded-2xl px-5 py-3 animate-slide-up delay-300"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: 'rgba(16,185,129,0.12)',
                  color: 'var(--color-success)',
                }}
              >
                <Mic size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Falas em voz alta
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {linesSpoken === totalSpeakable
                    ? 'Você disse todas as suas falas 🎙️'
                    : `Você disse ${linesSpoken} de ${totalSpeakable} falas`}
                </p>
              </div>
            </div>
            <span
              className="font-display text-xl font-black"
              style={{
                color:
                  linesSpoken === totalSpeakable
                    ? 'var(--color-success)'
                    : 'var(--color-text-secondary)',
              }}
            >
              {linesSpoken}/{totalSpeakable}
            </span>
          </div>
        )}

        {/* Score pill */}
        <div
          className="flex items-center justify-between rounded-2xl px-5 py-3 animate-slide-up delay-300"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
          }}
        >
          <div>
            <p
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Desempenho
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {Math.min(correctExercises, totalExercises)} de {totalExercises} corretos
            </p>
          </div>
          <span
            className="font-display text-3xl font-black"
            style={{ color: isPerfect ? 'var(--color-vocab)' : 'var(--color-success)' }}
          >
            {pct}%
          </span>
        </div>

        {/* Vocabulary earned */}
        {newVocabulary.length > 0 && (
          <div
            className="rounded-2xl p-4 animate-slide-up delay-300"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
            }}
          >
            <p
              className="mb-3 text-[10px] font-black uppercase tracking-widest"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Arsenal adquirido
            </p>
            <div className="flex flex-wrap gap-2">
              {newVocabulary.map((w, i) => (
                <span
                  key={w}
                  className="rounded-xl px-3 py-1.5 text-sm font-semibold animate-scale-in"
                  style={{
                    animationDelay: `${450 + i * 80}ms`,
                    animationFillMode: 'both',
                    backgroundColor: 'var(--color-vocab-bg)',
                    color: 'var(--color-vocab)',
                    border: '1px solid rgba(217,119,6,0.2)',
                  }}
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="animate-slide-up delay-300 pt-2">
          <button
            type="button"
            onClick={onExit}
            className="cta-shimmer relative w-full overflow-hidden rounded-2xl py-4 text-base font-bold text-white transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, var(--color-success) 0%, #059669 100%)',
              boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
            }}
          >
            Próxima missão →
          </button>
        </div>
      </div>
    </div>
  );
}
