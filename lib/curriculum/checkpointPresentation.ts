import type { LessonDefinition } from '@/types';
import { formatCheckpointRange } from './checkpointWindow';

function parseThemeMeta(theme: string): { number?: number; label: string } {
  const match = theme.match(/^Tema\s+(\d+):\s*(.+)$/i);
  if (match) {
    return { number: Number.parseInt(match[1]!, 10), label: match[2].trim() };
  }
  return { label: theme.trim() };
}

/** Popover copy for REVIEW nodes on the lesson path — avoids redundant range-only titles. */
export function getCheckpointPopoverCopy(lesson: LessonDefinition): {
  title: string;
  subtitle: string;
  startLabel: string;
} {
  const { number, label } = parseThemeMeta(lesson.theme);
  const range = formatCheckpointRange(lesson);

  const title = label || 'Checkpoint';
  const themePart = number !== undefined ? `Revisão do Tema ${number}` : 'Revisão do tema';
  const subtitle = `${themePart} · ${range} — avaliação densa: ouça, produza e fale`;

  return {
    title,
    subtitle,
    startLabel: 'Iniciar checkpoint',
  };
}
