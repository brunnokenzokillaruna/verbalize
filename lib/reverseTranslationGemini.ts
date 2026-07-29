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
  "correctedSentence": "optional — the LEARNER's sentence with fixes applied"
}

Verdict rules:
- exact: same meaning and essentially the same wording as a reference (ignore punctuation/capitalization).
- acceptable: same meaning with valid synonyms or equivalent phrasing, and NO form fixes needed. Count as SUCCESS. Omit correctedSentence (or repeat the learner text).
- soft: meaning is preserved but there are form issues (accents, apostrophes/elision, articles de/du/des, minor spelling, minor word order). Count as SUCCESS.
- wrong: meaning changed, key word wrong, wrong tense that changes meaning, incomplete, wrong language, or unrelated. Count as FAIL.

SOFT feedback rules (critical):
- feedback MUST list the concrete mistakes by quoting learner form → correct form.
  Example: "Corrija: mange → mangé; q'un → qu'un; du pain → de pain; je etais → j'étais; fatigue → fatigué."
- Do NOT give only a vague "versão mais natural" or paste a model answer without naming the errors.
- correctedSentence MUST be the LEARNER's own sentence with ONLY those fixes applied — keep their structure and word choice. NEVER replace it with a different model translation from the reference when the learner's structure already works.
- Prefer "soft" (not "acceptable") whenever accents, apostrophes, articles, or spelling need fixing.

WRONG feedback:
- Explain the main meaning error; correctedSentence may be the best reference translation.

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
