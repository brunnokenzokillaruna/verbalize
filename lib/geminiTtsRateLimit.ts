/**
 * Rate limiter dedicated to Gemini TTS models.
 *
 * TTS models (e.g. gemini-2.5-flash-preview-tts) have their own RPM/RPD
 * quotas separate from text models (gemini-3.5-flash, etc.), but they share
 * the same GCP project. We still throttle conservatively to avoid 429s during
 * lesson prefetch while content generation may be active.
 */

const MIN_GAP_MS = 5_000;
const DEFAULT_COOLDOWN_MS = 60_000;
const MAX_COOLDOWN_MS = 5 * 60_000;

let lastTtsCallAt = 0;
let ttsCooldownUntil = 0;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getErrorMessage(err: unknown): string {
  return (err as { message?: string })?.message ?? '';
}

export function isGeminiTtsRateLimitError(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return (
    e?.status === 429 ||
    (typeof e?.message === 'string' &&
      /429|rate.?limit|quota|resource.?exhausted|too many requests/i.test(e.message))
  );
}

export function isGeminiTtsInCooldown(): boolean {
  return Date.now() < ttsCooldownUntil;
}

export function markGeminiTtsRateLimited(err: unknown): void {
  const message = getErrorMessage(err);
  let duration = DEFAULT_COOLDOWN_MS;

  const match = message.match(/retry in ([\d.]+)s/i);
  if (match) {
    duration = Math.min((parseFloat(match[1]) + 2) * 1000, MAX_COOLDOWN_MS);
  } else if (/per day|daily|requests per day|rpd/i.test(message)) {
    duration = MAX_COOLDOWN_MS;
  }

  ttsCooldownUntil = Date.now() + duration;
  console.warn(
    `[Gemini TTS] Rate limit hit — pausing TTS for ${Math.round(duration / 1000)}s (text models unaffected).`,
  );
}

/**
 * Waits until the TTS slot is available. Throws if TTS is in cooldown
 * (caller should fall back to Google Cloud TTS immediately).
 */
export async function acquireGeminiTtsSlot(): Promise<void> {
  const now = Date.now();
  if (now < ttsCooldownUntil) {
    throw new Error('Gemini TTS in cooldown');
  }

  const gap = MIN_GAP_MS - (now - lastTtsCallAt);
  if (gap > 0) {
    await wait(gap);
  }

  lastTtsCallAt = Date.now();
}
