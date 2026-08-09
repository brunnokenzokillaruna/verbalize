/**
 * Full Gemini TTS prebuilt voice catalog with official gender labels
 * (Cloud Text-to-Speech / Gemini TTS docs).
 *
 * Multi-speaker dialogues pick one female + one male voice from these pools.
 */

import type { SpeakerGender } from '@/lib/speakerGender';

export type GeminiTtsVoiceName =
  | 'Achernar'
  | 'Achird'
  | 'Algenib'
  | 'Algieba'
  | 'Alnilam'
  | 'Aoede'
  | 'Autonoe'
  | 'Callirrhoe'
  | 'Charon'
  | 'Despina'
  | 'Enceladus'
  | 'Erinome'
  | 'Fenrir'
  | 'Gacrux'
  | 'Iapetus'
  | 'Kore'
  | 'Laomedeia'
  | 'Leda'
  | 'Orus'
  | 'Puck'
  | 'Pulcherrima'
  | 'Rasalgethi'
  | 'Sadachbia'
  | 'Sadaltager'
  | 'Schedar'
  | 'Sulafat'
  | 'Umbriel'
  | 'Vindemiatrix'
  | 'Zephyr'
  | 'Zubenelgenubi';

export const GEMINI_TTS_VOICES: Record<SpeakerGender, readonly GeminiTtsVoiceName[]> = {
  female: [
    'Achernar',
    'Aoede',
    'Autonoe',
    'Callirrhoe',
    'Despina',
    'Erinome',
    'Gacrux',
    'Kore',
    'Laomedeia',
    'Leda',
    'Pulcherrima',
    'Sulafat',
    'Vindemiatrix',
    'Zephyr',
  ],
  male: [
    'Achird',
    'Algenib',
    'Algieba',
    'Alnilam',
    'Charon',
    'Enceladus',
    'Fenrir',
    'Iapetus',
    'Orus',
    'Puck',
    'Rasalgethi',
    'Sadachbia',
    'Sadaltager',
    'Schedar',
    'Umbriel',
    'Zubenelgenubi',
  ],
};

export function pickGeminiTtsVoice(
  gender: SpeakerGender,
  used: Set<string>,
): GeminiTtsVoiceName {
  const pool = GEMINI_TTS_VOICES[gender];
  const available = pool.filter((v) => !used.has(v));
  const choices = available.length > 0 ? available : [...pool];
  const voice = choices[Math.floor(Math.random() * choices.length)]!;
  used.add(voice);
  return voice;
}
