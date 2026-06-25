import { isAggressivePregenEnabled } from '@/lib/geminiDevGuard';

export const PREGEN_GENERATING_TIMEOUT_PROD_MS = 5 * 60 * 1000;
export const PREGEN_GENERATING_TIMEOUT_DEV_MS = 45 * 1000;

export function getPregenGeneratingTimeoutMs(): number {
  return isAggressivePregenEnabled()
    ? PREGEN_GENERATING_TIMEOUT_PROD_MS
    : PREGEN_GENERATING_TIMEOUT_DEV_MS;
}

export function getPregenPollMaxAttempts(): number {
  return isAggressivePregenEnabled() ? 90 : 3;
}
