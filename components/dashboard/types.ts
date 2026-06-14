import type { LessonDefinition } from '@/types';

export type LessonModalState = {
  isOpen: boolean;
  lesson: LessonDefinition | null;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  tagLabel: string;
};

export const EMPTY_LESSON_MODAL: LessonModalState = {
  isOpen: false,
  lesson: null,
  isCompleted: false,
  isCurrent: false,
  isLocked: false,
  tagLabel: '',
};
