export const MISSION_THEME = {
  accent: 'var(--color-success)',
  accentDark: '#047857',
  accentBg: 'var(--color-success-bg)',
  label: 'Missão Especial',
} as const;

export const MISSION_STEPS = [
  { id: 'briefing', label: 'Briefing' },
  { id: 'scene', label: 'Cena' },
  { id: 'practice', label: 'Prática' },
] as const;

export const MAX_PAST_LINES = 2;
