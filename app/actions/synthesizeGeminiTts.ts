'use server';

import { GoogleGenAI } from '@google/genai';
import { getGeminiKey } from '@/lib/env';
import { pcmToWavBase64 } from '@/lib/pcmToWav';
import {
  acquireGeminiTtsSlot,
  isGeminiTtsInCooldown,
  isGeminiTtsRateLimitError,
  markGeminiTtsRateLimited,
} from '@/lib/geminiTtsRateLimit';
import type { SupportedLanguage } from '@/types';

/* ------------------------------------------------------------------ */
/*  Gemini Flash TTS — multi-speaker dialogue in a single API call     */
/*                                                                     */
/*  Uses the Interactions API with a dedicated TTS model so quotas     */
/*  are separate from lesson content generation (gemini-3.5-flash).    */
/*  Returns WAV base64 (browser-native) instead of MP3.                */
/* ------------------------------------------------------------------ */

const TTS_MODEL_CHAIN = [
  'gemini-2.5-flash-preview-tts',
  'gemini-3.1-flash-tts-preview',
] as const;

/** Female / male voice pair — Gemini prebuilt voices, multilingual. */
const VOICE_PAIR = { female: 'Aoede', male: 'Puck' } as const;

const STYLE_PROMPT =
  'Speak naturally at a slightly slower pace suitable for language learners. ' +
  'Keep clear pronunciation and warm conversational tone.';

export type GeminiDialogueResult = {
  chunks: string[];
  mimeType: 'audio/wav';
  /** True when the whole dialogue is one audio file (no per-line highlight). */
  monolithic: boolean;
};

const dialogueCache = new Map<string, GeminiDialogueResult>();

function cacheKey(lines: string[], language: SupportedLanguage): string {
  return `${language}:${lines.map((l) => l.trim().toLowerCase()).join('|')}`;
}

function stripSpeakerPrefix(line: string): string {
  return line.replace(/^[^:]+:\s*/, '').trim();
}

function parseSpeakerName(line: string): string | null {
  const match = line.match(/^([^:]+):/);
  return match ? match[1].trim() : null;
}

/** Gemini multi-speaker TTS supports at most 2 distinct speakers. */
function countUniqueSpeakers(lines: string[]): number {
  const speakers = new Set<string>();
  for (const line of lines) {
    const name = parseSpeakerName(line);
    if (name) speakers.add(name);
  }
  return speakers.size;
}

function buildMultiSpeakerPrompt(lines: string[]): {
  input: string;
  speechConfig: { speaker: string; voice: string }[];
} {
  const nonEmpty = lines.filter((l) => l.trim().length > 0);

  const uniqueSpeakers: string[] = [];
  for (const line of nonEmpty) {
    const name = parseSpeakerName(line);
    if (name && !uniqueSpeakers.includes(name)) uniqueSpeakers.push(name);
  }

  const speakerA = uniqueSpeakers[0] ?? 'Speaker1';
  const speakerB = uniqueSpeakers[1] ?? 'Speaker2';

  const speechConfig = [
    { speaker: speakerA, voice: VOICE_PAIR.female },
    { speaker: speakerB, voice: VOICE_PAIR.male },
  ];

  const formattedLines = nonEmpty.map((line, i) => {
    const name = parseSpeakerName(line);
    if (name) return line.trim();
    const speaker = i % 2 === 0 ? speakerA : speakerB;
    return `${speaker}: ${stripSpeakerPrefix(line)}`;
  });

  const input =
    `${STYLE_PROMPT}\n\n` +
    `TTS the following conversation between ${speakerA} and ${speakerB}:\n` +
    formattedLines.join('\n');

  return { input, speechConfig };
}

function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: getGeminiKey() });
}

async function callGeminiTts(
  input: string,
  speechConfig: { speaker: string; voice: string }[],
): Promise<string | null> {
  if (isGeminiTtsInCooldown()) return null;

  try {
    await acquireGeminiTtsSlot();
  } catch {
    return null;
  }

  const client = getGeminiClient();
  let lastError: unknown = null;

  for (const model of TTS_MODEL_CHAIN) {
    try {
      const interaction = await client.interactions.create({
        model,
        input,
        response_modalities: ['audio'],
        store: false,
        generation_config: {
          speech_config: speechConfig,
        },
      });

      const audioData =
        interaction.output_audio?.data ??
        (interaction as { outputAudio?: { data?: string } }).outputAudio?.data;
      if (!audioData) {
        console.warn(`[Gemini TTS] ${model} returned no audio data`);
        continue;
      }

      const pcm = Buffer.from(audioData, 'base64');
      return pcmToWavBase64(pcm);
    } catch (err) {
      lastError = err;
      if (isGeminiTtsRateLimitError(err)) {
        markGeminiTtsRateLimited(err);
        return null;
      }
      console.warn(`[Gemini TTS] ${model} failed:`, getErrorMessage(err));
    }
  }

  if (lastError) {
    console.error('[Gemini TTS] All TTS models failed:', getErrorMessage(lastError));
  }
  return null;
}

function getErrorMessage(err: unknown): string {
  return (err as { message?: string })?.message ?? String(err);
}

/**
 * Synthesises a full dialogue with Gemini multi-speaker TTS (1 API call).
 * Cached server-side — replays never consume quota.
 */
export async function synthesizeDialogueGemini(
  lines: string[],
  language: SupportedLanguage,
): Promise<GeminiDialogueResult | null> {
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0) return null;

  const key = cacheKey(nonEmpty, language);
  const cached = dialogueCache.get(key);
  if (cached) {
    console.log(
      `⚡ [Gemini TTS Cache] HIT — reusing dialogue audio (${nonEmpty.length} lines, 0 API calls)`,
    );
    return cached;
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn('[Gemini TTS] GEMINI_API_KEY not set — skipping.');
    return null;
  }

  if (isGeminiTtsInCooldown()) {
    console.warn('[Gemini TTS] In cooldown — skipping to Cloud TTS fallback.');
    return null;
  }

  const speakerCount = countUniqueSpeakers(nonEmpty);
  if (speakerCount > 2) {
    console.warn(
      `[Gemini TTS] ${speakerCount} speakers detected (max 2) — skipping to Cloud TTS fallback.`,
    );
    return null;
  }

  const { input, speechConfig } = buildMultiSpeakerPrompt(nonEmpty);

  console.log(
    `🎙️ [Gemini TTS] Cache MISS — generating multi-speaker dialogue (${nonEmpty.length} lines, 1 API call)`,
  );

  const wavBase64 = await callGeminiTts(input, speechConfig);
  if (!wavBase64) return null;

  const result: GeminiDialogueResult = {
    chunks: [wavBase64],
    mimeType: 'audio/wav',
    monolithic: true,
  };

  dialogueCache.set(key, result);
  console.log(`💾 [Gemini TTS] Cached dialogue audio under key: "${key.slice(0, 60)}..."`);

  return result;
}
