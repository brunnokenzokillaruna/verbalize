import { sanitizeVocabularyToken } from '@/lib/hookSanitize';
import { buildKnownVocabularyMatcher, canonicalVocabKey } from '@/lib/vocabCanonical';

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
  // FR greetings, fillers and high-frequency function words
  'salut', 'bonjour', 'bonsoir', 'merci', 'oui', 'non', 'alors', 'donc', 'aussi',
  'bien', 'beaucoup', 'aujourd', 'hui', 'maintenant', 'bientot', 'bientôt',
  'ensuite', 'apres', 'après', 'avant', 'encore', 'toujours', 'jamais', 'quand',
  'comment', 'pourquoi', 'parce', 'quelque', 'quelques', 'chose', 'tout', 'tous',
  'toute', 'toutes', 'juste', 'vraiment', 'super', 'genial', 'génial', 'dommage',
  'accord', 'souci', 'grave', 'allez', 'voila', 'voilà', 'elle', 'elles', 'nous',
  'vous', 'mon', 'ton', 'son', 'notre', 'votre', 'leur', 'leurs', 'cela', 'celui',
  'celle', 'quoi', 'dont', 'sont', 'etait', 'était', 'etaient', 'étaient', 'avez',
  'avons', 'avais', 'avait', 'plus', 'moins', 'sans', 'sous', 'chez', 'entre',
  'vers', 'jusqu', 'deja', 'déjà', 'autre', 'autres', 'meme', 'même', 'seulement',
  'peut', 'peux', 'veux', 'veut', 'faut', 'suis', 'etre', 'être', 'ici',
  // EN greetings, fillers and high-frequency function words
  'hello', 'hi', 'thanks', 'thank', 'yes', 'well', 'okay', 'right', 'sure',
  'really', 'maybe', 'about', 'there', 'here', 'they', 'them', 'their', 'these',
  'those', 'what', 'when', 'where', 'which', 'because', 'something', 'anything',
  'everything', 'always', 'never', 'again', 'still', 'just', 'very', 'much',
  'many', 'more', 'less', 'than', 'then', 'also', 'into', 'over', 'after',
  'before', 'going', 'gonna', 'want', 'need', 'know', 'think', 'could', 'would',
  'should', 'today', 'tomorrow', 'tonight',
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
  const isKnown = buildKnownVocabularyMatcher(knownVocabulary);
  const dynamicExcluded = buildDynamicExcludedSet(dialogue, extraExcluded);

  const sanitized = newVocabulary
    .map(sanitizeVocabularyToken)
    .filter((word) => word.length > 0);

  const alreadyLearned = sanitized.filter(isKnown);
  if (alreadyLearned.length > 0) {
    console.warn(
      `[filterKnownFromNewVocabulary] Model returned already-learned words: ${alreadyLearned.join(', ')}`,
    );
  }

  const unique = [
    ...new Set(
      sanitized.filter(
        (word) => !isKnown(word) && !isExcludedVocabularyWord(word, dynamicExcluded),
      ),
    ),
  ];
  if (unique.length >= 2) return unique.slice(0, 2);

  const needed = 2 - unique.length;
  const extras = extractFreshWordsFromDialogue(
    dialogue,
    isKnown,
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
  isKnown: (word: string) => boolean,
  need: number,
  exclude: string[],
  dynamicExcluded: Set<string>,
): string[] {
  if (need <= 0) return [];

  const excludeSet = new Set(exclude.map(canonicalVocabKey));
  const tokens = dialogue
    .split(/[\s,.!?;:«»"“”'’‘()[\]\-—–…]+/)
    .map(sanitizeVocabularyToken)
    .filter(
      (word) =>
        word.length >= 4 &&
        !isKnown(word) &&
        !excludeSet.has(canonicalVocabKey(word)) &&
        !isExcludedVocabularyWord(word, dynamicExcluded),
    );

  // Longer tokens are far more likely to be content words than leftover
  // function words, so they make better replacements.
  const unique = [...new Set(tokens)];
  return unique
    .map((word, index) => ({ word, index }))
    .sort((a, b) => b.word.length - a.word.length || a.index - b.index)
    .slice(0, need)
    .map((entry) => entry.word);
}

/** Drops multi-word entries the learner already has stored under the same phrase. */
export function filterKnownFromNewChunks<T extends { phrase: string }>(
  chunks: T[],
  knownVocabulary: string[],
): T[] {
  const isKnown = buildKnownVocabularyMatcher(knownVocabulary);
  return chunks.filter((chunk) => !isKnown(chunk.phrase));
}

export function filterHookVocabularyForKnownWords<
  T extends {
    newVocabulary: string[];
    dialogue: string;
    newChunks?: Array<{ phrase: string }>;
  },
>(hook: T, knownVocabulary: string[], extraExcluded: string[] = []): T {
  const newVocabulary = filterKnownFromNewVocabulary(
    hook.newVocabulary,
    hook.dialogue,
    knownVocabulary,
    extraExcluded,
  );

  if (!hook.newChunks?.length) return { ...hook, newVocabulary };

  return {
    ...hook,
    newVocabulary,
    newChunks: filterKnownFromNewChunks(hook.newChunks, knownVocabulary),
  };
}
