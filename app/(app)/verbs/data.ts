import type { SupportedLanguage } from '@/types';

export const TENSE_LABELS: Record<string, string> = {
  present:     'Presente',
  past:        'Passado',
  future:      'Futuro',
  conditional: 'Condicional',
  imperfect:   'Imperfeito',
  subjunctive: 'Subjuntivo',
};

export const TENSE_ORDER = ['present', 'past', 'imperfect', 'future', 'conditional', 'subjunctive'];

export const TENSE_ACCENT: Record<string, string> = {
  present:     '#3b82f6',
  past:        '#8b5cf6',
  imperfect:   '#a78bfa',
  future:      '#10b981',
  conditional: '#f59e0b',
  subjunctive: '#ec4899',
};

export const LANG_META: Record<SupportedLanguage, { label: string; flag: string; placeholder: string }> = {
  fr: { label: 'Francês', flag: '🇫🇷', placeholder: 'ex: être, avoir, aller…' },
  en: { label: 'Inglês',  flag: '🇬🇧', placeholder: 'ex: to be, to have, to go…' },
};
