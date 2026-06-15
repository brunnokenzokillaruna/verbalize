import type { VerbDocument, ConjugationSpeedData } from '@/types';
import {
  extractVerbOnlyForm,
  getConjugationAudioText,
  TENSE_LABELS,
} from '@/utils/conjugationHelper';

const DISTRACTOR_SUFFIXES = ['s', 'ent', 'ons', 'ez', 'ai', 'ais', 'ait', 'ions'];

/** Tempos mais comuns no sprint — evita cair em subjuntivo cedo demais. */
export const SPRINT_TENSE_KEYS = ['present', 'past', 'imperfect', 'future', 'conditional'] as const;

export type GenerateLocalDrillOptions = {
  allowedTenses?: readonly string[];
};

/**
 * Ensures exactly 4 unique options: 1 correct form + 3 distinct distractors.
 * Returns null when not enough unique distractors can be built.
 */
export function sanitizeConjugationOptions(
  correctForm: string,
  options: string[],
  extraPool: string[] = [],
): string[] | null {
  const normalized = correctForm.trim();
  if (!normalized) return null;

  const seen = new Set<string>();
  const distractors: string[] = [];

  const addDistractor = (raw: string) => {
    const candidate = raw.trim();
    if (!candidate || candidate === normalized || seen.has(candidate)) return;
    seen.add(candidate);
    distractors.push(candidate);
  };

  for (const opt of options) addDistractor(opt);
  for (const form of extraPool) {
    if (distractors.length >= 3) break;
    addDistractor(form);
  }
  for (const suffix of DISTRACTOR_SUFFIXES) {
    if (distractors.length >= 3) break;
    addDistractor(`${normalized}${suffix}`);
  }

  if (distractors.length < 3) return null;

  const result = [normalized, ...distractors.slice(0, 3)];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickExampleForDrill(
  verbDoc: VerbDocument,
  pronoun: string,
  verbForm: string,
): { target: string; portuguese: string } {
  const fullPhrase = getConjugationAudioText(pronoun, verbForm, verbDoc.language);
  const examples = verbDoc.exampleSentences ?? [];

  const match = examples.find(
    (ex) =>
      ex.target.toLowerCase().includes(verbForm.toLowerCase()) ||
      ex.target.toLowerCase().includes(fullPhrase.toLowerCase()),
  );
  if (match) return { target: match.target, portuguese: match.portuguese };

  if (examples.length > 0) {
    return { target: examples[0].target, portuguese: examples[0].portuguese };
  }

  return {
    target: `${fullPhrase}.`,
    portuguese: verbDoc.translation,
  };
}

export function generateLocalDrill(
  verbDoc: VerbDocument,
  config: GenerateLocalDrillOptions = {},
): ConjugationSpeedData {
  const allowed = config.allowedTenses ?? SPRINT_TENSE_KEYS;
  const availableTenses = Object.keys(verbDoc.conjugations).filter((t) =>
    allowed.includes(t),
  );
  const tenses = availableTenses.length > 0 ? availableTenses : Object.keys(verbDoc.conjugations);
  const randomTense = tenses[Math.floor(Math.random() * tenses.length)];
  const rawForms = (verbDoc.conjugations as Record<string, Record<string, string>>)[randomTense];

  const forms: Record<string, string> = {};
  for (const [pronoun, rawForm] of Object.entries(rawForms)) {
    forms[pronoun] = extractVerbOnlyForm(pronoun, rawForm, verbDoc.language);
  }

  const pronouns = Object.keys(forms);
  const correctPronoun = pronouns[Math.floor(Math.random() * pronouns.length)];
  const correctForm = forms[correctPronoun];

  // Distractors: other forms of the same verb in the same tense
  const otherForms = Object.values(forms).filter((f) => f !== correctForm);
  const distractors = new Set<string>();
  
  // Pick up to 3 distractors
  while (distractors.size < 3 && distractors.size < otherForms.length) {
    const randomForm = otherForms[Math.floor(Math.random() * otherForms.length)];
    distractors.add(randomForm);
  }

  // If not enough distractors (e.g., all forms are the same like in some english verbs), add fake ones or from other tenses
  if (distractors.size < 3) {
    const allForms = Object.values(verbDoc.conjugations).flatMap((c) =>
      Object.entries(c || {}).map(([p, f]) => extractVerbOnlyForm(p, f, verbDoc.language)),
    );
    const allUnique = [...new Set(allForms)].filter((f) => f !== correctForm && !distractors.has(f));
    while (distractors.size < 3 && allUnique.length > 0) {
      const randomForm = allUnique[Math.floor(Math.random() * allUnique.length)];
      distractors.add(randomForm);
      allUnique.splice(allUnique.indexOf(randomForm), 1);
    }
  }

  // If STILL not enough, just make some up (rare fallback)
  if (distractors.size < 3) {
    distractors.add(correctForm + 's');
    distractors.add(correctForm + 'ent');
    distractors.add(correctForm + 'ons');
  }

  const allForms = Object.values(verbDoc.conjugations).flatMap((c) =>
    Object.entries(c || {}).map(([p, f]) => extractVerbOnlyForm(p, f, verbDoc.language)),
  );
  const options = sanitizeConjugationOptions(
    correctForm,
    [correctForm, ...Array.from(distractors).slice(0, 3)],
    allForms,
  );
  if (!options) {
    throw new Error(`Could not build unique conjugation options for "${verbDoc.infinitive}"`);
  }

  const example = pickExampleForDrill(verbDoc, correctPronoun, correctForm);

  return {
    verb: verbDoc.infinitive,
    pronoun: correctPronoun,
    tense: TENSE_LABELS[randomTense] ?? randomTense,
    correctForm,
    options,
    exampleSentence: example.target,
    translation: example.portuguese,
  };
}
