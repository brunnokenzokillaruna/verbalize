import type { SupportedLanguage } from '@/types';

export interface CurriculumProgressChange {
  language: SupportedLanguage;
  from: string;
  to: string;
}

export interface CurriculumSanitizeChange {
  language: SupportedLanguage;
  from: string;
  to: string;
  reason: string;
}

/** Summary returned after syncing a user profile against the current catalog. */
export interface CurriculumSyncReport {
  uid: string;
  fromVersion: number;
  toVersion: number;
  migrated: boolean;
  progressChanges: CurriculumProgressChange[];
  sanitizedChanges: CurriculumSanitizeChange[];
  mistakesUpdated: number;
  pregenCleared: number;
}

/** Client-visible notice shown once after a sync that changed user data. */
export interface CurriculumSyncNotice {
  reportVersion: number;
  title: string;
  message: string;
  details: string[];
}
