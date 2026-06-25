import type { SupportedLanguage } from '@/types';

export type RecState =
  | 'idle'
  | 'requesting-mic'
  | 'recording'
  | 'transcribing'
  | 'review-correct'
  | 'review-retry'
  | 'done';

export interface DialogueLine {
  rawIndex: number;
  speaker: string;
  text: string;
  translation?: string;
  isUserLine: boolean;
  /** NPC line swapped because the learner's previous turn was inadequate. */
  isConsequenceTone?: boolean;
}

export interface LessonMissionRolePlayProps {
  dialogue: string;
  dialogueTranslations?: string[];
  language: SupportedLanguage;
  intentMode?: boolean;
  rolePlayConsequences?: import('@/types').RolePlayConsequence[];
  onComplete: (spoken: number, totalSpeakable: number) => void;
}
