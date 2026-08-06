import { cleanWordToken, normalizeWord } from '@/lib/wordTooltipUtils';
import type { SupportedLanguage } from '@/types';

/**
 * International loanwords / cognates that are valid Brazilian Portuguese
 * AND may appear unchanged in French/English dialogue. Treating them as
 * "leaked target vocabulary" caused checkpoints to drop all comprehension
 * questions (e.g. dialogue "cinema" + PT question "depois do cinema").
 */
const PT_BR_SHARED_COGNATES = new Set(
  [
    'bar',
    'bus',
    'cafe',
    'cinema',
    'club',
    'email',
    'film',
    'golf',
    'hotel',
    'internet',
    'jazz',
    'message',
    'metro',
    'ok',
    'okay',
    'parc',
    'park',
    'parking',
    'party',
    'photo',
    'pizza',
    'pub',
    'radio',
    'sandwich',
    'shopping',
    'show',
    'sport',
    'taxi',
    'tennis',
    'video',
    'weekend',
    'week-end',
  ].map((w) => normalizeWord(w)),
);

/**
 * Tokens that exist in both the target language and PT-BR with the same
 * spelling (false friends or shared function words). Example: French "mais"
 * (but) vs Portuguese "mais" (more) — both appear in natural checkpoint copy.
 */
const CROSS_LANGUAGE_AMBIGUOUS_TOKENS = new Set(
  [
    'mais',
    'entre',
    'dire',
    'part',
    'sort',
    'fine',
    'base',
    'type',
    'mode',
    'date',
    'plan',
    'moment',
    'present',
    'future',
    'important',
    'possible',
    'normal',
    'final',
    'total',
    'social',
    'local',
    'question',
  ].map((w) => normalizeWord(w)),
);

function shouldIgnoreForbiddenLemma(lemma: string): boolean {
  return PT_BR_SHARED_COGNATES.has(lemma) || CROSS_LANGUAGE_AMBIGUOUS_TOKENS.has(lemma);
}

/**
 * Strip quoted dialogue citations — target-language quotes are allowed there.
 * French elisions inside single quotes (C'était, l'ami) must not terminate the span.
 */
function stripQuotedSpans(text: string): string {
  return text
    .replace(/"[^"]*"/g, ' ')
    .replace(/«[^»]*»/g, ' ')
    .replace(/'(?:[A-Za-zÀ-ÿ]+'|[^'])*'/g, ' ');
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
    if (lemma.length < 3) continue;
    if (shouldIgnoreForbiddenLemma(lemma)) continue;
    set.add(lemma);
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
  return `- PT-BR LEARNER TEXT (listening-comprehension, bridge-choice scenario/question/explanation, checkpoint comprehension, reverse-translation portuguese_sentence, word-bank-translation portuguese_sentence, translation-with-constraint portuguese_sentence, fill-gap/context-choice "translation" fields): write ONLY Brazilian Portuguese. NEVER insert ${langLabel} lesson vocabulary into Portuguese prompts (write "golpe" / "furada", NOT "arnaque"; write "torre de igreja", NOT "clocher"). ${langLabel} may appear ONLY inside quotes when citing a dialogue line verbatim, or in separate fields meant for the target language (required_chunk, blankWord, target_translation).
- TRANSLATION-WITH-CONSTRAINT: portuguese_sentence must be 100% PT-BR and must NOT contain required_chunk. Express the meaning with a Portuguese equivalent; the learner sees required_chunk only in the mandatory-chunk box.`;
}
