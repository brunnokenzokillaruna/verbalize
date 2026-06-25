/** Removes markdown emphasis markers Gemini sometimes adds despite instructions. */
export function stripMarkdownEmphasis(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\^\^([^*^]+)\^\^/g, '$1')
    .replace(/\*+/g, '');
}

export function sanitizeVocabularyToken(word: string): string {
  return stripMarkdownEmphasis(word.trim()).toLowerCase();
}

export function sanitizeDialogueText(dialogue: string): string {
  return dialogue
    .split('\n')
    .map((line) => stripMarkdownEmphasis(line))
    .join('\n');
}
