import type { SupportedLanguage } from '@/types';
import { TENSE_LABELS } from '@/utils/conjugationHelper';

export { TENSE_LABELS };

export const TENSE_ORDER = [
  'present',
  'presentContinuous',
  'past',
  'pastContinuous',
  'imperfect',
  'pluperfect',
  'future',
  'nearFuture',
  'futurePerfect',
  'conditional',
  'conditionalPast',
  'subjunctive',
];

export const TENSE_ACCENT: Record<string, string> = {
  present: '#3b82f6',
  presentContinuous: '#60a5fa',
  past: '#8b5cf6',
  pastContinuous: '#c4b5fd',
  imperfect: '#a78bfa',
  pluperfect: '#7c3aed',
  future: '#10b981',
  nearFuture: '#34d399',
  futurePerfect: '#059669',
  conditional: '#f59e0b',
  conditionalPast: '#d97706',
  subjunctive: '#ec4899',
};

export const LANG_META: Record<SupportedLanguage, { label: string; flag: string; placeholder: string }> = {
  fr: { label: 'Francês', flag: '🇫🇷', placeholder: 'ex: être, avoir, aller…' },
  en: { label: 'Inglês',  flag: '🇬🇧', placeholder: 'ex: to be, to have, to go…' },
};
