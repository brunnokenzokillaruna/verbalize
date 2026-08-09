import type { CheckpointWindowItem } from '@/lib/curriculum/checkpointWindow';
import type { ExerciseTypeId } from '@/lib/practiceExercises/constants';
import type { ProficiencyLevel } from '@/types';

const STRUCTURAL_PRODUCTION_PREFERENCE: ExerciseTypeId[] = [
  'sentence-builder',
  'context-choice',
  'word-bank-translation',
  'bridge-choice',
  'grammar-trap',
];

/** Evenly sample prior lessons so the dialogue/items span the whole window. */
export function sampleAssessedTopics(
  window: CheckpointWindowItem[],
  count = 5,
): CheckpointWindowItem[] {
  if (window.length === 0) return [];
  if (window.length <= count) return window;

  const picked: CheckpointWindowItem[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const idx = Math.round((i * (window.length - 1)) / (count - 1));
    const item = window[idx]!;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    picked.push(item);
  }
  return picked;
}

/** Full-window retrieval cues for the briefing (not a grammar lesson). */
export function buildCoveredTopics(window: CheckpointWindowItem[]): string[] {
  const topics: string[] = [];
  const seen = new Set<string>();
  for (const item of window) {
    const label = item.grammarFocus.trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);
    topics.push(label);
  }
  return topics;
}

export function pickStructuralProductionType(
  allowed: Set<string>,
): ExerciseTypeId | null {
  for (const type of STRUCTURAL_PRODUCTION_PREFERENCE) {
    if (allowed.has(type)) return type;
  }
  return null;
}

/**
 * Higher rigor than the old 50% soft pass:
 * - Each skill section needs ≥ 2/3
 * - Overall: A1 ≥ 2/3, A2+ ≥ 70%
 */
export function evaluateCheckpointPass(params: {
  level: ProficiencyLevel;
  comprehensionCorrect: number;
  comprehensionTotal: number;
  productionCorrect: number;
  productionTotal: number;
}): {
  passed: boolean;
  comprehensionPassed: boolean;
  productionPassed: boolean;
  overallPassed: boolean;
  overallPct: number;
} {
  const {
    level,
    comprehensionCorrect,
    comprehensionTotal,
    productionCorrect,
    productionTotal,
  } = params;

  const total = comprehensionTotal + productionTotal;
  const correct = comprehensionCorrect + productionCorrect;
  const overallPct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const sectionPassed = (c: number, t: number) => {
    if (t === 0) return true;
    return c / t >= 2 / 3 - 1e-9;
  };

  const comprehensionPassed = sectionPassed(comprehensionCorrect, comprehensionTotal);
  const productionPassed = sectionPassed(productionCorrect, productionTotal);
  const overallThreshold = level === 'A1' ? 2 / 3 : 0.7;
  const overallPassed = total === 0 ? true : correct / total >= overallThreshold - 1e-9;

  return {
    passed: comprehensionPassed && productionPassed && overallPassed,
    comprehensionPassed,
    productionPassed,
    overallPassed,
    overallPct,
  };
}

export function summarizeTopicResults(
  results: Array<{ topic: string; correct: boolean }>,
): { strong: string[]; weak: string[] } {
  const byTopic = new Map<string, { hits: number; total: number }>();
  for (const { topic, correct } of results) {
    const key = topic.trim();
    if (!key) continue;
    const entry = byTopic.get(key) ?? { hits: 0, total: 0 };
    entry.total += 1;
    if (correct) entry.hits += 1;
    byTopic.set(key, entry);
  }

  const strong: string[] = [];
  const weak: string[] = [];
  for (const [topic, { hits, total }] of byTopic) {
    if (hits === total) strong.push(topic);
    else weak.push(topic);
  }
  return { strong, weak };
}
