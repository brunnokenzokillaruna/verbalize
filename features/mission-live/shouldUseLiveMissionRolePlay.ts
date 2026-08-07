import type { ProficiencyLevel } from '@/types';

const LIVE_LEVELS = new Set<ProficiencyLevel>(['B1', 'B2', 'C1', 'C2']);

/**
 * B1+ uses Live by default. Override with NEXT_PUBLIC_LIVE_MISSION_ROLEPLAY:
 * - "1" / "true" → force Live for all levels
 * - "0" / "false" → force scripted for all levels
 * - unset → level gate only
 */
export function shouldUseLiveMissionRolePlay(level: ProficiencyLevel): boolean {
  const raw = process.env.NEXT_PUBLIC_LIVE_MISSION_ROLEPLAY?.trim().toLowerCase();
  if (raw === '1' || raw === 'true') return true;
  if (raw === '0' || raw === 'false') return false;
  return LIVE_LEVELS.has(level);
}
