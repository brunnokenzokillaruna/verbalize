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
  // Prefer explicit range from catalog copy (IDs can be non-sequential, e.g. fr-a1-903).
  const fromCopy = `${lesson.uiTitle ?? ''} ${lesson.grammarFocus ?? ''}`.match(
    /lições?\s+(\d+)\s*[–-]\s*(\d+)/i,
  );
  if (fromCopy) {
    return `lições ${fromCopy[1]}–${fromCopy[2]}`;
  }

  // Fallback: position in the live catalog, not the numeric id suffix.
  const lessons = getLessonsForLanguage(lesson.language);
  const idx = lessons.findIndex((l) => l.id === lesson.id);
  if (idx >= 0) {
    const end = idx + 1;
    const start = Math.max(1, end - 11);
    return `lições ${start}–${end}`;
  }

  const match = lesson.id.match(/-(\d{3})$/);
  const end = match ? Number.parseInt(match[1]!, 10) : 0;
  const start = Math.max(1, end - 9);
  return `lições ${start}–${end}`;
}
