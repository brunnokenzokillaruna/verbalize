import { synthesizeDialogueGemini } from '@/app/actions/synthesizeGeminiTts';
import { synthesizeDialogue } from '@/app/actions/synthesizeSpeech';
import { synthesizeDialogueElevenLabs } from '@/app/actions/synthesizeElevenLabs';
import type { SupportedLanguage } from '@/types';

export function parseDialogueLines(dialogueAudio: string): string[] {
  return dialogueAudio
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function fetchDialogueAudioChunks(
  lines: string[],
  language: SupportedLanguage,
): Promise<string[]> {
  const expectedLines = lines.filter((l) => l.trim().length > 0).length;

  try {
    const elChunks = await synthesizeDialogueElevenLabs(lines, language);
    if (elChunks.length === expectedLines) return elChunks;
  } catch {
    /* try next provider */
  }

  try {
    const geminiResult = await synthesizeDialogueGemini(lines, language);
    if (geminiResult?.chunks.length) return geminiResult.chunks;
  } catch {
    /* try next provider */
  }

  return synthesizeDialogue(lines, language);
}
