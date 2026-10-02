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

function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * A sentence can omit the final period. It is not usable when it stops on a
 * hanging word ("é só encaixar o motor no").
 */
const TRUNCATED_TAIL =
  /\b(no|na|nos|nas|em|de|do|da|dos|das|para|pra|por|com|sem|um|uma|o|a|os|as|que|e|ou|the|of|to|for|an|and|or|du|des|au|aux|un|une)$/i;

export function isUsableTeachingText(text: string | undefined | null): boolean {
  const trimmed = text?.trim();
  if (!trimmed) return false;
  if (!looksCutOff(trimmed)) return true;
  return !TRUNCATED_TAIL.test(trimmed);
}

/**
 * True when the text is about this verb.
 * Matches the infinitive with or without accents, and a distinctive conjugation
 * root (écrire → j'écris). Short leftovers like "li" from lire are ignored so
 * a generic line ("o presente serve para hábitos") still fails.
 */
export function mentionsVerb(text: string | undefined | null, infinitive: string | undefined | null): boolean {
  const stem = fold(infinitive ?? '').replace(/^to\s+/, '').trim();
  if (!stem || stem.length < 3) return true;
  if (!text?.trim()) return false;

  const keys = [stem];
  const ending = stem.match(/(oir|re|er|ir)$/)?.[1];
  if (ending) {
    const root = stem.slice(0, -ending.length);
    if (root.length >= 4) keys.push(root);
  }

  const hay = fold(text);
  return keys.some((key) => hay.includes(key));
}
