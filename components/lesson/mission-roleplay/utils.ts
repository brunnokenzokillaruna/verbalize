import type { DialogueLine } from '@/components/lesson/mission-roleplay/types';

export const CORRECT_THRESHOLD = 0.7;

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function similarity(target: string, transcript: string): number {
  const tWords = normalizeText(target).split(' ');
  const rWords = new Set(normalizeText(transcript).split(' '));
  const matches = tWords.filter((w) => rWords.has(w)).length;
  return matches / Math.max(tWords.length, 1);
}

export function parseDialogueLines(
  dialogue: string,
  dialogueTranslations?: string[],
): DialogueLine[] {
  return dialogue
    .split('\n')
    .filter((l) => l.trim())
    .map((line, i) => {
      const match = line.match(/^([^:]+):\s*(.+)/);
      const speaker = match?.[1]?.trim() ?? `Linha ${i + 1}`;
      const text = match?.[2]?.trim() ?? line;
      return {
        rawIndex: i,
        speaker,
        text,
        translation: dialogueTranslations?.[i],
        isUserLine: /^você$/i.test(speaker.replace(/\s+/g, '')),
      };
    });
}
