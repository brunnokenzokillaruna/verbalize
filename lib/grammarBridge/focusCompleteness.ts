/**
 * Ensures Grammar Bridge covers EVERY term named in grammarFocus
 * (e.g. "Amener e Emmener", "Apporter VS Emporter") — not just the first one.
 */

import type { GrammarBridgeResult } from '@/types';

const FOCUS_PREFIX =
  /^(Vocabulário|Vocabulary|Par de Confusão|Confusion pair|Narrativa|Narrative|Expressões|Expressions|Gramática|Grammar|Fonética|Phonetics)\s*:\s*/i;

/** Portuguese theme phrases that are NOT target-language lemmas to teach. */
const PT_THEME_NOISE =
  /^(roupas|acessórios|baixo|cima|números|grande|ordinais|rankings|passaporte|visto|aduana)/i;

function stripFocusPrefix(grammarFocus: string): string {
  return grammarFocus.replace(FOCUS_PREFIX, '').trim();
}

function looksLikeTeachableLemma(term: string): boolean {
  const t = term.trim();
  if (t.length < 2 || t.split(/\s+/).length > 4) return false;
  if (PT_THEME_NOISE.test(t)) return false;
  return /^[A-Za-zÀ-ÿ'’-]+(?:\s+[A-Za-zÀ-ÿ'’-]+)*$/.test(t);
}

/**
 * Extract contrast / list terms the lesson must teach in full.
 * Returns [] when the focus is a single rule (no multi-term completeness).
 */
export function extractRequiredFocusTerms(grammarFocus: string): string[] {
  const raw = stripFocusPrefix(grammarFocus);
  if (!raw) return [];

  if (/\bVS\b/i.test(raw)) {
    return raw
      .split(/\s+VS\s+/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 4);
  }

  if (raw.includes(',')) {
    const parts = raw
      .split(/\s*,\s*|\s+e\s+/i)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2 && parts.length <= 5 && parts.every(looksLikeTeachableLemma)) {
      return parts.slice(0, 5);
    }
  }

  const ePair = raw.match(
    /^([A-Za-zÀ-ÿ'’-]+(?:\s+[A-Za-zÀ-ÿ'’-]+){0,3})\s+e\s+([A-Za-zÀ-ÿ'’-]+(?:\s+[A-Za-zÀ-ÿ'’-]+){0,3})$/i,
  );
  if (ePair) {
    const left = ePair[1].trim();
    const right = ePair[2].trim();
    if (looksLikeTeachableLemma(left) && looksLikeTeachableLemma(right)) {
      return [left, right];
    }
  }

  return [];
}

function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .normalize('NFC');
}

/** Loose match: full term or verb stem (amener → amen/amene/amène…). */
export function termAppearsInText(term: string, corpus: string): boolean {
  const hay = fold(corpus);
  const needle = fold(term).trim();
  if (!needle) return true;
  if (hay.includes(needle)) return true;

  // Multi-word: require each significant token
  const tokens = needle.split(/\s+/).filter((w) => w.length > 2);
  if (tokens.length > 1) {
    return tokens.every((tok) => hay.includes(tok));
  }

  // -er verbs: match stem so conjugations count
  if (needle.endsWith('er') && needle.length > 4) {
    const stem = needle.slice(0, -2);
    if (stem.length >= 3 && hay.includes(stem)) return true;
  }

  return false;
}

/** Aggregate all learner-facing teaching fields into one corpus. */
export function collectBridgeTeachingCorpus(bridge: GrammarBridgeResult): string {
  const parts: string[] = [];

  const push = (value: string | undefined | null) => {
    if (value?.trim()) parts.push(value);
  };

  push(bridge.insight);
  push(bridge.analogy);
  push(bridge.survivalTip);
  push(bridge.usageContext);
  push(bridge.culturalNote);
  push(bridge.structureFormula);

  if (Array.isArray(bridge.explanation)) {
    bridge.explanation.forEach((line) => push(line));
  } else {
    push(bridge.explanation);
  }

  push(bridge.bridge?.portuguese);
  push(bridge.bridge?.target);
  push(bridge.bridge?.difference);
  push(bridge.dialogueExample?.target);
  push(bridge.dialogueExample?.portuguese);

  bridge.structureFormulas?.forEach((f) => {
    push(f.label);
    push(f.formula);
    push(f.hint);
    push(f.example?.target);
    push(f.example?.portuguese);
  });

  bridge.patterns?.forEach((p) => {
    push(p.label);
    push(p.target);
    push(p.portuguese);
  });

  bridge.additionalExamples?.forEach((ex) => {
    push(ex.target);
    push(ex.portuguese);
  });

  bridge.items?.forEach((item) => {
    push(item.target);
    push(item.portuguese);
    push(item.logic);
  });

  const trap = typeof bridge.brazilianTrap === 'object' ? bridge.brazilianTrap : null;
  if (trap) {
    push(trap.wrong);
    push(trap.right);
    push(trap.explanation);
    push(trap.wrongPortuguese);
    push(trap.rightPortuguese);
  }

  const quiz = bridge.retentionCheck;
  if (quiz) {
    push(quiz.question);
    quiz.options?.forEach((o) => push(o));
  }

  return parts.join('\n');
}

export type FocusCompletenessIssue = {
  field: string;
  problem: string;
  fixHint: string;
  missingTerms: string[];
};

/**
 * Returns an issue when grammarFocus names 2+ terms and at least one is absent
 * from the teaching corpus.
 */
export function findMissingFocusTerms(
  bridge: GrammarBridgeResult,
  grammarFocus: string,
): FocusCompletenessIssue | null {
  const required = extractRequiredFocusTerms(grammarFocus);
  if (required.length < 2) return null;

  const corpus = collectBridgeTeachingCorpus(bridge);
  const missing = required.filter((term) => !termAppearsInText(term, corpus));
  if (missing.length === 0) return null;

  return {
    field: 'focusCompleteness',
    problem: `Lesson omits required focus term(s): ${missing.join(', ')} (focus requires: ${required.join(' + ')})`,
    fixHint: `Teach EVERY term from the focus. Missing: ${missing.join(', ')}. For VOC use items[] with one entry per term; for GRAM use structureFormulas or contrasting patterns; cite all terms in insight.`,
    missingTerms: missing,
  };
}

/** Prompt block injected into Grammar Bridge generation when focus is multi-term. */
export function buildFocusCompletenessPromptBlock(grammarFocus: string): string {
  const terms = extractRequiredFocusTerms(grammarFocus);
  if (terms.length < 2) return '';

  const list = terms.map((t, i) => `${i + 1}. ${t}`).join('\n');

  return `
⚠️ COMPLETUDE DO TEMA — OBRIGATÓRIA (não ensine só metade) ⚠️
O grammarFocus "${grammarFocus}" exige ensinar TODOS estes itens (não só o primeiro):
${list}

Regras:
- VOC / EXPR: preencha "items" com EXATAMENTE um item por termo acima (target = o termo ou frase curta usando-o; portuguese = significado; logic = quando usar / diferença).
- GRAM / Par de Confusão: use "structureFormulas" com um bloco por termo OU "patterns" contrastando os termos; insight DEVE citar TODOS.
- brazilianTrap e retentionCheck devem testar a CONFUSÃO entre eles (não só um).
- É PROIBIDO gerar uma lição que só explica o primeiro termo e ignora o(s) outro(s) — isso será rejeitado e regenerado.
`;
}
