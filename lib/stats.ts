import type { UserDocument } from '@/types';

/**
 * Calculates the 'effective' streak based on the last lesson date.
 * If the user missed yesterday, the streak is effectively 0 even if the
 * database still stores a higher number.
 */
export function getEffectiveStreak(profile: UserDocument | null): number {
  if (!profile || !profile.lastLessonDate) return 0;

  const lastDate = profile.lastLessonDate.toDate ? profile.lastLessonDate.toDate() : new Date(profile.lastLessonDate as unknown as string);
  const now = new Date();
  
  // Normalise to midnight local time for day comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDayStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

  const diffDays = Math.round((todayStart.getTime() - lastDayStart.getTime()) / 86400000);

  // diffDays === 0: did a lesson today
  // diffDays === 1: did a lesson yesterday (streak still active)
  // diffDays > 1: missed at least one full day (streak broken)
  if (diffDays > 1) return 0;
  
  return profile.currentStreak ?? 0;
}
