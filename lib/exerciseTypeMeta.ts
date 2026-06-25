import type { ExerciseType, SupportedLanguage, ProficiencyLevel } from '@/types';
import type { LucideIcon } from 'lucide-react';
import type { ImmersionMode } from '@/lib/immersion';
import {
  shouldUseTargetLanguageInstructions,
  EXERCISE_INSTRUCTIONS_TARGET,
} from '@/lib/immersion';
import {
  Braces,
  BookOpen,
  AudioLines,
  Ear,
  GitBranch,
  ImageIcon,
  Link2,
  MessageCircle,
  Mic,
  PenLine,
  Podcast,
  Puzzle,
  ShieldAlert,
  Shuffle,
  Sparkles,
  RefreshCw,
  Subtitles,
  Type,
  Voicemail,
  UserCog,
  Volume2,
  Waves,
  Zap,
} from 'lucide-react';

export type ExerciseShellVariant =
  | 'prompt'
  | 'build'
  | 'produce'
  | 'oral'
  | 'dialogue'
  | 'trap'
  | 'scan'
  | 'link'
  | 'visual'
  | 'speed';

export interface ExerciseTypeMeta {
  title: string;
  instruction: string;
  icon: LucideIcon;
  accent: string;
  accentBg: string;
  accentBorder: string;
  variant: ExerciseShellVariant;
}

export const EXERCISE_TYPE_META: Record<ExerciseType, ExerciseTypeMeta> = {
  'context-choice': {
    title: 'Escolha contextual',
    instruction: 'Qual palavra completa a frase?',
    icon: Sparkles,
    accent: 'var(--color-vocab)',
    accentBg: 'var(--color-vocab-bg)',
    accentBorder: 'rgba(217, 119, 6, 0.35)',
    variant: 'prompt',
  },
  'sentence-builder': {
    title: 'Monte a frase',
    instruction: 'Toque nas palavras na ordem certa.',
    icon: Puzzle,
    accent: 'var(--color-primary)',
    accentBg: 'var(--color-primary-light)',
    accentBorder: 'rgba(29, 94, 212, 0.3)',
    variant: 'build',
  },
  'image-match': {
    title: 'Associe a imagem',
    instruction: 'Qual foto representa a palavra?',
    icon: ImageIcon,
    accent: 'var(--color-warning)',
    accentBg: 'var(--color-warning-bg)',
    accentBorder: 'var(--color-warning-border)',
    variant: 'visual',
  },
  'reverse-translation': {
    title: 'Traduza livremente',
    instruction: 'Escreva a frase no idioma-alvo.',
    icon: PenLine,
    accent: '#0d9488',
    accentBg: 'rgba(13, 148, 136, 0.12)',
    accentBorder: 'rgba(13, 148, 136, 0.35)',
    variant: 'produce',
  },
  'word-bank-translation': {
    title: 'Banco de palavras',
    instruction: 'Monte a tradução com os blocos.',
    icon: Braces,
    accent: '#0891b2',
    accentBg: 'rgba(8, 145, 178, 0.12)',
    accentBorder: 'rgba(8, 145, 178, 0.35)',
    variant: 'build',
  },
  'bridge-choice': {
    title: 'Ponte PT-BR',
    instruction: 'Evite a tradução literal do português.',
    icon: GitBranch,
    accent: 'var(--color-verb)',
    accentBg: 'var(--color-verb-bg)',
    accentBorder: 'rgba(124, 58, 237, 0.35)',
    variant: 'trap',
  },
  'listen-and-select': {
    title: 'Ouça e escolha',
    instruction: 'Qual transcrição bate com o áudio?',
    icon: Ear,
    accent: '#db2777',
    accentBg: 'rgba(219, 39, 119, 0.1)',
    accentBorder: 'rgba(219, 39, 119, 0.3)',
    variant: 'oral',
  },
  'listening-comprehension': {
    title: 'Compreensão auditiva',
    instruction: 'Ouça o diálogo e responda sobre o significado.',
    icon: Ear,
    accent: 'var(--color-primary)',
    accentBg: 'var(--color-primary-light)',
    accentBorder: 'rgba(29, 94, 212, 0.3)',
    variant: 'oral',
  },
  'audio-dictation': {
    title: 'Ditado',
    instruction: 'Ouça e escreva o que você ouviu.',
    icon: Volume2,
    accent: '#4f46e5',
    accentBg: 'rgba(79, 70, 229, 0.1)',
    accentBorder: 'rgba(79, 70, 229, 0.3)',
    variant: 'oral',
  },
  'speak-repeat': {
    title: 'Fale e repita',
    instruction: 'Grave sua voz imitando a frase.',
    icon: Mic,
    accent: '#e11d48',
    accentBg: 'rgba(225, 29, 72, 0.1)',
    accentBorder: 'rgba(225, 29, 72, 0.3)',
    variant: 'oral',
  },
  'error-correction': {
    title: 'Corrija o erro',
    instruction: 'Encontre e conserte o erro na frase.',
    icon: Type,
    accent: 'var(--color-error)',
    accentBg: 'var(--color-error-bg)',
    accentBorder: 'rgba(220, 38, 38, 0.3)',
    variant: 'trap',
  },
  'social-roleplay': {
    title: 'Diálogo real',
    instruction: 'Como você responderia nesta situação?',
    icon: MessageCircle,
    accent: '#2563eb',
    accentBg: 'rgba(37, 99, 235, 0.1)',
    accentBorder: 'rgba(37, 99, 235, 0.3)',
    variant: 'dialogue',
  },
  'scrambled-conversation': {
    title: 'Ordem do diálogo',
    instruction: 'Organize as falas na sequência lógica.',
    icon: Shuffle,
    accent: '#7c3aed',
    accentBg: 'rgba(124, 58, 237, 0.1)',
    accentBorder: 'rgba(124, 58, 237, 0.3)',
    variant: 'dialogue',
  },
  'interactive-subtitles': {
    title: 'Legendas interativas',
    instruction: 'Toque nos erros e escolha a correção.',
    icon: Subtitles,
    accent: '#f59e0b',
    accentBg: 'var(--color-warning-bg)',
    accentBorder: 'var(--color-warning-border)',
    variant: 'scan',
  },
  'logic-connectors': {
    title: 'Conectores lógicos',
    instruction: 'Qual ligação faz sentido entre as partes?',
    icon: Link2,
    accent: '#0284c7',
    accentBg: 'rgba(2, 132, 199, 0.1)',
    accentBorder: 'rgba(2, 132, 199, 0.3)',
    variant: 'link',
  },
  'grammar-trap': {
    title: 'Radar de erro',
    instruction: 'Qual frase está gramaticalmente correta?',
    icon: ShieldAlert,
    accent: 'var(--color-verb)',
    accentBg: 'var(--color-verb-bg)',
    accentBorder: 'rgba(124, 58, 237, 0.35)',
    variant: 'trap',
  },
  'minimal-pair': {
    title: 'Par mínimo',
    instruction: 'Ouça os dois sons e escolha o certo.',
    icon: Ear,
    accent: 'var(--color-vocab)',
    accentBg: 'var(--color-vocab-bg)',
    accentBorder: 'rgba(217, 119, 6, 0.35)',
    variant: 'oral',
  },
  'minimal-pair-production': {
    title: 'Par mínimo falado',
    instruction: 'Ouça os dois sons e fale a palavra certa.',
    icon: Mic,
    accent: 'var(--color-vocab)',
    accentBg: 'var(--color-vocab-bg)',
    accentBorder: 'rgba(217, 119, 6, 0.35)',
    variant: 'oral',
  },
  'conjugation-speed': {
    title: 'Conjugação rápida',
    instruction: 'Escolha a forma verbal correta.',
    icon: Zap,
    accent: 'var(--color-verb)',
    accentBg: 'var(--color-verb-bg)',
    accentBorder: 'rgba(124, 58, 237, 0.35)',
    variant: 'speed',
  },
  'listen-and-respond': {
    title: 'Ouça e responda',
    instruction: 'Ouça o diálogo e responda em voz alta.',
    icon: Mic,
    accent: '#e11d48',
    accentBg: 'rgba(225, 29, 72, 0.1)',
    accentBorder: 'rgba(225, 29, 72, 0.3)',
    variant: 'oral',
  },
  'free-roleplay': {
    title: 'Roleplay livre',
    instruction: 'Responda como você falaria na situação.',
    icon: MessageCircle,
    accent: '#2563eb',
    accentBg: 'rgba(37, 99, 235, 0.1)',
    accentBorder: 'rgba(37, 99, 235, 0.3)',
    variant: 'dialogue',
  },
  'micro-message': {
    title: 'Mensagem rápida',
    instruction: 'Escreva uma resposta curta e natural.',
    icon: PenLine,
    accent: '#0d9488',
    accentBg: 'rgba(13, 148, 136, 0.12)',
    accentBorder: 'rgba(13, 148, 136, 0.35)',
    variant: 'produce',
  },
  paraphrase: {
    title: 'Parafraseie',
    instruction: 'Reescreva com o mesmo sentido, palavras diferentes.',
    icon: RefreshCw,
    accent: '#7c3aed',
    accentBg: 'rgba(124, 58, 237, 0.1)',
    accentBorder: 'rgba(124, 58, 237, 0.35)',
    variant: 'produce',
  },
  'fill-gap-production': {
    title: 'Complete (produção)',
    instruction: 'Escreva a palavra que completa a frase.',
    icon: PenLine,
    accent: 'var(--color-vocab)',
    accentBg: 'var(--color-vocab-bg)',
    accentBorder: 'rgba(217, 119, 6, 0.35)',
    variant: 'produce',
  },
  shadowing: {
    title: 'Shadowing',
    instruction: 'Ouça e fale junto com o áudio.',
    icon: Volume2,
    accent: '#db2777',
    accentBg: 'rgba(219, 39, 119, 0.1)',
    accentBorder: 'rgba(219, 39, 119, 0.3)',
    variant: 'oral',
  },
  'translation-with-constraint': {
    title: 'Traduza com restrição',
    instruction: 'Traduza incluindo a expressão obrigatória.',
    icon: Link2,
    accent: '#7c3aed',
    accentBg: 'rgba(124, 58, 237, 0.1)',
    accentBorder: 'rgba(124, 58, 237, 0.35)',
    variant: 'produce',
  },
  'voicemail-dictation': {
    title: 'Correio de voz',
    instruction: 'Ouça a mensagem e resuma em português.',
    icon: Voicemail,
    accent: '#0891b2',
    accentBg: 'rgba(8, 145, 178, 0.1)',
    accentBorder: 'rgba(8, 145, 178, 0.3)',
    variant: 'produce',
  },
  'inference-tone': {
    title: 'Tom da fala',
    instruction: 'Ouça os dois áudios e identifique o tom.',
    icon: AudioLines,
    accent: '#6366f1',
    accentBg: 'rgba(99, 102, 241, 0.1)',
    accentBorder: 'rgba(99, 102, 241, 0.3)',
    variant: 'oral',
  },
  'connected-speech': {
    title: 'Fala conectada',
    instruction: 'Ouça a frase e escreva o que ouviu, prestando atenção à ligação.',
    icon: Waves,
    accent: '#0d9488',
    accentBg: 'rgba(13, 148, 136, 0.1)',
    accentBorder: 'rgba(13, 148, 136, 0.3)',
    variant: 'produce',
  },
  'story-continuation': {
    title: 'Continue a história',
    instruction: 'Escreva a próxima parte da história de forma coerente.',
    icon: BookOpen,
    accent: '#b45309',
    accentBg: 'rgba(180, 83, 9, 0.1)',
    accentBorder: 'rgba(180, 83, 9, 0.35)',
    variant: 'dialogue',
  },
  'spot-the-register': {
    title: 'Registro errado',
    instruction: 'Reescreva a fala destacada com o registro adequado.',
    icon: UserCog,
    accent: '#7c3aed',
    accentBg: 'rgba(124, 58, 237, 0.1)',
    accentBorder: 'rgba(124, 58, 237, 0.35)',
    variant: 'dialogue',
  },
  'prompted-monologue': {
    title: 'Mini-monólogo',
    instruction: 'Fale por 30–60 segundos sobre o tema proposto.',
    icon: Podcast,
    accent: '#e11d48',
    accentBg: 'rgba(225, 29, 72, 0.1)',
    accentBorder: 'rgba(225, 29, 72, 0.3)',
    variant: 'oral',
  },
};

export function getExerciseTypeMeta(type: ExerciseType): ExerciseTypeMeta {
  return EXERCISE_TYPE_META[type];
}

export interface ExerciseMetaContext {
  language?: SupportedLanguage;
  level?: ProficiencyLevel;
  immersionMode?: ImmersionMode;
}

export function getExerciseTypeMetaWithContext(
  type: ExerciseType,
  ctx: ExerciseMetaContext = {},
): ExerciseTypeMeta {
  const base = EXERCISE_TYPE_META[type];
  const { language, level, immersionMode = 'auto' } = ctx;
  if (!language || !level) return base;
  if (!shouldUseTargetLanguageInstructions(language, level, immersionMode)) return base;

  const targetInstruction = EXERCISE_INSTRUCTIONS_TARGET[type]?.[language];
  if (!targetInstruction) return base;

  return { ...base, instruction: targetInstruction };
}

/** Decorative pattern per shell variant (CSS background) */
export const SHELL_VARIANT_STYLES: Record<
  ExerciseShellVariant,
  { bodyClass: string; pattern?: string }
> = {
  prompt: {
    bodyClass: 'rounded-2xl border border-dashed',
    pattern: 'radial-gradient(circle at 100% 0%, rgba(217,119,6,0.06) 0%, transparent 45%)',
  },
  build: {
    bodyClass: 'rounded-2xl border-2 border-dotted',
    pattern: 'repeating-linear-gradient(90deg, transparent, transparent 12px, rgba(29,94,212,0.03) 12px, rgba(29,94,212,0.03) 24px)',
  },
  produce: {
    bodyClass: 'rounded-2xl border',
    pattern: 'linear-gradient(135deg, rgba(13,148,136,0.05) 0%, transparent 60%)',
  },
  oral: {
    bodyClass: 'rounded-[1.25rem] border',
    pattern: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.08) 0%, transparent 55%)',
  },
  dialogue: {
    bodyClass: 'rounded-2xl border',
    pattern: 'radial-gradient(circle at 0% 100%, rgba(37,99,235,0.07) 0%, transparent 50%)',
  },
  trap: {
    bodyClass: 'rounded-2xl border-l-4',
    pattern: 'linear-gradient(90deg, rgba(124,58,237,0.06) 0%, transparent 40%)',
  },
  scan: {
    bodyClass: 'rounded-xl border',
    pattern: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(245,158,11,0.04) 3px, rgba(245,158,11,0.04) 4px)',
  },
  link: {
    bodyClass: 'rounded-2xl border',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(2,132,199,0.06) 0%, transparent 70%)',
  },
  visual: {
    bodyClass: 'rounded-2xl border-2',
    pattern: 'radial-gradient(circle at 80% 20%, rgba(245,158,11,0.1) 0%, transparent 40%)',
  },
  speed: {
    bodyClass: 'rounded-2xl border',
    pattern: 'linear-gradient(180deg, rgba(124,58,237,0.08) 0%, transparent 30%)',
  },
};
