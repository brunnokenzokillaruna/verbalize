import type { LucideIcon } from 'lucide-react';
import { Layers, Brain, ImageIcon } from 'lucide-react';

export type ReviewThemeId = 'flashcard' | 'context' | 'visual';

export type ReviewTheme = {
  id: ReviewThemeId;
  label: string;
  tagline: string;
  icon: LucideIcon;
  accent: string;
  accentDark: string;
  accentLight: string;
  accentBg: string;
  ambient: string;
  resultsTitle: string;
};

export const REVIEW_THEMES: Record<ReviewThemeId, ReviewTheme> = {
  flashcard: {
    id: 'flashcard',
    label: 'Cartões',
    tagline: 'Memória ativa · virar e avaliar',
    icon: Layers,
    accent: 'var(--color-primary)',
    accentDark: 'var(--color-primary-dark)',
    accentLight: 'var(--color-primary-light)',
    accentBg: 'var(--color-primary-light)',
    ambient:
      'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(29, 94, 212, 0.14) 0%, transparent 55%)',
    resultsTitle: 'Cartões concluídos',
  },
  context: {
    id: 'context',
    label: 'Em contexto',
    tagline: 'Frases reais · uso na prática',
    icon: Brain,
    accent: 'var(--color-verb)',
    accentDark: '#6d28d9',
    accentLight: 'rgba(124, 58, 237, 0.12)',
    accentBg: 'var(--color-verb-bg)',
    ambient:
      'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(124, 58, 237, 0.12) 0%, transparent 55%)',
    resultsTitle: 'Contexto concluído',
  },
  visual: {
    id: 'visual',
    label: 'Visual',
    tagline: 'Associação mental · imagem e palavra',
    icon: ImageIcon,
    accent: 'var(--color-warning)',
    accentDark: '#b45309',
    accentLight: 'var(--color-warning-bg)',
    accentBg: 'var(--color-warning-bg)',
    ambient:
      'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(217, 119, 6, 0.14) 0%, transparent 55%)',
    resultsTitle: 'Galeria concluída',
  },
};

export const EXERCISE_TYPE_LABELS: Record<
  'context-choice' | 'reverse-translation' | 'word-bank-translation',
  { label: string; hint: string }
> = {
  'context-choice': {
    label: 'Escolha certa',
    hint: 'Qual palavra completa a frase?',
  },
  'reverse-translation': {
    label: 'Traduza',
    hint: 'Como se diz em português?',
  },
  'word-bank-translation': {
    label: 'Monte a frase',
    hint: 'Arraste as palavras na ordem certa',
  },
};
