/**
 * Local validation for multiple-choice exercises — zero Gemini calls.
 * Catches cases where correctIndex / explanation / audio source disagree
 * (e.g. dialogue says "pour manger" but the marked answer says "descansar").
 */

type SemanticBucket =
  | 'eat'
  | 'rest'
  | 'go_home'
  | 'order_more'
  | 'buy'
  | 'pay'
  | 'wait';

const BUCKET_PATTERNS: Record<SemanticBucket, RegExp[]> = {
  eat: [
    /\bcomer\b/,
    /\bmanger\b/,
    /\bmange(?:r|z|nt)?\b/,
    /\beat(?:ing)?\b/,
    /\bmeal\b/,
    /\balmo(?:c|ç)/,
    /\bjant/,
    /\blunch\b/,
    /\bdinner\b/,
    /\bbreakfast\b/,
    /\bpetisc/,
    /\brefei/,
    /\bsnack\b/,
    /\bpour manger\b/,
    /\bpara comer\b/,
  ],
  rest: [
    /\bdescans/,
    /\brepous/,
    /\brest(?:ing)?\b/,
    /\bdormir\b/,
    /\bsleep\b/,
    /\brelax/,
    /\bpara descansar\b/,
    /\bpour (?:se )?reposer\b/,
    /\bse reposer\b/,
  ],
  go_home: [
    /\bvoltar.*casa\b/,
    /\brentrer\b/,
    /\bgo home\b/,
    /\bretornar\b/,
    /\bpartir\b/,
  ],
  order_more: [
    /\bpedir outro\b/,
    /\bcommander\b/,
    /\border (?:another|more)\b/,
    /\bpedir mais\b/,
  ],
  buy: [/\bcomprar\b/, /\bacheter\b/, /\bbuy(?:ing)?\b/],
  pay: [/\bpagar\b/, /\bpayer\b/, /\bpay(?:ing)?\b/],
  wait: [/\besperar\b/, /\battendre\b/, /\bwait(?:ing)?\b/],
};

/** Pairs of intents that must not be swapped in a single comprehension answer. */
const MUTUALLY_EXCLUSIVE: [SemanticBucket, SemanticBucket][] = [
  ['eat', 'rest'],
  ['go_home', 'eat'],
  ['order_more', 'go_home'],
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectBuckets(text: string): Set<SemanticBucket> {
  const normalized = normalize(text);
  const buckets = new Set<SemanticBucket>();
  for (const [bucket, patterns] of Object.entries(BUCKET_PATTERNS) as [SemanticBucket, RegExp[]][]) {
    if (patterns.some((pattern) => pattern.test(normalized))) {
      buckets.add(bucket);
    }
  }
  return buckets;
}

function extractQuotedPhrases(text: string): string[] {
  return [...text.matchAll(/['"]([^'"]{3,})['"]/g)].map((match) => match[1]);
}

function tokenOverlapRatio(a: string, b: string): number {
  const tokensA = new Set(normalize(a).split(' ').filter(Boolean));
  const tokensB = normalize(b).split(' ').filter(Boolean);
  if (tokensB.length === 0) return 0;
  let matched = 0;
  for (const token of tokensB) {
    if (tokensA.has(token)) matched++;
  }
  return matched / tokensB.length;
}

export interface McqConsistencyInput {
  correctOption: string;
  explanation: string;
  /** dialogueAudio, audioText, or other source the answer must reflect */
  sourceText?: string;
}

/**
 * Returns true when the marked correct option matches the explanation and
 * optional audio/dialogue source on actionable meaning (eat vs rest, etc.).
 */
export function isMcqAnswerConsistent(input: McqConsistencyInput): boolean {
  const { correctOption, explanation, sourceText } = input;
  if (!correctOption?.trim() || !explanation?.trim()) return false;

  const answerBuckets = detectBuckets(correctOption);
  const truthBuckets = new Set<SemanticBucket>([
    ...detectBuckets(explanation),
    ...extractQuotedPhrases(explanation).flatMap((phrase) => [...detectBuckets(phrase)]),
    ...(sourceText ? [...detectBuckets(sourceText)] : []),
  ]);

  if (truthBuckets.size === 0) return true;

  for (const [bucketA, bucketB] of MUTUALLY_EXCLUSIVE) {
    const truthHasA = truthBuckets.has(bucketA);
    const truthHasB = truthBuckets.has(bucketB);
    const answerHasA = answerBuckets.has(bucketA);
    const answerHasB = answerBuckets.has(bucketB);

    if (truthHasA && !truthHasB && answerHasB && !answerHasA) return false;
    if (truthHasB && !truthHasA && answerHasA && !answerHasB) return false;
  }

  return true;
}

export function isListenAndSelectConsistent(
  audioText: string,
  options: string[],
  correctIndex: number,
): boolean {
  const correct = options[correctIndex]?.trim();
  if (!correct || !audioText?.trim()) return false;
  if (normalize(correct) === normalize(audioText)) return true;
  return tokenOverlapRatio(correct, audioText) >= 0.9;
}

export interface CheckpointComprehensionInput {
  questionPt: string;
  options: string[];
  correctIndex: number;
  explanationPt: string;
  dialogueAudio: string;
}

export function isCheckpointComprehensionConsistent(
  input: CheckpointComprehensionInput,
): boolean {
  const correctOption = input.options[input.correctIndex];
  if (!correctOption) return false;
  return isMcqAnswerConsistent({
    correctOption,
    explanation: input.explanationPt,
    sourceText: input.dialogueAudio,
  });
}
