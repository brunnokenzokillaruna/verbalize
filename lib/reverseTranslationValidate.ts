/**
 * Local validation for reverse-translation exercises (Gemini fallback).
 * Intentionally stricter than earlier fuzzy matching — prefers fail over
 * silently accepting meaning changes.
 */

export type ReverseTranslationVerdict = 'exact' | 'acceptable' | 'soft' | 'wrong';

export interface ReverseTranslationValidation {
  accepted: boolean;
  verdict: ReverseTranslationVerdict;
  note?: string;
  correctedSentence?: string;
}

const FR_SYNONYM_GROUPS: string[][] = [
  ['avoir', 'posseder', 'detenir'],
  ['grand', 'gros', 'large'],
  ['petit', 'mince', 'minuscule'],
  ['chercher', 'trouver', 'retrouver'],
  ['manger', 'dejeuner', 'diner'],
  ['beau', 'joli', 'magnifique'],
  ['rapidement', 'vite', 'promptement'],
  ['fast', 'quick', 'rapid'],
  ['big', 'large', 'huge'],
  ['small', 'little', 'tiny'],
  ['have', 'got', 'possess'],
];

/** Pairs that look similar but change meaning — never auto-accept. */
const MEANING_TRAPS: Array<[string, string]> = [
  ['trop', 'tres'],
  ['too', 'very'],
  ['hard', 'hardly'],
  ['peu', 'pas'],
];

const FUNCTION_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'a', 'au', 'aux', 'en', 'y',
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'me', 'te', 'se',
  'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses', 'ce', 'cet', 'cette', 'ces',
  'et', 'ou', 'mais', 'donc', 'car', 'que', 'qui', 'quoi', 'dont', 'ou',
  'the', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'and', 'or', 'but',
  'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your', 'his', 'her', 'our', 'their',
  'is', 'are', 'was', 'were', 'am', 'be', 'been', 'have', 'has', 'had',
  'me', 'suis', 'es', 'est', 'sommes', 'etes', 'sont', 'ai', 'as', 'avons', 'avez', 'ont',
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?;:'"-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function similarityRatio(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  return 1 - levenshtein(na, nb) / maxLen;
}

function tokenSet(s: string): Set<string> {
  return new Set(normalize(s).split(' ').filter(Boolean));
}

function contentTokens(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter((t) => t.length > 0 && !FUNCTION_WORDS.has(t));
}

function sharesSynonym(tokenA: string, tokenB: string): boolean {
  if (tokenA === tokenB) return true;
  return FR_SYNONYM_GROUPS.some(
    (group) => group.includes(tokenA) && group.includes(tokenB),
  );
}

function tokenOverlapScore(user: string, reference: string): number {
  const userTokens = [...tokenSet(user)];
  const refTokens = [...tokenSet(reference)];
  if (refTokens.length === 0) return 0;

  let matched = 0;
  for (const ref of refTokens) {
    if (userTokens.some((u) => u === ref || sharesSynonym(u, ref))) {
      matched++;
    }
  }
  return matched / refTokens.length;
}

function contentOverlapScore(user: string, reference: string): number {
  const userTokens = contentTokens(user);
  const refTokens = contentTokens(reference);
  if (refTokens.length === 0) return 1;

  let matched = 0;
  for (const ref of refTokens) {
    if (userTokens.some((u) => u === ref || sharesSynonym(u, ref))) {
      matched++;
    }
  }
  return matched / refTokens.length;
}

function usesAdjectiveInsteadOfAdverb(user: string, reference: string): boolean {
  const userTokens = normalize(user).split(' ').filter(Boolean);
  const refTokens = normalize(reference).split(' ').filter(Boolean);
  if (userTokens.length !== refTokens.length) return false;

  for (let i = 0; i < refTokens.length; i++) {
    const ref = refTokens[i];
    const usr = userTokens[i];
    if (
      ref.endsWith('ment') &&
      ref.length > 5 &&
      usr !== ref &&
      ref.startsWith(usr) &&
      usr.length >= 4
    ) {
      return true;
    }
  }

  return false;
}

function hitsMeaningTrap(user: string, reference: string): string | null {
  const userTokens = tokenSet(user);
  const refTokens = tokenSet(reference);

  for (const [a, b] of MEANING_TRAPS) {
    if (a === b) continue;
    if (userTokens.has(a) && refTokens.has(b) && !userTokens.has(b)) {
      return `"${a}" muda o sentido em relação a "${b}"`;
    }
    if (userTokens.has(b) && refTokens.has(a) && !userTokens.has(a)) {
      return `"${b}" muda o sentido em relação a "${a}"`;
    }
  }
  return null;
}

function softAccept(note: string, correctedSentence: string): ReverseTranslationValidation {
  return {
    accepted: true,
    verdict: 'soft',
    note,
    correctedSentence,
  };
}

function reject(note: string, correctedSentence?: string): ReverseTranslationValidation {
  return {
    accepted: false,
    verdict: 'wrong',
    note,
    correctedSentence,
  };
}

export function validateReverseTranslationLocal(
  userAnswer: string,
  expectedAnswer: string,
  acceptableVariants: string[] = [],
): ReverseTranslationValidation {
  const userNorm = normalize(userAnswer);
  if (!userNorm) {
    return reject('Digite uma resposta antes de enviar.');
  }

  const variants = Array.isArray(acceptableVariants) ? acceptableVariants : [];
  const references = [expectedAnswer, ...variants].filter((r) => typeof r === 'string' && r.trim());

  for (const ref of references) {
    if (userNorm === normalize(ref)) {
      return { accepted: true, verdict: 'exact' };
    }
  }

  const trap = hitsMeaningTrap(userAnswer, expectedAnswer);
  if (trap) {
    return reject(
      `Quase — mas ${trap}. Confira a frase em português e ajuste o sentido.`,
      expectedAnswer,
    );
  }

  if (usesAdjectiveInsteadOfAdverb(userAnswer, expectedAnswer)) {
    return reject(
      'Use o advérbio (ex.: "rapidement", "vite"), não o adjetivo ("rapide"). Em português falamos "rápido", mas em francês a tradução correta aqui é um advérbio.',
      expectedAnswer,
    );
  }

  for (const ref of references) {
    if (usesAdjectiveInsteadOfAdverb(userAnswer, ref)) continue;
    if (hitsMeaningTrap(userAnswer, ref)) continue;

    const similarity = similarityRatio(userAnswer, ref);
    const tokenOverlap = tokenOverlapScore(userAnswer, ref);
    const contentOverlap = contentOverlapScore(userAnswer, ref);

    // Near-exact / strong synonym match
    if (similarity >= 0.92 || (tokenOverlap >= 0.92 && contentOverlap >= 0.9)) {
      return { accepted: true, verdict: 'acceptable' };
    }

    // Soft: meaning content preserved, small form differences
    if (contentOverlap >= 0.85 && similarity >= 0.78) {
      return softAccept(
        'Sua resposta ficou bem próxima. Confira a versão modelo para polir detalhes (artigos, ordem das palavras ou um termo mais natural).',
        expectedAnswer,
      );
    }
  }

  return reject(
    'A tradução não corresponde ao sentido esperado. Confira a frase em português e tente de novo.',
    expectedAnswer,
  );
}

export { normalize as normalizeReverseTranslation };
