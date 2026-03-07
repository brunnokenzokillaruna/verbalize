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
