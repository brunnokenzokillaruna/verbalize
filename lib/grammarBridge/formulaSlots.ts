export type SlotRole = 'subject' | 'verb' | 'complement';

const SLOT_NAME =
  /^(suj|subj|compl|comp|sujeito|subject|verbo|verb|n[uú]mero|number|complemento|objeto|pronome|adjetivo|substantivo|pessoa|algu[eé]m)/i;

const CHIP_LABELS: Record<string, string> = {
  suj: 'Sujeito',
  subj: 'Sujeito',
  compl: 'Complemento',
  comp: 'Complemento',
};

export function formulaParts(formula: string): string[] {
  return formula
    .split(/\s*\+\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function slotRole(index: number, total: number): SlotRole {
  if (total <= 1) return 'verb';
  if (index === 0) return 'subject';
  if (index === total - 1) return 'complement';
  return 'verb';
}

export function chipLabel(part: string): string {
  const trimmed = part.trim();
  const inner =
    trimmed.startsWith('[') && trimmed.endsWith(']') ? trimmed.slice(1, -1).trim() : trimmed;
  return CHIP_LABELS[inner.toLowerCase()] ?? inner;
}

export type ColoredChunk = { text: string; role: SlotRole };

/** Colors an example when the formula is slot + slot, including abbreviated chips like [Suj]. */
export function colorizeExample(formula: string, example: string): ColoredChunk[] | null {
  const parts = formulaParts(formula);
  const clean = example.replace(/\^\^/g, '').trim();
  if (!clean || parts.length < 2) return null;

  const segmented = segmentExample(formula, example);
  if (segmented && segmented.length === parts.length) {
    return segmented.map((text, index) => ({ text, role: slotRole(index, parts.length) }));
  }

  const allSlots = parts.every((part) => chipNeedles(part).length === 0);
  if (!allSlots || parts.length > 3) return null;

  const words = clean.split(/\s+/);
  if (words.length < parts.length) return null;
  if (parts.length === 2) {
    return [
      { text: words[0], role: slotRole(0, 2) },
      { text: words.slice(1).join(' '), role: slotRole(1, 2) },
    ];
  }
  return [
    { text: words[0], role: 'subject' },
    { text: words[1], role: 'verb' },
    { text: words.slice(2).join(' '), role: 'complement' },
  ];
}

/** Literal pieces we can find in an example. Slot names inside brackets are not literals. */
export function chipNeedles(part: string): string[] {
  const trimmed = part.trim();
  const bracketed = trimmed.startsWith('[') && trimmed.endsWith(']');
  const inner = bracketed ? trimmed.slice(1, -1).trim() : trimmed;
  const alternatives = inner
    .split(/\s*\/\s*/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1);

  if (!bracketed) return alternatives;
  return alternatives.filter((item) => !SLOT_NAME.test(item));
}

function isBoundary(char: string | undefined): boolean {
  if (!char) return true;
  return !/[0-9A-Za-zÀ-ÿ]/.test(char);
}

export function findNeedle(
  haystack: string,
  needle: string,
  from = 0,
): { start: number; end: number } | null {
  const lower = haystack.toLowerCase();
  const target = needle.toLowerCase();
  let cursor = from;
  while (cursor < lower.length) {
    const index = lower.indexOf(target, cursor);
    if (index < 0) return null;
    const before = index === 0 ? undefined : lower[index - 1];
    const after = lower[index + target.length];
    if (isBoundary(before) && isBoundary(after)) {
      return { start: index, end: index + needle.length };
    }
    cursor = index + 1;
  }
  return null;
}

/** First literal from the chip that appears in the example, preserving the example's casing. */
export function matchChipInExample(part: string, example: string): string | null {
  const clean = example.replace(/\^\^/g, '');
  const needles = [...chipNeedles(part)].sort((a, b) => b.length - a.length);
  let best: { start: number; end: number } | null = null;
  for (const needle of needles) {
    const found = findNeedle(clean, needle, 0);
    if (found && (!best || found.start < best.start)) best = found;
  }
  if (!best) return null;
  return clean.slice(best.start, best.end);
}

/**
 * Splits the example into one chunk per formula chip, in order.
 * Returns null when a literal chip is missing or the chunks don't cover the sentence.
 */
export function segmentExample(formula: string, example: string): string[] | null {
  const parts = formulaParts(formula);
  const clean = example.replace(/\^\^/g, '').trim();
  if (parts.length < 2 || !clean) return null;

  const segments: string[] = [];
  let cursor = 0;

  for (let i = 0; i < parts.length; i++) {
    const needles = chipNeedles(parts[i]);
    if (needles.length > 0) {
      let found: { start: number; end: number } | null = null;
      for (const needle of needles) {
        const hit = findNeedle(clean, needle, cursor);
        if (hit && (!found || hit.start < found.start)) found = hit;
      }
      if (!found) return null;
      if (found.start > cursor && clean.slice(cursor, found.start).trim()) return null;
      if (segments.length !== i) return null;
      segments.push(clean.slice(found.start, found.end));
      cursor = found.end;
      continue;
    }

    const nextLiteralIndex = parts.findIndex(
      (part, index) => index > i && chipNeedles(part).length > 0,
    );
    if (nextLiteralIndex === -1) {
      const rest = clean.slice(cursor).trim();
      if (!rest) return null;
      segments.push(rest);
      cursor = clean.length;
      continue;
    }

    let nextAt = -1;
    for (const needle of chipNeedles(parts[nextLiteralIndex])) {
      const hit = findNeedle(clean, needle, cursor);
      if (hit && (nextAt < 0 || hit.start < nextAt)) nextAt = hit.start;
    }
    if (nextAt < 0) return null;
    const gap = clean.slice(cursor, nextAt).trim();
    if (!gap) return null;
    segments.push(gap);
    cursor = nextAt;
  }

  if (segments.length !== parts.length) return null;
  if (clean.slice(cursor).trim()) return null;
  return segments;
}
