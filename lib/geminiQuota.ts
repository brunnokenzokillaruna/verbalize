/**
 * Soft daily budget tracker for Gemini models (in-memory, UTC midnight reset).
 * Survives warm serverless instances; protects spend caps during spikes.
 *
 * Defaults sized for paid Tier 1 (override with env if needed):
 *   GEMINI_DAILY_BUDGET_35 / GEMINI_DAILY_BUDGET_LITE
 * In dev mode the 3.5 cap is automatically reduced.
 */

import { isGeminiDevMode } from '@/lib/geminiDevGuard';

export type GeminiTier = 'critical' | 'standard' | 'lightweight';

export type QuotaBucket = 'flash35' | 'lite';

const MODEL_TO_BUCKET: Record<string, QuotaBucket> = {
  'gemini-3.5-flash': 'flash35',
  'gemini-3.1-flash-lite': 'lite',
  'gemini-2.5-flash-lite': 'lite',
  'gemini-2.5-flash': 'flash35',
};

function utcDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readBudget(envKey: string, fallback: number): number {
  const raw = process.env[envKey];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function getBudgetLimit(bucket: QuotaBucket): number {
  if (bucket === 'flash35') {
    const base = readBudget('GEMINI_DAILY_BUDGET_35', 120);
    return isGeminiDevMode() ? Math.min(base, 30) : base;
  }
  return readBudget('GEMINI_DAILY_BUDGET_LITE', 2_000);
}

let dateKey = utcDateKey();
const counts: Record<QuotaBucket, number> = { flash35: 0, lite: 0 };

function resetIfNewDay(): void {
  const today = utcDateKey();
  if (today !== dateKey) {
    dateKey = today;
    counts.flash35 = 0;
    counts.lite = 0;
  }
}

export function getQuotaBucket(model: string): QuotaBucket {
  return MODEL_TO_BUCKET[model] ?? 'lite';
}

export function isQuotaAvailable(model: string): boolean {
  resetIfNewDay();
  const bucket = getQuotaBucket(model);
  return counts[bucket] < getBudgetLimit(bucket);
}

export function isFlash35BudgetExhausted(): boolean {
  resetIfNewDay();
  return counts.flash35 >= getBudgetLimit('flash35');
}

export function recordQuotaUsage(model: string): void {
  resetIfNewDay();
  const bucket = getQuotaBucket(model);
  counts[bucket] += 1;
}

export function getQuotaStatus(): {
  date: string;
  flash35: { used: number; limit: number; remaining: number };
  lite: { used: number; limit: number; remaining: number };
  devMode: boolean;
} {
  resetIfNewDay();
  const flashLimit = getBudgetLimit('flash35');
  const liteLimit = getBudgetLimit('lite');
  return {
    date: dateKey,
    flash35: {
      used: counts.flash35,
      limit: flashLimit,
      remaining: Math.max(0, flashLimit - counts.flash35),
    },
    lite: {
      used: counts.lite,
      limit: liteLimit,
      remaining: Math.max(0, liteLimit - counts.lite),
    },
    devMode: isGeminiDevMode(),
  };
}

export function logQuotaUsage(model: string, tier: GeminiTier): void {
  const status = getQuotaStatus();
  const bucket = getQuotaBucket(model);
  const info = bucket === 'flash35' ? status.flash35 : status.lite;
  console.info(
    `[Gemini Quota] tier=${tier} model=${model} — ${bucket}: ${info.used}/${info.limit} RPD (${info.remaining} restantes)`,
  );
}
