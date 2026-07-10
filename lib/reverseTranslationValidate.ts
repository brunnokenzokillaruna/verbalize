/**
 * Local validation for reverse-translation exercises — zero Gemini calls.
 */

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

/**
 * Detects French adjective used where the reference expects -ment adverb
 * (e.g. "rapide" vs "rapidement" — common BP interference).
 */
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

export interface ReverseTranslationValidation {
  accepted: boolean;
  note?: string;
}

export function validateReverseTranslationLocal(
  userAnswer: string,
  expectedAnswer: string,
  acceptableVariants: string[] = [],
): ReverseTranslationValidation {
  const userNorm = normalize(userAnswer);
  if (!userNorm) {
    return { accepted: false, note: 'Digite uma resposta antes de enviar.' };
  }

  const references = [expectedAnswer, ...acceptableVariants];
  for (const ref of references) {
    if (userNorm === normalize(ref)) {
      return { accepted: true };
    }
  }

  for (const ref of references) {
    if (usesAdjectiveInsteadOfAdverb(userAnswer, ref)) {
      continue;
    }
    if (similarityRatio(userAnswer, ref) >= 0.85) {
      return { accepted: true };
    }
    if (tokenOverlapScore(userAnswer, ref) >= 0.85) {
      return { accepted: true };
    }
  }

  if (usesAdjectiveInsteadOfAdverb(userAnswer, expectedAnswer)) {
    return {
      accepted: false,
      note: 'Use o advérbio (ex.: "rapidement", "vite"), não o adjetivo ("rapide"). Em português falamos "rápido", mas em francês a tradução correta aqui é um advérbio.',
    };
  }

  if (tokenOverlapScore(userAnswer, expectedAnswer) >= 0.7) {
    return { accepted: true };
  }

  if (similarityRatio(userAnswer, expectedAnswer) >= 0.72) {
    return { accepted: true };
  }

  return {
    accepted: false,
    note: 'A tradução não corresponde ao esperado. Confira a frase em português e tente de novo.',
  };
}

export { normalize as normalizeReverseTranslation };
