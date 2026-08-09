/**
 * Gemini TTS audio tags (English bracket modifiers).
 * @see https://ai.google.dev/gemini-api/docs/speech-generation#audio-tags
 *
 * Tags stay English even when the spoken transcript is French/other.
 * For language learning we only apply light, pronunciation-safe tags.
 */

/** Common tags from Gemini docs — subset we allow for learner dialogues. */
export const LEARNER_SAFE_AUDIO_TAGS = [
  'amazed',
  'curious',
  'excited',
  'gasp',
  'giggles',
  'laughs',
  'sighs',
  'serious',
  'tired',
] as const;

export type LearnerSafeAudioTag = (typeof LEARNER_SAFE_AUDIO_TAGS)[number];

const ALREADY_TAGGED = /^\s*\[[^\]]+\]/;

/**
 * Prefix a spoken line with at most one English audio tag when the text
 * clearly signals emotion. Returns the original text when unsure (clarity >
 * theatrics for learners).
 */
export function applyLearnerAudioTag(spokenText: string): string {
  const text = spokenText.trim();
  if (!text || ALREADY_TAGGED.test(text)) return text;

  const lower = text.toLowerCase();

  if (/\b(haha|hahaha|hehe|lol)\b/i.test(text)) {
    return tag('laughs', text);
  }

  if (
    /^(oh\s+non|ah\s+non|oh\s+no|oh\s+merde|ugh|ow)\b/i.test(lower) ||
    /\b(j'ai oublié|i forgot|c'est dommage|that's too bad|zut)\b/i.test(lower)
  ) {
    return tag('sighs', text);
  }

  if (/^(wow|waouh|oh\s+là\s+là)\b/i.test(lower)) {
    return tag('amazed', text);
  }

  if (/\?\s*[.!…]*\s*$/.test(text)) {
    return tag('curious', text);
  }

  if (
    /!\s*$/.test(text) &&
    /\b(super|parfait|génial|bravo|great|perfect|awesome|yes|oui|allez|carrément|yay)\b/i.test(
      lower,
    )
  ) {
    return tag('excited', text);
  }

  if (/\b(je suis fatigué|i'm tired|exhausted|épuisé)\b/i.test(lower)) {
    return tag('tired', text);
  }

  return text;
}

function tag(name: LearnerSafeAudioTag, text: string): string {
  return `[${name}] ${text}`;
}
