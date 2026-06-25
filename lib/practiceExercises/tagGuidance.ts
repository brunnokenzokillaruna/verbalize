import type { LessonTag } from '@/types';
import type { ExerciseTypeId } from './constants';
import { resolveRequiredProductionType } from './productionTypes';
import type { ProficiencyLevel } from '@/types';

export function buildTagGuidance(
  tag: LessonTag,
  allowed: Set<ExerciseTypeId>,
  level?: ProficiencyLevel,
  vocabCount?: number,
): string {
  const pick = (candidates: ExerciseTypeId[]) => candidates.filter((t) => allowed.has(t));
  const list = (items: ExerciseTypeId[]) => items.map((t) => `'${t}'`).join(', ');

  const productionLine =
    level !== undefined && vocabCount !== undefined
      ? (() => {
          const req = resolveRequiredProductionType(level, vocabCount, [...allowed]);
          return req
            ? `- PRODUCTION (mandatory): include EXACTLY ONE '${req}' exercise in the session.`
            : '';
        })()
      : '';

  if (tag === 'PRON') {
    const slot0 = level && ['A2', 'B1', 'B2', 'C1', 'C2'].includes(level)
      ? 'minimal-pair-production'
      : 'minimal-pair';
    const types = pick(['speak-repeat', 'shadowing', 'connected-speech', 'audio-dictation', 'interactive-subtitles', 'listen-and-select']);
    return [
      `- The FIRST exercise (index 0) MUST be of type '${slot0}'. This is mandatory for PRON lessons.`,
      types.length ? `- The remaining 4 exercises should focus heavily on ${list(types)} (at least 3 out of 4).` : '',
      productionLine,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'GRAM') {
    const types = pick([
      'error-correction',
      'sentence-builder',
      'context-choice',
      'fill-gap-production',
      'translation-with-constraint',
      'bridge-choice',
    ]);
    return [
      `- The FIRST exercise (index 0) MUST be of type 'grammar-trap'. This is mandatory for GRAM lessons.`,
      `- For pronoun placement, negation order, or adverb position: NEVER use 'error-correction'. Use 'sentence-builder', 'grammar-trap', 'bridge-choice', or 'context-choice' with a blank BEFORE the verb.`,
      types.length ? `- The remaining 4 exercises should focus on ${list(types)} to reinforce the grammar structure.` : '',
      productionLine,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'VOC') {
    const types = pick([
      'context-choice',
      'fill-gap-production',
      'reverse-translation',
      'translation-with-constraint',
      'paraphrase',
      'sentence-builder',
      'word-bank-translation',
    ]);
    return [
      types.length ? `- Focus on ${list(types)} used in very simple sentences.` : '',
      productionLine,
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative. Sentence 2 must follow from sentence 1, sentence 3 from sentence 2, etc. Imagine a short story unfolding — each exercise is the next scene. This makes the vocabulary stick through narrative context.`,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'DIAL') {
    const types = pick([
      'listen-and-respond',
      'free-roleplay',
      'micro-message',
      'social-roleplay',
      'scrambled-conversation',
      'interactive-subtitles',
      'speak-repeat',
      'voicemail-dictation',
      'inference-tone',
      'story-continuation',
      'spot-the-register',
      'prompted-monologue',
    ]);
    const hasListenRespond = allowed.has('listen-and-respond');
    const hasFreeProduction = allowed.has('free-roleplay') || allowed.has('micro-message');
    return [
      hasListenRespond
        ? `- At least 1 exercise MUST be 'listen-and-respond' — the learner hears a dialogue and responds orally with their own words (not repetition).`
        : '',
      hasFreeProduction
        ? `- At least 1 exercise MUST be 'free-roleplay' OR 'micro-message' — the learner writes their own response (not MCQ).`
        : '',
      types.length
        ? `- Focus on ${list(types)} to simulate real-world usage. Use scenarios a Brazilian would realistically encounter: at a French restaurant, at a hotel in Lyon, on the Paris metro, at a French pharmacy, at an airport, in a Parisian shop.`
        : '',
      `- At least 1 exercise MUST be 'speak-repeat' when 'listen-and-respond' is not in the pool — the learner must speak a line aloud from the mini-story.`,
      productionLine,
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative. Sentence 2 must follow from sentence 1, sentence 3 from sentence 2, etc. Imagine a short story unfolding — each exercise is the next scene.`,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'MISS') {
    const types = pick([
      'listen-and-respond',
      'free-roleplay',
      'micro-message',
      'social-roleplay',
      'scrambled-conversation',
      'interactive-subtitles',
      'voicemail-dictation',
      'story-continuation',
      'spot-the-register',
      'prompted-monologue',
    ]);
    const hasListenRespond = allowed.has('listen-and-respond');
    const hasFreeProduction = allowed.has('free-roleplay') || allowed.has('micro-message');
    return [
      hasListenRespond
        ? `- At least 1 exercise MUST be 'listen-and-respond' — spontaneous oral response after hearing a mission dialogue.`
        : '',
      hasFreeProduction
        ? `- At least 1 exercise MUST be 'free-roleplay' OR 'micro-message' for written production in the mission context.`
        : '',
      types.length
        ? `- Focus on ${list(types)} to simulate real-world usage. Use scenarios a Brazilian would realistically encounter.`
        : '',
      productionLine,
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative. Sentence 2 must follow from sentence 1, sentence 3 from sentence 2, etc.`,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'EXPR') {
    const types = pick([
      'free-roleplay',
      'social-roleplay',
      'context-choice',
      'paraphrase',
      'translation-with-constraint',
      'inference-tone',
      'spot-the-register',
      'sentence-builder',
      'speak-repeat',
    ]);
    const hasFreeRoleplay = allowed.has('free-roleplay');
    return [
      hasFreeRoleplay
        ? `- At least 1 exercise MUST be 'free-roleplay' so the learner produces the target expression in their own words.`
        : `- At least 2 out of 5 exercises MUST be 'social-roleplay' where the correct option uses the target expression naturally.`,
      types.length
        ? `- Remaining exercises should focus on ${list(types)}.`
        : '',
      `- At least 1 exercise MUST be 'speak-repeat' using the target expression in a natural sentence.`,
      productionLine,
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative. Sentence 2 must follow from sentence 1, sentence 3 from sentence 2, etc.`,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'CULT') {
    const types = pick(['social-roleplay', 'context-choice', 'sentence-builder', 'logic-connectors', 'speak-repeat', 'inference-tone', 'spot-the-register']);
    return [
      `- At least 2 out of 5 exercises MUST be 'social-roleplay' testing cultural nuances (formality, taboos, gestures, social expectations).`,
      `- At least 1 exercise MUST be 'speak-repeat' with a culturally appropriate phrase.`,
      types.length ? `- Include at least 1 'context-choice' about cultural vocabulary or register.\n- Remaining exercises from: ${list(types)}.` : '',
      productionLine,
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative with cultural context.`,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'VERB') {
    const types = pick(['error-correction', 'sentence-builder', 'context-choice']);
    return [
      `- The FIRST exercise (index 0) MUST be of type 'conjugation-speed'. This is mandatory for VERB lessons.`,
      types.length ? `- The remaining 4 exercises should focus on ${list(types)} to reinforce the verb conjugation patterns.` : '',
      productionLine,
    ].filter(Boolean).join('\n');
  }
  return productionLine;
}
