import type { MissionBriefingResult, ProficiencyLevel, SupportedLanguage } from '@/types';
import type { RoleplayDebriefResult, RoleplaySessionConfig } from '@/features/roleplay-chat/types';

export type MissionLiveMode = 'live' | 'scripted';

export interface MissionLiveBuildInput {
  briefing: MissionBriefingResult;
  dialogue: string;
  language: SupportedLanguage;
  level: ProficiencyLevel;
  lessonTitlePt?: string;
}

export interface MissionLiveSessionResult {
  mode: MissionLiveMode;
  userTurns: number;
  debrief: RoleplayDebriefResult | null;
  completedGoalIndexes: number[];
}

export type { RoleplaySessionConfig };
