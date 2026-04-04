'use server';

import type { SupportedLanguage } from '@/types';

const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

type VoiceConfig = { languageCode: string; name: string };

/* ------------------------------------------------------------------ */
/*  Voice pools — Studio, Chirp-HD, Chirp3-HD only                    */
/* ------------------------------------------------------------------ */

const VOICE_POOLS: Record<SupportedLanguage, { female: string[]; male: string[] }> = {
  fr: {
    female: [
      'fr-FR-Studio-A',
      'fr-FR-Chirp-HD-F',
      'fr-FR-Chirp-HD-O',
      'fr-FR-Chirp3-HD-Achernar',
      'fr-FR-Chirp3-HD-Aoede',
      'fr-FR-Chirp3-HD-Autonoe',
      'fr-FR-Chirp3-HD-Callirrhoe',
      'fr-FR-Chirp3-HD-Despina',
      'fr-FR-Chirp3-HD-Erinome',
      'fr-FR-Chirp3-HD-Gacrux',
      'fr-FR-Chirp3-HD-Kore',
      'fr-FR-Chirp3-HD-Laomedeia',
      'fr-FR-Chirp3-HD-Leda',
      'fr-FR-Chirp3-HD-Pulcherrima',
      'fr-FR-Chirp3-HD-Sulafat',
      'fr-FR-Chirp3-HD-Vindemiatrix',
      'fr-FR-Chirp3-HD-Zephyr',
    ],
    male: [
      'fr-FR-Studio-D',
      'fr-FR-Chirp-HD-D',
      'fr-FR-Chirp3-HD-Achird',
      'fr-FR-Chirp3-HD-Algenib',
      'fr-FR-Chirp3-HD-Algieba',
      'fr-FR-Chirp3-HD-Alnilam',
      'fr-FR-Chirp3-HD-Charon',
      'fr-FR-Chirp3-HD-Enceladus',
      'fr-FR-Chirp3-HD-Fenrir',
      'fr-FR-Chirp3-HD-Iapetus',
      'fr-FR-Chirp3-HD-Orus',
      'fr-FR-Chirp3-HD-Puck',
      'fr-FR-Chirp3-HD-Rasalgethi',
      'fr-FR-Chirp3-HD-Sadachbia',
      'fr-FR-Chirp3-HD-Sadaltager',
      'fr-FR-Chirp3-HD-Schedar',
      'fr-FR-Chirp3-HD-Umbriel',
      'fr-FR-Chirp3-HD-Zubenelgenubi',
    ],
  },
  en: {
    female: [
      'en-US-Studio-O',
      'en-US-Chirp-HD-F',
      'en-US-Chirp-HD-O',
      'en-US-Chirp3-HD-Achernar',
      'en-US-Chirp3-HD-Aoede',
      'en-US-Chirp3-HD-Autonoe',
      'en-US-Chirp3-HD-Callirrhoe',
      'en-US-Chirp3-HD-Despina',
      'en-US-Chirp3-HD-Erinome',
      'en-US-Chirp3-HD-Gacrux',
      'en-US-Chirp3-HD-Kore',
      'en-US-Chirp3-HD-Laomedeia',
      'en-US-Chirp3-HD-Leda',
      'en-US-Chirp3-HD-Pulcherrima',
      'en-US-Chirp3-HD-Sulafat',
      'en-US-Chirp3-HD-Vindemiatrix',
      'en-US-Chirp3-HD-Zephyr',
    ],
    male: [
      'en-US-Studio-Q',
      'en-US-Chirp-HD-D',
      'en-US-Chirp3-HD-Achird',
      'en-US-Chirp3-HD-Algenib',
      'en-US-Chirp3-HD-Algieba',
      'en-US-Chirp3-HD-Alnilam',
      'en-US-Chirp3-HD-Charon',
      'en-US-Chirp3-HD-Enceladus',
      'en-US-Chirp3-HD-Fenrir',
      'en-US-Chirp3-HD-Iapetus',
      'en-US-Chirp3-HD-Orus',
      'en-US-Chirp3-HD-Puck',
      'en-US-Chirp3-HD-Rasalgethi',
      'en-US-Chirp3-HD-Sadachbia',
      'en-US-Chirp3-HD-Sadaltager',
      'en-US-Chirp3-HD-Schedar',
      'en-US-Chirp3-HD-Umbriel',
      'en-US-Chirp3-HD-Zubenelgenubi',
    ],
  },
};

const LANG_CODES: Record<SupportedLanguage, string> = {
  fr: 'fr-FR',
  en: 'en-US',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick two distinct voices — one female, one male — for a dialogue. */
function pickDialoguePair(language: SupportedLanguage): [VoiceConfig, VoiceConfig] {
  const pool = VOICE_POOLS[language];
  const langCode = LANG_CODES[language];
  return [
    { languageCode: langCode, name: pickRandom(pool.female) },
    { languageCode: langCode, name: pickRandom(pool.male) },
  ];
}

function stripSpeakerPrefix(line: string): string {
  return line.replace(/^[^:]+:\s*/, '').trim();
}

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

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Synthesizes a single piece of text with a random voice.
 * Used for word-click audio in TranslationTooltip.
 */
export async function synthesizeSpeech(
  text: string,
  language: SupportedLanguage,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return null;

  const pool = VOICE_POOLS[language];
  const allVoices = [...pool.female, ...pool.male];
  const voice: VoiceConfig = {
    languageCode: LANG_CODES[language],
    name: pickRandom(allVoices),
  };
  return callTTS(text, voice, apiKey);
}

/**
 * Synthesizes text with a specific voice name (used by voice test page).
 */
export async function synthesizeSpeechWithVoice(
  text: string,
  languageCode: string,
  voiceName: string,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return null;
  return callTTS(text, { languageCode, name: voiceName }, apiKey);
}

/**
 * Synthesizes each dialogue line with alternating random voices (female/male).
 * Picks a fresh random pair per call so each lesson sounds different.
 * Returns an array of base64 MP3 strings in the same order as the input lines.
 */
export async function synthesizeDialogue(
  lines: string[],
  language: SupportedLanguage,
): Promise<string[]> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return [];

  const pair = pickDialoguePair(language);
  const nonEmpty = lines.filter((l) => l.trim().length > 0);

  const results = await Promise.all(
    nonEmpty.map((line, i) => callTTS(stripSpeakerPrefix(line), pair[i % 2], apiKey)),
  );

  return results.filter((r): r is string => r !== null);
}
