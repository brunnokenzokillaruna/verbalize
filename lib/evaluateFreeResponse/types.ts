import type { SupportedLanguage } from '@/types';

export interface EvaluateFreeResponseParams {
  /** Transcribed learner utterance in the target language. */
  transcript: string;
  /** What the learner should communicate (PT-BR). */
  intent: string;
  language: SupportedLanguage;
  /** Recent dialogue lines for context. */
  previousContext: string[];
  /** Example ideal response in the target language. */
  expectedLine?: string;
  /** What the NPC / interlocutor said (target language). */
  promptLine?: string;
  /** Extra rubric for Gemini / local keyword matching (PT-BR or EN). */
  evaluationCriteria?: string;
  /** Themes that count as acceptable even without exact wording. */
  acceptableThemes?: string[];
  /**
   * When true, a relevant in-character reply is success — criteria/themes are
   * optional directions, not a hidden checklist of required details.
   */
  openEnded?: boolean;
  /** When false, skip Gemini and use local heuristics only. */
  preferGemini?: boolean;
}

export interface EvaluateFreeResponseResult {
  isCorrect: boolean;
  feedback: string;
  correctedSentence?: string;
  /** `local` | `gemini` — how the answer was scored. */
  evaluator?: 'local' | 'gemini';
  error?: string;
}

export interface GeminiEvaluationPayload {
  isCorrect: boolean;
  feedback: string;
  correctedSentence?: string;
}
