import {
  Plane, Utensils, Music, Film, Briefcase, Laptop, Book, Palette,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const ADMIN_EMAIL = 'admin@gmail.com';

export const PROFESSIONS = [
  'Estudante',
  'Tecnologia / TI',
  'Saúde',
  'Educação',
  'Negócios / Finanças',
  'Artes / Comunicação',
  'Jurídico',
  'Outro',
];

export const GOALS = [
  'Viajar com confiança',
  'Crescer profissionalmente',
  'Estudar no exterior',
  'Acompanhar séries sem legenda',
  'Me comunicar com nativos',
  'Morar no exterior',
];

export const INTERESTS: { label: string; icon: LucideIcon }[] = [
  { label: 'Viagens', icon: Plane },
  { label: 'Gastronomia', icon: Utensils },
  { label: 'Música', icon: Music },
  { label: 'Cinema & Séries', icon: Film },
  { label: 'Negócios', icon: Briefcase },
  { label: 'Tecnologia', icon: Laptop },
  { label: 'Literatura', icon: Book },
  { label: 'Moda & Design', icon: Palette },
];
