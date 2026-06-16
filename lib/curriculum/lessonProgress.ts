import type { SupportedLanguage } from '@/types';
import { ENGLISH_LESSONS, FRENCH_LESSONS, getLessonsForLanguage } from '@/lib/curriculum';
import {
  CURRICULUM_VERSION,
  migrateFrontierLessonId,
} from '@/lib/curriculum/lessonIdMigration';

export const INITIAL_LESSON_PROGRESS: Record<SupportedLanguage, string> = {
  fr: FRENCH_LESSONS[0]!.id,
  en: ENGLISH_LESSONS[0]!.id,
};

export interface LessonProgressSanitizeChange {
  language: SupportedLanguage;
  from: string;
  to: string;
  reason: 'legacy_id_migrated' | 'invalid_id_reset' | 'missing_language_initialized';
}

/** Returns true when the id exists in the current catalog for that language. */
export function isValidLessonId(language: SupportedLanguage, lessonId: string): boolean {
  return getLessonsForLanguage(language).some((lesson) => lesson.id === lessonId);
}

/**
 * Resolves a stored frontier id to a valid current-catalog id.
 * Falls back to the first lesson when the id is unknown or corrupt.
 */
export function resolveFrontierLessonId(
  language: SupportedLanguage,
  lessonId?: string,
): string {
  const lessons = getLessonsForLanguage(language);
  const fallback = lessons[0]?.id;
  if (!fallback) {
    throw new Error(`No lessons defined for language: ${language}`);
  }

  if (!lessonId) return fallback;
  if (isValidLessonId(language, lessonId)) return lessonId;

  for (let fromVersion = CURRICULUM_VERSION - 1; fromVersion >= 1; fromVersion -= 1) {
    const migrated = migrateFrontierLessonId(language, lessonId, fromVersion);
    if (migrated && isValidLessonId(language, migrated)) return migrated;
  }

  return fallback;
}

/**
 * Normalizes lessonProgress so every stored id is valid in the current catalog.
 * Also ensures both supported languages have an explicit starting point.
 */
export function sanitizeLessonProgress(
  lessonProgress?: Partial<Record<SupportedLanguage, string>>,
): {
  lessonProgress: Record<SupportedLanguage, string>;
  changes: LessonProgressSanitizeChange[];
} {
  const next: Record<SupportedLanguage, string> = {
    fr: lessonProgress?.fr ?? INITIAL_LESSON_PROGRESS.fr,
    en: lessonProgress?.en ?? INITIAL_LESSON_PROGRESS.en,
  };
  const changes: LessonProgressSanitizeChange[] = [];

  for (const language of ['fr', 'en'] as SupportedLanguage[]) {
    const previous = lessonProgress?.[language];

    if (!previous) {
      if (next[language] !== INITIAL_LESSON_PROGRESS[language]) {
        changes.push({
          language,
          from: '(none)',
          to: next[language],
          reason: 'missing_language_initialized',
        });
      }
      continue;
    }

    const resolved = resolveFrontierLessonId(language, previous);
    if (resolved !== previous) {
      let migratedFromVersion: string | null = null;
      for (let fromVersion = CURRICULUM_VERSION - 1; fromVersion >= 1; fromVersion -= 1) {
        const candidate = migrateFrontierLessonId(language, previous, fromVersion);
        if (candidate === resolved) {
          migratedFromVersion = candidate;
          break;
        }
      }
      changes.push({
        language,
        from: previous,
        to: resolved,
        reason: migratedFromVersion === resolved ? 'legacy_id_migrated' : 'invalid_id_reset',
      });
    }
    next[language] = resolved;
  }

  return { lessonProgress: next, changes };
}
