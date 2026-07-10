import { cleanWordToken, normalizeWord } from '@/lib/wordTooltipUtils';
import type { SupportedLanguage } from '@/types';

/** Strip quoted dialogue citations — target-language quotes are allowed there. */
function stripQuotedSpans(text: string): string {
  return text.replace(/['"][^'"]*['"]/g, ' ');
}

function tokenize(text: string): string[] {
  return normalizeWord(stripQuotedSpans(text))
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9-]/g, ''))
    .filter((token) => token.length >= 3);
}

function buildForbiddenLemmaSet(words: string[]): Set<string> {
  const set = new Set<string>();
  for (const word of words) {
    const lemma = normalizeWord(cleanWordToken(word));
    if (lemma.length >= 3) set.add(lemma);
  }
  return set;
}

/** Extract content words from a target-language dialogue (for checkpoint validation). */
export function extractDialogueContentWords(dialogue: string): string[] {
  const lines = dialogue.split('\n');
  const words: string[] = [];
  for (const line of lines) {
    const content = line.includes(':') ? line.split(':').slice(1).join(':') : line;
    for (const token of content.split(/\s+/)) {
      const cleaned = cleanWordToken(token);
      if (cleaned.length >= 4 && /[a-zA-ZÀ-ÿ]/.test(cleaned)) {
        words.push(cleaned);
      }
    }
  }
  return words;
}

export function findLeakedTargetWord(
  text: string,
  forbiddenWords: Iterable<string>,
): string | null {
  const forbidden = buildForbiddenLemmaSet([...forbiddenWords]);
  if (forbidden.size === 0) return null;

  for (const token of tokenize(text)) {
    if (forbidden.has(token)) {
      return token;
    }
  }
  return null;
}

export function isPtBrLearnerTextPure(
  text: string,
  forbiddenWords: Iterable<string>,
): boolean {
  return findLeakedTargetWord(text, forbiddenWords) === null;
}

export interface ListeningComprehensionPtBrInput {
  questionPt: string;
  options: string[];
  explanationPt: string;
  lessonVocabulary: string[];
  dialogueAudio?: string;
}

/**
 * Ensures comprehension UI copy stays in PT-BR — lesson/target words must not
 * leak into options or explanations (e.g. "clocher" instead of "torre de igreja").
 */
export function isListeningComprehensionPtBrPure(
  input: ListeningComprehensionPtBrInput,
): boolean {
  const forbidden = [
    ...input.lessonVocabulary,
    ...(input.dialogueAudio ? extractDialogueContentWords(input.dialogueAudio) : []),
  ];

  if (!isPtBrLearnerTextPure(input.questionPt, forbidden)) return false;

  for (const option of input.options) {
    if (!isPtBrLearnerTextPure(option, forbidden)) return false;
  }

  return isPtBrLearnerTextPure(input.explanationPt, forbidden);
}

export function buildPtBrVocabRule(language: SupportedLanguage): string {
  const langLabel = language === 'fr' ? 'French' : 'English';
  return `- PT-BR LEARNER TEXT (listening-comprehension, bridge-choice scenario/question/explanation, checkpoint comprehension): write ONLY Brazilian Portuguese. NEVER insert ${langLabel} lesson vocabulary in options or explanations (write "torre de igreja", NOT "clocher"; write "gramado", NOT "gazon"). ${langLabel} may appear ONLY inside quotes when citing a dialogue line verbatim.`;
}
