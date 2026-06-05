import { GoogleGenAI } from '@google/genai';
import { getGeminiKey } from '@/lib/env';

// Latest free-tier Gemini model as specified in CLAUDE.md
const GEMINI_MODEL = 'gemini-3.5-flash';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message: string };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Instantiate the official Google Gen AI Client
const ai = new GoogleGenAI({ apiKey: getGeminiKey() });

/**
 * Calls the Gemini API using the official SDK and returns the text response.
 * Runs server-side only (uses GEMINI_API_KEY).
 */
export async function callGemini(
  prompt: string,
  systemPrompt?: string,
  maxOutputTokens = 1024,
  retries = 4,
  thinkingBudget?: number,
): Promise<string> {
  // Automatically boost maxOutputTokens for 3.5 or thinking models because
  // their internal reasoning/thinking output also counts toward the maxOutputTokens limit.
  // This prevents response truncation on complex prompts like dialogue generation.
  const adjustedMaxTokens = GEMINI_MODEL.includes('3.5') || GEMINI_MODEL.includes('thinking')
    ? Math.max(maxOutputTokens * 3, 8192)
    : maxOutputTokens;

  // Build the generation config
  const config: Record<string, any> = {
    temperature: 0.7,
    maxOutputTokens: adjustedMaxTokens,
  };

  if (systemPrompt) {
    config.systemInstruction = systemPrompt;
  }

  // Gemini 3.1 Flash-Lite has thinking enabled by default; pass thinkingBudget=0
  // to disable it for speed-critical calls like the minimal hook.
  if (thinkingBudget !== undefined) {
    config.thinkingConfig = { thinkingBudget };
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config,
      });

      const text = response.text;
      if (!text) {
        throw new Error('Gemini returned empty content');
      }

      return text.trim();
    } catch (err: any) {
      lastError = err as Error;
      
      // Handle retry for rate limits (429) or service unavailable (503)
      const isRateLimit = err?.status === 429 || (err?.message && /429|limit/i.test(err.message));
      const isServiceUnavailable = err?.status === 503 || (err?.message && /503|unavailable/i.test(err.message));

      if ((isRateLimit || isServiceUnavailable) && attempt < retries) {
        // For 429, honour the "retry in Xs" hint from the error message
        let delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        const match = (err?.message ?? '').match(/retry in ([\d.]+)s/i);
        if (match) delay = (parseFloat(match[1]) + 1) * 1000; // add 1s buffer
        
        console.warn(`[Gemini SDK] Attempt ${attempt + 1} failed. Retrying in ${Math.round(delay / 1000)}s...`);
        await wait(delay);
        continue;
      }
      
      if (attempt === retries) break;

      // For network errors or other issues, we also retry
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      await wait(delay);
    }
  }

  throw lastError || new Error('Unknown error in callGemini');
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
  const raw = await callGemini(prompt, systemPrompt, maxOutputTokens, 4, thinkingBudget);

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
    throw new Error(`Gemini response was not valid JSON:\n${cleaned.slice(0, 500)}`);
  }
}
