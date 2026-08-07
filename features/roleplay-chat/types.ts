import type { ProficiencyLevel, SupportedLanguage } from '@/types';

/** Preset scenarios are unique per CEFR level — never reused across levels. */
export type PresetScenarioId =
  | 'a1-cafe'
  | 'a1-apresentacao'
  | 'a1-passagem'
  | 'a1-feira'
  | 'a1-farmacia'
  | 'a2-hotel'
  | 'a2-consulta'
  | 'a2-combinar'
  | 'a2-troca'
  | 'a2-entrega'
  | 'b1-voo-cancelado'
  | 'b1-atraso'
  | 'b1-triagem'
  | 'b1-reclamacao'
  | 'b1-vizinho'
  | 'b2-salario'
  | 'b2-conflito'
  | 'b2-turismo'
  | 'b2-cliente'
  | 'b2-aluguel'
  | 'c1-projeto'
  | 'c1-feedback'
  | 'c1-entrevista-tecnica'
  | 'c1-mediacao'
  | 'c1-reuniao'
  | 'c2-crise'
  | 'c2-etica'
  | 'c2-diplomacia'
  | 'c2-ironia'
  | 'c2-painel';

export type RoleplayScenarioId = PresetScenarioId | 'custom';

/** How demanding the character is inside the learner's own level. */
export type RoleplayIntensity = 'gentle' | 'normal' | 'challenging';

/** When grammar feedback is surfaced. */
export type CorrectionMode = 'fluency' | 'study';

export interface RoleplayScenario {
  id: RoleplayScenarioId;
  titlePt: string;
  descriptionPt: string;
  characterName: string;
  characterRolePt: string;
  /** Learner's role in the scene (PT-BR). */
  userRolePt: string;
  /** Short conversation goal for the learner (PT-BR). */
  objectivePt: string;
  /** Checkable micro-goals (PT-BR) used for steering and for the debrief. */
  goalsPt: string[];
  settingPt: string;
  /** Suggested opening vibe for the AI (target language context). */
  openingHint: string;
  /** Exactly one CEFR level per scenario. */
  level: ProficiencyLevel;
}

/** Resolved config passed into Live + debrief. */
export interface RoleplaySessionConfig {
  scenario: RoleplayScenario;
  userRolePt: string;
  objectivePt: string;
  intensity: RoleplayIntensity;
  correctionMode: CorrectionMode;
}

export interface RoleplayRolePair {
  aiRolePt: string;
  userRolesPt: string[];
}

export interface SuggestRoleplayRolesResult {
  pairs: RoleplayRolePair[];
  /** True when local keyword fallback was used. */
  usedFallback?: boolean;
  error?: string;
}

export interface RoleplayDebriefResult {
  whatWorkedPt: string;
  recurringIssuePt: string;
  phraseToPractice: string;
  phraseToPracticePt: string;
  /** Indexes of `goalsPt` the learner actually completed. */
  completedGoalIndexes: number[];
  error?: string;
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

/** In-character nudges the learner can request without breaking immersion. */
export type CoachNoteKind = 'repeat' | 'simplify' | 'suggest';

export interface LiveMissionConstraintsPayload {
  keyPhrases: string[];
  stakes?: string;
  timePressure?: string;
  dialogueSkeleton: string[];
}

export interface LiveTokenCustomScenario {
  titlePt: string;
  descriptionPt: string;
  settingPt: string;
  characterName: string;
  characterRolePt: string;
  userRolePt: string;
  objectivePt: string;
  /** Present only for MISS Live sessions. */
  goalsPt?: string[];
  missionConstraints?: LiveMissionConstraintsPayload;
}

/**
 * Exactly one path: preset scenarioId (never `custom`) or a customScenario payload.
 * Optional opposite keys are typed as `never` so callers stay practical with object literals.
 */
export type LiveTokenRequest =
  | {
      language: SupportedLanguage;
      level: ProficiencyLevel;
      intensity: RoleplayIntensity;
      scenarioId: PresetScenarioId;
      userRolePt?: string;
      objectivePt?: string;
      customScenario?: never;
    }
  | {
      language: SupportedLanguage;
      level: ProficiencyLevel;
      intensity: RoleplayIntensity;
      scenarioId?: never;
      userRolePt?: never;
      objectivePt?: never;
      customScenario: LiveTokenCustomScenario;
    };

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
