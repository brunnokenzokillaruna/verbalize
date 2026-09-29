const STOP = new Set([
  'para', 'como', 'mais', 'pela', 'pelo', 'isso', 'essa', 'esse', 'esta', 'este',
  'eles', 'elas', 'voce', 'você', 'nao', 'não', 'com', 'uma', 'uns', 'umas',
  'que', 'por', 'dos', 'das', 'num', 'numa', 'seu', 'sua', 'seus', 'suas',
  'foi', 'vai', 'tem', 'ter', 'ser', 'são', 'sao', 'ele', 'ela', 'dele', 'dela',
  'the', 'and', 'that', 'with', 'from', 'this',
]);

export function normalizeVoicemailText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[.,!?;:'"-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function contentTokens(value: string): string[] {
  return normalizeVoicemailText(value)
    .split(' ')
    .filter((word) => word.length >= 4 && !STOP.has(word));
}

function pointIsCovered(summary: string, point: string): boolean {
  const tokens = contentTokens(point);
  if (tokens.length === 0) return summary.includes(normalizeVoicemailText(point));
  const hits = tokens.filter((token) => summary.includes(token)).length;
  const needed = tokens.length === 1 ? 1 : Math.ceil(tokens.length / 2);
  return hits >= needed;
}

/** How many key points a Portuguese summary actually mentions. */
export function voicemailPointsCovered(summary: string, points: string[]): number {
  const text = normalizeVoicemailText(summary);
  if (!text) return 0;
  return points.filter((point) => point.trim() && pointIsCovered(text, point)).length;
}

/** Three points need two. Fewer points need all of them. */
export function voicemailCoveragePasses(covered: number, total: number): boolean {
  if (total <= 0) return false;
  const needed = total >= 3 ? 2 : total;
  return covered >= needed;
}
