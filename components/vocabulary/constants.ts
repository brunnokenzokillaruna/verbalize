import type { SupportedLanguage } from '@/types';

export const LANG_LABEL: Record<SupportedLanguage, { label: string; flag: string }> = {
  fr: { label: 'Francês', flag: '🇫🇷' },
  en: { label: 'Inglês', flag: '🇬🇧' },
};
