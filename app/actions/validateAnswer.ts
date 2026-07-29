'use server';

import { evaluateReverseTranslationGemini } from '@/lib/reverseTranslationGemini';
import { validateReverseTranslationLocal } from '@/lib/reverseTranslationValidate';
import type { ReverseTranslationVerdict } from '@/lib/reverseTranslationValidate';

export interface ValidationResult {
  accepted: boolean;
  verdict: ReverseTranslationVerdict;
  note?: string;
  correctedSentence?: string;
}

/**
 * Validates a reverse-translation (or paraphrase) answer.
 * Prefers Gemini semantic grading; falls back to a strict local checker.
 * On unexpected errors, rejects (fail-closed) instead of accepting.
 */
export async function validateReverseTranslation(
  userAnswer: string,
  expectedAnswer: string,
  portugueseSentence: string,
  language: string,
  acceptableVariants: string[] = [],
): Promise<ValidationResult> {
  const variants = Array.isArray(acceptableVariants) ? acceptableVariants : [];

  try {
    const ai = await evaluateReverseTranslationGemini({
      userAnswer,
      expectedAnswer,
      portugueseSentence,
      language,
      acceptableVariants: variants,
    });

    if (ai) {
      return {
        accepted: ai.accepted,
        verdict: ai.verdict,
        note: ai.note,
        correctedSentence: ai.correctedSentence,
      };
    }

    return validateReverseTranslationLocal(userAnswer, expectedAnswer, variants);
  } catch (err) {
    console.error('[validateReverseTranslation] Error — fail-closed:', err);
    try {
      return validateReverseTranslationLocal(userAnswer, expectedAnswer, variants);
    } catch {
      return {
        accepted: false,
        verdict: 'wrong',
        note: 'Não foi possível validar sua resposta agora. Tente de novo.',
        correctedSentence: expectedAnswer,
      };
    }
  }
}
