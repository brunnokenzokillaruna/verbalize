/**
 * Linguistic answer-key QA for practice exercises.
 *
 * Goal: never ship an exercise whose marked "correct" answer teaches wrong French/English.
 * Local guards catch structural lies; a lightweight Gemini pass catches semantic/grammar lies.
 */

import type {
  BridgeChoiceData,
  ConjugationSpeedData,
  ContextChoiceData,
  ErrorCorrectionData,
  Exercise,
  FillGapProductionData,
  GrammarTrapData,
  ReverseTranslationData,
  SupportedLanguage,
  TranslationWithConstraintData,
} from '@/types';
import { LANG_LABEL } from './constants';
import { findLeakedTargetWord } from './validatePtBrText';
import { isDirectionalBlankMismatched } from '@/lib/fillGapDirectionalSanitize';

export type AnswerClaim = {
  index: number;
  type: string;
  /** Compact, type-specific claim for the verifier. */
  claim: string;
};

type VerifierVerdict = {
  i: number;
  ok: boolean;
  reason?: string;
};

const LANG = LANG_LABEL;

function norm(s: string): string {
  return s.toLowerCase().normalize('NFC').trim();
}

/**
 * Build a short claim string for exercises that have a single clear "correct" key.
 * Returns null for types we don't QA this way (oral / open production).
 */
export function extractAnswerClaim(ex: Exercise, index: number): AnswerClaim | null {
  switch (ex.type) {
    case 'context-choice': {
      const d = ex.data as ContextChoiceData;
      return {
        index,
        type: ex.type,
        claim: `PT: "${d.translation}" | FR/EN sentence: "${d.sentence}" | marked blankWord: "${d.blankWord}" | options: [${d.options.join(', ')}]`,
      };
    }
    case 'fill-gap-production': {
      const d = ex.data as FillGapProductionData;
      return {
        index,
        type: ex.type,
        claim: `PT: "${d.translation}" | sentence: "${d.sentence}" | marked blankWord: "${d.blankWord}" | variants: [${(d.acceptable_variants ?? []).join(', ')}]`,
      };
    }
    case 'reverse-translation': {
      const d = ex.data as ReverseTranslationData;
      return {
        index,
        type: ex.type,
        claim: `PT prompt: "${d.portuguese_sentence}" | marked target: "${d.target_translation}" | variants: [${d.acceptable_variants.join(', ')}]`,
      };
    }
    case 'error-correction': {
      const d = ex.data as ErrorCorrectionData;
      return {
        index,
        type: ex.type,
        claim: `wrong: "${d.sentence_with_error}" | error_word: "${d.error_word}" | correct_word: "${d.correct_word}" | corrected: "${d.corrected_sentence ?? ''}" | PT meaning: "${d.translation}"`,
      };
    }
    case 'grammar-trap': {
      const d = ex.data as GrammarTrapData;
      const marked = d.options.find((o) => o.isCorrect);
      return {
        index,
        type: ex.type,
        claim: `question PT: "${d.question}" | trap: "${d.trapRule}" | markedCorrect: "${marked?.sentence ?? '?'}" (${marked?.translation ?? ''}) | all: ${d.options.map((o) => `[${o.isCorrect ? 'CORRECT' : 'wrong'}] ${o.sentence}`).join(' | ')}`,
      };
    }
    case 'bridge-choice': {
      const d = ex.data as BridgeChoiceData;
      const marked = d.options[d.correctIndex];
      return {
        index,
        type: ex.type,
        claim: `Q: "${d.question}" | explanation: "${d.explanation}" | markedCorrect(index ${d.correctIndex}): "${marked}" | options: ${d.options.map((o, i) => `[${i}] ${o}`).join(' | ')}`,
      };
    }
    case 'conjugation-speed': {
      const d = ex.data as ConjugationSpeedData;
      return {
        index,
        type: ex.type,
        claim: `conjugate ${d.verb} for "${d.pronoun}" in tense "${d.tense}" | marked correctForm: "${d.correctForm}" | options: [${d.options.join(', ')}] | example: "${d.exampleSentence}"`,
      };
    }
    case 'translation-with-constraint': {
      const d = ex.data as TranslationWithConstraintData;
      return {
        index,
        type: ex.type,
        claim: `PT: "${d.portuguese_sentence}" | must include: "${d.required_chunk}" | marked target: "${d.target_translation}"`,
      };
    }
    case 'sentence-builder':
    case 'word-bank-translation': {
      const d = ex.data as { correctOrder: string[]; translation?: string; portuguese_sentence?: string };
      const pt = d.translation ?? d.portuguese_sentence ?? '';
      return {
        index,
        type: ex.type,
        claim: `PT: "${pt}" | marked sentence: "${d.correctOrder.join(' ')}"`,
      };
    }
    default:
      return null;
  }
}

/**
 * Deterministic drops — wrong answer keys that never need an LLM.
 */
export function failsLocalAnswerKeyGuard(ex: Exercise): string | null {
  if (ex.type === 'context-choice') {
    const d = ex.data as ContextChoiceData;
    if (!d.options.some((o) => norm(o) === norm(d.blankWord))) {
      return 'blankWord not present in options';
    }
    if (!d.sentence.includes('___')) {
      return 'context-choice sentence missing blank';
    }
    if (
      isDirectionalBlankMismatched({
        blankWord: d.blankWord,
        translation: d.translation,
        sentence: d.sentence,
      })
    ) {
      return 'directional verb blankWord mismatches PT cue (trazer/levar or person/thing)';
    }
  }

  if (ex.type === 'fill-gap-production') {
    const d = ex.data as FillGapProductionData;
    if (!d.sentence.includes('___')) {
      return 'fill-gap sentence missing blank';
    }
    if (!d.blankWord.trim()) {
      return 'empty blankWord';
    }
    if (
      isDirectionalBlankMismatched({
        blankWord: d.blankWord,
        translation: d.translation,
        sentence: d.sentence,
      })
    ) {
      return 'directional verb blankWord mismatches PT cue (trazer/levar or person/thing)';
    }
  }

  if (ex.type === 'grammar-trap') {
    const d = ex.data as GrammarTrapData;
    const correct = d.options.filter((o) => o.isCorrect);
    if (correct.length !== 1) {
      return `grammar-trap must have exactly one isCorrect (got ${correct.length})`;
    }
  }

  if (ex.type === 'conjugation-speed') {
    const d = ex.data as ConjugationSpeedData;
    if (!d.options.some((o) => norm(o) === norm(d.correctForm))) {
      return 'correctForm not present in options';
    }
  }

  if (ex.type === 'translation-with-constraint') {
    const d = ex.data as TranslationWithConstraintData;
    const leak = findLeakedTargetWord(d.portuguese_sentence, [d.required_chunk]);
    if (leak) {
      return `portuguese_sentence leaks target word "${leak}"`;
    }
  }

  if (ex.type === 'minimal-pair' || ex.type === 'minimal-pair-production') {
    const d = ex.data as { wordA: string; wordB: string; correctWord: string };
    if (d.correctWord !== d.wordA && d.correctWord !== d.wordB) {
      return 'correctWord is neither wordA nor wordB';
    }
  }

  return null;
}

export function filterByLocalAnswerKeyGuards(exercises: Exercise[]): Exercise[] {
  return exercises.filter((ex) => {
    const reason = failsLocalAnswerKeyGuard(ex);
    if (reason) {
      console.warn(`[verifyAnswerKeys] Dropped ${ex.type} — ${reason}`);
      return false;
    }
    return true;
  });
}

function buildVerifierPrompt(
  claims: AnswerClaim[],
  language: SupportedLanguage,
): { systemPrompt: string; prompt: string } {
  const lang = LANG[language];
  const systemPrompt = `You are a strict linguistic QA reviewer for a ${lang} learning app for Brazilian Portuguese speakers.
Your ONLY job: decide whether each exercise's MARKED correct answer is actually correct.
Respond with ONLY a JSON array. No markdown.`;

  const prompt = `Review these ${claims.length} exercises. For each, set ok=true ONLY if the marked correct answer is linguistically correct given the Portuguese cue and the target-language sentence/options.

Mark ok=false when ANY of these apply:
1. blankWord / correctForm / target_translation contradicts the Portuguese meaning (classic: PT "levar" marked as French "apporter" — should be "emporter" for things or "emmener" for people; "trazer"↔"apporter"/"amener").
2. French person vs thing mix-up: amener/emmener are ONLY for people/animals; apporter/emporter are ONLY for things. Marking "apporter" correct for "primo/ami/cousin" is ALWAYS wrong.
3. The marked correct option is ungrammatical (wrong gender/number/conjugation/agreement).
4. isCorrect / correctIndex points to the wrong option (the real correct option is another one, or none are correct).
5. reverse-translation / sentence-builder target does not mean what the Portuguese prompt says.
6. error-correction "corrected" sentence is still wrong, or correct_word does not fix the error.

Be conservative: if you are unsure, set ok=true (do not false-drop). If clearly wrong, set ok=false.

Input:
${JSON.stringify(
    claims.map((c) => ({ i: c.index, type: c.type, claim: c.claim })),
    null,
    2,
  )}

Output JSON array with one object per input item:
[{ "i": <same index>, "ok": true|false, "reason": "short English reason when ok=false" }]`;

  return { systemPrompt, prompt };
}

/**
 * Gemini second-pass: drop exercises whose marked answer key is wrong.
 * On API/parse failure, keeps the set (availability) but logs — local guards already ran.
 */
export async function verifyAnswerKeysWithGemini(
  exercises: Exercise[],
  language: SupportedLanguage,
): Promise<Exercise[]> {
  const claims = exercises
    .map((ex, i) => extractAnswerClaim(ex, i))
    .filter((c): c is AnswerClaim => c !== null);

  if (claims.length === 0) return exercises;

  try {
    const { callGeminiJSON } = await import('@/services/gemini');
    const { systemPrompt, prompt } = buildVerifierPrompt(claims, language);
    const verdicts = await callGeminiJSON<VerifierVerdict[]>(
      prompt,
      systemPrompt,
      1024,
      undefined,
      'lightweight',
    );

    if (!Array.isArray(verdicts) || verdicts.length === 0) {
      console.warn('[verifyAnswerKeys] Empty verifier response — keeping exercises');
      return exercises;
    }

    const byIndex = new Map<number, VerifierVerdict>();
    for (const v of verdicts) {
      if (typeof v?.i === 'number') byIndex.set(v.i, v);
    }

    const kept: Exercise[] = [];
    for (let i = 0; i < exercises.length; i++) {
      const verdict = byIndex.get(i);
      // Types without a claim (not in map from our side) are always kept.
      // If we sent a claim but verifier omitted it → keep (uncertain).
      if (!verdict || verdict.ok !== false) {
        kept.push(exercises[i]);
        continue;
      }
      console.warn(
        `[verifyAnswerKeys] Dropped ${exercises[i].type} [#${i}] — ${verdict.reason ?? 'marked answer incorrect'}`,
      );
    }

    return kept;
  } catch (err) {
    console.warn('[verifyAnswerKeys] Verifier call failed — keeping exercises:', err);
    return exercises;
  }
}

/**
 * Full answer-key gate: local guards then Gemini semantic QA.
 */
export async function gateExerciseAnswerKeys(
  exercises: Exercise[],
  language: SupportedLanguage,
): Promise<Exercise[]> {
  const local = filterByLocalAnswerKeyGuards(exercises);
  return verifyAnswerKeysWithGemini(local, language);
}
