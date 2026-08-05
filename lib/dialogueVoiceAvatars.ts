export const DIALOGUE_VOICE_NAMES = [
  'Aoede',
  'Kore',
  'Leda',
  'Zephyr',
  'Puck',
  'Charon',
  'Fenrir',
  'Orus',
  'Alice',
  'Charlie',
  'Sarah',
  'George',
] as const;

export type DialogueVoiceName = (typeof DIALOGUE_VOICE_NAMES)[number];

export type DialogueSpeakerVoice = {
  speaker: string;
  voiceName: string;
};

const DIALOGUE_VOICE_NAME_SET = new Set<string>(DIALOGUE_VOICE_NAMES);

export function getDialogueVoiceAvatarPath(voiceName?: string): string | null {
  if (!voiceName || !DIALOGUE_VOICE_NAME_SET.has(voiceName)) return null;
  return `/images/dialogue-voices/${voiceName}.jpg`;
}
