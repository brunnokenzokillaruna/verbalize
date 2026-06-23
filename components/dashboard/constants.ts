import type { ProficiencyLevel } from '@/types';

export const LANG_LABEL: Record<string, { name: string; flag: string; countryCode: string }> = {
  fr: { name: 'Francês', flag: '🇫🇷', countryCode: 'fr' },
  en: { name: 'Inglês', flag: '🇬🇧', countryCode: 'gb' },
};

export const ALL_LEVELS: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const THEME_COLORS = [
  ['var(--color-primary)', 'var(--color-primary-dark)'],
  ['var(--color-success)', 'var(--color-success)'],
  ['var(--color-verb)', 'var(--color-verb)'],
  ['var(--color-vocab)', 'var(--color-warning)'],
  ['var(--color-error)', 'var(--color-error)'],
  ['var(--color-primary-dark)', 'var(--color-primary)'],
  ['var(--color-vocab)', 'var(--color-vocab)'],
] as const;

export const TAG_LABELS: Record<string, string> = {
  PRON: 'Pronúncia',
  GRAM: 'Gramática',
  VOC: 'Vocab.',
  DIAL: 'Diálogo',
  MISS: 'Missão',
  VERB: 'Verbos',
  EXPR: 'Expressões',
  CULT: 'Cultura',
  REVIEW: 'Checkpoint',
};
