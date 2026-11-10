/**
 * Smoke tests for table-backed conjugations (no Gemini / Firestore).
 * Run: npx tsx test-cached-conjugations.ts
 */
import { buildConjugationPreviewFromVerbDoc } from './lib/verbs/buildConjugationPreview';
import {
  mapPreviewTenseToVerbKey,
  pickAvailableTense,
  resolveVerbTenseKey,
} from './lib/verbs/tenseKeys';
import { generateLocalDrill } from './utils/verbDrillGenerator';
import type { VerbDocument } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

assert(resolveVerbTenseKey('Presente') === 'present', 'resolveVerbTenseKey presente');
assert(resolveVerbTenseKey('passé composé') === 'past', 'resolveVerbTenseKey passé composé');
assert(resolveVerbTenseKey('Imparfait') === 'imperfect', 'resolveVerbTenseKey imparfait');
assert(resolveVerbTenseKey('conditionnel présent') === 'conditional', 'resolveVerbTenseKey conditionnel');

assert(mapPreviewTenseToVerbKey('imparfait', 'fr') === 'imperfect', 'map preview imparfait');
assert(mapPreviewTenseToVerbKey('passé composé', 'fr') === 'past', 'map preview passé composé');
assert(mapPreviewTenseToVerbKey('plus-que-parfait', 'fr') === null, 'map preview plus-que-parfait → null');
assert(mapPreviewTenseToVerbKey('futur proche (aller + infinitif)', 'fr') === null, 'map futur proche → null');
assert(mapPreviewTenseToVerbKey('present continuous', 'en') === null, 'map present continuous → null');
assert(mapPreviewTenseToVerbKey('will future', 'en') === 'future', 'map will future');

const etre: VerbDocument = {
  infinitive: 'être',
  language: 'fr',
  translation: 'ser / estar',
  conjugations: {
    present: {
      je: 'je suis',
      tu: 'tu es',
      il: 'il est',
      elle: 'elle est',
      on: 'on est',
      nous: 'nous sommes',
      vous: 'vous êtes',
      ils: 'ils sont',
      elles: 'elles sont',
    },
    past: {
      je: 'j\'ai été',
      tu: 'tu as été',
      il: 'il a été',
      elle: 'elle a été',
      on: 'on a été',
      nous: 'nous avons été',
      vous: 'vous avez été',
      ils: 'ils ont été',
      elles: 'elles ont été',
    },
    imperfect: {
      je: "j'étais",
      tu: 'tu étais',
      il: 'il était',
      elle: 'elle était',
      on: 'on était',
      nous: 'nous étions',
      vous: 'vous étiez',
      ils: 'ils étaient',
      elles: 'elles étaient',
    },
  },
  exampleSentences: [
    { target: 'Je suis fatigué.', portuguese: 'Eu estou cansado.' },
  ],
};

assert(pickAvailableTense(etre.conjugations, 'imperfect') === 'imperfect', 'pick preferred imperfect');
assert(pickAvailableTense(etre.conjugations, 'subjunctive') === 'present', 'pick falls back to present');

const preview = buildConjugationPreviewFromVerbDoc(etre, 'imperfect', 'fr');
assert(preview.length === 9, 'preview has 9 French pronouns');
assert(preview[0]?.pronoun === 'je', 'preview starts with je');
assert(
  preview.some((r) => r.pronoun === 'je' && /étais/i.test(r.form)),
  'preview je imperfect form',
);

const drill = generateLocalDrill(etre, { preferredTense: 'imperfect', allowedTenses: ['imperfect'] });
assert(drill.verb === 'être', 'drill verb');
assert(drill.tense === 'Imperfeito', 'drill tense label');
assert(drill.options.length === 4, 'drill has 4 options');
assert(drill.options.includes(drill.correctForm), 'drill options include correct form');
assert(new Set(drill.options).size === 4, 'drill options unique');

console.log('\nAll cached-conjugation tests passed.');
