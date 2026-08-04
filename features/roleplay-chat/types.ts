import type { ProficiencyLevel, SupportedLanguage } from '@/types';

export type RoleplayScenarioId =
  | 'cafe'
  | 'hotel'
  | 'job-interview'
  | 'doctor'
  | 'friend-catchup'
  | 'travel-help';

export interface RoleplayScenario {
  id: RoleplayScenarioId;
  titlePt: string;
  descriptionPt: string;
  characterName: string;
  characterRolePt: string;
  settingPt: string;
  /** Suggested opening vibe for the AI (target language context). */
  openingHint: string;
  levels: ProficiencyLevel[];
}

export type ChatRole = 'user' | 'assistant' | 'system';

export interface GrammarCorrection {
  hasIssues: boolean;
  correctedSentence?: string;
  feedbackPt: string;
  /** Short labels e.g. "concordância", "tempo verbal" */
  issueTags?: string[];
}

export interface RoleplayChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** True while transcript is still streaming in. */
  streaming?: boolean;
  /** Brazilian Portuguese localization of `text`. */
  translationPt?: string;
  translationLoading?: boolean;
  grammar?: GrammarCorrection | null;
  grammarLoading?: boolean;
  createdAt: number;
}

export type LiveSessionStatus =
  | 'idle'
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'error'
  | 'ended';

export interface LiveTokenRequest {
  language: SupportedLanguage;
  scenarioId: RoleplayScenarioId;
  level: ProficiencyLevel;
}

export interface LiveTokenResponse {
  token: string;
  model: string;
  systemInstruction: string;
  expiresAt: string;
}

export interface CorrectRoleplayGrammarParams {
  transcript: string;
  language: SupportedLanguage;
  level: ProficiencyLevel;
  scenarioTitle: string;
  recentContext: string[];
}

export interface CorrectRoleplayGrammarResult {
  hasIssues: boolean;
  correctedSentence?: string;
  feedbackPt: string;
  issueTags?: string[];
  error?: string;
}
