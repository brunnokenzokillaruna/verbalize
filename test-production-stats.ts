/**
 * Smoke tests for production stats breakdown and pregen schema versioning.
 * Run: npx tsx test-production-stats.ts
 */
import { isPregenSchemaCurrent, PREGEN_SCHEMA_VERSION } from './lib/practiceExercises/constants';
import { getWeekStartISO, getWeeklyProductionBreakdown, computeSpontaneousSessionRate, getOralExerciseCompletionStats } from './lib/productionStatsHelpers';
import type { UserDocument } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(isPregenSchemaCurrent(PREGEN_SCHEMA_VERSION), 'current schema version is valid');
assert(!isPregenSchemaCurrent(undefined), 'missing schema version is stale');
assert(!isPregenSchemaCurrent(PREGEN_SCHEMA_VERSION - 1), 'older schema version is stale');

const profile = {
  productionStats: {
    oralAttempts: 10,
    oralAccepted: 8,
    oralSpontaneousAttempts: 4,
    oralSpontaneousAccepted: 3,
    freeWriteAttempts: 2,
    freeWriteAccepted: 2,
    weeklyAccepted: 5,
    weeklyOralAccepted: 4,
    weeklyOralSpontaneousAccepted: 2,
    weeklyWriteAccepted: 1,
    weeklyWeekStart: getWeekStartISO(),
  },
} satisfies Pick<UserDocument, 'productionStats'>;

const breakdown = getWeeklyProductionBreakdown(profile as UserDocument);
assert(breakdown.total === 5, 'weekly total');
assert(breakdown.oral === 4, 'weekly oral total');
assert(breakdown.oralSpontaneous === 2, 'weekly spontaneous');
assert(breakdown.oralEcho === 2, 'weekly echo derived');
assert(breakdown.written === 1, 'weekly written');

const staleWeek = {
  productionStats: {
    ...profile.productionStats!,
    weeklyWeekStart: '2000-01-01',
  },
} satisfies Pick<UserDocument, 'productionStats'>;
const empty = getWeeklyProductionBreakdown(staleWeek as UserDocument);
assert(empty.total === 0 && empty.oralEcho === 0, 'stale week resets breakdown');

const sessionRate = computeSpontaneousSessionRate(
  [
    { lessonId: 'd1', lessonTag: 'DIAL', hadSpontaneousProductionAccepted: true },
    { lessonId: 'd2', lessonTag: 'DIAL', hadSpontaneousProductionAccepted: false },
    { lessonId: 'm1', lessonTag: 'MISS', hadSpontaneousProductionAccepted: true },
    { lessonId: 'g1', lessonTag: 'GRAM', hadSpontaneousProductionAccepted: true },
  ],
  () => undefined,
);
assert(sessionRate.dialogueMissionSessions === 3, 'only DIAL/MISS count');
assert(sessionRate.withSpontaneousAccepted === 2, 'spontaneous accepted count');
assert(sessionRate.ratePercent === 67, 'session rate percent');

const oralStats = getOralExerciseCompletionStats({
  productionStats: {
    oralExerciseCompleted: 7,
    oralExerciseSkipped: 3,
  },
} as UserDocument);
assert(oralStats.total === 10, 'oral exercise total');
assert(oralStats.ratePercent === 70, 'oral completion rate');

console.log('✅ test-production-stats.ts passed');
