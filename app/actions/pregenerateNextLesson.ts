'use server';

import { generateHook } from './generateHook';
import { generateGrammarBridge } from './generateGrammarBridge';
import { generateMissionBriefing } from './generateMissionBriefing';
import { generatePracticeExercises } from './generatePracticeExercises';
import { generateCheckpointSession } from './generateCheckpointSession';
import {
  savePregeneratedLesson,
  tryStartPregeneratingLesson,
  abortPregeneratedLesson,
} from '@/services/firestore';
import { getPreviousTopics } from '@/lib/curriculum';
import { isAggressivePregenEnabled } from '@/lib/geminiDevGuard';
import type { LessonDefinition, LessonTag, GrammarBridgeResult, MissionBriefingResult } from '@/types';

const TAGS_WITH_GRAMMAR_PHASE: ReadonlySet<LessonTag> = new Set(['GRAM', 'VERB', 'CULT', 'VOC', 'DIAL', 'EXPR']);

/** In-process dedup: concurrent calls for the same uid+lesson share one promise. */
const pregenInFlight = new Map<string, Promise<boolean>>();

async function runPregenerateNextLesson(
  uid: string,
  lesson: LessonDefinition,
  interests: string[],
  knownVocabulary: string[],
  masteredVocabulary: string[] = [],
): Promise<boolean> {
  if (!isAggressivePregenEnabled()) {
    console.info(`[pregenerateNextLesson] Skipped ${lesson.id} — pregen disabled (dev/preview).`);
    return true;
  }

  const acquired = await tryStartPregeneratingLesson(uid, lesson.id);
  if (!acquired) {
    console.info(`[pregenerateNextLesson] Skipped ${lesson.id} — already generating or cached.`);
    return true;
  }

  // REVIEW: dense checkpoint only — no hook / grammar bridge / practice pool.
  if (lesson.tag === 'REVIEW') {
    const checkpointSession = await generateCheckpointSession({
      language: lesson.language,
      level: lesson.level,
      lessonId: lesson.id,
      grammarFocus: lesson.grammarFocus,
      theme: lesson.theme,
      uiTitle: lesson.uiTitle,
      knownVocabulary,
    }).catch((err) => {
      console.error('[pregenerateNextLesson] checkpoint session error:', err);
      return null;
    });

    if (!checkpointSession) {
      await abortPregeneratedLesson(uid, lesson.id).catch(() => {});
      console.error('[pregenerateNextLesson] Checkpoint generation failed — cache cleared.');
      return false;
    }

    await savePregeneratedLesson(uid, lesson.id, { checkpointSession });
    return true;
  }

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
    masteredVocabulary,
    previousTopics: getPreviousTopics(lesson.language, lesson.id),
    grammarBridge,
    maxAttempts: 1,
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
}

/**
 * Generates the full content for `lesson` in the background and caches it in
 * Firestore. REVIEW lessons cache a dense checkpoint session; other tags cache
 * hook + optional grammar/mission/exercises.
 */
export async function pregenerateNextLesson(
  uid: string,
  lesson: LessonDefinition,
  interests: string[],
  knownVocabulary: string[],
  masteredVocabulary: string[] = [],
): Promise<boolean> {
  const key = `${uid}_${lesson.id}`;
  const existing = pregenInFlight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      return await runPregenerateNextLesson(uid, lesson, interests, knownVocabulary, masteredVocabulary);
    } catch (err) {
      console.error('[pregenerateNextLesson] Error:', err);
      await abortPregeneratedLesson(uid, lesson.id).catch(() => {});
      return false;
    } finally {
      pregenInFlight.delete(key);
    }
  })();

  pregenInFlight.set(key, promise);
  return promise;
}
