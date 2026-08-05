import type { ProficiencyLevel } from '@/types';

const LEVELS = new Set<string>(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

/**
 * Lesson ids embed their CEFR level (e.g. `fr-a2-114`), so callers can read the
 * learner's level without importing the whole lesson catalog into the bundle.
 */
export function levelFromLessonId(lessonId?: string): ProficiencyLevel | null {
  const match = /^[a-z]{2}-([abc][12])-/i.exec(lessonId ?? '');
  const level = match?.[1]?.toUpperCase();
  return level && LEVELS.has(level) ? (level as ProficiencyLevel) : null;
}
