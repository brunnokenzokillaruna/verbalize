import { callGeminiJSON } from '@/services/gemini';
import type { ReverseTranslationVerdict } from '@/lib/reverseTranslationValidate';

export interface ReverseTranslationAiResult {
  accepted: boolean;
  verdict: ReverseTranslationVerdict;
  note?: string;
  correctedSentence?: string;
}

interface GeminiPayload {
  verdict: ReverseTranslationVerdict;
  feedback: string;
  correctedSentence?: string;
}

const SYSTEM_PROMPT = `You grade a Brazilian Portuguese learner's translation into the target language.

Return ONLY valid JSON:
{
  "verdict": "exact" | "acceptable" | "soft" | "wrong",
  "feedback": "1-2 short sentences in Brazilian Portuguese",
  "correctedSentence": "optional natural target-language sentence"
}

Verdict rules:
- exact: same meaning and essentially the same wording as a reference (ignore punctuation/capitalization).
- acceptable: same meaning with valid synonyms, natural word-order variants, or equivalent phrasing. Count as SUCCESS.
- soft: meaning is preserved but there are minor form issues the learner should notice (missing/extra article, minor word order, small spelling, accent, register). Count as SUCCESS, but feedback MUST point out what to improve. Set correctedSentence to a polished version.
- wrong: meaning changed, key word wrong, wrong tense/aspect that changes meaning, incomplete, wrong language, or unrelated. Count as FAIL. feedback explains the main error; correctedSentence = best model translation.

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
    const raw = await callGeminiJSON<GeminiPayload>(prompt, SYSTEM_PROMPT, 320, 0, 'lightweight');
    if (!raw || typeof raw.verdict !== 'string' || typeof raw.feedback !== 'string') {
      return null;
    }

    const verdict = normalizeVerdict(raw.verdict);
    if (!verdict) return null;

    const accepted = verdict === 'exact' || verdict === 'acceptable' || verdict === 'soft';
    return {
      accepted,
      verdict,
      note: raw.feedback.trim() || undefined,
      correctedSentence: raw.correctedSentence?.trim() || undefined,
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
