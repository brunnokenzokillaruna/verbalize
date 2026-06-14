import type {
  GrammarBridgeResult,
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
  language: SupportedLanguage;
  level: ProficiencyLevel;
  knownVocabulary: string[];
  previousTopics: string[];
  grammarBridge?: GrammarBridgeResult | null;
}
