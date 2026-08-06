/**
 * Heuristics to avoid redundant pedagogical content across grammar bridge steps.
 */

import type { GrammarBridgeResult } from '@/types';

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(text: string): Set<string> {
  const normalized = normalizeText(text);
  if (!normalized) return new Set();
  return new Set(normalized.split(' ').filter((w) => w.length > 2));
}

/** Jaccard-like overlap between two texts (0–1). */
export function textOverlap(a: string, b: string): number {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const OVERLAP_THRESHOLD = 0.55;

/**
 * Returns explanation bullets that add information not already in insight + bridge.difference.
 */
export function filterUniqueExplanation(
  insight: string | undefined,
  difference: string | undefined,
  explanation: string | string[] | undefined,
): string[] {
  const base = [insight ?? '', difference ?? ''].filter(Boolean).join(' ');
  const items = Array.isArray(explanation)
    ? explanation
    : explanation
      ? [explanation]
      : [];

  return items
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((item) => textOverlap(item, base) < OVERLAP_THRESHOLD);
}

/**
 * Drop survivalTip when it mostly restates insight / difference / trap explanation.
 * Uses per-field Jaccard so a short mnemonic is not false-dropped against a long base.
 */
export function filterUniqueSurvivalTip(
  tip: string | undefined,
  bridge: Pick<GrammarBridgeResult, 'insight' | 'bridge' | 'brazilianTrap' | 'explanation'>,
): string | undefined {
  const trimmed = tip?.trim();
  if (!trimmed) return undefined;

  const trapExplanation =
    typeof bridge.brazilianTrap === 'object' ? bridge.brazilianTrap?.explanation : undefined;
  const explanationItems = Array.isArray(bridge.explanation)
    ? bridge.explanation
    : bridge.explanation
      ? [bridge.explanation]
      : [];

  const references = [
    bridge.insight,
    bridge.bridge?.difference,
    trapExplanation,
    ...explanationItems,
  ].filter((s): s is string => Boolean(s?.trim()));

  for (const ref of references) {
    if (textOverlap(trimmed, ref) >= OVERLAP_THRESHOLD) return undefined;
  }

  return trimmed;
}

/**
 * Whether the âncora step adds a memorable tip (not a restatement of earlier steps).
 */
export function shouldIncludeSynthesis(bridge: GrammarBridgeResult): boolean {
  const tip = filterUniqueSurvivalTip(bridge.survivalTip, bridge);
  if (tip) return true;
  // Formula-only anchor is ok when tip was dropped or missing
  return Boolean(bridge.structureFormulas?.[0]?.formula || bridge.structureFormula);
}

/** Extract significant words from target phrases for transfer dedup. */
export function extractContentWords(...phrases: string[]): Set<string> {
  const words = new Set<string>();
  for (const phrase of phrases) {
    const clean = normalizeText(phrase.replace(/\^\^/g, ''));
    for (const w of clean.split(' ')) {
      if (w.length > 3) words.add(w);
    }
  }
  return words;
}

/**
 * Whether an additional example adds lexical generalization vs patterns/dialogue.
 */
export function shouldIncludeTransfer(
  transfer: { target: string; portuguese: string },
  patternTargets: string[],
  dialogueTarget?: string,
): boolean {
  const transferWords = extractContentWords(transfer.target);
  if (transferWords.size === 0) return true;

  const referenceWords = extractContentWords(...patternTargets, dialogueTarget ?? '');
  if (referenceWords.size === 0) return true;

  let shared = 0;
  for (const w of transferWords) {
    if (referenceWords.has(w)) shared++;
  }
  const overlapRatio = shared / transferWords.size;
  return overlapRatio < 0.5;
}

const CONTRAST_LABEL_HINTS = [
  'afirm',
  'neg',
  'posit',
  'singular',
  'plural',
  'formal',
  'inform',
  'casual',
];

/** Whether two patterns should render as a compare step. */
export function canComparePatterns(
  patterns: Array<{ label: string; target: string; portuguese: string }>,
): boolean {
  if (patterns.length < 2) return false;
  const labels = patterns.slice(0, 2).map((p) => normalizeText(p.label));
  const hasContrast = labels.some((l) => CONTRAST_LABEL_HINTS.some((h) => l.includes(h)));
  if (hasContrast) return true;
  return labels[0] !== labels[1];
}
