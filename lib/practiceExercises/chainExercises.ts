import type { Exercise, ExerciseType } from '@/types';

const CHAIN_RECEPTIVE: ExerciseType = 'listening-comprehension';
const CHAIN_PRODUCTION: ExerciseType[] = ['reverse-translation', 'listen-and-respond'];

export function getLinkedExerciseId(ex: Exercise): string | undefined {
  const data = ex.data as { linkedExerciseId?: string };
  const id = data.linkedExerciseId?.trim();
  return id || undefined;
}

/**
 * Places chained pairs adjacent: receptive (listening) immediately before production.
 */
export function applyExerciseChains(exercises: Exercise[]): Exercise[] {
  const byLink = new Map<string, { receptive?: Exercise; production?: Exercise }>();

  for (const ex of exercises) {
    const linkId = getLinkedExerciseId(ex);
    if (!linkId) continue;

    const entry = byLink.get(linkId) ?? {};
    if (ex.type === CHAIN_RECEPTIVE) {
      entry.receptive = ex;
    } else if (CHAIN_PRODUCTION.includes(ex.type)) {
      entry.production = ex;
    }
    byLink.set(linkId, entry);
  }

  const completePairs = [...byLink.entries()].filter(
    ([, pair]) => pair.receptive && pair.production,
  );
  if (completePairs.length === 0) return exercises;

  const chainedIds = new Set(
    completePairs.flatMap(([id]) => [id]),
  );
  const usedInPair = new Set<Exercise>();
  for (const [, pair] of completePairs) {
    if (pair.receptive) usedInPair.add(pair.receptive);
    if (pair.production) usedInPair.add(pair.production);
  }

  const remainder = exercises.filter((ex) => !usedInPair.has(ex));
  const [, firstPair] = completePairs[0];
  const pairBlock: Exercise[] = [];
  if (firstPair.receptive) pairBlock.push(firstPair.receptive);
  if (firstPair.production) pairBlock.push(firstPair.production);

  const insertAt = remainder.length > 0 && remainder[0]?.type === 'grammar-trap' ? 1 : 0;
  const result = [...remainder];
  result.splice(insertAt, 0, ...pairBlock);

  void chainedIds;
  return result;
}

export function buildChainPromptBlock(hasChainTypes: boolean): string {
  if (!hasChainTypes) return '';
  return `
CHAIN RULE (include exactly ONE pair for deeper retention):
1. listening-comprehension with "linkedExerciseId": "chain-1" and "chainAnchorPhrase": a key phrase from the lesson (in target language).
2. reverse-translation with the SAME "linkedExerciseId": "chain-1" — portuguese_sentence prompts the student to write chainAnchorPhrase (or equivalent) in the target language.
The pair must share the same anchor phrase.`;
}
