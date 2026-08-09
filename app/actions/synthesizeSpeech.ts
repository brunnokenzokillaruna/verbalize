'use server';

import type { SupportedLanguage } from '@/types';
import {
  listSpeakersInOrder,
  resolveSpeakerGenders,
  speakerKeyForLine,
  stripSpeakerPrefix,
  type SpeakerGender,
} from '@/lib/speakerGender';
import type { DialogueSpeakerVoice } from '@/lib/dialogueVoiceAvatars';

const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

type VoiceConfig = { languageCode: string; name: string };

export type GoogleDialogueResult = {
  chunks: string[];
  speakerVoices: DialogueSpeakerVoice[];
};

/* ------------------------------------------------------------------ */
/*  Voice pools — Studio, Chirp-HD, Chirp3-HD only                    */
/* ------------------------------------------------------------------ */

const VOICE_POOLS: Record<SupportedLanguage, { female: string[]; male: string[] }> = {
  fr: {
    female: [
      'fr-FR-Studio-A',
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
      'fr-CA-Chirp3-HD-Achernar',
      'fr-CA-Chirp3-HD-Aoede',
      'fr-CA-Chirp3-HD-Autonoe',
      'fr-CA-Chirp3-HD-Callirrhoe',
      'fr-CA-Chirp3-HD-Despina',
      'fr-CA-Chirp3-HD-Erinome',
      'fr-CA-Chirp3-HD-Gacrux',
      'fr-CA-Chirp3-HD-Kore',
      'fr-CA-Chirp3-HD-Laomedeia',
      'fr-CA-Chirp3-HD-Leda',
      'fr-CA-Chirp3-HD-Pulcherrima',
      'fr-CA-Chirp3-HD-Sulafat',
      'fr-CA-Chirp3-HD-Vindemiatrix',
      'fr-CA-Chirp3-HD-Zephyr',
    ],
    male: [
      'fr-FR-Studio-D',
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
      'fr-CA-Chirp3-HD-Achird',
      'fr-CA-Chirp3-HD-Algenib',
      'fr-CA-Chirp3-HD-Algieba',
      'fr-CA-Chirp3-HD-Alnilam',
      'fr-CA-Chirp3-HD-Charon',
      'fr-CA-Chirp3-HD-Enceladus',
      'fr-CA-Chirp3-HD-Fenrir',
      'fr-CA-Chirp3-HD-Iapetus',
      'fr-CA-Chirp3-HD-Orus',
      'fr-CA-Chirp3-HD-Puck',
      'fr-CA-Chirp3-HD-Rasalgethi',
      'fr-CA-Chirp3-HD-Sadachbia',
      'fr-CA-Chirp3-HD-Sadaltager',
      'fr-CA-Chirp3-HD-Schedar',
      'fr-CA-Chirp3-HD-Umbriel',
      'fr-CA-Chirp3-HD-Zubenelgenubi',
    ],
  },
  en: {
    female: [
      'en-US-Studio-O',
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


/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Extracts the language code from a voice name (e.g., 'fr-CA-Chirp3-HD-Achernar' -> 'fr-CA'). */
function getLangFromVoice(voiceName: string): string {
  const parts = voiceName.split('-');
  return `${parts[0]}-${parts[1]}`;
}

function voiceConfigFromName(voiceName: string): VoiceConfig {
  return { languageCode: getLangFromVoice(voiceName), name: voiceName };
}

/**
 * Assign a Google TTS voice per speaker, matching inferred gender.
 * Same-gender dialogues get two distinct voices from that gender pool.
 */
function pickVoicesForSpeakers(
  language: SupportedLanguage,
  genders: Map<string, SpeakerGender>,
): Map<string, VoiceConfig> {
  const pool = VOICE_POOLS[language];
  const used = { female: new Set<string>(), male: new Set<string>() };
  const result = new Map<string, VoiceConfig>();

  for (const [speaker, gender] of genders) {
    const names = pool[gender];
    const available = names.filter((n) => !used[gender].has(n));
    const pickFrom = available.length > 0 ? available : names;
    const voiceName = pickRandom(pickFrom);
    used[gender].add(voiceName);
    result.set(speaker, voiceConfigFromName(voiceName));
  }

  return result;
}

function escapeSsml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts plain text to a TTS `input` object.
 * Prepends a short break to avoid clipping the first syllable.
 * Adds a final period when missing so the engine closes the phrase cleanly.
 */
function buildTTSInput(text: string): { ssml: string } {
  const trimmed = text.trim();
  const withEnding = /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  const ssmlContent = escapeSsml(withEnding).replace(/\s*\/\s*/g, '<break time="300ms"/>');
  return {
    ssml: `<speak><break time="120ms"/>${ssmlContent}<break time="80ms"/></speak>`,
  };
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
        input: buildTTSInput(text),
        voice,
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.92,
          sampleRateHertz: 24000,
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

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/** Studio voice names per language — reliable for single words and short phrases. */
const STUDIO_VOICES: Record<SupportedLanguage, string[]> = {
  fr: ['fr-FR-Studio-A', 'fr-FR-Studio-D'],
  en: ['en-US-Studio-O', 'en-US-Studio-Q'],
};


/**
 * Synthesizes a single piece of text.
 *
 * If `fixedVoice` is provided, that exact voice is used regardless of
 * text length. Otherwise a random voice is picked (original behaviour).
 *
 * Chirp-HD / Chirp3-HD voices require full sentences and fail silently on
 * single words, so short texts (≤ 4 words) always use Studio voices
 * when no fixed voice is specified.
 */
export async function synthesizeSpeech(
  text: string,
  language: SupportedLanguage,
  fixedVoice?: string,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return null;

  if (fixedVoice) {
    const voice: VoiceConfig = {
      languageCode: getLangFromVoice(fixedVoice),
      name: fixedVoice,
    };
    return callTTS(text, voice, apiKey);
  }

  const wordCount = text.trim().split(/\s+/).length;
  const isShort = wordCount <= 4;

  const candidateNames = isShort
    ? STUDIO_VOICES[language]
    : [...VOICE_POOLS[language].female, ...VOICE_POOLS[language].male];

  const name = pickRandom(candidateNames);
  const voice: VoiceConfig = {
    languageCode: getLangFromVoice(name),
    name,
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
 * Synthesizes each dialogue line with voices matched to speaker gender
 * (Sophie → female, Lucas → male). Same-gender pairs still get two distinct
 * timbres from that gender pool. Returns base64 MP3 strings in line order.
 */
async function synthesizeDialogueResult(
  lines: string[],
  language: SupportedLanguage,
): Promise<GoogleDialogueResult> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return { chunks: [], speakerVoices: [] };

  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  const speakers = listSpeakersInOrder(nonEmpty);
  const genders = resolveSpeakerGenders(nonEmpty);
  const voiceBySpeaker = pickVoicesForSpeakers(language, genders);
  const resolvedVoiceBySpeaker = new Map<string, string>();
  const fallbackPair = [
    voiceConfigFromName(pickRandom(VOICE_POOLS[language].female)),
    voiceConfigFromName(pickRandom(VOICE_POOLS[language].male)),
  ] as const;

  const results = await Promise.all(
    nonEmpty.map((line, i) => {
      const speaker = speakerKeyForLine(line, i, speakers);
      const voice =
        voiceBySpeaker.get(speaker) ?? fallbackPair[i % 2];
      resolvedVoiceBySpeaker.set(speaker, voice.name.split('-').at(-1) ?? voice.name);
      return callTTS(stripSpeakerPrefix(line), voice, apiKey);
    }),
  );

  // Keep line↔audio alignment: partial success would drop speakers (often one gender).
  if (results.some((r) => r === null)) {
    console.warn(
      `[Google TTS] Incomplete dialogue (${results.filter(Boolean).length}/${nonEmpty.length} lines) — returning empty for fallback`,
    );
    return { chunks: [], speakerVoices: [] };
  }

  return {
    chunks: results as string[],
    speakerVoices: [...resolvedVoiceBySpeaker].map(([speaker, voiceName]) => ({
      speaker,
      voiceName,
    })),
  };
}

export async function synthesizeDialogue(
  lines: string[],
  language: SupportedLanguage,
): Promise<string[]> {
  return (await synthesizeDialogueResult(lines, language)).chunks;
}

export async function synthesizeDialogueWithVoices(
  lines: string[],
  language: SupportedLanguage,
): Promise<GoogleDialogueResult> {
  return synthesizeDialogueResult(lines, language);
}
