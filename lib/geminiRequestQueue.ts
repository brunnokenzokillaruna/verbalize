/**
 * Serializes Gemini text API calls to stay within free-tier RPM limits.
 * Separate queues per tier — critical (3.5) is slower; lite allows faster cadence.
 */

import {
  type GeminiTier,
  getQuotaBucket,
  isQuotaAvailable,
  logQuotaUsage,
  recordQuotaUsage,
} from '@/lib/geminiQuota';

const GAP_MS: Record<GeminiTier, number> = {
  critical: 13_000, // 5 RPM on gemini-3.5-flash
  standard: 4_500, // 15 RPM on gemini-3.1-flash-lite
  lightweight: 4_500,
};

const lastCallAt: Record<GeminiTier, number> = {
  critical: 0,
  standard: 0,
  lightweight: 0,
};

const chains: Record<GeminiTier, Promise<void>> = {
  critical: Promise.resolve(),
  standard: Promise.resolve(),
  lightweight: Promise.resolve(),
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForSlot(tier: GeminiTier): Promise<void> {
  const gap = GAP_MS[tier] - (Date.now() - lastCallAt[tier]);
  if (gap > 0) {
    await wait(gap);
  }
  lastCallAt[tier] = Date.now();
}

export class GeminiQuotaExceededError extends Error {
  constructor(
    message: string,
    public readonly model: string,
    public readonly tier: GeminiTier,
  ) {
    super(message);
    this.name = 'GeminiQuotaExceededError';
  }
}

/**
 * Runs `fn` after prior queued calls for the same tier finish, RPM gap elapses,
 * and soft daily budget allows the primary model.
 */
export function enqueueGeminiCall<T>(
  tier: GeminiTier,
  primaryModel: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isQuotaAvailable(primaryModel)) {
    const bucket = getQuotaBucket(primaryModel);
    return Promise.reject(
      new GeminiQuotaExceededError(
        `[Gemini Quota] Soft daily budget exhausted for ${bucket} (model ${primaryModel})`,
        primaryModel,
        tier,
      ),
    );
  }

  const run = chains[tier].then(async () => {
    await waitForSlot(tier);
    const result = await fn();
    recordQuotaUsage(primaryModel);
    logQuotaUsage(primaryModel, tier);
    return result;
  });

  chains[tier] = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

export { getQuotaStatus } from '@/lib/geminiQuota';
