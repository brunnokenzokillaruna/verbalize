import type { Exercise, ProficiencyLevel } from '@/types';

const A2_PLUS: ProficiencyLevel[] = ['A2', 'B1', 'B2', 'C1', 'C2'];

const STOP = new Set([
  'a', 'o', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'em', 'no', 'na',
  'nos', 'nas', 'para', 'por', 'com', 'sem', 'que', 'se', 'ao', 'à', 'the', 'an', 'and', 'or',
  'to', 'of', 'in', 'on', 'at', 'for', 'is', 'are', 'was', 'were', 'be', 'i', 'you', 'he', 'she',
  'we', 'they', 'it', 'my', 'your', 'le', 'la', 'les', 'un', 'une', 'des', 'du', 'et', 'ou',
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'est', 'suis', 'sont', 'pas', 'ne',
]);

/** Types that should reuse lesson vocab/dialogue when that context is available. */
export const ANCHORABLE_TYPES = new Set([
  'context-choice',
  'sentence-builder',
  'reverse-translation',
  'word-bank-translation',
  'fill-gap-production',
  'audio-dictation',
  'speak-repeat',
  'paraphrase',
]);

export function isA2PlusLevel(level: ProficiencyLevel | undefined): boolean {
  return !!level && A2_PLUS.includes(level);
}

export function tokenizeForAnchor(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^a-zàâäáãåăâçćčđéèêëíìîïñóòôöõúùûüýÿœæß]+/i)) {
    const t = raw.trim();
    if (t.length < 3 || STOP.has(t)) continue;
    tokens.add(t);
  }
  return tokens;
}

function extractExerciseAnchorText(ex: Exercise): string {
  const d = ex.data as unknown as Record<string, unknown>;
  const parts: string[] = [];
  for (const key of [
    'blankWord',
    'sentence',
    'target_translation',
    'text',
    'source_sentence',
    'correctForm',
    'audioText',
  ] as const) {
    const v = d[key];
    if (typeof v === 'string' && v.trim()) parts.push(v);
  }
  if (Array.isArray(d.correctOrder)) {
    parts.push((d.correctOrder as string[]).join(' '));
  }
  if (Array.isArray(d.words)) {
    parts.push((d.words as string[]).join(' '));
  }
  return parts.join(' ');
}

/**
 * When lesson vocabulary/dialogue context exists, require at least one content-token
 * overlap so drills stay anchored to the lesson. Returns true when check should pass.
 */
export function isAnchoredToLesson(
  ex: Exercise,
  lessonVocabulary: string[],
  lessonDialogue: string,
): boolean {
  if (!ANCHORABLE_TYPES.has(ex.type)) return true;

  const lessonTokens = new Set<string>();
  for (const word of lessonVocabulary) {
    for (const t of tokenizeForAnchor(word)) lessonTokens.add(t);
  }
  for (const t of tokenizeForAnchor(lessonDialogue)) lessonTokens.add(t);

  if (lessonTokens.size === 0) return true;

  const exerciseTokens = tokenizeForAnchor(extractExerciseAnchorText(ex));
  if (exerciseTokens.size === 0) return true;

  for (const t of exerciseTokens) {
    if (lessonTokens.has(t)) return true;
  }
  return false;
}

const MIN_CRITERIA = 12;
const MIN_EXAMPLE = 8;

export function isNonTrivialFreeProductionField(
  value: string | undefined,
  minLength: number,
): boolean {
  const text = value?.trim() ?? '';
  return text.length >= minLength;
}

export function isSolidFreeRoleplay(data: {
  evaluationCriteria?: string;
  exampleResponse?: string;
  acceptableThemes?: string[];
}): boolean {
  if (!isNonTrivialFreeProductionField(data.evaluationCriteria, MIN_CRITERIA)) return false;
  if (!isNonTrivialFreeProductionField(data.exampleResponse, MIN_EXAMPLE)) return false;
  if (!Array.isArray(data.acceptableThemes) || data.acceptableThemes.length === 0) return false;
  return data.acceptableThemes.some((t) => (t?.trim().length ?? 0) >= 3);
}

export function isSolidMicroMessage(data: {
  evaluationCriteria?: string;
  exampleResponse?: string;
}): boolean {
  return (
    isNonTrivialFreeProductionField(data.evaluationCriteria, MIN_CRITERIA) &&
    isNonTrivialFreeProductionField(data.exampleResponse, MIN_EXAMPLE)
  );
}

export function isSolidListenAndRespond(data: {
  evaluationCriteria?: string;
  exampleResponse?: string;
  acceptableThemes?: string[];
}): boolean {
  if (!isNonTrivialFreeProductionField(data.evaluationCriteria, MIN_CRITERIA)) return false;
  if (!isNonTrivialFreeProductionField(data.exampleResponse, MIN_EXAMPLE)) return false;
  if (Array.isArray(data.acceptableThemes) && data.acceptableThemes.length > 0) {
    return data.acceptableThemes.some((t) => (t?.trim().length ?? 0) >= 3);
  }
  return true;
}
