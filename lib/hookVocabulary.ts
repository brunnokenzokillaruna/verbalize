import { sanitizeVocabularyToken } from '@/lib/hookSanitize';
import { canonicalVocabKey } from '@/lib/vocabCanonical';

/**
 * Character names used in dialogue generation (pickHookNames / pickNames).
 * Kept here so backfill and model-output filtering never treat them as vocab.
 */
const HOOK_CHARACTER_NAMES = [
  // FR female
  'marie', 'sophie', 'camille', 'lea', 'léa', 'emma', 'chloe', 'chloé', 'manon', 'ines', 'inès',
  'sarah', 'jade', 'louise', 'alice', 'lina', 'julia', 'eva', 'clara', 'lucie', 'romane',
  'agathe', 'jeanne', 'margaux', 'noemie', 'noémie', 'elise', 'élise', 'anais', 'anaïs',
  // FR male
  'lucas', 'thomas', 'julien', 'antoine', 'louis', 'hugo', 'arthur', 'nathan',
  'gabriel', 'raphael', 'raphaël', 'leo', 'léo', 'enzo', 'paul', 'jules', 'adam', 'victor',
  'noah', 'ethan', 'mathis', 'maxime', 'alexandre', 'clement', 'clément', 'baptiste', 'romain',
  // EN
  'olivia', 'jake', 'michael', 'daniel', 'ryan',
];

/** Days, months, and common place names that are not useful beginner vocab targets. */
const CALENDAR_AND_PLACE_WORDS = [
  // FR days / months
  'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche',
  'janvier', 'fevrier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
  'aout', 'août', 'septembre', 'octobre', 'novembre', 'decembre', 'décembre',
  // EN days / months
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july',
  'august', 'september', 'october', 'november', 'december',
  // Places / demonyms often injected into scenes
  'paris', 'lyon', 'marseille', 'bordeaux', 'toulouse', 'nice', 'lille',
  'london', 'france', 'brasil', 'brazil', 'england', 'portugal',
];

/** Function words + MISS role labels that should never be "new vocabulary". */
const DIALOGUE_STOP_WORDS = [
  'mais', 'avec', 'pour', 'dans', 'cette', 'cest', 'comme', 'très', 'tres',
  'week', 'weekend', 'matin',
  'the', 'this', 'that', 'with', 'from', 'have', 'were', 'your',
  'voce', 'você',
  // Common MISS local-role labels (PT / FR / EN)
  'recepcionista', 'garcom', 'garçom', 'atendente', 'caixa', 'medico', 'médico',
  'serveur', 'serveuse', 'caissier', 'caissiere', 'caissière', 'medecin', 'médecin',
  'receptionniste', 'réceptionniste', 'waiter', 'waitress', 'receptionist', 'doctor',
  'client', 'cliente', 'voisin', 'voisine', 'ami', 'amie', 'copain', 'copine',
];

const STATIC_EXCLUDED_VOCAB = new Set(
  [...HOOK_CHARACTER_NAMES, ...CALENDAR_AND_PLACE_WORDS, ...DIALOGUE_STOP_WORDS].map(
    canonicalVocabKey,
  ),
);

function isExcludedVocabularyWord(word: string, dynamicExcluded: Set<string>): boolean {
  const key = canonicalVocabKey(word);
  if (!key) return true;
  return STATIC_EXCLUDED_VOCAB.has(key) || dynamicExcluded.has(key);
}

/** Speaker labels from lines like "Alice: Bonjour" or "Garçom: …". */
export function extractDialogueSpeakerLabels(dialogue: string): string[] {
  const labels: string[] = [];
  for (const line of dialogue.split('\n')) {
    const colon = line.indexOf(':');
    if (colon <= 0) continue;
    const label = sanitizeVocabularyToken(line.slice(0, colon));
    if (label.length > 0) labels.push(label);
  }
  return labels;
}

function buildDynamicExcludedSet(
  dialogue: string,
  extraExcluded: string[] = [],
): Set<string> {
  const set = new Set<string>();
  for (const label of extractDialogueSpeakerLabels(dialogue)) {
    set.add(canonicalVocabKey(label));
  }
  for (const word of extraExcluded) {
    const key = canonicalVocabKey(sanitizeVocabularyToken(word));
    if (key) set.add(key);
  }
  return set;
}

/**
 * Removes already-learned words and proper nouns / calendar words from
 * newVocabulary, backfilling from the dialogue when needed.
 */
export function filterKnownFromNewVocabulary(
  newVocabulary: string[],
  dialogue: string,
  knownVocabulary: string[],
  extraExcluded: string[] = [],
): string[] {
  const knownSet = new Set(knownVocabulary.map(canonicalVocabKey));
  const dynamicExcluded = buildDynamicExcludedSet(dialogue, extraExcluded);

  const filtered = newVocabulary
    .map(sanitizeVocabularyToken)
    .filter(
      (word) =>
        word.length > 0 &&
        !knownSet.has(canonicalVocabKey(word)) &&
        !isExcludedVocabularyWord(word, dynamicExcluded),
    );

  const unique = [...new Set(filtered)];
  if (unique.length >= 2) return unique.slice(0, 2);

  const needed = 2 - unique.length;
  const extras = extractFreshWordsFromDialogue(
    dialogue,
    knownSet,
    needed,
    unique,
    dynamicExcluded,
  );
  const merged = [...unique, ...extras];

  if (merged.length < 2) {
    console.warn(
      '[filterKnownFromNewVocabulary] Could not find 2 fresh non-proper-noun words',
    );
    // Prefer fewer useful words over reintroducing proper names.
    return merged;
  }

  return merged.slice(0, 2);
}

function extractFreshWordsFromDialogue(
  dialogue: string,
  knownSet: Set<string>,
  need: number,
  exclude: string[],
  dynamicExcluded: Set<string>,
): string[] {
  if (need <= 0) return [];

  const excludeSet = new Set(exclude.map(canonicalVocabKey));
  const tokens = dialogue
    .split(/[\s,.!?;:«»"'()[\]-]+/)
    .map(sanitizeVocabularyToken)
    .filter(
      (word) =>
        word.length >= 4 &&
        !knownSet.has(canonicalVocabKey(word)) &&
        !excludeSet.has(canonicalVocabKey(word)) &&
        !isExcludedVocabularyWord(word, dynamicExcluded),
    );

  const result: string[] = [];
  for (const token of tokens) {
    if (result.includes(token)) continue;
    result.push(token);
    if (result.length >= need) break;
  }
  return result;
}

export function filterHookVocabularyForKnownWords<
  T extends { newVocabulary: string[]; dialogue: string },
>(hook: T, knownVocabulary: string[], extraExcluded: string[] = []): T {
  return {
    ...hook,
    newVocabulary: filterKnownFromNewVocabulary(
      hook.newVocabulary,
      hook.dialogue,
      knownVocabulary,
      extraExcluded,
    ),
  };
}
