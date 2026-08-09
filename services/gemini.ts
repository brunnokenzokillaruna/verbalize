import { GoogleGenAI } from '@google/genai';
import { getGeminiKey } from '@/lib/env';
import {
  enqueueGeminiCall,
  GeminiQuotaExceededError,
} from '@/lib/geminiRequestQueue';
import {
  type GeminiTier,
  isFlash35BudgetExhausted,
  isQuotaAvailable,
} from '@/lib/geminiQuota';

export type { GeminiTier } from '@/lib/geminiQuota';

const MODEL_CHAINS: Record<GeminiTier, readonly string[]> = {
  // Lite is the runtime fallback when 3.5 is overloaded (503) or rate-limited.
  critical: ['gemini-3.5-flash', 'gemini-3.1-flash-lite'],
  // Paid: prefer 3.5 for lesson content quality; lite remains the cheap fallback.
  standard: ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite'],
  lightweight: ['gemini-3.1-flash-lite'],
};

/** Degraded hook path when 3.5 daily budget is exhausted. */
const CRITICAL_FALLBACK_MODEL = 'gemini-3.1-flash-lite';

export const PRIMARY_GEMINI_MODEL = 'gemini-3.5-flash';

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;
const OVERLOAD_COOLDOWN_MS = 60 * 1000;
const DAILY_QUOTA_COOLDOWN_MS = 60 * 60 * 1000;

const modelCooldownUntil = new Map<string, number>();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    return Math.ceil(maxOutputTokens * 1.25);
  }

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
  } else if (isServiceUnavailable(err)) {
    duration = OVERLOAD_COOLDOWN_MS;
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

function getActiveModelChain(tier: GeminiTier): string[] {
  let chain = [...MODEL_CHAINS[tier]];

  const flash35Unavailable =
    isFlash35BudgetExhausted() || !isQuotaAvailable(PRIMARY_GEMINI_MODEL);

  if (flash35Unavailable && chain.includes(PRIMARY_GEMINI_MODEL)) {
    console.warn(
      `[Gemini SDK] gemini-3.5-flash daily budget exhausted — skipping 3.5 for tier=${tier}`,
    );
    chain = chain.filter((model) => model !== PRIMARY_GEMINI_MODEL);
    if (chain.length === 0) {
      chain = [CRITICAL_FALLBACK_MODEL];
    }
  }

  const available = chain.filter((model) => !isModelInCooldown(model));
  return available.length > 0 ? available : chain;
}

function getMaxRetries(err: unknown): number {
  if (isRateLimit(err) || isServiceUnavailable(err)) return 0;
  return 2;
}

function getRetryDelay(err: unknown, attempt: number): number {
  const match = getErrorMessage(err).match(/retry in ([\d.]+)s/i);
  if (match) return (parseFloat(match[1]) + 1) * 1000;
  return Math.pow(2, attempt) * 1000 + Math.random() * 500;
}

function shouldFallbackImmediately(err: unknown): boolean {
  return isRateLimit(err) || isServiceUnavailable(err);
}

async function generateWithModel(
  tier: GeminiTier,
  model: string,
  prompt: string,
  config: Record<string, unknown>,
): Promise<string> {
  const response = await enqueueGeminiCall(tier, model, () =>
    ai.models.generateContent({
      model,
      contents: prompt,
      config,
    }),
  );

  const text = response.text;
  if (!text) {
    throw new Error('Gemini returned empty content');
  }

  return text.trim();
}

/**
 * Calls the Gemini API using tier-specific model chains.
 * critical → 3.5-flash (degrades to lite when daily budget exhausted)
 * standard → 3.5-flash → 3.1-flash-lite → 2.5-flash-lite
 * lightweight → 3.1-flash-lite only
 */
export async function callGemini(
  prompt: string,
  systemPrompt?: string,
  maxOutputTokens = 1024,
  thinkingBudget?: number,
  tier: GeminiTier = 'standard',
): Promise<string> {
  let lastError: Error | null = null;
  const modelChain = getActiveModelChain(tier);

  if (modelChain[0] !== MODEL_CHAINS[tier][0]) {
    console.info(`[Gemini SDK] tier=${tier} iniciando com: ${modelChain[0]}`);
  }

  for (let modelIndex = 0; modelIndex < modelChain.length; modelIndex++) {
    const model = modelChain[modelIndex];
    const effectiveThinking =
      thinkingBudget ?? (model.includes('flash-lite') ? 0 : undefined);
    const config = buildGenerationConfig(model, systemPrompt, maxOutputTokens, effectiveThinking);
    let attempt = 0;
    let maxRetries = 2;

    while (attempt <= maxRetries) {
      try {
        const text = await generateWithModel(tier, model, prompt, config);

        if (model !== MODEL_CHAINS[tier][0]) {
          console.info(`[Gemini SDK] Request succeeded using fallback model: ${model}`);
        }

        return text;
      } catch (err: unknown) {
        if (err instanceof GeminiQuotaExceededError) {
          if (model === PRIMARY_GEMINI_MODEL) {
            console.warn('[Gemini SDK] 3.5 quota exceeded — continuing with lite models');
            // Fall through to next model in chain (or degrade critical → standard).
            if (modelChain[modelIndex + 1]) break;
            if (tier === 'critical') {
              return callGemini(prompt, systemPrompt, maxOutputTokens, thinkingBudget ?? 0, 'standard');
            }
          }
          throw err;
        }

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
          } else if (tier === 'critical') {
            console.warn('[Gemini SDK] Critical tier exhausted — degrading to standard/lite chain');
            return callGemini(prompt, systemPrompt, maxOutputTokens, effectiveThinking ?? 0, 'standard');
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

  if (tier === 'critical') {
    console.warn('[Gemini SDK] Critical models failed — last resort: standard/lite chain');
    return callGemini(prompt, systemPrompt, maxOutputTokens, thinkingBudget ?? 0, 'standard');
  }

  throw lastError || new Error('All Gemini models failed in callGemini');
}

function salvageTruncatedJson(cleaned: string): string {
  let result = cleaned.trimEnd();
  result = result.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"\\]*(?:\\.[^"\\]*)*$/m, '');
  result = result.replace(/,\s*$/m, '');

  let inString = false;
  let escaped = false;
  let openBraces = 0;
  let openBrackets = 0;

  for (const ch of result) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') openBraces++;
    else if (ch === '}') openBraces--;
    else if (ch === '[') openBrackets++;
    else if (ch === ']') openBrackets--;
  }

  if (inString) result += '"';
  while (openBrackets > 0) {
    result += ']';
    openBrackets--;
  }
  while (openBraces > 0) {
    result += '}';
    openBraces--;
  }

  return result;
}

function parseGeminiJsonResponse<T>(raw: string): T {
  let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

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
    const salvaged = salvageTruncatedJson(cleaned);
    if (salvaged !== cleaned) {
      try {
        return JSON.parse(salvaged) as T;
      } catch {
        // fall through to error below
      }
    }
    throw new SyntaxError(`Gemini response was not valid JSON:\n${cleaned.slice(0, 500)}`);
  }
}

function isJsonParseFailure(err: unknown): boolean {
  return err instanceof SyntaxError;
}

export async function callGeminiJSON<T>(
  prompt: string,
  systemPrompt?: string,
  maxOutputTokens = 1024,
  thinkingBudget?: number,
  tier: GeminiTier = 'standard',
): Promise<T> {
  const tokenAttempts =
    maxOutputTokens >= LARGE_OUTPUT_THRESHOLD
      ? [maxOutputTokens, Math.max(maxOutputTokens * 2, LARGE_OUTPUT_MIN_TOKENS)]
      : [maxOutputTokens];

  let lastError: Error | null = null;

  for (let i = 0; i < tokenAttempts.length; i++) {
    const tokens = tokenAttempts[i];
    try {
      const raw = await callGemini(prompt, systemPrompt, tokens, thinkingBudget, tier);
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
