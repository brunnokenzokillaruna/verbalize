'use server';

import type { SupportedLanguage } from '@/types';
import {
  listSpeakersInOrder,
  resolveSpeakerGenders,
  speakerKeyForLine,
  stripSpeakerPrefix,
  type SpeakerGender,
} from '@/lib/speakerGender';

/* ------------------------------------------------------------------ */
/*  ElevenLabs Text-to-Speech — dialogue synthesis with cache          */
/*                                                                     */
/*  Uses the ElevenLabs REST API directly (no SDK import needed on     */
/*  the server-action edge). Returns base64 MP3 strings identical in   */
/*  shape to the Google TTS action so the client hook can swap freely. */
/* ------------------------------------------------------------------ */

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

/* ── Voice configuration ─────────────────────────────────────────────
   One female + one male voice per language. Assigned by speaker name
   gender (Sophie → female), not by line index.                        */

interface ElevenLabsVoice {
  id: string;
  name: string;
}

const VOICE_PAIRS: Record<SupportedLanguage, { female: ElevenLabsVoice; male: ElevenLabsVoice }> = {
  fr: {
    female: { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice' },    // verified free tier (Clear, Engaging)
    male:   { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie' },  // verified free tier (Deep, Confident)
  },
  en: {
    female: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },    // verified free tier (Mature, Reassuring)
    male:   { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },   // verified free tier (Warm, Storyteller)
  },
};

const LANG_CODES: Record<SupportedLanguage, string> = {
  fr: 'fr',
  en: 'en',
};

/* ── In-memory audio cache ───────────────────────────────────────────
   Key = deterministic hash of (text + voiceId + language).
   Survives across requests within the same server process, so
   replaying the same dialogue never burns extra ElevenLabs credits.
   On Vercel serverless, each cold start gets a fresh cache — but
   within a warm function the cache persists across invocations.       */

const audioCache = new Map<string, string>();

function cacheKey(text: string, voiceId: string, lang: string): string {
  // Simple but deterministic key — good enough for an in-memory Map.
  // We lowercase + trim to normalise minor whitespace differences.
  return `${lang}:${voiceId}:${text.trim().toLowerCase()}`;
}

/* ── Core TTS call ───────────────────────────────────────────────────*/

async function callElevenLabs(
  text: string,
  voiceId: string,
  language: SupportedLanguage,
  apiKey: string,
): Promise<string | null> {
  const key = cacheKey(text, voiceId, LANG_CODES[language]);

  // 1️⃣ Cache hit → return immediately (zero credits used)
  const cached = audioCache.get(key);
  if (cached) {
    console.log(
      `⚡ [ElevenLabs Server Cache] Cache HIT! Reusing base64 audio for text: "${text.substring(0, 40)}..." (0 credits consumed from ElevenLabs)`
    );
    return cached;
  }

  // 2️⃣ Cache miss → call API
  try {
    console.log(
      `🎙️ [ElevenLabs Server Cache] Cache MISS! Requesting premium audio from ElevenLabs API for: "${text.substring(0, 40)}..."`
    );
    const res = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        language_code: LANG_CODES[language],
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
          style: 0.45,
          speed: 0.92,           // slightly slower for language learners
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.error('[ElevenLabs Server Cache] API error:', res.status, err);
      return null;
    }

    // Convert the binary response to a base64 string (same format Google TTS uses)
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // 3️⃣ Store in cache for future replays
    audioCache.set(key, base64);
    console.log(
      `💾 [ElevenLabs Server Cache] SUCCESS: Generated & cached audio under key: "${key}" (Saved for future replays!)`
    );

    return base64;
  } catch (err) {
    console.error('[ElevenLabs Server Cache] Fetch Error:', err);
    return null;
  }
}

function voiceForGender(
  pair: { female: ElevenLabsVoice; male: ElevenLabsVoice },
  gender: SpeakerGender,
): ElevenLabsVoice {
  return gender === 'female' ? pair.female : pair.male;
}

/* ── Public API ──────────────────────────────────────────────────────*/

/**
 * Synthesises each dialogue line with ElevenLabs voices matched to
 * speaker gender (name/role), not line index.
 *
 * Returns an array of base64 MP3 strings in the same order as the
 * input lines.  Cached results are returned instantly without burning
 * any ElevenLabs credits.
 */
export async function synthesizeDialogueElevenLabs(
  lines: string[],
  language: SupportedLanguage,
): Promise<string[]> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.warn('[ElevenLabs] ELEVENLABS_API_KEY not set — skipping.');
    return [];
  }

  const pair = VOICE_PAIRS[language];
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  const speakers = listSpeakersInOrder(nonEmpty);
  const genders = resolveSpeakerGenders(nonEmpty);

  // Free accounts have a limit of 2 concurrent requests.
  // We process sequentially to avoid the HTTP 429 "Too many concurrent requests" error.
  const results: (string | null)[] = [];
  for (let i = 0; i < nonEmpty.length; i++) {
    const line = nonEmpty[i]!;
    const speaker = speakerKeyForLine(line, i, speakers);
    const gender = genders.get(speaker) ?? (i % 2 === 0 ? 'female' : 'male');
    const voice = voiceForGender(pair, gender);
    const audio = await callElevenLabs(stripSpeakerPrefix(line), voice.id, language, apiKey);
    results.push(audio);
  }

  return results.filter((r): r is string => r !== null);
}

/**
 * Synthesises a single piece of text with ElevenLabs.
 * Picks a default voice for the language.  Cached.
 */
export async function synthesizeSpeechElevenLabs(
  text: string,
  language: SupportedLanguage,
): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  const voice = VOICE_PAIRS[language].male; // default single-speaker voice
  return callElevenLabs(text, voice.id, language, apiKey);
}

/**
 * Returns the current cache size — useful for debugging / monitoring.
 */
export async function getElevenLabsCacheStats(): Promise<{ entries: number }> {
  return { entries: audioCache.size };
}
