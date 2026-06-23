import type { SupportedLanguage, LessonDefinition } from '@/types';
import { getLessonsForLanguage } from '@/lib/curriculum';

export interface CheckpointWindowItem {
  id: string;
  grammarFocus: string;
  tag: string;
  theme: string;
  uiTitle?: string;
}

export function getCheckpointWindow(
  language: SupportedLanguage,
  currentLessonId: string,
  windowSize = 10,
): CheckpointWindowItem[] {
  const lessons = getLessonsForLanguage(language);
  const idx = lessons.findIndex((l) => l.id === currentLessonId);
  if (idx <= 0) return [];

  const start = Math.max(0, idx - windowSize);
  return lessons.slice(start, idx).map((l) => ({
    id: l.id,
    grammarFocus: l.grammarFocus,
    tag: l.tag,
    theme: l.theme,
    uiTitle: l.uiTitle,
  }));
}

export function formatCheckpointRange(lesson: LessonDefinition): string {
  const match = lesson.id.match(/-(\d{3})$/);
  const end = match ? Number.parseInt(match[1]!, 10) : 0;
  const start = Math.max(1, end - 9);
  return `lições ${start}–${end}`;
}
