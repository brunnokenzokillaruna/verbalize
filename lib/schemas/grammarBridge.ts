import { z } from 'zod';
import type { GrammarBridgeResult, SupportedLanguage } from '@/types';
import { sanitizeBridgeExample } from '@/lib/grammarBridgeValidation';
import { stripUndefinedDeep } from '@/utils/stripUndefined';

const wordLimit = (max: number) =>
  z.string().transform((s) => {
    const words = s.trim().split(/\s+/);
    return words.length <= max ? s.trim() : words.slice(0, max).join(' ');
  });

const bridgeRowSchema = z.object({
  portuguese: z.string(),
  target: z.string(),
  difference: wordLimit(15).optional().default(''),
});

const brazilianTrapSchema = z.union([
  z.string(),
  z.object({
    wrong: z.string(),
    right: z.string(),
    explanation: wordLimit(30),
    subtitle: z.string().optional(),
    wrongPortuguese: z.string().optional(),
    rightPortuguese: z.string().optional(),
  }),
]);

const formulaExampleSchema = z.object({
  target: z.string(),
  portuguese: z.string(),
});

const structureFormulaItemSchema = z.object({
  label: z.string(),
  formula: z.string(),
  hint: wordLimit(20).optional(),
  example: formulaExampleSchema.optional(),
});

const retentionCheckSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2).max(4),
  correctIndex: z.number().int().min(0),
});

export const grammarBridgeSchema = z
  .object({
    insight: z.string().optional(),
    explanation: z.union([z.string(), z.array(z.string())]).optional(),
    survivalTip: wordLimit(12).optional(),
    culturalNote: wordLimit(15).optional(),
    structureFormula: z.string().optional(),
    structureFormulas: z.array(structureFormulaItemSchema).optional(),
    formulaExample: formulaExampleSchema.optional(),
    bridge: bridgeRowSchema.optional(),
    dialogueExample: z
      .object({
        target: z.string(),
        portuguese: z.string(),
      })
      .optional(),
    additionalExamples: z
      .array(z.object({ target: z.string(), portuguese: z.string() }))
      .max(1)
      .optional(),
    items: z
      .array(
        z.object({
          target: z.string(),
          portuguese: z.string(),
          logic: z.string().optional(),
        }),
      )
      .max(3)
      .optional(),
    brazilianTrap: brazilianTrapSchema.optional(),
    usageContext: z.string().optional(),
    patterns: z
      .array(
        z.object({
          label: z.string(),
          target: z.string(),
          portuguese: z.string(),
        }),
      )
      .max(2)
      .optional(),
    verbSpotlight: z
      .object({
        infinitive: z.string(),
        meaning: z.string(),
        personality: wordLimit(15),
        frequencyNote: wordLimit(12).optional(),
        idiomaticExpressions: z
          .array(z.object({ target: z.string(), portuguese: z.string() }))
          .max(2)
          .optional(),
        conjugationPreview: z
          .array(z.object({ pronoun: z.string(), form: z.string() }))
          .optional(),
      })
      .optional(),
    retentionCheck: retentionCheckSchema.optional(),
    rule: z.string().optional(),
    targetExample: z.string().optional(),
    portugueseComparison: z.string().optional(),
  })
  .passthrough();

function toExplanationArray(
  explanation: string | string[] | undefined,
): string[] | null {
  if (!explanation) return null;
  if (Array.isArray(explanation)) {
    return explanation.map((s) => s.trim()).filter(Boolean).slice(0, 2);
  }
  const sentences = explanation
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 1) return [explanation.trim()];
  return sentences.slice(0, 2);
}

function normalizeTrap(
  trap: GrammarBridgeResult['brazilianTrap'],
): {
  wrong: string;
  right: string;
  explanation: string;
  subtitle?: string;
  wrongPortuguese?: string;
  rightPortuguese?: string;
} | null {
  if (!trap) return null;
  if (typeof trap === 'string') {
    return { wrong: '', right: '', explanation: trap };
  }
  return {
    wrong: trap.wrong ?? '',
    right: trap.right ?? '',
    explanation: trap.explanation ?? '',
    subtitle: trap.subtitle,
    wrongPortuguese: trap.wrongPortuguese,
    rightPortuguese: trap.rightPortuguese,
  };
}

/** Validates and normalizes AI-generated grammar bridge content. */
export function normalizeGrammarBridgeResult(
  raw: GrammarBridgeResult | null | undefined,
  language: SupportedLanguage = 'fr',
): GrammarBridgeResult | null {
  if (!raw) return null;

  const parsed = grammarBridgeSchema.safeParse(raw);
  const data = parsed.success ? parsed.data : raw;

  const hasNewFormat =
    data.insight ||
    data.items ||
    data.bridge ||
    data.brazilianTrap ||
    data.patterns ||
    data.structureFormula ||
    data.structureFormulas;

  if (!hasNewFormat && data.rule) {
    return stripUndefinedDeep({
      insight: data.rule,
      dialogueExample:
        data.targetExample && data.portugueseComparison
          ? { target: data.targetExample, portuguese: data.portugueseComparison }
          : undefined,
      additionalExamples: data.additionalExamples ?? [],
    }) as GrammarBridgeResult;
  }

  const retentionCheck = data.retentionCheck;
  const safeRetention =
    retentionCheck &&
    retentionCheck.options.length >= 2 &&
    retentionCheck.correctIndex < retentionCheck.options.length
      ? retentionCheck
      : undefined;

  const normalized: GrammarBridgeResult = stripUndefinedDeep({
    insight: data.insight,
    explanation: toExplanationArray(data.explanation) ?? undefined,
    survivalTip: data.survivalTip,
    culturalNote: data.culturalNote,
    structureFormula: data.structureFormula,
    structureFormulas: data.structureFormulas,
    formulaExample: data.formulaExample,
    bridge: data.bridge,
    dialogueExample: data.dialogueExample,
    additionalExamples: (data.additionalExamples ?? []).slice(0, 1),
    items: data.items?.slice(0, 3)?.map((item) =>
      stripUndefinedDeep({
        target: item.target,
        portuguese: item.portuguese,
        logic: item.logic,
      }),
    ),
    brazilianTrap: normalizeTrap(data.brazilianTrap) ?? undefined,
    usageContext: data.usageContext,
    patterns: data.patterns?.slice(0, 2),
    verbSpotlight: data.verbSpotlight,
    retentionCheck: safeRetention,
  }) as GrammarBridgeResult;

  normalized.bridge = sanitizeBridgeExample(normalized, language);
  return normalized;
}
