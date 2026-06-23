'use server';

import { validateReverseTranslationLocal } from '@/lib/reverseTranslationValidate';

interface ValidationResult {
  accepted: boolean;
  note?: string;
}

/**
 * Validates a reverse-translation answer locally — no Gemini API call.
 */
export async function validateReverseTranslation(
  userAnswer: string,
  expectedAnswer: string,
  _portugueseSentence: string,
  _language: string,
  acceptableVariants: string[] = [],
): Promise<ValidationResult> {
  try {
    return validateReverseTranslationLocal(userAnswer, expectedAnswer, acceptableVariants);
  } catch {
    return { accepted: true };
  }
}
