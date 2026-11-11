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

export const LANG_META: Record<SupportedLanguage, { label: string; flag: string; placeholder: string }> = {
  fr: { label: 'Francês', flag: '🇫🇷', placeholder: 'ex: être, avoir, aller…' },
  en: { label: 'Inglês',  flag: '🇬🇧', placeholder: 'ex: to be, to have, to go…' },
};
