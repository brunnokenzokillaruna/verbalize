import type { ProficiencyLevel } from '@/types';
import type {
  CorrectionMode,
  RoleplayIntensity,
  RoleplayScenario,
  RoleplaySessionConfig,
} from './types';

export const CUSTOM_SCENARIO_LIMITS = {
  titlePt: 80,
  descriptionPt: 280,
  settingPt: 280,
  characterName: 40,
  characterRolePt: 80,
  userRolePt: 80,
  objectivePt: 160,
} as const;

export const DEFAULT_CUSTOM_OPENING_HINT =
  'Greet the learner in character, acknowledge the setting, and steer toward the conversation objective.';

export function normalizeOneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function boundOneLine(value: unknown, maxLength: number, fallback: string): string {
  const normalized = typeof value === 'string' ? normalizeOneLine(value) : '';
  return (normalized || normalizeOneLine(fallback)).slice(0, maxLength);
}

/** JSON fence that prevents user content from closing its own prompt boundary. */
export function fencePromptData(label: string, data: unknown): string {
  const json = (JSON.stringify(data, null, 2) ?? 'null')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
  return `<${label}>\n${json}\n</${label}>`;
}

export interface CustomScenarioInput {
  titlePt?: string;
  descriptionPt?: string;
  settingPt?: string;
  characterName?: string;
  characterRolePt?: string;
  userRolePt?: string;
  objectivePt?: string;
  level?: ProficiencyLevel;
}

/** Canonical constructor shared by browser-facing setup and the token route. */
export function createCustomScenario(input: CustomScenarioInput): RoleplayScenario {
  const descriptionPt = boundOneLine(
    input.descriptionPt,
    CUSTOM_SCENARIO_LIMITS.descriptionPt,
    'Cenário personalizado',
  );

  return {
    id: 'custom',
    titlePt: boundOneLine(input.titlePt, CUSTOM_SCENARIO_LIMITS.titlePt, 'Cenário livre'),
    descriptionPt,
    characterName: boundOneLine(
      input.characterName,
      CUSTOM_SCENARIO_LIMITS.characterName,
      'Alex',
    ),
    characterRolePt: boundOneLine(
      input.characterRolePt,
      CUSTOM_SCENARIO_LIMITS.characterRolePt,
      'parceiro(a) de conversa',
    ),
    userRolePt: boundOneLine(input.userRolePt, CUSTOM_SCENARIO_LIMITS.userRolePt, 'aprendiz'),
    objectivePt: boundOneLine(
      input.objectivePt,
      CUSTOM_SCENARIO_LIMITS.objectivePt,
      'Manter uma conversa natural',
    ),
    goalsPt: [],
    settingPt: boundOneLine(
      input.settingPt,
      CUSTOM_SCENARIO_LIMITS.settingPt,
      descriptionPt || 'um ambiente cotidiano',
    ),
    openingHint: DEFAULT_CUSTOM_OPENING_HINT,
    level: input.level ?? 'A2',
  };
}

export function buildCustomScenario(input: {
  scenarioText: string;
  aiRolePt: string;
  userRolePt: string;
  objectivePt: string;
  characterName?: string;
  level?: ProficiencyLevel;
}): RoleplayScenario {
  const descriptionPt = boundOneLine(
    input.scenarioText,
    CUSTOM_SCENARIO_LIMITS.descriptionPt,
    'Cenário personalizado',
  );
  const titlePt =
    descriptionPt.length > 42
      ? `${descriptionPt.slice(0, 39).trim()}…`
      : descriptionPt;

  return createCustomScenario({
    titlePt,
    descriptionPt,
    settingPt: descriptionPt,
    characterName: input.characterName,
    characterRolePt: input.aiRolePt,
    userRolePt: input.userRolePt,
    objectivePt: input.objectivePt,
    level: input.level,
  });
}

export function toSessionConfig(
  scenario: RoleplayScenario,
  options?: { intensity?: RoleplayIntensity; correctionMode?: CorrectionMode },
): RoleplaySessionConfig {
  return {
    scenario,
    userRolePt: scenario.userRolePt,
    objectivePt: scenario.objectivePt,
    intensity: options?.intensity ?? 'normal',
    correctionMode: options?.correctionMode ?? 'study',
  };
}
