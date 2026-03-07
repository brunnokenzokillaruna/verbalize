import type { Timestamp } from 'firebase/firestore';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserDocument {
  uid: string;
  email: string;
  name: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;

  // Personalization
  profession: string;
  interests: string[];
  languageGoals: string;
  currentTargetLanguage: 'fr' | 'en';

  // High-level stats
  currentStreak: number;
  totalLessonsCompleted: number;
}

// ─── Vocabulary & SRS ─────────────────────────────────────────────────────────

export interface UserVocabularyDocument {
  id: string;
  uid: string;
  language: 'fr' | 'en';

  word: string;
  translation: string;

  // SRS Data
  firstSeen: Timestamp;
  lastReview: Timestamp;
  nextReview: Timestamp;
  srsLevel: number; // 0–5 indicating memory strength
  mistakeCount: number;
}

// ─── Image Cache ──────────────────────────────────────────────────────────────

export interface ImageCacheDocument {
  word: string; // Document ID (e.g., "apple_isolated")
  language: string;
  imageUrl: string;
  photographer: string;
  createdAt: Timestamp;
}

// ─── Lesson Log ───────────────────────────────────────────────────────────────

export interface LessonLogDocument {
  id: string;
  uid: string;
  language: 'fr' | 'en';
  lessonId: string;
  completedAt: Timestamp;
  score: number; // 0–100
}

// ─── Verbs ────────────────────────────────────────────────────────────────────

export interface VerbDocument {
  infinitive: string; // Document ID
  language: 'fr' | 'en';
  translation: string;

  conjugations: {
    present: Record<string, string>;
    past?: Record<string, string>;
    future?: Record<string, string>;
    conditional?: Record<string, string>;
    subjunctive?: Record<string, string>;
    imperfect?: Record<string, string>;
  };

  exampleSentences: Array<{
    target: string;
    portuguese: string;
  }>;
}

// ─── Lesson ───────────────────────────────────────────────────────────────────

export type LessonStage = 'hook' | 'grammar' | 'vocabulary' | 'practice' | 'review';

export type SupportedLanguage = 'fr' | 'en';

export type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ExerciseType =
  | 'context-choice'
  | 'sentence-builder'
  | 'image-match'
  | 'audio-dictation'
  | 'speak-repeat'
  | 'error-correction'
  | 'reverse-translation'
  | 'verb-conjugation-drill';

// ─── Server Action Result Types ───────────────────────────────────────────────

export interface TranslateWordResult {
  translation: string;
  explanation: string;
  example: string;
}

export interface HookResult {
  dialogue: string;
  newVocabulary: string[];
  grammarFocus: string;
}

export interface GrammarBridgeResult {
  rule: string;
  targetExample: string;
  portugueseComparison: string;
}

export interface VocabImageResult {
  imageUrl: string;
  imageAlt: string;
}

// ─── Curriculum & Lesson Engine ───────────────────────────────────────────────

export interface LessonDefinition {
  id: string;
  language: SupportedLanguage;
  level: ProficiencyLevel;
  grammarFocus: string;
}

// ─── Exercise Data Types ──────────────────────────────────────────────────────

export interface ContextChoiceData {
  sentence: string;      // "Je ___ un café." (blank represented as ___)
  blankWord: string;     // the correct answer
  options: string[];     // 4 options including the correct one
  translation: string;   // Portuguese translation of the full sentence
}

export interface SentenceBuilderData {
  words: string[];        // shuffled word list
  correctOrder: string[]; // correct arrangement
  translation: string;    // Portuguese translation
}

export interface ReverseTranslationData {
  portuguese_sentence: string;
  target_translation: string;
  acceptable_variants: string[];
  hint?: string;
}

export interface DictationData {
  text: string;        // text to play via TTS
  translation: string; // Portuguese hint
}

export interface ErrorCorrectionData {
  sentence_with_error: string;
  error_word: string;
  correct_word: string;
  explanation: string; // in Portuguese
}

export interface ConjugationDrillData {
  verb: string;
  tense: string;
  conjugations: Array<{ pronoun: string; form: string; blank: boolean }>;
  tip?: string;
}

export type Exercise =
  | { type: 'context-choice';         data: ContextChoiceData }
  | { type: 'sentence-builder';       data: SentenceBuilderData }
  | { type: 'reverse-translation';    data: ReverseTranslationData }
  | { type: 'audio-dictation';        data: DictationData }
  | { type: 'error-correction';       data: ErrorCorrectionData }
  | { type: 'verb-conjugation-drill'; data: ConjugationDrillData }
