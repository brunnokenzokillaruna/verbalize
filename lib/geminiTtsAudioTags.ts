/**
 * Gemini 3.8 TTS audio tags and delivery styles.
 * @see https://ai.google.dev/gemini-api/docs/speech-generation
 *
 * Sustained delivery goes in speech_metadata.style.
 * Point-in-time vocal events use angle brackets in the transcript
 * (e.g. <laugh>, <sigh>, <gasp>) — never square brackets.
 * Tags/styles stay English even when the spoken transcript is French.
 */

export const LEARNER_BASE_STYLE =
  'clear slightly slower pace for language learners, warm conversational tone, ' +
  'crisp pronunciation, natural but not theatrical — avoid dramatic acting';

/** Vocal-event tags allowed inline in the transcript. */
export const LEARNER_SAFE_VOCAL_TAGS = [
  'laugh',
  'sigh',
  'gasp',
] as const;

export type LearnerSafeVocalTag = (typeof LEARNER_SAFE_VOCAL_TAGS)[number];

export type LearnerLineAudio = {
  /** Verbatim transcript (may include angle-bracket vocal events). */
  text: string;
  /** Turn-level delivery style for speech_metadata.style. */
  style: string;
};

const ALREADY_ANGLE_TAGGED = /^\s*<[^>]+>/;
const LEGACY_SQUARE_TAG = /^\s*\[([^\]]+)\]\s*/;

/**
 * Map a spoken line to Gemini 3.8 TTS transcript + style.
 * Prefers clarity over theatrics for language learners.
 */
export function prepareLearnerLineAudio(spokenText: string): LearnerLineAudio {
  let text = spokenText.trim();
  if (!text) return { text: '', style: LEARNER_BASE_STYLE };

  // Migrate any leftover [tag] prefixes from older generations.
  const legacy = text.match(LEGACY_SQUARE_TAG);
  if (legacy) {
    text = text.slice(legacy[0].length).trim();
  }

  if (ALREADY_ANGLE_TAGGED.test(text)) {
    return { text, style: LEARNER_BASE_STYLE };
  }

  const lower = text.toLowerCase();

  if (/\b(haha|hahaha|hehe|lol)\b/i.test(text)) {
    return { text: vocal('laugh', text), style: LEARNER_BASE_STYLE };
  }

  if (
    /^(oh\s+non|ah\s+non|oh\s+no|oh\s+merde|ugh|ow)\b/i.test(lower) ||
    /\b(j'ai oublié|i forgot|c'est dommage|that's too bad|zut)\b/i.test(lower)
  ) {
    return { text: vocal('sigh', text), style: LEARNER_BASE_STYLE };
  }

  if (/^(wow|waouh|oh\s+là\s+là)\b/i.test(lower)) {
    return {
      text,
      style: `${LEARNER_BASE_STYLE}; amazed`,
    };
  }

  if (/\?\s*[.!…]*\s*$/.test(text)) {
    return {
      text,
      style: `${LEARNER_BASE_STYLE}; curious`,
    };
  }

  if (
    /!\s*$/.test(text) &&
    /\b(super|parfait|génial|bravo|great|perfect|awesome|yes|oui|allez|carrément|yay)\b/i.test(
      lower,
    )
  ) {
    return {
      text,
      style: `${LEARNER_BASE_STYLE}; excited`,
    };
  }

  if (/\b(je suis fatigué|i'm tired|exhausted|épuisé)\b/i.test(lower)) {
    return {
      text,
      style: `${LEARNER_BASE_STYLE}; tired`,
    };
  }

  return { text, style: LEARNER_BASE_STYLE };
}

/** @deprecated Prefer prepareLearnerLineAudio for Gemini 3.8 TTS. */
export function applyLearnerAudioTag(spokenText: string): string {
  return prepareLearnerLineAudio(spokenText).text;
}

function vocal(name: LearnerSafeVocalTag, text: string): string {
  return `<${name}> ${text}`;
}
