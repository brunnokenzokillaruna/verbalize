/**
 * Guards against ambiguous PT-BR colloquial adverbs (e.g. "rápido" = "rapidamente")
 * in reverse-translation exercises that expect a target-language adverb.
 */

export interface ReverseTranslationLike {
  portuguese_sentence: string;
  target_translation: string;
  acceptable_variants: string[];
  hint?: string;
}

/** Colloquial PT-BR adverbs often used without -mente in speech. */
const COLLOQUIAL_TO_FORMAL: Record<string, string> = {
  rapido: 'rapidamente',
  rápido: 'rapidamente',
  direto: 'diretamente',
  forte: 'fortemente',
};

/** French adverb ↔ synonym replacements for acceptable_variants enrichment. */
const FR_ADVERB_SYNONYMS: Record<string, string[]> = {
  rapidement: ['vite'],
  vite: ['rapidement'],
  directement: ['tout de suite'],
  fortement: ['beaucoup'],
};

export const REVERSE_TRANSLATION_PT_ADVERB_PROMPT_RULE = `
REVERSE-TRANSLATION — PT-BR ADVERB CLARITY (mandatory):
- In Brazilian Portuguese, words like "rápido", "direto", and "forte" are often used colloquially AS ADVERBS (= "rapidamente", "diretamente", "fortemente"), even without "-mente".
- For reverse-translation exercises, NEVER leave this ambiguous for the learner:
  1. PREFERRED: write the Portuguese prompt with the explicit adverb form ("rapidamente", "diretamente", "logo", "depressa") when the target translation uses an adverb (-ment / -ly / vite).
  2. FORBIDDEN pattern: a colloquial adjective-looking adverb right after a noun where it could modify the noun OR the verb — e.g. "organizar o mercado rápido" (learner may write "marché rapide" instead of "rapidement").
  3. If you must use colloquial "rápido/direto/forte" as an adverb, add a "hint" in PT-BR explaining that it means "de forma rápida/direta/forte".
  4. When "target_translation" uses a French adverb (-ment or "vite"), include at least one "acceptable_variants" entry with a natural synonym (e.g. "vite" if the model answer is "rapidement").`;

function normalizeKey(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function endsWithColloquialAdverb(sentence: string): { raw: string; formal: string } | null {
  const trimmed = sentence.trim().replace(/[.!?…]+$/, '').trim();
  const match = trimmed.match(/\b(r[aá]pido|direto|forte)$/i);
  if (!match) return null;

  const raw = match[1];
  const formal =
    COLLOQUIAL_TO_FORMAL[raw.toLowerCase()] ??
    COLLOQUIAL_TO_FORMAL[normalizeKey(raw)];

  if (!formal) return null;
  return { raw, formal };
}

function targetUsesAdverb(target: string): boolean {
  return /\b\w+ment\b/i.test(target) || /\bvite\b/i.test(target) || /\btout de suite\b/i.test(target);
}

function replaceTrailingWord(sentence: string, from: string, to: string): string {
  const pattern = new RegExp(`\\b${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s*[.!?…]*)$`, 'i');
  return sentence.replace(pattern, (_, punct: string) => `${to}${punct ?? ''}`);
}

function dedupeVariants(variants: string[], target: string): string[] {
  const seen = new Set<string>();
  const targetNorm = target.toLowerCase().trim();
  const out: string[] = [];

  for (const variant of variants) {
    const trimmed = variant.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (key === targetNorm || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }

  return out;
}

function enrichFrenchAdverbVariants(
  targetTranslation: string,
  variants: string[],
): string[] {
  const enriched = [...variants];

  for (const [adverb, synonyms] of Object.entries(FR_ADVERB_SYNONYMS)) {
    const pattern = new RegExp(`\\b${adverb}\\b`, 'i');
    if (!pattern.test(targetTranslation)) continue;

    for (const synonym of synonyms) {
      enriched.push(targetTranslation.replace(pattern, synonym));
    }
  }

  return dedupeVariants(enriched, targetTranslation);
}

/**
 * Normalizes ambiguous PT prompts and ensures adverb synonym variants exist.
 */
export function sanitizeReverseTranslationExercise<T extends ReverseTranslationLike>(
  data: T,
): T {
  const next: T = {
    ...data,
    acceptable_variants: [...(data.acceptable_variants ?? [])],
  };

  const colloquial = endsWithColloquialAdverb(next.portuguese_sentence);
  if (colloquial && targetUsesAdverb(next.target_translation)) {
    next.portuguese_sentence = replaceTrailingWord(
      next.portuguese_sentence,
      colloquial.raw,
      colloquial.formal,
    );

    if (!next.hint?.trim()) {
      next.hint =
        `No português falamos "${colloquial.raw}" no lugar de "${colloquial.formal}" no dia a dia; em francês, traduza com advérbio (ex.: -ment ou "vite").`;
    }
  }

  next.acceptable_variants = enrichFrenchAdverbVariants(
    next.target_translation,
    next.acceptable_variants,
  );

  return next;
}
