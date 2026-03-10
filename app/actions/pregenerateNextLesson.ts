'use server';

import { generateHook } from './generateHook';
import { savePregeneratedLesson } from '@/services/firestore';
import type { LessonDefinition } from '@/types';

/**
 * Generates the hook for `lesson` in the background and caches it in Firestore
 * so the next lesson can start instantly (zero perceived wait time).
 * Called fire-and-forget from finishLesson() in the lesson page.
 */
export async function pregenerateNextLesson(
  uid: string,
  lesson: LessonDefinition,
  interests: string[],
): Promise<void> {
  try {
    const hook = await generateHook({
      language: lesson.language,
      level: lesson.level,
      interests,
      grammarFocus: lesson.grammarFocus,
    });
    if (hook) {
      await savePregeneratedLesson(uid, lesson.id, hook);
    }
  } catch (err) {
    // Non-critical — lesson will just generate normally on next open
    console.error('[pregenerateNextLesson] Error:', err);
  }
}
