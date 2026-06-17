import { GoogleGenAI } from '@google/genai';
import { getGeminiKey } from '@/lib/env';

/**
 * Models in priority order. Each model has its own rate-limit quota on the
 * free tier, so when the primary is exhausted we fall back to the next.
 *
 * Fallback strategy (free tier):
 *  1. 3.5 Flash  — best quality (primary)
 *  2. 3.1 Flash Lite — fastest fallback + 500 RPD (vs 20 on 2.5 Flash)
 *  3. 2.5 Flash — stronger reasoning when Lite struggles with complex JSON
 *  4. 2.5 Flash Lite — last resort
 */
const GEMINI_MODEL_CHAIN = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
] as const;

export const PRIMARY_GEMINI_MODEL = GEMINI_MODEL_CHAIN[0];

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;
const DAILY_QUOTA_COOLDOWN_MS = 60 * 60 * 1000;

/** Models temporarily skipped after quota/rate-limit failures (in-process cache). */
const modelCooldownUntil = new Map<string, number>();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Instantiate the official Google Gen AI Client
const ai = new GoogleGenAI({ apiKey: getGeminiKey() });

function modelSupportsThinkingConfig(model: string): boolean {
  return model.includes('flash-lite') || model.includes('3.5');
}

const LARGE_OUTPUT_THRESHOLD = 1500;
const LARGE_OUTPUT_MIN_TOKENS = 8192;

function getAdjustedMaxTokens(model: string, maxOutputTokens: number): number {
  const isLargeOutput = maxOutputTokens >= LARGE_OUTPUT_THRESHOLD;

  if (model.includes('3.5') || model.includes('thinking')) {
    if (isLargeOutput) {
      return Math.max(maxOutputTokens * 3, LARGE_OUTPUT_MIN_TOKENS);
    }
    // Small JSON (word tooltips, etc.): avoid 8192-token budget that slows TTFT.
    return Math.ceil(maxOutputTokens * 1.25);
  }

  // Fallback models (2.5-flash, etc.) need the same headroom for large JSON payloads
  // like hooks, grammar bridges, and exercise arrays — otherwise output truncates mid-JSON.
  if (isLargeOutput) {
    return Math.max(maxOutputTokens, LARGE_OUTPUT_MIN_TOKENS);
  }

  return maxOutputTokens;
}

function buildGenerationConfig(
  model: string,
  systemPrompt: string | undefined,
  maxOutputTokens: number,
  thinkingBudget: number | undefined,
): Record<string, unknown> {
  const config: Record<string, unknown> = {
    temperature: 0.7,
    maxOutputTokens: getAdjustedMaxTokens(model, maxOutputTokens),
  };

  if (systemPrompt) {
    config.systemInstruction = systemPrompt;
  }

  // Gemini 3.1 Flash-Lite has thinking enabled by default; pass thinkingBudget=0
  // to disable it for speed-critical calls like the minimal hook.
  if (thinkingBudget !== undefined && modelSupportsThinkingConfig(model)) {
    config.thinkingConfig = { thinkingBudget };
  }

  return config;
}

function getErrorMessage(err: unknown): string {
  return (err as { message?: string })?.message ?? '';
}

function isRateLimit(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return (
    e?.status === 429 ||
    (typeof e?.message === 'string' && /429|rate.?limit|quota|resource.?exhausted/i.test(e.message))
  );
}

function isDailyQuotaExhausted(err: unknown): boolean {
  return /per day|daily|requests per day|rpd/i.test(getErrorMessage(err));
}

function isServiceUnavailable(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return (
    e?.status === 503 ||
    (typeof e?.message === 'string' && /503|unavailable|overloaded/i.test(e.message))
  );
}

function isNonRetryable(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return status === 400 || status === 401 || status === 403;
}

function isModelInCooldown(model: string): boolean {
  const until = modelCooldownUntil.get(model);
  return until !== undefined && Date.now() < until;
}

function markModelCooldown(model: string, err: unknown): void {
  const message = getErrorMessage(err);
  let duration = DEFAULT_COOLDOWN_MS;

  if (isDailyQuotaExhausted(err)) {
    duration = DAILY_QUOTA_COOLDOWN_MS;
  } else {
    const match = message.match(/retry in ([\d.]+)s/i);
    if (match) {
      duration = Math.min((parseFloat(match[1]) + 5) * 1000, 30 * 60 * 1000);
    }
  }

  modelCooldownUntil.set(model, Date.now() + duration);
  console.warn(
    `[Gemini SDK] ${model} em cooldown por ${Math.round(duration / 1000)}s (chamadas seguintes pulam este modelo).`,
  );
}

function getActiveModelChain(): readonly (typeof GEMINI_MODEL_CHAIN)[number][] {
  const available = GEMINI_MODEL_CHAIN.filter((model) => !isModelInCooldown(model));
  return available.length > 0 ? available : GEMINI_MODEL_CHAIN;
}

/** How many retries to attempt on the same model before falling back. */
function getMaxRetries(err: unknown): number {
  if (isRateLimit(err) || isServiceUnavailable(err)) return 0;
  return 2;
}

function getRetryDelay(err: unknown, attempt: number): number {
  const match = getErrorMessage(err).match(/retry in ([\d.]+)s/i);
  if (match) return (parseFloat(match[1]) + 1) * 1000;
  return Math.pow(2, attempt) * 1000 + Math.random() * 500;
}

/** 503 often masks quota exhaustion on the free tier — skip retries and switch model. */
function shouldFallbackImmediately(err: unknown): boolean {
  return isRateLimit(err) || isServiceUnavailable(err);
}

/**
 * Calls the Gemini API using the official SDK and returns the text response.
 * Runs server-side only (uses GEMINI_API_KEY).
 *
 * Tries models in GEMINI_MODEL_CHAIN order. When the primary model hits its
 * rate limit, automatically falls back to the next available model.
 */
export async function callGemini(
  prompt: string,
  systemPrompt?: string,
  maxOutputTokens = 1024,
  _retries = 4,
  thinkingBudget?: number,
): Promise<string> {
  let lastError: Error | null = null;
  const modelChain = getActiveModelChain();

  if (modelChain[0] !== GEMINI_MODEL_CHAIN[0]) {
    console.info(`[Gemini SDK] Pulando modelos em cooldown. Iniciando com: ${modelChain[0]}`);
  }

  for (let modelIndex = 0; modelIndex < modelChain.length; modelIndex++) {
    const model = modelChain[modelIndex];
    const config = buildGenerationConfig(model, systemPrompt, maxOutputTokens, thinkingBudget);
    let attempt = 0;
    let maxRetries = 2;

    while (attempt <= maxRetries) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        const text = response.text;
        if (!text) {
          throw new Error('Gemini returned empty content');
        }

        if (model !== PRIMARY_GEMINI_MODEL) {
          console.info(`[Gemini SDK] Request succeeded using fallback model: ${model}`);
        }

        return text.trim();
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        maxRetries = getMaxRetries(err);

        if (isNonRetryable(err)) {
          throw lastError;
        }

        const nextModel = modelChain[modelIndex + 1];
        const immediateFallback = shouldFallbackImmediately(err);

        if (immediateFallback) {
          markModelCooldown(model, err);
          if (nextModel) {
            const reason = isRateLimit(err) ? 'rate limit' : 'indisponível';
            console.warn(`[Gemini SDK] ${model} ${reason}. Fallback imediato para ${nextModel}...`);
          }
          break;
        }

        if (attempt < maxRetries) {
          const delay = getRetryDelay(err, attempt);
          console.warn(
            `[Gemini SDK] ${model} attempt ${attempt + 1} failed. Retrying in ${Math.round(delay / 1000)}s...`,
          );
          await wait(delay);
          attempt++;
          continue;
        }

        if (nextModel) {
          console.warn(`[Gemini SDK] ${model} failed after retries. Falling back to ${nextModel}...`);
        }

        break;
      }
    }
  }

  throw lastError || new Error('All Gemini models failed in callGemini');
}

function parseGeminiJsonResponse<T>(raw: string): T {
  // 1. Strip markdown code fences
  let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  // 2. Extract the outermost JSON object or array (handles extra text before/after)
  const objStart = cleaned.indexOf('{');
  const arrStart = cleaned.indexOf('[');
  const start = objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart);
  if (start > 0) cleaned = cleaned.slice(start);
  const lastCurly = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const end = Math.max(lastCurly, lastBracket);
  if (end !== -1 && end < cleaned.length - 1) cleaned = cleaned.slice(0, end + 1);

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new SyntaxError(`Gemini response was not valid JSON:\n${cleaned.slice(0, 500)}`);
  }
}

function isJsonParseFailure(err: unknown): boolean {
  return err instanceof SyntaxError;
}

/**
 * Calls Gemini and parses the response as JSON.
 * The prompt should instruct Gemini to respond with ONLY valid JSON.
 * Robustly extracts the first complete JSON object/array even when Gemini
 * adds surrounding text or markdown fences.
 */
export async function callGeminiJSON<T>(
  prompt: string,
  systemPrompt?: string,
  maxOutputTokens = 1024,
  thinkingBudget?: number,
): Promise<T> {
  const tokenAttempts =
    maxOutputTokens >= LARGE_OUTPUT_THRESHOLD
      ? [maxOutputTokens, Math.max(maxOutputTokens * 2, LARGE_OUTPUT_MIN_TOKENS)]
      : [maxOutputTokens];

  let lastError: Error | null = null;

  for (let i = 0; i < tokenAttempts.length; i++) {
    const tokens = tokenAttempts[i];
    try {
      const raw = await callGemini(prompt, systemPrompt, tokens, 4, thinkingBudget);
      return parseGeminiJsonResponse<T>(raw);
    } catch (err: unknown) {
      if (isJsonParseFailure(err) && i < tokenAttempts.length - 1) {
        console.warn(
          `[Gemini SDK] JSON truncado/inválido com ${tokens} tokens. Retentando com ${tokenAttempts[i + 1]}...`,
        );
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error('Failed to parse Gemini JSON response');
}
