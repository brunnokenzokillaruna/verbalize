/**
 * Word-level diff between what the learner wrote and the corrected sentence.
 *
 * The analysis shown after a translation exercise used to depend entirely on
 * Gemini choosing which mistakes to mention, so it could explain the missing
 * idiom and silently skip "du projet". Deriving the list of changes from the
 * diff makes coverage structural: every difference is available, and the model
 * only has to supply the reasoning.
 */

export interface CorrectionSegment {
  /** Exactly what the learner wrote; empty when something was missing. */
  learner: string;
  /** What it should be; empty when the learner added something extra. */
  correct: string;
}

export interface CorrectionDiff {
  segments: CorrectionSegment[];
  /** Share of the learner's words that changed. Near 1 means a full rewrite. */
  changeRatio: number;
}

interface Token {
  text: string;
  key: string;
  start: number;
  end: number;
}

const TOKEN_RE = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*|[^\s]/gu;

/** Case-insensitive but accent-sensitive: a missing accent is a real mistake. */
function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  for (const match of text.matchAll(TOKEN_RE)) {
    const value = match[0];
    const start = match.index ?? 0;
    tokens.push({ text: value, key: value.toLowerCase(), start, end: start + value.length });
  }
  return tokens;
}

function hasContent(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

/**
 * A trailing period or comma on one side is not part of the lesson, so it must
 * not ride along into "fatigue → fatigué." and look like the fix includes it.
 */
function trimPunctuationEdges(tokens: Token[]): Token[] {
  let start = 0;
  let end = tokens.length;
  while (start < end && !hasContent(tokens[start]!.text)) start += 1;
  while (end > start && !hasContent(tokens[end - 1]!.text)) end -= 1;
  return tokens.slice(start, end);
}

function sliceTokens(source: string, tokens: Token[]): string {
  const trimmed = trimPunctuationEdges(tokens);
  if (trimmed.length === 0) return '';
  return source.slice(trimmed[0]!.start, trimmed.at(-1)!.end).trim();
}

/** dp[i][j] = length of the longest common subsequence of a[i..] and b[j..]. */
function lcsLengths(a: Token[], b: Token[]): number[][] {
  const dp = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i]![j] =
        a[i]!.key === b[j]!.key
          ? dp[i + 1]![j + 1]! + 1
          : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }
  return dp;
}

export function diffCorrectionSegments(
  learnerText: string,
  correctedText: string,
): CorrectionDiff {
  const learnerTokens = tokenize(learnerText);
  const correctedTokens = tokenize(correctedText);
  if (learnerTokens.length === 0 || correctedTokens.length === 0) {
    return { segments: [], changeRatio: 0 };
  }

  const dp = lcsLengths(learnerTokens, correctedTokens);
  const segments: CorrectionSegment[] = [];
  let changedLearnerTokens = 0;
  let pendingLearner: Token[] = [];
  let pendingCorrected: Token[] = [];

  function flushPending() {
    if (pendingLearner.length === 0 && pendingCorrected.length === 0) return;
    const learner = sliceTokens(learnerText, pendingLearner);
    const correct = sliceTokens(correctedText, pendingCorrected);
    // Punctuation-only differences are noise, not something to teach.
    if (hasContent(learner) || hasContent(correct)) {
      segments.push({ learner, correct });
    }
    changedLearnerTokens += pendingLearner.length;
    pendingLearner = [];
    pendingCorrected = [];
  }

  let i = 0;
  let j = 0;
  while (i < learnerTokens.length && j < correctedTokens.length) {
    if (learnerTokens[i]!.key === correctedTokens[j]!.key) {
      flushPending();
      i += 1;
      j += 1;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      pendingLearner.push(learnerTokens[i]!);
      i += 1;
    } else {
      pendingCorrected.push(correctedTokens[j]!);
      j += 1;
    }
  }
  while (i < learnerTokens.length) pendingLearner.push(learnerTokens[i++]!);
  while (j < correctedTokens.length) pendingCorrected.push(correctedTokens[j++]!);
  flushPending();

  return {
    segments,
    changeRatio: changedLearnerTokens / learnerTokens.length,
  };
}

/** Beyond this the answer is a different sentence, not a set of fixable slips. */
export const MAX_CHANGE_RATIO_FOR_LIST = 0.75;

/** Diff segments, or none when the answer is a wholesale rewrite. */
export function fixableCorrectionSegments(
  learnerText: string,
  correctedText: string,
): CorrectionSegment[] {
  const { segments, changeRatio } = diffCorrectionSegments(learnerText, correctedText);
  return changeRatio > MAX_CHANGE_RATIO_FOR_LIST ? [] : segments;
}
