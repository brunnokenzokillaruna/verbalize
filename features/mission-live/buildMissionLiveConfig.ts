import {
  boundOneLine,
  createCustomScenario,
  CUSTOM_SCENARIO_LIMITS,
} from '@/features/roleplay-chat/buildCustomScenario';
import { boundGoals } from '@/features/roleplay-chat/prompts';
import type { RoleplaySessionConfig } from '@/features/roleplay-chat/types';
import { parseDialogueLines } from '@/components/lesson/mission-roleplay/utils';
import type { MissionLiveBuildInput } from './types';

function inferNpcName(dialogue: string): string {
  const lines = parseDialogueLines(dialogue);
  const npc = lines.find((l) => !l.isUserLine);
  return boundOneLine(npc?.speaker, CUSTOM_SCENARIO_LIMITS.characterName, 'Alex');
}

function inferOpeningHint(dialogue: string): string {
  const lines = parseDialogueLines(dialogue);
  const firstNpc = lines.find((l) => !l.isUserLine);
  if (!firstNpc?.text) {
    return 'Greet the learner in character, stay in the mission scenario, and steer toward the objectives.';
  }
  return boundOneLine(
    `Open with a line in the spirit of: "${firstNpc.text}" — do not quote it verbatim if unnatural; stay in character.`,
    240,
    'Greet the learner in character.',
  );
}

/** Maps a MISS briefing + hook dialogue into the Live session config shape. */
export function buildMissionLiveConfig(input: MissionLiveBuildInput): RoleplaySessionConfig {
  const { briefing, dialogue, level, lessonTitlePt } = input;
  const goalsPt = boundGoals(briefing.objectives);
  const objectivePt = boundOneLine(
    goalsPt[0] ?? briefing.scenario,
    CUSTOM_SCENARIO_LIMITS.objectivePt,
    'Cumprir os objetivos da missão',
  );

  const scenario = createCustomScenario({
    titlePt: lessonTitlePt ?? 'Missão',
    descriptionPt: briefing.scenario,
    settingPt: briefing.scenario,
    characterName: inferNpcName(dialogue),
    characterRolePt: 'personagem da missão',
    userRolePt: 'Você',
    objectivePt,
    level,
  });

  return {
    scenario: {
      ...scenario,
      goalsPt,
      openingHint: inferOpeningHint(dialogue),
    },
    userRolePt: 'Você',
    objectivePt,
    intensity: level === 'B1' ? 'gentle' : 'normal',
    correctionMode: 'fluency',
  };
}

export interface MissionLiveConstraints {
  keyPhrases: string[];
  stakes?: string;
  timePressure?: string;
  /** Compact dialogue skeleton for steering — not a verbatim script. */
  dialogueSkeleton: string[];
}

export function buildMissionLiveConstraints(input: MissionLiveBuildInput): MissionLiveConstraints {
  const lines = parseDialogueLines(input.dialogue);
  return {
    keyPhrases: (input.briefing.keyPhrases ?? [])
      .map((p) => boundOneLine(p, 80, ''))
      .filter(Boolean)
      .slice(0, 8),
    stakes: input.briefing.stakes
      ? boundOneLine(input.briefing.stakes, 160, '')
      : undefined,
    timePressure: input.briefing.timePressure
      ? boundOneLine(input.briefing.timePressure, 60, '')
      : undefined,
    dialogueSkeleton: lines
      .slice(0, 10)
      .map((l) => `${l.isUserLine ? 'Learner' : l.speaker}: ${boundOneLine(l.text, 120, '')}`)
      .filter((s) => !s.endsWith(': ')),
  };
}
