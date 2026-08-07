/**
 * Keeps French directional verbs aligned with the PT-BR prompt.
 *
 * Portuguese Bridge:
 *   trazer ≈ apporter / amener (bring toward)
 *   levar  ≈ emporter / emmener (take away)
 *
 * Animacy (person vs thing):
 *   pessoas → amener / emmener
 *   coisas  → apporter / emporter
 *
 * Generators sometimes flip the pair (e.g. PT "levar" + FR blankWord "apporter",
 * or PT "levar meu primo" + FR "apporter"/"emporter").
 */

export interface FillGapLike {
  blankWord: string;
  translation: string;
  /** Optional FR/EN sentence — helps confirm the object when present. */
  sentence?: string;
  acceptable_variants?: string[];
  options?: string[];
}

export const FILL_GAP_DIRECTIONAL_PROMPT_RULE = `
FILL-GAP / CONTEXT-CHOICE — FRENCH DIRECTIONAL VERBS (mandatory when language is French):
- Portuguese "trazer" maps to apporter / amener (movement toward a place / the listener).
- Portuguese "levar" maps to emporter / emmener (take something/someone away with you).
- PEOPLE vs THINGS (critical — wrong key teaches false French):
  - Person/animal object → amener (trazer) or emmener (levar). NEVER apporter/emporter.
  - Thing/object → apporter (trazer) or emporter (levar). NEVER amener/emmener.
  - Example: "levar meu primo" → blankWord "emmener" (NOT apporter, NOT emporter).
  - Example: "trazer o bolo" → blankWord "apporter" (NOT amener).
- blankWord MUST match the PT-BR translation cue. Strip parenthetical glosses when deciding:
  e.g. "Eu vou levar (trazer para lá) este bolo…" → blankWord = emporter (NOT apporter).
- NEVER set blankWord to the opposite verb of the pair when the PT prompt clearly signals trazer vs levar.
- Distractors in context-choice MAY include the opposite verb; blankWord must still be the matching one.`;

type Direction = 'bring' | 'take';
type Animacy = 'person' | 'thing';

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

/** Common PT person/relationship nouns near trazer/levar. */
const PT_PERSON =
  /\b(primo|prima|amig[oa]s?|pessoas?|algu[eé]m|filh[oa]s?|m[ãa]e|pai|pais|irm[ãa]os?|irmãs?|colegas?|namorad[oa]s?|marido|espos[ao]|crian[cç]as?|menin[oa]s?|senhor(?:a|es|as)?|clientes?|professor(?:a|es|as)?|alun[oa]s?|m[eé]dic[oa]s?|doutor(?:a|es|as)?|vizinh[oa]s?|homem|homens|mulher(?:es)?|garot[oa]s?|beb[eê]s?|ti[oa]s?|sobrinh[oa]s?|net[oa]s?|cunhad[oa]s?|chefe|parentes?|convidad[oa]s?|crian[cç]ada)\b/i;

/** Common PT thing nouns near trazer/levar. */
const PT_THING =
  /\b(bolo|bolos|livro|livros|presente|presentes|bagagem|mala|malas|documento|documentos|carta|cartas|pacote|pacotes|comida|bebida|garrafa|garrafas|caixa|caixas|chave|chaves|dinheiro|celular|telefone|roupa|roupas|guarda[- ]?chuva|computador|caderno|caneta|mochila|sacola|sacolas|flor|flores|jornal|revistas?|rem[eé]dio|rem[eé]dios|valise|cadeau)\b/i;

const FR_PERSON =
  /\b(cousin|cousine|ami|amie|amis|amies|personne|quelqu'?un|fils|fille|enfants?|m[eè]re|p[eè]re|fr[eè]re|s[œo]ur|coll[eè]gue|copain|copine|mari|femme|gar[cç]on|b[eé]b[eé]|oncle|tante|neveu|ni[eè]ce|voisin|voisine|client|cliente|professeur|[eé]l[eè]ve|m[eé]decin|docteur|invit[eé]s?|parents?|gars|mec|nana)\b/i;

const FR_THING =
  /\b(g[aâ]teau|livre|cadeau|bagage|valise|document|lettre|paquet|nourriture|boisson|bouteille|bo[iî]te|cl[eé]|argent|t[eé]l[eé]phone|portable|v[eê]tement|parapluie|ordinateur|cahier|stylo|sac|sacs|fleur|fleurs|journal|magazine|m[eé]dicament)\b/i;

function ptAnimacy(translation: string): Animacy | null {
  const primary = primaryPtText(translation);
  const hasPerson = PT_PERSON.test(primary);
  const hasThing = PT_THING.test(primary);
  if (hasPerson && !hasThing) return 'person';
  if (hasThing && !hasPerson) return 'thing';
  return null;
}

function frSentenceAnimacy(sentence: string | undefined): Animacy | null {
  if (!sentence?.trim()) return null;
  const text = sentence.replace(/___/g, ' ').replace(/\^\^/g, '');
  const hasPerson = FR_PERSON.test(text);
  const hasThing = FR_THING.test(text);
  if (hasPerson && !hasThing) return 'person';
  if (hasThing && !hasPerson) return 'thing';
  return null;
}

function resolveAnimacy(translation: string, sentence?: string): Animacy | null {
  return ptAnimacy(translation) ?? frSentenceAnimacy(sentence);
}

function frDirectionOfWord(word: string): Direction | null {
  const w = word.toLowerCase().normalize('NFC');
  if (/\bemport/.test(w) || /\bemmen/.test(w) || /\bemmèn/.test(w)) return 'take';
  if (/\bapport/.test(w) || /\bamen/.test(w) || /\bamèn/.test(w)) return 'bring';
  return null;
}

function frAnimacyOfWord(word: string): Animacy | null {
  const w = word.toLowerCase().normalize('NFC');
  if (/\bemmen/.test(w) || /\bemmèn/.test(w) || /\bamen/.test(w) || /\bamèn/.test(w)) {
    return 'person';
  }
  if (/\bemport/.test(w) || /\bapport/.test(w)) return 'thing';
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

  const result = word;
  for (const [pattern, replacement] of replacements) {
    const next = result.replace(pattern, replacement);
    if (next !== result) return next;
  }
  return result;
}

/** Swap thing↔person verbs while keeping bring/take direction. */
export function swapFrenchAnimacyVerb(word: string, to: Animacy): string {
  const replacements: Array<[RegExp, string]> =
    to === 'person'
      ? [
          [/apporter/gi, 'amener'],
          [/apporte/gi, 'amène'],
          [/apport/gi, 'amen'],
          [/emporter/gi, 'emmener'],
          [/emporte/gi, 'emmène'],
          [/emport/gi, 'emmen'],
        ]
      : [
          [/amener/gi, 'apporter'],
          [/amène/gi, 'apporte'],
          [/amene/gi, 'apporte'],
          [/amen(?=[a-zàâçéèêëîïôùûü]|$)/gi, 'apport'],
          [/emmener/gi, 'emporter'],
          [/emmène/gi, 'emporte'],
          [/emmene/gi, 'emporte'],
          [/emmen(?=[a-zàâçéèêëîïôùûü]|$)/gi, 'emport'],
        ];

  const result = word;
  for (const [pattern, replacement] of replacements) {
    const next = result.replace(pattern, replacement);
    if (next !== result) return next;
  }
  return result;
}

function applyBlankCorrection<T extends FillGapLike>(
  data: T,
  correctedBlank: string,
): T {
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

  return {
    ...data,
    blankWord: correctedBlank,
    options,
  };
}

/**
 * If blankWord is the opposite directional verb of the PT cue, flip it.
 * Also flips person↔thing when the object is clearly a person or a thing.
 * Options keep the opposite verb as a distractor when already present;
 * otherwise the old blankWord entry is replaced.
 */
export function sanitizeFillGapDirectional<T extends FillGapLike>(data: T): T {
  const wantedDirection = ptDirection(data.translation);
  const wantedAnimacy = resolveAnimacy(data.translation, data.sentence);

  let blank = data.blankWord;
  let variants = data.acceptable_variants;

  if (wantedDirection) {
    const current = frDirectionOfWord(blank);
    if (current && current !== wantedDirection) {
      blank = swapFrenchDirectionalVerb(blank, wantedDirection);
    }
    if (variants) {
      variants = variants.map((item) => {
        const dir = frDirectionOfWord(item);
        if (dir && dir !== wantedDirection) {
          return swapFrenchDirectionalVerb(item, wantedDirection);
        }
        return item;
      });
    }
  }

  if (wantedAnimacy) {
    const current = frAnimacyOfWord(blank);
    if (current && current !== wantedAnimacy) {
      blank = swapFrenchAnimacyVerb(blank, wantedAnimacy);
    }
    if (variants) {
      variants = variants.map((item) => {
        const anim = frAnimacyOfWord(item);
        if (anim && anim !== wantedAnimacy) {
          return swapFrenchAnimacyVerb(item, wantedAnimacy);
        }
        return item;
      });
    }
  }

  if (blank === data.blankWord && variants === data.acceptable_variants) {
    return data;
  }

  return {
    ...applyBlankCorrection({ ...data, acceptable_variants: variants }, blank),
    acceptable_variants: variants,
  };
}

/**
 * True when blankWord clearly violates person/thing or trazer/levar mapping.
 * Used by local answer-key guards after sanitization should have fixed the key.
 */
export function isDirectionalBlankMismatched(data: FillGapLike): boolean {
  const wantedDirection = ptDirection(data.translation);
  const wantedAnimacy = resolveAnimacy(data.translation, data.sentence);
  const blankDir = frDirectionOfWord(data.blankWord);
  const blankAnim = frAnimacyOfWord(data.blankWord);

  if (wantedDirection && blankDir && blankDir !== wantedDirection) return true;
  if (wantedAnimacy && blankAnim && blankAnim !== wantedAnimacy) return true;
  return false;
}
