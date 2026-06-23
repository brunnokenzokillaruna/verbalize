'use client';

import type { ReactNode } from 'react';
import type { ExerciseType, SupportedLanguage, ProficiencyLevel } from '@/types';
import type { ImmersionMode } from '@/lib/immersion';
import {
  getExerciseTypeMetaWithContext,
  SHELL_VARIANT_STYLES,
} from '@/lib/exerciseTypeMeta';
import { HelpCircle } from 'lucide-react';
import { shouldUseTargetLanguageInstructions } from '@/lib/immersion';
import { EXERCISE_TYPE_META } from '@/lib/exerciseTypeMeta';

interface ExerciseTypeShellProps {
  type: ExerciseType;
  children: ReactNode;
  /** Hide instruction when the child component shows its own */
  hideInstruction?: boolean;
  /** Hide type header when parent already shows session header */
  hideHeader?: boolean;
  language?: SupportedLanguage;
  level?: ProficiencyLevel;
  immersionMode?: ImmersionMode;
}

export function ExerciseTypeShell({
  type,
  children,
  hideInstruction = false,
  hideHeader = false,
  language,
  level,
  immersionMode = 'auto',
}: ExerciseTypeShellProps) {
  const meta = getExerciseTypeMetaWithContext(type, { language, level, immersionMode });
  const ptInstruction = EXERCISE_TYPE_META[type].instruction;
  const showImmersionTooltip =
    language &&
    level &&
    shouldUseTargetLanguageInstructions(language, level, immersionMode) &&
    meta.instruction !== ptInstruction;
  const shell = SHELL_VARIANT_STYLES[meta.variant];
  const Icon = meta.icon;

  return (
    <div
      className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-3 duration-500"
      data-exercise-type={type}
    >
      {!hideHeader && (
        <div className="flex items-start gap-3.5">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm"
            style={{
              backgroundColor: meta.accentBg,
              border: `1.5px solid ${meta.accentBorder}`,
              color: meta.accent,
            }}
          >
            <Icon size={22} strokeWidth={2.25} aria-hidden />
          </div>
          <div className="flex flex-col gap-0.5 pt-0.5 min-w-0">
            <span
              className="text-[10px] font-black uppercase tracking-[0.18em]"
              style={{ color: meta.accent }}
            >
              {meta.title}
            </span>
            {!hideInstruction && (
              <p
                className="text-sm font-medium leading-snug flex items-start gap-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <span>{meta.instruction}</span>
                {showImmersionTooltip && (
                  <span className="relative group shrink-0 mt-0.5">
                    <HelpCircle size={14} className="text-text-muted" aria-hidden />
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-10 w-48 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px] font-medium text-text-secondary opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shadow-sm"
                    >
                      {ptInstruction}
                    </span>
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {hideHeader && !hideInstruction && (
        <p
          className="text-sm font-medium leading-snug -mt-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {meta.instruction}
        </p>
      )}

      {/* Variant body */}
      <div
        className={`relative overflow-hidden p-1 sm:p-1.5 ${shell.bodyClass}`}
        style={{
          borderColor: meta.accentBorder,
          backgroundColor: 'var(--color-surface)',
          backgroundImage: shell.pattern,
        }}
      >
        {/* Accent stripe for trap variant */}
        {meta.variant === 'trap' && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
            style={{ backgroundColor: meta.accent }}
            aria-hidden
          />
        )}

        {/* Speed variant pulse dot */}
        {meta.variant === 'speed' && (
          <div
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
            style={{
              backgroundColor: meta.accentBg,
              color: meta.accent,
              border: `1px solid ${meta.accentBorder}`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: meta.accent }}
            />
            Rápido
          </div>
        )}

        <div className="relative px-3 py-4 sm:px-4 sm:py-5">{children}</div>
      </div>
    </div>
  );
}

interface ExerciseSessionHeaderProps {
  type: ExerciseType;
  exerciseIndex: number;
  total: number;
  language?: SupportedLanguage;
  level?: ProficiencyLevel;
  immersionMode?: ImmersionMode;
}

export function ExerciseSessionHeader({
  type,
  exerciseIndex,
  total,
  language,
  level,
  immersionMode = 'auto',
}: ExerciseSessionHeaderProps) {
  const meta = getExerciseTypeMetaWithContext(type, { language, level, immersionMode });
  const Icon = meta.icon;
  const progress = Math.round(((exerciseIndex + 1) / total) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: meta.accentBg,
              color: meta.accent,
              border: `1px solid ${meta.accentBorder}`,
            }}
          >
            <Icon size={18} strokeWidth={2.25} aria-hidden />
          </div>
          <div className="flex flex-col min-w-0">
            <h2
              className="font-display text-lg font-bold tracking-tight truncate"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {meta.title}
            </h2>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {exerciseIndex + 1} de {total}
            </p>
          </div>
        </div>
        <span
          className="text-[11px] font-black tracking-widest tabular-nums shrink-0"
          style={{ color: meta.accent, opacity: 0.7 }}
        >
          {progress}%
        </span>
      </div>

      <div
        className="relative h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--color-surface-raised)' }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: meta.accent,
          }}
        />
      </div>
    </div>
  );
}
