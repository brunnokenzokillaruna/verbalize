import { canonicalVocabKey } from '@/lib/vocabCanonical';

export interface CharacterAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface NarratedTextRange {
  lineIndex: number;
  start: number;
  end: number;
  text: string;
}

export interface TimedNarratedRange extends NarratedTextRange {
  startTime: number;
  endTime: number;
}

export interface NarrationTarget extends NarratedTextRange {
  translation: string;
  kind: 'word' | 'expression';
}

const WORD_RE = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;

export function stripDialogueSpeaker(line: string): string {
  return line.replace(/^[^:\n]{1,40}:\s*/, '').trim();
}

export function tokenizeNarratedText(
  text: string,
): Array<{ text: string; start: number; end: number }> {
  const tokens: Array<{ text: string; start: number; end: number }> = [];
  for (const match of text.matchAll(WORD_RE)) {
    const value = match[0];
    const start = match.index ?? 0;
    tokens.push({ text: value, start, end: start + value.length });
  }
  return tokens;
}

export function findNarratedRangeFromAlignment(
  alignment: CharacterAlignment | null | undefined,
  currentTime: number,
  lineIndex: number,
): NarratedTextRange | null {
  if (!alignment?.characters.length) return null;

  const charIndex = alignment.character_start_times_seconds.findIndex(
    (start, index) =>
      currentTime >= start &&
      currentTime < (alignment.character_end_times_seconds[index] ?? start),
  );
  if (charIndex < 0) return null;

  const alignedText = alignment.characters.join('');
  const tokens = tokenizeNarratedText(alignedText);
  const token = tokens.find(
    (candidate) => charIndex >= candidate.start && charIndex < candidate.end,
  ) ?? tokens.findLast((candidate) => candidate.end <= charIndex);
  return token ? { lineIndex, ...token } : null;
}

export function buildEstimatedNarrationTimeline(
  dialogueLines: string[],
  durationSeconds: number,
): TimedNarratedRange[] {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return [];

  const ranges = dialogueLines.flatMap((line, lineIndex) =>
    tokenizeNarratedText(stripDialogueSpeaker(line)).map((token) => ({
      lineIndex,
      ...token,
      weight: Math.max(1, Math.sqrt(token.text.length)),
    })),
  );
  const totalWeight = ranges.reduce((sum, range) => sum + range.weight, 0);
  if (totalWeight <= 0) return [];

  let cursor = 0;
  return ranges.map(({ weight, ...range }) => {
    const span = (weight / totalWeight) * durationSeconds;
    const timed = { ...range, startTime: cursor, endTime: cursor + span };
    cursor += span;
    return timed;
  });
}

export function findEstimatedNarratedRange(
  timeline: TimedNarratedRange[],
  currentTime: number,
): NarratedTextRange | null {
  const range = timeline.find(
    (candidate) =>
      currentTime >= candidate.startTime && currentTime < candidate.endTime,
  );
  if (!range) return null;
  return {
    lineIndex: range.lineIndex,
    start: range.start,
    end: range.end,
    text: range.text,
  };
}

export function collectDialogueTranslationTargets(
  dialogue: string,
  expressions: Array<{ phrase: string }> = [],
): string[] {
  const targets = new Map<string, string>();
  const add = (value: string) => {
    const key = canonicalVocabKey(value);
    if (key && !targets.has(key)) targets.set(key, value.trim());
  };

  expressions.forEach((expression) => add(expression.phrase));
  dialogue
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => tokenizeNarratedText(stripDialogueSpeaker(line)))
    .forEach((token) => add(token.text));

  return [...targets.values()];
}

function findTranslation(
  value: string,
  translations: Record<string, string>,
): string {
  const targetKey = canonicalVocabKey(value);
  for (const [key, translation] of Object.entries(translations)) {
    if (canonicalVocabKey(key) === targetKey && translation.trim()) {
      return translation.trim();
    }
  }
  return '';
}

function phraseRangeContaining(
  text: string,
  phrase: string,
  narrated: NarratedTextRange,
): { start: number; end: number } | null {
  const textTokens = tokenizeNarratedText(text);
  const phraseKeys = tokenizeNarratedText(phrase).map((token) =>
    canonicalVocabKey(token.text),
  );
  if (phraseKeys.length < 2) return null;

  for (let index = 0; index <= textTokens.length - phraseKeys.length; index++) {
    const candidates = textTokens.slice(index, index + phraseKeys.length);
    const matches = candidates.every(
      (token, offset) =>
        canonicalVocabKey(token.text) === phraseKeys[offset],
    );
    if (!matches) continue;

    const start = candidates[0]!.start;
    const end = candidates.at(-1)!.end;
    if (narrated.start < end && narrated.end > start) return { start, end };
  }
  return null;
}

/** Skipped when locating a translation, so "a conta" can match "conta". */
const PT_FUNCTION_WORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas',
  'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'ao', 'aos', 'para', 'pra', 'por', 'com', 'que', 'se',
]);

const MIN_SHARED_STEM = 4;
const MIN_STEM_COVERAGE = 0.7;

function sharedPrefixLength(a: string, b: string): number {
  const limit = Math.min(a.length, b.length);
  let shared = 0;
  while (shared < limit && a[shared] === b[shared]) shared += 1;
  return shared;
}

/**
 * True for pairs like "tentar"/"tento" — the tooltip carries the dictionary
 * form while the sentence carries a conjugated or agreeing one.
 */
function tokensShareStem(a: string, b: string): boolean {
  if (a === b) return true;
  const shared = sharedPrefixLength(a, b);
  return (
    shared >= MIN_SHARED_STEM &&
    shared / Math.min(a.length, b.length) >= MIN_STEM_COVERAGE
  );
}

/**
 * Locates a Portuguese translation inside the line's fixed translation, so the
 * narrated word can be highlighted on both sides at once. Returns null when the
 * wording diverges too much — the target text simply stays unhighlighted.
 */
export function findTranslationHighlightRange(
  translationLine: string,
  translation: string,
): { start: number; end: number } | null {
  const targetKeys = tokenizeNarratedText(translation)
    .map((token) => canonicalVocabKey(token.text))
    .filter((key) => key.length > 0);
  if (targetKeys.length === 0) return null;

  const contentKeys = targetKeys.filter((key) => !PT_FUNCTION_WORDS.has(key));
  const keys = contentKeys.length > 0 ? contentKeys : targetKeys;
  const tokens = tokenizeNarratedText(translationLine);

  for (let index = 0; index + keys.length <= tokens.length; index++) {
    const window = tokens.slice(index, index + keys.length);
    const matches = window.every(
      (token, offset) => canonicalVocabKey(token.text) === keys[offset],
    );
    if (matches) return { start: window[0]!.start, end: window.at(-1)!.end };
  }

  // Longest key first: the most specific word carries the meaning.
  for (const key of [...keys].sort((a, b) => b.length - a.length)) {
    const token = tokens.find((candidate) =>
      tokensShareStem(canonicalVocabKey(candidate.text), key),
    );
    if (token) return { start: token.start, end: token.end };
  }

  return null;
}

export function resolveNarrationTarget(
  lineText: string,
  narrated: NarratedTextRange | null,
  translations: Record<string, string>,
  expressions: Array<{ phrase: string; translation: string }> = [],
): NarrationTarget | null {
  if (!narrated) return null;

  for (const expression of expressions) {
    const range = phraseRangeContaining(lineText, expression.phrase, narrated);
    if (range) {
      return {
        lineIndex: narrated.lineIndex,
        ...range,
        text: lineText.slice(range.start, range.end),
        translation: expression.translation,
        kind: 'expression',
      };
    }
  }

  const translation = findTranslation(narrated.text, translations);
  if (!translation) return null;
  return { ...narrated, translation, kind: 'word' };
}
