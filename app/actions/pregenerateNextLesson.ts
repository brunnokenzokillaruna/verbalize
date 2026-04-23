'use server';

import { generateHook } from './generateHook';
import { generateGrammarBridge } from './generateGrammarBridge';
import { generatePracticeExercises } from './generatePracticeExercises';
import { savePregeneratedLesson, getUserVocabulary } from '@/services/firestore';
import { getPreviousTopics } from '@/lib/curriculum';
import type { LessonDefinition, LessonTag, GrammarBridgeResult, Exercise } from '@/types';

const TAGS_WITH_GRAMMAR_PHASE: ReadonlySet<LessonTag> = new Set(['GRAM', 'VERB', 'CULT']);

/**
 * Generates the full content for `lesson` in the background (hook + grammar
 * bridge + exercises) and caches everything in Firestore so the next lesson
 * can start and transition instantly. Called fire-and-forget when the user
 * enters the 'practice' phase of the current lesson — that gives ~60-180s
 * of runway, enough for all three Gemini calls to finish before the user
 * clicks "next lesson".
 */
export async function pregenerateNextLesson(
  uid: string,
  lesson: LessonDefinition,
  interests: string[],
): Promise<void> {
  try {
    const vocabDocs = await getUserVocabulary(uid, lesson.language);
    const knownVocabulary = vocabDocs.map((doc) => doc.word);

    const hook = await generateHook({
      language: lesson.language,
      level: lesson.level,
      tag: lesson.tag,
      interests,
      theme: lesson.theme,
      uiTitle: lesson.uiTitle,
      grammarFocus: lesson.grammarFocus,
      knownVocabulary,
    });
    if (!hook) return;

    const needsGrammarBridge = TAGS_WITH_GRAMMAR_PHASE.has(lesson.tag);

    const bridgePromise: Promise<GrammarBridgeResult | null> = needsGrammarBridge
      ? generateGrammarBridge({
          dialogue: hook.dialogue,
          grammarFocus: hook.grammarFocus,
          language: lesson.language,
          tag: lesson.tag,
        }).catch((err) => {
          console.error('[pregenerateNextLesson] grammar bridge error:', err);
          return null;
        })
      : Promise.resolve(null);

    const exercisesPromise: Promise<Exercise[] | null> = generatePracticeExercises({
      dialogue: hook.dialogue,
      newVocabulary: hook.newVocabulary,
      verbWord: hook.verbWord ?? '',
      grammarFocus: lesson.grammarFocus,
      tag: lesson.tag,
      language: lesson.language,
      level: lesson.level,
      knownVocabulary,
      previousTopics: getPreviousTopics(lesson.language, lesson.id),
    }).catch((err) => {
      console.error('[pregenerateNextLesson] exercises error:', err);
      return null;
    });

    const [grammarBridge, exercises] = await Promise.all([bridgePromise, exercisesPromise]);

    await savePregeneratedLesson(uid, lesson.id, {
      hook,
      ...(grammarBridge ? { grammarBridge } : {}),
      ...(exercises && exercises.length > 0 ? { exercises } : {}),
    });
  } catch (err) {
    // Non-critical — lesson will just generate normally on next open
    console.error('[pregenerateNextLesson] Error:', err);
  }
}
