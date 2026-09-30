/** True when a teaching sentence was cut before it could finish. */
export function looksCutOff(text: string | undefined | null): boolean {
  const trimmed = text?.trim();
  if (!trimmed) return false;
  return !/[.!?…]["”']?$/.test(trimmed);
}

/**
 * Keeps whole sentences. Never slices a thought in the middle of a clause.
 * If the first sentence is longer than the budget, it is kept intact.
 */
export function limitToCompleteSentence(text: string, maxWords: number): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  if (trimmed.split(' ').length <= maxWords) return trimmed;

  const sentences = trimmed.match(/[^.!?…]+[.!?…]+(?:["”'])?|[^.!?…]+$/g) ?? [trimmed];
  let kept = '';
  for (const sentence of sentences) {
    const piece = sentence.trim();
    if (!piece) continue;
    const next = kept ? `${kept} ${piece}` : piece;
    if (next.split(' ').length <= maxWords) {
      kept = next;
      continue;
    }
    if (!kept && /[.!?…]["”']?$/.test(piece)) return piece;
    break;
  }
  return kept || trimmed;
}

/** "Eu ler o livro" is not how a Brazilian thinks. Natural speech conjugates the verb. */
export function looksLikeBrokenPortuguese(text: string | undefined | null): boolean {
  const trimmed = text?.trim();
  if (!trimmed) return false;
  return /\b(eu|voc[eê]|ele|ela|a gente|n[oó]s|eles|elas)\s+[a-zà-ü]+(?:ar|er|ir|or)\b/i.test(trimmed);
}
export function mentionsVerb(text: string | undefined | null, infinitive: string | undefined | null): boolean {
  const stem = infinitive?.toLowerCase().replace(/^to\s+/, '').trim();
  if (!stem || stem.length < 3) return true;
  if (!text?.trim()) return false;
  return text.toLowerCase().includes(stem);
}
