import type {
  GrammarBridgeResult,
  LessonRole,
  LessonTag,
  ProficiencyLevel,
  SupportedLanguage,
} from '@/types';

export interface GeneratePracticeParams {
  dialogue: string;
  newVocabulary: string[];
  verbWord: string;
  grammarFocus: string;
  theme?: string;
  uiTitle?: string;
  tag: LessonTag;
  lessonRole?: LessonRole;
  language: SupportedLanguage;
  level: ProficiencyLevel;
  knownVocabulary: string[];
  previousTopics: string[];
  grammarBridge?: GrammarBridgeResult | null;
  /** Override retry count (pregen uses 1, live path uses 2). */
  maxAttempts?: number;
  /** Words with SRS level ≥4 — used for adaptive tier-down (recognition → production). */
  masteredVocabulary?: string[];
}
