'use server';

import { generateHook } from './generateHook';
import { generateGrammarBridge } from './generateGrammarBridge';
import { generateMissionBriefing } from './generateMissionBriefing';
import { generatePracticeExercises } from './generatePracticeExercises';
import {
  savePregeneratedLesson,
  startPregeneratingLesson,
  abortPregeneratedLesson,
} from '@/services/firestore';
import { getPreviousTopics } from '@/lib/curriculum';
import type { LessonDefinition, LessonTag, GrammarBridgeResult, MissionBriefingResult } from '@/types';

const TAGS_WITH_GRAMMAR_PHASE: ReadonlySet<LessonTag> = new Set(['GRAM', 'VERB', 'CULT', 'VOC', 'DIAL', 'EXPR']);

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
  knownVocabulary: string[]
): Promise<boolean> {
  try {
    await startPregeneratingLesson(uid, lesson.id);

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
    if (!hook) {
      await abortPregeneratedLesson(uid, lesson.id).catch(() => {});
      console.error('[pregenerateNextLesson] Hook generation failed — cache cleared.');
      return false;
    }

    const needsGrammarBridge = TAGS_WITH_GRAMMAR_PHASE.has(lesson.tag);

    let grammarBridge: GrammarBridgeResult | null = null;
    if (needsGrammarBridge) {
      grammarBridge = await generateGrammarBridge({
        dialogue: hook.dialogue,
        grammarFocus: lesson.tag === 'VOC' ? lesson.grammarFocus : hook.grammarFocus,
        language: lesson.language,
        tag: lesson.tag,
      }).catch((err) => {
        console.error('[pregenerateNextLesson] grammar bridge error:', err);
        return null;
      });
      // Brief cooling period between Gemini calls
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    let missionBriefing: MissionBriefingResult | null = null;
    if (lesson.tag === 'MISS') {
      missionBriefing = await generateMissionBriefing({
        grammarFocus: lesson.grammarFocus,
        theme: lesson.theme,
        uiTitle: lesson.uiTitle,
        language: lesson.language,
        dialogue: hook.dialogue,
      }).catch((err) => {
        console.error('[pregenerateNextLesson] mission briefing error:', err);
        return null;
      });
      // Brief cooling period between Gemini calls
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const exercises = await generatePracticeExercises({
      dialogue: hook.dialogue,
      newVocabulary: hook.newVocabulary,
      verbWord: hook.verbWord ?? '',
      grammarFocus: lesson.grammarFocus,
      theme: lesson.theme,
      uiTitle: lesson.uiTitle,
      tag: lesson.tag,
      language: lesson.language,
      level: lesson.level,
      knownVocabulary,
      previousTopics: getPreviousTopics(lesson.language, lesson.id),
      grammarBridge,
    }).catch((err) => {
      console.error('[pregenerateNextLesson] exercises error:', err);
      return null;
    });

    await savePregeneratedLesson(uid, lesson.id, {
      hook,
      ...(grammarBridge ? { grammarBridge } : {}),
      ...(missionBriefing ? { missionBriefing } : {}),
      ...(exercises && exercises.length > 0 ? { exercises } : {}),
    });
    return true;
  } catch (err) {
    // Non-critical — lesson will just generate normally on next open
    console.error('[pregenerateNextLesson] Error:', err);
    await abortPregeneratedLesson(uid, lesson.id).catch(() => {});
    return false;
  }
}
