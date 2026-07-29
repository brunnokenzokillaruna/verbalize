/**
 * Smoke tests for reverse-translation local validation.
 * Run: npx tsx test-reverse-translation-pt-adverb.ts
 */
import { sanitizeReverseTranslationExercise } from './lib/reverseTranslationPtAdverb';
import { validateReverseTranslationLocal } from './lib/reverseTranslationValidate';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

const ambiguous = sanitizeReverseTranslationExercise({
  portuguese_sentence: 'Você precisa organizar o mercado rápido.',
  target_translation: 'Tu dois organiser le marché rapidement.',
  acceptable_variants: [],
});

assert(
  ambiguous.portuguese_sentence.includes('rapidamente'),
  'rewrites colloquial "rápido" to "rapidamente" when target uses adverb',
);
assert(
  ambiguous.acceptable_variants.some((v) => /\bvite\b/i.test(v)),
  'adds "vite" as acceptable variant for "rapidement"',
);

const explicit = sanitizeReverseTranslationExercise({
  portuguese_sentence: 'Faça isso rapidamente.',
  target_translation: 'Fais-le rapidement.',
  acceptable_variants: ['Fais-le vite.'],
});

assert(
  explicit.portuguese_sentence === 'Faça isso rapidamente.',
  'does not rewrite already explicit adverb forms',
);

const viteAccepted = validateReverseTranslationLocal(
  'Tu dois organiser le marché vite.',
  'Tu dois organiser le marché rapidement.',
  ['Tu dois organiser le marché vite.'],
);
assert(viteAccepted.accepted === true, 'accepts vite as synonym of rapidement');

const adjectiveRejected = validateReverseTranslationLocal(
  'Tu dois organiser le marché rapide.',
  'Tu dois organiser le marché rapidement.',
  [],
);
assert(adjectiveRejected.accepted === false, 'rejects adjective "rapide" when adverb expected');

// Screenshot case: "trop tard" vs "très tard" / "muito tarde" — meaning change
const tropVsTres = validateReverseTranslationLocal(
  'Le dernier dimanche, je me suis levé trop tard',
  'Dimanche dernier, je me suis levé très tard.',
  [],
);
assert(
  tropVsTres.accepted === false,
  'rejects trop vs très meaning change (muito tarde ≠ trop tard)',
);
assert(tropVsTres.verdict === 'wrong', 'trop/très trap uses wrong verdict');

const exact = validateReverseTranslationLocal(
  'Dimanche dernier, je me suis levé très tard.',
  'Dimanche dernier, je me suis levé très tard.',
  [],
);
assert(exact.accepted === true && exact.verdict === 'exact', 'accepts exact match');

const gibberish = validateReverseTranslationLocal(
  'blah blah marche',
  'Je vais au marché demain matin avec ma sœur.',
  [],
);
assert(gibberish.accepted === false, 'rejects low-overlap gibberish');

const nullVariants = validateReverseTranslationLocal(
  'Bonjour',
  'Bonjour',
  // @ts-expect-error intentional resilience check
  null,
);
assert(nullVariants.accepted === true, 'exact match still works with null variants');

console.log('\nAll reverse-translation validation tests passed.');
