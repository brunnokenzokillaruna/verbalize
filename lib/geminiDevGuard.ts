/**
 * Guards for Gemini usage in dev vs production (shared API key).
 *
 * Dev mode and pregen guards activate automatically:
 * - Local `npm run dev` → dev mode ON, pregen OFF
 * - Vercel preview → dev mode ON, pregen OFF
 * - Vercel production → dev mode OFF, pregen ON
 *
 * Override only if needed via VERBALIZE_GEMINI_DEV_MODE=true|false
 */

export function isGeminiDevMode(): boolean {
  const override = process.env.VERBALIZE_GEMINI_DEV_MODE;
  if (override === 'false') return false;
  if (override === 'true') return true;

  if (process.env.VERCEL_ENV === 'production') return false;
  if (process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development') {
    return true;
  }

  return process.env.NODE_ENV !== 'production';
}

/** Dashboard / background pregen only on Vercel production. */
export function isAggressivePregenEnabled(): boolean {
  if (isGeminiDevMode()) return false;
  return process.env.VERCEL_ENV === 'production';
}

export function assertGeminiIntegrationAllowed(): void {
  if (process.env.ALLOW_GEMINI_INTEGRATION === '1') return;
  if (process.env.NODE_ENV === 'production') return;
  throw new Error(
    '[Gemini] Integration test blocked. Set ALLOW_GEMINI_INTEGRATION=1 to run scripts that call the live API.',
  );
}
