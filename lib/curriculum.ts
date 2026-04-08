import type { LessonDefinition, SupportedLanguage } from '@/types';
import { FRENCH_LESSONS } from './curriculum/french';
import { ENGLISH_LESSONS } from './curriculum/english';

export { FRENCH_LESSONS, ENGLISH_LESSONS };

// ─── Lesson selection ─────────────────────────────────────────────────────────

const LESSON_MAP: Record<SupportedLanguage, LessonDefinition[]> = {
  fr: FRENCH_LESSONS,
  en: ENGLISH_LESSONS,
};

/** All lessons for a given language, in curriculum order. */
export function getLessonsForLanguage(language: SupportedLanguage): LessonDefinition[] {
  return LESSON_MAP[language];
}

/**
 * Returns the lesson the user should study next.
 * `currentLessonId` is the ID stored in `profile.lessonProgress[language]`.
 * Falls back to the first lesson if no progress is recorded.
 */
export function getNextLesson(language: SupportedLanguage, currentLessonId?: string): LessonDefinition {
  const lessons = LESSON_MAP[language];
  if (!currentLessonId) return lessons[0];
  const lesson = lessons.find((l) => l.id === currentLessonId);
  return lesson ?? lessons[0];
}

/**
 * Returns the ID of the lesson that comes after `completedLessonId`.
 * Returns null if the completed lesson is the last one in the curriculum.
 */
export function getNextLessonId(language: SupportedLanguage, completedLessonId: string): string | null {
  const lessons = LESSON_MAP[language];
  const idx = lessons.findIndex((l) => l.id === completedLessonId);
  if (idx === -1 || idx >= lessons.length - 1) return null;
  return lessons[idx + 1].id;
}

export function getLessonById(id: string): LessonDefinition | undefined {
  return [...FRENCH_LESSONS, ...ENGLISH_LESSONS].find((l) => l.id === id);
}

/**
 * Returns the grammarFocus topics of all lessons before `currentLessonId`
 * (i.e. lessons the user has already completed). Capped at the last 10
 * to keep the prompt concise.
 */
export function getPreviousTopics(language: SupportedLanguage, currentLessonId: string): string[] {
  const lessons = LESSON_MAP[language];
  const idx = lessons.findIndex((l) => l.id === currentLessonId);
  if (idx <= 0) return [];
  return lessons.slice(Math.max(0, idx - 10), idx).map((l) => l.grammarFocus);
}
