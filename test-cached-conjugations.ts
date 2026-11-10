/**
 * Smoke tests for table-backed conjugations (no Gemini / Firestore).
 * Run: npx tsx test-cached-conjugations.ts
 */
import { buildConjugationPreviewFromVerbDoc } from './lib/verbs/buildConjugationPreview';
import { mergeVerbConjugations } from './lib/verbs/generateVerbTable';
import {
  mapPreviewTenseToVerbKey,
  missingCoreTenses,
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
assert(resolveVerbTenseKey('plus-que-parfait') === 'pluperfect', 'resolveVerbTenseKey plus-que-parfait');
assert(resolveVerbTenseKey('conditionnel passé') === 'conditionalPast', 'resolveVerbTenseKey conditionnel passé');
assert(resolveVerbTenseKey('futur proche') === 'nearFuture', 'resolveVerbTenseKey futur proche');
assert(resolveVerbTenseKey('going to future') === 'nearFuture', 'resolveVerbTenseKey going to');
assert(resolveVerbTenseKey('present continuous') === 'presentContinuous', 'resolveVerbTenseKey present continuous');

assert(mapPreviewTenseToVerbKey('imparfait', 'fr') === 'imperfect', 'map preview imparfait');
assert(mapPreviewTenseToVerbKey('passé composé', 'fr') === 'past', 'map preview passé composé');
assert(mapPreviewTenseToVerbKey('plus-que-parfait', 'fr') === 'pluperfect', 'map preview plus-que-parfait');
assert(
  mapPreviewTenseToVerbKey('futur proche (aller + infinitif)', 'fr') === 'nearFuture',
  'map futur proche',
);
assert(mapPreviewTenseToVerbKey('present continuous', 'en') === 'presentContinuous', 'map present continuous');
assert(mapPreviewTenseToVerbKey('will future', 'en') === 'future', 'map will future');
assert(
  mapPreviewTenseToVerbKey('present perfect continuous', 'en') === null,
  'map present perfect continuous → null',
);

const etreThin: VerbDocument = {
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
      je: "j'ai été",
      tu: 'tu as été',
      il: 'il a été',
      elle: 'elle a été',
      on: 'on a été',
      nous: 'nous avons été',
      vous: 'vous avez été',
      ils: 'ils ont été',
      elles: 'elles ont été',
    },
  },
  exampleSentences: [{ target: 'Je suis fatigué.', portuguese: 'Eu estou cansado.' }],
};

const missing = missingCoreTenses(etreThin.conjugations, 'fr');
assert(missing.includes('imperfect'), 'thin doc misses imperfect');
assert(missing.includes('pluperfect'), 'thin doc misses pluperfect');
assert(missing.includes('nearFuture'), 'thin doc misses nearFuture');
assert(!missing.includes('present'), 'thin doc has present');

const merged = mergeVerbConjugations(etreThin.conjugations, {
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
  nearFuture: {
    je: 'je vais être',
    tu: 'tu vas être',
    il: 'il va être',
    elle: 'elle va être',
    on: 'on va être',
    nous: 'nous allons être',
    vous: 'vous allez être',
    ils: 'ils vont être',
    elles: 'elles vont être',
  },
});
assert(Boolean(merged.imperfect?.je), 'merge adds imperfect');
assert(Boolean(merged.nearFuture?.je), 'merge adds nearFuture');
assert(merged.present.je === 'je suis', 'merge keeps present');

const etre: VerbDocument = {
  ...etreThin,
  conjugations: {
    ...merged,
    pluperfect: {
      je: "j'avais été",
      tu: 'tu avais été',
      il: 'il avait été',
      elle: 'elle avait été',
      on: 'on avait été',
      nous: 'nous avions été',
      vous: 'vous aviez été',
      ils: 'ils avaient été',
      elles: 'elles avaient été',
    },
  },
};

assert(pickAvailableTense(etre.conjugations, 'imperfect') === 'imperfect', 'pick preferred imperfect');
assert(
  pickAvailableTense(etre.conjugations, 'subjunctive', { allowFallback: false }) === null,
  'no wrong-tense fallback when disabled',
);
assert(pickAvailableTense(etre.conjugations, 'subjunctive') === 'present', 'fallback to present when allowed');

const preview = buildConjugationPreviewFromVerbDoc(etre, 'imperfect', 'fr');
assert(preview.length === 9, 'preview has 9 French pronouns');
assert(preview[0]?.pronoun === 'je', 'preview starts with je');
assert(
  preview.some((r) => r.pronoun === 'je' && /étais/i.test(r.form)),
  'preview je imperfect form',
);

const nearPreview = buildConjugationPreviewFromVerbDoc(etre, 'nearFuture', 'fr');
assert(
  nearPreview.some((r) => r.pronoun === 'je' && /vais être/i.test(r.form)),
  'preview je near future',
);

const drill = generateLocalDrill(etre, { preferredTense: 'imperfect', allowedTenses: ['imperfect'] });
assert(drill.verb === 'être', 'drill verb');
assert(drill.tense === 'Imperfeito', 'drill tense label');
assert(drill.options.length === 4, 'drill has 4 options');
assert(drill.options.includes(drill.correctForm), 'drill options include correct form');
assert(new Set(drill.options).size === 4, 'drill options unique');

console.log('\nAll cached-conjugation tests passed.');
