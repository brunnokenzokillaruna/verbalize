import type { LessonTag } from '@/types';

export type StampStatus = 'completed' | 'current' | 'locked';

export type StampShape =
  | 'circle'
  | 'ticket'
  | 'oval'
  | 'shield'
  | 'roundedRect'
  | 'hexagon'
  | 'lozenge'
  | 'arch'
  | 'scallop';

export type StampStyle = {
  label: string;
  abbr: string;
  color: string;
  shape: StampShape;
};

/** Passport-ink palette + shape per lesson tag (matches stamp legend). */
export const STAMP_STYLES: Record<LessonTag, StampStyle> = {
  GRAM: { label: 'Gramática', abbr: 'GRAM', color: '#2F6B4F', shape: 'circle' },
  VOC: { label: 'Vocabulário', abbr: 'VOC', color: '#2B6CB0', shape: 'ticket' },
  DIAL: { label: 'Diálogo', abbr: 'DIAL', color: '#D97706', shape: 'oval' },
  MISS: { label: 'Missão', abbr: 'MISS', color: '#7C3AED', shape: 'shield' },
  PRON: { label: 'Pronúncia', abbr: 'PRON', color: '#DB2777', shape: 'roundedRect' },
  VERB: { label: 'Verbos', abbr: 'VERB', color: '#0D9488', shape: 'hexagon' },
  EXPR: { label: 'Expressões', abbr: 'EXPR', color: '#DC2626', shape: 'lozenge' },
  CULT: { label: 'Cultura', abbr: 'CULT', color: '#B45309', shape: 'arch' },
  REVIEW: { label: 'Checkpoint', abbr: 'CHK', color: '#1E3A5F', shape: 'scallop' },
};

export const STAMP_CURRENT_COLOR = '#C9A227';
export const STAMP_LOCKED_COLOR = '#9CA3AF';

/** Deterministic slight tilt so completed stamps feel hand-pressed. */
export function stampRotation(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return (h % 15) - 7;
}
