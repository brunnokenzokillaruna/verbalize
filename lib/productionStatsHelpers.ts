import type { UserDocument, LessonTag } from '@/types';

/** ISO date (YYYY-MM-DD) for the Monday of the current week (UTC). */
export function getWeekStartISO(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Minimum accepted production sentences per week to earn the streak badge. */
export const PRODUCTION_WEEKLY_STREAK_THRESHOLD = 3;

/** Target spontaneous oral sentences per week (roadmap success metric). */
export const SPONTANEOUS_ORAL_WEEKLY_GOAL = 3;

export type WeeklyProductionBreakdown = {
  total: number;
  oral: number;
  /** Echo/memorized oral production (repeat, shadowing, etc.). */
  oralEcho: number;
  /** Free-form oral production (listen-and-respond, roleplay, monologue). */
  oralSpontaneous: number;
  written: number;
};

/** Accepted production sentences recorded this calendar week. */
export function getWeeklyProductionAccepted(profile: UserDocument | null | undefined): number {
  return getWeeklyProductionBreakdown(profile).total;
}

/** Oral vs written breakdown for the current week (when tracked). */
export function getWeeklyProductionBreakdown(
  profile: UserDocument | null | undefined,
): WeeklyProductionBreakdown {
  if (!profile?.productionStats) {
    return { total: 0, oral: 0, oralEcho: 0, oralSpontaneous: 0, written: 0 };
  }
  const stats = profile.productionStats;
  const weekStart = getWeekStartISO();
  if (stats.weeklyWeekStart !== weekStart) {
    return { total: 0, oral: 0, oralEcho: 0, oralSpontaneous: 0, written: 0 };
  }
  const oral = stats.weeklyOralAccepted ?? 0;
  const oralSpontaneous = stats.weeklyOralSpontaneousAccepted ?? 0;
  return {
    total: stats.weeklyAccepted ?? 0,
    oral,
    oralEcho: Math.max(0, oral - oralSpontaneous),
    oralSpontaneous,
    written: stats.weeklyWriteAccepted ?? 0,
  };
}

export function hasProductionWeeklyStreak(profile: UserDocument | null | undefined): boolean {
  return getWeeklyProductionAccepted(profile) >= PRODUCTION_WEEKLY_STREAK_THRESHOLD;
}

export type CumulativeProductionBreakdown = {
  oralAccepted: number;
  oralAttempts: number;
  oralSpontaneousAccepted: number;
  oralSpontaneousAttempts: number;
  writtenAccepted: number;
  writtenAttempts: number;
};

/** Target % of DIAL/MISS sessions with accepted spontaneous production (roadmap metric). */
export const SPONTANEOUS_SESSION_RATE_GOAL = 40;

/** Target oral exercise completion rate vs skip/no-mic bypass (roadmap metric). */
export const ORAL_EXERCISE_COMPLETION_GOAL = 70;

export type OralExerciseCompletionStats = {
  completed: number;
  skipped: number;
  total: number;
  ratePercent: number | null;
};

export function getOralExerciseCompletionStats(
  profile: UserDocument | null | undefined,
): OralExerciseCompletionStats {
  const stats = profile?.productionStats;
  const completed = stats?.oralExerciseCompleted ?? 0;
  const skipped = stats?.oralExerciseSkipped ?? 0;
  const total = completed + skipped;
  return {
    completed,
    skipped,
    total,
    ratePercent: total > 0 ? Math.round((completed / total) * 100) : null,
  };
}

export type SpontaneousSessionStats = {
  dialogueMissionSessions: number;
  withSpontaneousAccepted: number;
  ratePercent: number | null;
};

export function computeSpontaneousSessionRate(
  logs: Array<{
    lessonId: string;
    lessonTag?: LessonTag;
    hadSpontaneousProductionAccepted?: boolean;
  }>,
  resolveTag: (lessonId: string) => LessonTag | undefined,
): SpontaneousSessionStats {
  let dialogueMissionSessions = 0;
  let withSpontaneousAccepted = 0;

  for (const log of logs) {
    const tag = log.lessonTag ?? resolveTag(log.lessonId);
    if (tag !== 'DIAL' && tag !== 'MISS') continue;
    dialogueMissionSessions += 1;
    if (log.hadSpontaneousProductionAccepted) withSpontaneousAccepted += 1;
  }

  return {
    dialogueMissionSessions,
    withSpontaneousAccepted,
    ratePercent:
      dialogueMissionSessions > 0
        ? Math.round((withSpontaneousAccepted / dialogueMissionSessions) * 100)
        : null,
  };
}
/** Lifetime oral vs written production counters (when tracked). */
export function getCumulativeProductionBreakdown(
  profile: UserDocument | null | undefined,
): CumulativeProductionBreakdown {
  const stats = profile?.productionStats;
  return {
    oralAccepted: stats?.oralAccepted ?? 0,
    oralAttempts: stats?.oralAttempts ?? 0,
    oralSpontaneousAccepted: stats?.oralSpontaneousAccepted ?? 0,
    oralSpontaneousAttempts: stats?.oralSpontaneousAttempts ?? 0,
    writtenAccepted: stats?.freeWriteAccepted ?? 0,
    writtenAttempts: stats?.freeWriteAttempts ?? 0,
  };
}
