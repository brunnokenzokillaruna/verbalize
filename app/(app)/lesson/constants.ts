import type { LessonTag } from '@/types';

export const TAGS_WITH_GRAMMAR_PHASE: ReadonlySet<LessonTag> = new Set([
  'GRAM',
  'VERB',
  'CULT',
  'VOC',
  'DIAL',
  'EXPR',
]);

export interface TooltipState {
  isOpen: boolean;
  word: string;
  isLoading: boolean;
  translation?: string;
  explanation?: string;
  example?: string;
  partOfSpeech?: string;
  infinitive?: string;
}

export const CLOSED_TOOLTIP: TooltipState = { isOpen: false, word: '', isLoading: false };
