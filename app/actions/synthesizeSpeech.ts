'use server';

import type { SupportedLanguage } from '@/types';

const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Neural2 voices — free tier (1M chars/month), best quality available
const VOICES: Record<SupportedLanguage, { languageCode: string; name: string }> = {
  fr: { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A' },
  en: { languageCode: 'en-US', name: 'en-US-Neural2-C' },
};

/**
 * Calls Google Cloud Text-to-Speech and returns a base64-encoded MP3 string.
 * Returns null if the API key is not configured or the request fails.
 */
export async function synthesizeSpeech(
  text: string,
  language: SupportedLanguage,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return null;

  try {
    const voice = VOICES[language];
    const res = await fetch(`${TTS_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice,
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.88,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[synthesizeSpeech] API error:', err);
      return null;
    }

    const data = await res.json();
    return (data.audioContent as string) ?? null;
  } catch (err) {
    console.error('[synthesizeSpeech] Error:', err);
    return null;
  }
}
