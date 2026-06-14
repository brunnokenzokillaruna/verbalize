import type { LessonTag } from '@/types';
import type { ExerciseTypeId } from './constants';

export function buildTagGuidance(tag: LessonTag, allowed: Set<ExerciseTypeId>): string {
  const pick = (candidates: ExerciseTypeId[]) => candidates.filter((t) => allowed.has(t));
  const list = (items: ExerciseTypeId[]) => items.map((t) => `'${t}'`).join(', ');

  if (tag === 'PRON') {
    const types = pick(['speak-repeat', 'audio-dictation', 'interactive-subtitles', 'listen-and-select']);
    return [
      `- The FIRST exercise (index 0) MUST be of type 'minimal-pair'. This is mandatory for PRON lessons.`,
      types.length ? `- The remaining 4 exercises should focus heavily on ${list(types)} (at least 3 out of 4).` : '',
    ].filter(Boolean).join('\n');
  }
  if (tag === 'GRAM') {
    const types = pick(['error-correction', 'sentence-builder', 'context-choice', 'bridge-choice']);
    return [
      `- The FIRST exercise (index 0) MUST be of type 'grammar-trap'. This is mandatory for GRAM lessons.`,
      types.length ? `- The remaining 4 exercises should focus on ${list(types)} to reinforce the grammar structure.` : '',
    ].filter(Boolean).join('\n');
  }
  if (tag === 'VOC') {
    const types = pick(['context-choice', 'reverse-translation', 'sentence-builder']);
    return [
      types.length ? `- Focus on ${list(types)} used in very simple sentences.` : '',
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative. Sentence 2 must follow from sentence 1, sentence 3 from sentence 2, etc. Imagine a short story unfolding — each exercise is the next scene. This makes the vocabulary stick through narrative context.`,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'DIAL') {
    const types = pick(['social-roleplay', 'scrambled-conversation', 'interactive-subtitles']);
    return [
      types.length
        ? `- Focus on ${list(types)} to simulate real-world usage. Use scenarios a Brazilian would realistically encounter: at a French restaurant, at a hotel in Lyon, on the Paris metro, at a French pharmacy, at an airport, in a Parisian shop.`
        : '',
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative. Sentence 2 must follow from sentence 1, sentence 3 from sentence 2, etc. Imagine a short story unfolding — each exercise is the next scene.`,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'MISS') {
    const types = pick(['social-roleplay', 'scrambled-conversation', 'interactive-subtitles']);
    return [
      types.length
        ? `- Focus on ${list(types)} to simulate real-world usage. Use scenarios a Brazilian would realistically encounter.`
        : '',
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative. Sentence 2 must follow from sentence 1, sentence 3 from sentence 2, etc.`,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'EXPR') {
    const types = pick(['social-roleplay', 'context-choice', 'sentence-builder']);
    return [
      types.length
        ? `- At least 2 out of 5 exercises MUST be 'social-roleplay' where the correct option uses the target expression naturally. The other options should be grammatically correct but less natural/idiomatic.\n- The remaining exercises should focus on ${list(types)}.`
        : '',
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative. Sentence 2 must follow from sentence 1, sentence 3 from sentence 2, etc.`,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'CULT') {
    const types = pick(['social-roleplay', 'context-choice', 'sentence-builder', 'logic-connectors']);
    return [
      `- At least 2 out of 5 exercises MUST be 'social-roleplay' testing cultural nuances (formality, taboos, gestures, social expectations).`,
      types.length ? `- Include at least 1 'context-choice' about cultural vocabulary or register.\n- Remaining exercises from: ${list(types)}.` : '',
      `- MINI-STORY: All 5 exercise sentences MUST form a coherent micro-narrative with cultural context.`,
    ].filter(Boolean).join('\n');
  }
  if (tag === 'VERB') {
    const types = pick(['error-correction', 'sentence-builder', 'context-choice']);
    return [
      `- The FIRST exercise (index 0) MUST be of type 'conjugation-speed'. This is mandatory for VERB lessons.`,
      types.length ? `- The remaining 4 exercises should focus on ${list(types)} to reinforce the verb conjugation patterns.` : '',
    ].filter(Boolean).join('\n');
  }
  return '';
}
