/**
 * Keeps French directional verbs aligned with the PT-BR prompt.
 *
 * Portuguese Bridge:
 *   trazer ≈ apporter / amener (bring toward)
 *   levar  ≈ emporter / emmener (take away)
 *
 * Generators sometimes flip the pair (e.g. PT "levar" + FR blankWord "apporter").
 */

export interface FillGapLike {
  blankWord: string;
  translation: string;
  acceptable_variants?: string[];
  options?: string[];
}

export const FILL_GAP_DIRECTIONAL_PROMPT_RULE = `
FILL-GAP / CONTEXT-CHOICE — FRENCH DIRECTIONAL VERBS (mandatory when language is French):
- Portuguese "trazer" maps to apporter / amener (movement toward a place / the listener).
- Portuguese "levar" maps to emporter / emmener (take something/someone away with you).
- blankWord MUST match the PT-BR translation cue. Strip parenthetical glosses when deciding:
  e.g. "Eu vou levar (trazer para lá) este bolo…" → blankWord = emporter (NOT apporter).
- NEVER set blankWord to the opposite verb of the pair when the PT prompt clearly signals trazer vs levar.
- Distractors in context-choice MAY include the opposite verb; blankWord must still be the matching one.`;

type Direction = 'bring' | 'take';

/** Strip "(…)" glosses so "levar (trazer para lá)" still reads as levar. */
function primaryPtText(translation: string): string {
  return translation.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
}

function ptDirection(translation: string): Direction | null {
  const primary = primaryPtText(translation).toLowerCase();
  const hasTake = /\blev(ar|o|a|amos|am|ando|ou|ei|aria|asse)?\b/.test(primary);
  const hasBring = /\btraz(er|o|e|emos|em|endo|ia)?\b/.test(primary);

  if (hasTake && !hasBring) return 'take';
  if (hasBring && !hasTake) return 'bring';
  return null;
}

function frDirectionOfWord(word: string): Direction | null {
  const w = word.toLowerCase().normalize('NFC');
  if (/\bemport/.test(w) || /\bemmen/.test(w) || /\bemmèn/.test(w)) return 'take';
  if (/\bapport/.test(w) || /\bamen/.test(w) || /\bamèn/.test(w)) return 'bring';
  return null;
}

/** Swap apporter↔emporter and amener↔emmener, preserving conjugation shape. */
export function swapFrenchDirectionalVerb(word: string, to: Direction): string {
  const replacements: Array<[RegExp, string]> =
    to === 'take'
      ? [
          [/apporter/gi, 'emporter'],
          [/apporte/gi, 'emporte'],
          [/apport/gi, 'emport'],
          [/amener/gi, 'emmener'],
          [/amène/gi, 'emmène'],
          [/amene/gi, 'emmene'],
          [/amen(?=[a-zàâçéèêëîïôùûü]|$)/gi, 'emmen'],
        ]
      : [
          [/emporter/gi, 'apporter'],
          [/emporte/gi, 'apporte'],
          [/emport/gi, 'apport'],
          [/emmener/gi, 'amener'],
          [/emmène/gi, 'amène'],
          [/emmene/gi, 'amene'],
          [/emmen(?=[a-zàâçéèêëîïôùûü]|$)/gi, 'amen'],
        ];

  let result = word;
  for (const [pattern, replacement] of replacements) {
    const next = result.replace(pattern, replacement);
    if (next !== result) return next;
  }
  return result;
}

/**
 * If blankWord is the opposite directional verb of the PT cue, flip it.
 * Options keep the opposite verb as a distractor when already present;
 * otherwise the old blankWord entry is replaced.
 */
export function sanitizeFillGapDirectional<T extends FillGapLike>(data: T): T {
  const wanted = ptDirection(data.translation);
  if (!wanted) return data;

  const current = frDirectionOfWord(data.blankWord);
  if (!current || current === wanted) return data;

  const correctedBlank = swapFrenchDirectionalVerb(data.blankWord, wanted);
  if (correctedBlank === data.blankWord) return data;

  const norm = (s: string) => s.toLowerCase().trim();
  const correctedNorm = norm(correctedBlank);
  const oldNorm = norm(data.blankWord);

  let options = data.options;
  if (options) {
    const next = [...options];
    const alreadyHasCorrect = next.some((o) => norm(o) === correctedNorm);
    if (!alreadyHasCorrect) {
      const idx = next.findIndex((o) => norm(o) === oldNorm);
      if (idx >= 0) next[idx] = correctedBlank;
      else next[0] = correctedBlank;
    }
    options = next;
  }

  let variants = data.acceptable_variants;
  if (variants) {
    variants = variants.map((item) => {
      const dir = frDirectionOfWord(item);
      if (dir && dir !== wanted) return swapFrenchDirectionalVerb(item, wanted);
      return item;
    });
  }

  return {
    ...data,
    blankWord: correctedBlank,
    acceptable_variants: variants,
    options,
  };
}
