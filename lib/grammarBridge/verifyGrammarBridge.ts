/**
 * Linguistic accuracy gate for Grammar Bridge generation.
 *
 * Goal: the AI must not teach wrong French/English. Local guards catch structural
 * lies; a Gemini verifier catches semantic/grammar lies; callers regenerate with
 * feedback. Prefer correction over shipping — null only after retries fail.
 */

import type { GrammarBridgeResult, SupportedLanguage } from '@/types';
import {
  looksLikeMetaExplanation,
  looksLikePortugueseInTargetField,
} from '@/lib/grammarBridgeValidation';

export type BridgeIssueSeverity = 'core' | 'secondary';

export type BridgeIssue = {
  field: string;
  problem: string;
  fixHint?: string;
  severity: BridgeIssueSeverity;
};

export type BridgeVerificationResult = {
  ok: boolean;
  issues: BridgeIssue[];
  /** Bridge with secondary bad fields stripped (when core is ok). */
  sanitized?: GrammarBridgeResult;
};

type Claim = {
  id: string;
  field: string;
  severity: BridgeIssueSeverity;
  claim: string;
};

type VerifierVerdict = {
  id: string;
  ok: boolean;
  reason?: string;
  fixHint?: string;
};

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

function stripHighlights(text: string): string {
  return text.replace(/\^\^/g, '').trim();
}

function norm(s: string): string {
  return stripHighlights(s).toLowerCase().normalize('NFC').trim();
}

function targetFieldIssues(
  field: string,
  text: string | undefined,
  language: SupportedLanguage,
  severity: BridgeIssueSeverity,
): BridgeIssue[] {
  if (!text?.trim()) return [];
  const clean = stripHighlights(text);
  if (looksLikeMetaExplanation(clean) || looksLikePortugueseInTargetField(clean, language)) {
    return [
      {
        field,
        severity,
        problem: `${field} looks like Portuguese meta-explanation or mixed PT in the target language`,
        fixHint: `Rewrite ${field} as a pure, grammatical ${LANG_LABEL[language]} sentence (no Portuguese words).`,
      },
    ];
  }
  return [];
}

/**
 * Deterministic structural / format guards. Does not judge linguistic correctness.
 */
export function collectLocalBridgeIssues(
  bridge: GrammarBridgeResult,
  language: SupportedLanguage,
): BridgeIssue[] {
  const issues: BridgeIssue[] = [];

  if (bridge.bridge?.target) {
    issues.push(...targetFieldIssues('bridge.target', bridge.bridge.target, language, 'core'));
  }
  if (bridge.bridge && (!bridge.bridge.portuguese?.trim() || !bridge.bridge.target?.trim())) {
    issues.push({
      field: 'bridge',
      severity: 'core',
      problem: 'bridge is missing portuguese or target sentence',
      fixHint: 'Provide parallel PT-BR and target example sentences in bridge.',
    });
  }

  if (bridge.dialogueExample?.target) {
    issues.push(
      ...targetFieldIssues('dialogueExample.target', bridge.dialogueExample.target, language, 'secondary'),
    );
  }

  bridge.patterns?.forEach((p, i) => {
    issues.push(...targetFieldIssues(`patterns[${i}].target`, p.target, language, 'secondary'));
  });

  bridge.additionalExamples?.forEach((ex, i) => {
    issues.push(
      ...targetFieldIssues(`additionalExamples[${i}].target`, ex.target, language, 'secondary'),
    );
  });

  bridge.structureFormulas?.forEach((f, i) => {
    if (f.example?.target) {
      issues.push(
        ...targetFieldIssues(
          `structureFormulas[${i}].example.target`,
          f.example.target,
          language,
          'core',
        ),
      );
    }
  });

  if (bridge.formulaExample?.target) {
    issues.push(
      ...targetFieldIssues('formulaExample.target', bridge.formulaExample.target, language, 'core'),
    );
  }

  const trap = typeof bridge.brazilianTrap === 'object' ? bridge.brazilianTrap : null;
  if (trap) {
    if (trap.right?.trim()) {
      issues.push(...targetFieldIssues('brazilianTrap.right', trap.right, language, 'core'));
    }
    if (trap.wrong?.trim() && trap.right?.trim() && norm(trap.wrong) === norm(trap.right)) {
      issues.push({
        field: 'brazilianTrap',
        severity: 'core',
        problem: 'brazilianTrap.wrong and brazilianTrap.right are identical',
        fixHint: 'wrong must be the classic Brazilian mistake; right must be the correct target sentence.',
      });
    }
    if (!trap.right?.trim() && trap.wrong?.trim()) {
      issues.push({
        field: 'brazilianTrap.right',
        severity: 'core',
        problem: 'brazilianTrap.right is empty while wrong is set',
        fixHint: 'Provide the correct target-language sentence in brazilianTrap.right.',
      });
    }
  }

  const quiz = bridge.retentionCheck;
  if (quiz) {
    if (
      !Array.isArray(quiz.options) ||
      quiz.options.length < 2 ||
      quiz.correctIndex < 0 ||
      quiz.correctIndex >= quiz.options.length
    ) {
      issues.push({
        field: 'retentionCheck',
        severity: 'core',
        problem: 'retentionCheck has invalid options or correctIndex',
        fixHint: 'Provide 2–4 options and a correctIndex pointing to the truly correct option.',
      });
    } else {
      const marked = quiz.options[quiz.correctIndex];
      // Options may be PT or target — only flag PT-mix when the option looks like target lang
      if (marked && /[àâäéèêëïîôùûüçœæ]|^(je|tu|il|elle|nous|vous|ils|I |You |He |She )/i.test(marked)) {
        issues.push(...targetFieldIssues('retentionCheck.correctOption', marked, language, 'core'));
      }
    }
  }

  const formulas = bridge.structureFormulas ?? [];
  if (formulas.length >= 2 && bridge.insight) {
    const insightNorm = norm(bridge.insight);
    const uncovered = formulas.filter((f) => {
      const labelWords = f.label
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
      // Heuristic: if label has distinctive words and none appear in insight, flag soft completeness
      if (labelWords.length === 0) return false;
      return !labelWords.some((w) => insightNorm.includes(w));
    });
    // Only flag when ALL extra formulas seem uncovered (likely omitted a whole use)
    if (uncovered.length === formulas.length) {
      issues.push({
        field: 'insight',
        severity: 'secondary',
        problem: 'insight may not cover all structureFormulas uses',
        fixHint: 'Mention every distinct use from structureFormulas in the insight (max 2 short sentences).',
      });
    }
  }

  bridge.verbSpotlight?.conjugationPreview?.forEach((c, i) => {
    if (c.form) {
      issues.push(
        ...targetFieldIssues(
          `verbSpotlight.conjugationPreview[${i}].form`,
          c.form,
          language,
          'core',
        ),
      );
    }
  });

  bridge.verbSpotlight?.idiomaticExpressions?.forEach((ex, i) => {
    issues.push(
      ...targetFieldIssues(
        `verbSpotlight.idiomaticExpressions[${i}].target`,
        ex.target,
        language,
        'secondary',
      ),
    );
  });

  return issues;
}

/** Strip secondary-issue fields so a mostly-good bridge can still ship. */
export function stripSecondaryIssues(
  bridge: GrammarBridgeResult,
  issues: BridgeIssue[],
): GrammarBridgeResult {
  const next: GrammarBridgeResult = { ...bridge };
  const secondaryFields = new Set(
    issues.filter((i) => i.severity === 'secondary').map((i) => i.field),
  );

  if ([...secondaryFields].some((f) => f.startsWith('patterns['))) {
    next.patterns = next.patterns?.filter((_, i) => !secondaryFields.has(`patterns[${i}].target`));
    if (next.patterns?.length === 0) delete next.patterns;
  }
  if ([...secondaryFields].some((f) => f.startsWith('additionalExamples['))) {
    next.additionalExamples = next.additionalExamples?.filter(
      (_, i) => !secondaryFields.has(`additionalExamples[${i}].target`),
    );
    if (next.additionalExamples?.length === 0) delete next.additionalExamples;
  }
  if (secondaryFields.has('dialogueExample.target')) {
    delete next.dialogueExample;
  }
  if ([...secondaryFields].some((f) => f.startsWith('verbSpotlight.idiomaticExpressions['))) {
    if (next.verbSpotlight) {
      next.verbSpotlight = {
        ...next.verbSpotlight,
        idiomaticExpressions: next.verbSpotlight.idiomaticExpressions?.filter(
          (_, i) => !secondaryFields.has(`verbSpotlight.idiomaticExpressions[${i}].target`),
        ),
      };
    }
  }

  return next;
}

export function extractBridgeClaims(
  bridge: GrammarBridgeResult,
  language: SupportedLanguage,
): Claim[] {
  const lang = LANG_LABEL[language];
  const claims: Claim[] = [];

  if (bridge.bridge?.target) {
    claims.push({
      id: 'bridge.target',
      field: 'bridge.target',
      severity: 'core',
      claim: `RIGHT ${lang} example (must be grammatical): "${stripHighlights(bridge.bridge.target)}" (PT parallel: "${stripHighlights(bridge.bridge.portuguese)}")`,
    });
  }

  if (bridge.insight) {
    claims.push({
      id: 'insight',
      field: 'insight',
      severity: 'core',
      claim: `Teaching claim in PT-BR (must not state a false ${lang} rule): "${bridge.insight}"`,
    });
  }

  const trap = typeof bridge.brazilianTrap === 'object' ? bridge.brazilianTrap : null;
  if (trap?.right || trap?.wrong) {
    claims.push({
      id: 'brazilianTrap',
      field: 'brazilianTrap',
      severity: 'core',
      claim: `TRAP: wrong="${trap.wrong ?? ''}" must be incorrect ${lang}; right="${trap.right ?? ''}" must be correct ${lang}. PT wrong="${trap.wrongPortuguese ?? ''}" PT right="${trap.rightPortuguese ?? ''}"`,
    });
  }

  if (bridge.formulaExample?.target) {
    claims.push({
      id: 'formulaExample',
      field: 'formulaExample.target',
      severity: 'core',
      claim: `RIGHT ${lang} formula example: "${bridge.formulaExample.target}"`,
    });
  }

  bridge.structureFormulas?.forEach((f, i) => {
    if (f.example?.target) {
      claims.push({
        id: `structureFormulas[${i}]`,
        field: `structureFormulas[${i}].example.target`,
        severity: 'core',
        claim: `RIGHT ${lang} for formula "${f.label}": "${f.example.target}"`,
      });
    }
  });

  bridge.patterns?.forEach((p, i) => {
    claims.push({
      id: `patterns[${i}]`,
      field: `patterns[${i}].target`,
      severity: 'secondary',
      claim: `RIGHT ${lang} pattern "${p.label}": "${p.target}"`,
    });
  });

  bridge.additionalExamples?.forEach((ex, i) => {
    claims.push({
      id: `additionalExamples[${i}]`,
      field: `additionalExamples[${i}].target`,
      severity: 'secondary',
      claim: `RIGHT ${lang} extra example: "${ex.target}"`,
    });
  });

  const quiz = bridge.retentionCheck;
  if (quiz?.options?.length && quiz.correctIndex >= 0 && quiz.correctIndex < quiz.options.length) {
    claims.push({
      id: 'retentionCheck',
      field: 'retentionCheck',
      severity: 'core',
      claim: `QUIZ question="${quiz.question}" markedCorrect(index ${quiz.correctIndex})="${quiz.options[quiz.correctIndex]}" options=[${quiz.options.map((o, i) => `[${i}] ${o}`).join(' | ')}] — marked answer must be the truly correct one`,
    });
  }

  const conj = bridge.verbSpotlight?.conjugationPreview;
  if (conj?.length) {
    claims.push({
      id: 'conjugationPreview',
      field: 'verbSpotlight.conjugationPreview',
      severity: 'core',
      claim: `PRESENT conjugations of "${bridge.verbSpotlight?.infinitive ?? '?'}" must be correct: ${conj.map((c) => `${c.pronoun}=${c.form}`).join(', ')}`,
    });
  }

  return claims;
}

function buildVerifierPrompt(
  claims: Claim[],
  language: SupportedLanguage,
  grammarFocus: string,
): { systemPrompt: string; prompt: string } {
  const lang = LANG_LABEL[language];
  const systemPrompt = `You are a strict linguistic QA reviewer for a ${lang} learning app for Brazilian Portuguese speakers.
Your ONLY job: decide whether each teaching claim is linguistically accurate.
Respond with ONLY a JSON array. No markdown.`;

  const prompt = `Grammar focus: "${grammarFocus}"
Language: ${lang}

Review each claim. Set ok=true ONLY if the marked RIGHT / correct content is actually correct ${lang} (or a true teaching statement).

Mark ok=false when ANY of these apply:
1. A "RIGHT" target sentence is ungrammatical (gender, agreement, conjugation, word order, wrong preposition).
2. brazilianTrap.right is wrong OR brazilianTrap.wrong is actually correct.
3. Quiz correctIndex points to a wrong option, or the marked option teaches bad ${lang}.
4. Conjugation forms are incorrect for present tense.
5. insight asserts a false rule about ${lang}.

Be conservative on soft pedagogy wording: if unsure about insight style, ok=true. If clearly wrong grammar, ok=false.

Input:
${JSON.stringify(
    claims.map((c) => ({ id: c.id, field: c.field, claim: c.claim })),
    null,
    2,
  )}

Output JSON array:
[{ "id": "<same id>", "ok": true|false, "reason": "short English when ok=false", "fixHint": "how to fix when ok=false" }]`;

  return { systemPrompt, prompt };
}

/**
 * Gemini second-pass over factual claims. On API failure returns null (caller must not ship blindly).
 */
export async function verifyBridgeClaimsWithGemini(
  bridge: GrammarBridgeResult,
  language: SupportedLanguage,
  grammarFocus: string,
): Promise<BridgeIssue[] | null> {
  const claims = extractBridgeClaims(bridge, language);
  if (claims.length === 0) return [];

  try {
    const { callGeminiJSON } = await import('@/services/gemini');
    const { systemPrompt, prompt } = buildVerifierPrompt(claims, language, grammarFocus);
    const verdicts = await callGeminiJSON<VerifierVerdict[]>(
      prompt,
      systemPrompt,
      1200,
      undefined,
      'lightweight',
    );

    if (!Array.isArray(verdicts) || verdicts.length === 0) {
      console.warn('[verifyGrammarBridge] Empty verifier response');
      return null;
    }

    const byId = new Map<string, VerifierVerdict>();
    for (const v of verdicts) {
      if (typeof v?.id === 'string') byId.set(v.id, v);
    }

    const claimById = new Map(claims.map((c) => [c.id, c]));
    const issues: BridgeIssue[] = [];

    for (const claim of claims) {
      const verdict = byId.get(claim.id);
      if (!verdict || verdict.ok !== false) continue;
      issues.push({
        field: claim.field,
        severity: claim.severity,
        problem: verdict.reason ?? 'Marked as linguistically incorrect',
        fixHint: verdict.fixHint,
      });
    }

    // Unverified claims (omitted by model): treat as ok (conservative), except we still ran local guards
    void claimById;
    return issues;
  } catch (err) {
    console.warn('[verifyGrammarBridge] Verifier call failed:', err);
    return null;
  }
}

/**
 * Full gate: local + Gemini. Returns sanitized bridge when only secondary issues remain.
 */
export async function gateGrammarBridge(
  bridge: GrammarBridgeResult,
  language: SupportedLanguage,
  grammarFocus: string,
): Promise<BridgeVerificationResult> {
  const localIssues = collectLocalBridgeIssues(bridge, language);
  const geminiIssues = await verifyBridgeClaimsWithGemini(bridge, language, grammarFocus);

  if (geminiIssues === null) {
    // Verifier unavailable — do not ship unchecked core content
    return {
      ok: false,
      issues: [
        ...localIssues,
        {
          field: '_verifier',
          severity: 'core',
          problem: 'Linguistic verifier unavailable',
          fixHint: 'Regenerate the bridge carefully; all RIGHT fields must be correct.',
        },
      ],
    };
  }

  const issues = [...localIssues, ...geminiIssues];
  const coreIssues = issues.filter((i) => i.severity === 'core');
  const secondaryIssues = issues.filter((i) => i.severity === 'secondary');

  if (coreIssues.length > 0) {
    return { ok: false, issues };
  }

  if (secondaryIssues.length > 0) {
    return {
      ok: true,
      issues: secondaryIssues,
      sanitized: stripSecondaryIssues(bridge, secondaryIssues),
    };
  }

  return { ok: true, issues: [] };
}

/** Format issues for regenerate-with-feedback prompt. */
export function formatIssuesForRegen(issues: BridgeIssue[]): string {
  return issues
    .map(
      (i, n) =>
        `${n + 1}. [${i.severity}] ${i.field}: ${i.problem}${i.fixHint ? ` → ${i.fixHint}` : ''}`,
    )
    .join('\n');
}
