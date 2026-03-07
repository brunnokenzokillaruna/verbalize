/**
 * Server-side environment variable validation.
 *
 * SECURITY NOTES FOR PUBLIC REPO:
 * ─────────────────────────────────────────────────────────────────────────────
 * - NEXT_PUBLIC_FIREBASE_* keys are intentionally public-facing. They are safe
 *   to expose because access is controlled by Firebase Security Rules, NOT by
 *   keeping the keys secret. Always configure proper Security Rules in your
 *   Firebase console before going to production.
 *
 * - GEMINI_API_KEY and PEXELS_API_KEY are server-only secrets. They must NEVER
 *   be prefixed with NEXT_PUBLIC_ and must NEVER appear in client-side code.
 *   They are only accessed inside Server Components or Server Actions (Phase 4).
 *
 * - Never commit .env.local to version control. Use .env.local.example as a
 *   template. On Vercel, set these as environment variables in the dashboard.
 * ─────────────────────────────────────────────────────────────────────────────
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Verbalize] Missing required server environment variable: ${key}\n` +
        `Copy .env.local.example to .env.local and fill in the value.`,
    );
  }
  return value;
}

/** Gemini API key — server-side only, used in Server Actions (Phase 4) */
export function getGeminiKey(): string {
  return requireEnv('GEMINI_API_KEY');
}

/** Pexels API key — server-side only, used in Server Actions (Phase 4) */
export function getPexelsKey(): string {
  return requireEnv('PEXELS_API_KEY');
}
