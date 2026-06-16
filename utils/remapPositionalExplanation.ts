const ORDINAL_TO_INDEX: Record<string, number> = {
  primeira: 0,
  segunda: 1,
  terceira: 2,
  quarta: 3,
  '1ª': 0,
  '2ª': 1,
  '3ª': 2,
  '4ª': 3,
  '1a': 0,
  '2a': 1,
  '3a': 2,
  '4a': 3,
};

/** Maps each option's original index to its on-screen letter (A, B, C…). */
export function buildOriginalToDisplayLetter(
  shuffled: Array<{ originalIndex: number }>,
): Map<number, string> {
  const map = new Map<number, string>();
  shuffled.forEach((item, displayIndex) => {
    map.set(item.originalIndex, String.fromCharCode(65 + displayIndex));
  });
  return map;
}

/**
 * Rewrites PT-BR explanations that refer to "primeira opção", "segunda", etc.
 * so they match the shuffled display order shown to the learner.
 */
export function remapPositionalExplanation(
  explanation: string,
  originalToLetter: Map<number, string>,
): string {
  if (!explanation || originalToLetter.size === 0) return explanation;

  return explanation.replace(
    /\b(A|a)\s+(primeira|segunda|terceira|quarta|1ª|2ª|3ª|4ª|1a|2a|3a|4a)(\s+opção)?\b/gi,
    (match, article: string, ordinal: string) => {
      const originalIndex = ORDINAL_TO_INDEX[ordinal.toLowerCase()];
      if (originalIndex === undefined) return match;

      const letter = originalToLetter.get(originalIndex);
      if (!letter) return match;

      return `${article} opção ${letter}`;
    },
  );
}
