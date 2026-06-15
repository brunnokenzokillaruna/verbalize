import type { SupportedLanguage } from '@/types';

/**
 * Default voices used as the fixed NPC voice in mission role-play.
 * A single, deterministic voice per language avoids jarring gender/timbre
 * changes across dialogue lines.
 */
const DEFAULT_FIXED_VOICES: Record<SupportedLanguage, string> = {
  fr: 'fr-FR-Chirp3-HD-Aoede',
  en: 'en-US-Chirp3-HD-Kore',
};

/** Studio voices — fewer trailing artifacts on short phrases and conjugations. */
const STUDIO_VOICES: Record<SupportedLanguage, string> = {
  fr: 'fr-FR-Studio-A',
  en: 'en-US-Studio-O',
};

/**
 * Returns the fixed NPC voice name for a given language.
 * Call once on mount and pass to useAudio(fixedVoice).
 */
export function getFixedVoiceName(language: SupportedLanguage): string {
  return DEFAULT_FIXED_VOICES[language];
}

/** Stable Studio voice for word/conjugation playback buttons. */
export function getStudioVoiceName(language: SupportedLanguage): string {
  return STUDIO_VOICES[language];
}
