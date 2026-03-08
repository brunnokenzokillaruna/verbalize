import { getGeminiKey } from '@/lib/env';

// Latest free-tier Gemini model as specified in CLAUDE.md
const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message: string };
}

/**
 * Calls the Gemini REST API and returns the text response.
 * Runs server-side only (uses GEMINI_API_KEY).
 *
 * @param prompt - The user prompt (required)
 * @param systemPrompt - Optional system-level instruction
 * @throws Error with a descriptive message on failure
 */
export async function callGemini(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = getGeminiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data: GeminiResponse = await res.json();

  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${data.error?.message ?? 'Unknown error'}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned empty content');
  }

  return text.trim();
}

/**
 * Calls Gemini and parses the response as JSON.
 * The prompt should instruct Gemini to respond with ONLY valid JSON.
 */
export async function callGeminiJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
  const raw = await callGemini(prompt, systemPrompt);

  // Strip markdown code fences if Gemini wraps JSON in ```json ... ```
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Gemini response was not valid JSON:\n${cleaned}`);
  }
}
