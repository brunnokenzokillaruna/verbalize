import { callGeminiJSON } from '@/services/gemini';
import {
  buildTranslationCorrections,
  type RawModelCorrection,
  type TranslationCorrection,
} from '@/lib/reverseTranslationCorrections';
import type { ReverseTranslationVerdict } from '@/lib/reverseTranslationValidate';

export interface ReverseTranslationAiResult {
  accepted: boolean;
  verdict: ReverseTranslationVerdict;
  note?: string;
  correctedSentence?: string;
  corrections?: TranslationCorrection[];
}

interface GeminiPayload {
  verdict: ReverseTranslationVerdict;
  feedback: string;
  corrections?: RawModelCorrection[];
  correctedSentence?: string;
}

const SYSTEM_PROMPT = `You grade a Brazilian Portuguese learner's translation into the target language.

Return ONLY valid JSON:
{
  "verdict": "exact" | "acceptable" | "soft" | "wrong",
  "feedback": "1-2 short sentences in Brazilian Portuguese",
  "corrections": [{ "learner": "exact text the learner wrote", "correct": "what it should be", "why": "≤14 words in PT-BR" }],
  "correctedSentence": "optional — the LEARNER's sentence with fixes applied"
}

Verdict rules:
- exact: same meaning and essentially the same wording as a reference (ignore punctuation/capitalization).
- acceptable: same meaning with valid synonyms or equivalent phrasing, and NO form fixes needed. Count as SUCCESS. Omit correctedSentence (or repeat the learner text).
- soft: meaning is preserved but there are form issues (accents, apostrophes/elision, articles de/du/des, minor spelling, minor word order). Count as SUCCESS.
- wrong: meaning changed, key word wrong, wrong tense that changes meaning, incomplete, wrong language, or unrelated. Count as FAIL.

corrections rules (apply to BOTH soft and wrong — critical):
- One entry for EVERY difference between the learner's sentence and correctedSentence that a learner should understand. Do not stop at the first or the most interesting one.
- Order by severity: the difference that breaks the meaning comes first.
- "learner" MUST be copied verbatim from the learner's answer, as one contiguous stretch, so it can be located in their text. For something they omitted entirely, use an empty string.
- When the learner's wording means something different, say what it actually means in "why". Example: learner wrote "à côté du projet" → "why": "isso quer dizer 'ao lado do projeto', não 'por fora'".
- NEVER leave a wrong preposition, contraction or article unmentioned just because a bigger error exists.

feedback rules:
- Comment only on what the learner actually wrote. Details belong in corrections, so keep feedback to the overall picture.
- Do NOT paste a model answer as the whole explanation.

correctedSentence:
- soft: the LEARNER's own sentence with ONLY those fixes applied — keep their structure and word choice.
- wrong: the closest correct sentence that still preserves the Portuguese meaning.

Meaning traps (ALWAYS wrong, never soft):
- Intensity: "trop" (too) ≠ "très"/"muito" (very); "peu" ≠ "un peu" when sense changes.
- Polarity / negation errors.
- Wrong day/time that changes the proposition.

Be encouraging but honest. Prefer soft over wrong for tiny form issues. Prefer wrong over soft when meaning drifts.`;

export async function evaluateReverseTranslationGemini(params: {
  userAnswer: string;
  expectedAnswer: string;
  portugueseSentence: string;
  language: string;
  acceptableVariants?: string[];
}): Promise<ReverseTranslationAiResult | null> {
  const lang = params.language === 'en' ? 'English' : 'French';
  const variants = (params.acceptableVariants ?? []).filter(Boolean);
  const variantsBlock =
    variants.length > 0
      ? `Other acceptable references:\n${variants.map((v) => `- ${v}`).join('\n')}`
      : 'Other acceptable references: (none)';

  const prompt = `Target language: ${lang}

Portuguese source (meaning to preserve): "${params.portugueseSentence}"
Primary reference translation: "${params.expectedAnswer}"
${variantsBlock}

Learner answer: "${params.userAnswer.trim()}"

Grade the learner answer.`;

  try {
    const raw = await callGeminiJSON<GeminiPayload>(prompt, SYSTEM_PROMPT, 640, 0, 'lightweight');
    if (!raw || typeof raw.verdict !== 'string' || typeof raw.feedback !== 'string') {
      return null;
    }

    const verdict = normalizeVerdict(raw.verdict);
    if (!verdict) return null;

    const accepted = verdict === 'exact' || verdict === 'acceptable' || verdict === 'soft';
    const feedback = raw.feedback.trim();
    const correctedSentence = raw.correctedSentence?.trim() || undefined;

    const corrections =
      verdict === 'soft' || verdict === 'wrong'
        ? buildTranslationCorrections({
            learnerAnswer: params.userAnswer,
            correctedSentence: correctedSentence || params.expectedAnswer,
            feedback,
            modelCorrections: raw.corrections,
          })
        : [];

    return {
      accepted,
      verdict,
      note: feedback || undefined,
      correctedSentence,
      corrections: corrections.length > 0 ? corrections : undefined,
    };
  } catch (err) {
    console.warn('[evaluateReverseTranslationGemini] failed:', err);
    return null;
  }
}

function normalizeVerdict(value: string): ReverseTranslationVerdict | null {
  const v = value.trim().toLowerCase();
  if (v === 'exact' || v === 'acceptable' || v === 'soft' || v === 'wrong') return v;
  return null;
}
