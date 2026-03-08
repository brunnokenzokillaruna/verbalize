'use server';

import type { SupportedLanguage } from '@/types';

const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

type VoiceConfig = { languageCode: string; name: string };

// Single voice per language (used for word-click audio)
const VOICES: Record<SupportedLanguage, VoiceConfig> = {
  fr: { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A' },
  en: { languageCode: 'en-US', name: 'en-US-Neural2-C' },
};

// Two voices per language for dialogue (alternating speaker A / speaker B)
const DIALOGUE_VOICES: Record<SupportedLanguage, [VoiceConfig, VoiceConfig]> = {
  fr: [
    { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A' }, // female
    { languageCode: 'fr-FR', name: 'fr-FR-Neural2-B' }, // male
  ],
  en: [
    { languageCode: 'en-US', name: 'en-US-Neural2-C' }, // female
    { languageCode: 'en-US', name: 'en-US-Neural2-D' }, // male
  ],
};

async function callTTS(
  text: string,
  voice: VoiceConfig,
  apiKey: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${TTS_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice,
        audioConfig: { audioEncoding: 'MP3', speakingRate: 0.88 },
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

/**
 * Synthesizes a single piece of text with the default voice for the language.
 * Used for word-click audio in TranslationTooltip.
 */
export async function synthesizeSpeech(
  text: string,
  language: SupportedLanguage,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return null;
  return callTTS(text, VOICES[language], apiKey);
}

/**
 * Synthesizes each dialogue line with an alternating voice (A/B per line).
 * Returns an array of base64 MP3 strings in the same order as the input lines.
 * Skips empty lines.
 */
export async function synthesizeDialogue(
  lines: string[],
  language: SupportedLanguage,
): Promise<string[]> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return [];

  const pair = DIALOGUE_VOICES[language];
  const nonEmpty = lines.filter((l) => l.trim().length > 0);

  const results = await Promise.all(
    nonEmpty.map((line, i) => callTTS(line, pair[i % 2], apiKey)),
  );

  return results.filter((r): r is string => r !== null);
}
