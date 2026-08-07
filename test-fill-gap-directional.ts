/**
 * Smoke tests for French directional verb sanitization (apporter/emporter/amener/emmener).
 * Run: npx tsx test-fill-gap-directional.ts
 */
import {
  isDirectionalBlankMismatched,
  sanitizeFillGapDirectional,
  swapFrenchAnimacyVerb,
  swapFrenchDirectionalVerb,
} from './lib/fillGapDirectionalSanitize';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

// Screenshot case: PT "levar (trazer para lá)" + wrong blankWord "apporter"
const screenshotCase = sanitizeFillGapDirectional({
  blankWord: 'apporter',
  translation: 'Eu vou levar (trazer para lá) este bolo para a reunião esta noite.',
  acceptable_variants: ['apporte'],
});

assert(
  screenshotCase.blankWord === 'emporter',
  'fixes apporter → emporter when PT cue is levar (ignores parenthetical trazer)',
);
assert(
  screenshotCase.acceptable_variants?.[0] === 'emporte',
  'rewrites acceptable_variants in the same direction',
);

const mcqKeepsDistractor = sanitizeFillGapDirectional({
  blankWord: 'apporter',
  translation: 'Eu vou levar este bolo.',
  options: ['apporter', 'emporter', 'prendre', 'amener'],
});
assert(mcqKeepsDistractor.blankWord === 'emporter', 'MCQ blankWord flips to emporter');
assert(
  mcqKeepsDistractor.options?.includes('apporter') === true &&
    mcqKeepsDistractor.options?.includes('emporter') === true,
  'MCQ keeps opposite verb as distractor when already in options',
);

const mcqReplacesMissing = sanitizeFillGapDirectional({
  blankWord: 'apporter',
  translation: 'Eu vou levar este bolo.',
  options: ['apporter', 'prendre', 'amener', 'porter'],
});
assert(
  mcqReplacesMissing.options?.includes('emporter') === true &&
    mcqReplacesMissing.options?.includes('apporter') === false,
  'MCQ replaces wrong blankWord in options when correct verb is missing',
);

const trazerCase = sanitizeFillGapDirectional({
  blankWord: 'emporter',
  translation: 'Eu vou trazer este bolo para a reunião.',
});
assert(
  trazerCase.blankWord === 'apporter',
  'fixes emporter → apporter when PT cue is trazer',
);

const alreadyCorrect = sanitizeFillGapDirectional({
  blankWord: 'emporter',
  translation: 'Eu vou levar este bolo.',
});
assert(
  alreadyCorrect.blankWord === 'emporter',
  'leaves matching levar/emporter pair unchanged',
);

const conjugated = sanitizeFillGapDirectional({
  blankWord: 'apporte',
  translation: 'Eu levo o bolo.',
});
assert(conjugated.blankWord === 'emporte', 'swaps conjugated apporte → emporte');

assert(
  swapFrenchDirectionalVerb('amener', 'take') === 'emmener',
  'swaps amener → emmener',
);

const ambiguous = sanitizeFillGapDirectional({
  blankWord: 'apporter',
  translation: 'Eu vou levar e trazer o bolo.',
});
assert(
  ambiguous.blankWord === 'apporter',
  'does not guess when primary PT text has both levar and trazer',
);

// Person vs thing — "levar meu primo" must never be apporter
const cousinCase = sanitizeFillGapDirectional({
  blankWord: 'apporter',
  translation:
    'Meu amigo está sozinho em casa, eu acho que deveria levar meu primo para brincar com ele.',
  sentence: 'Mon ami est seul chez lui, je pense que je devrais ___ mon cousin pour jouer avec lui.',
  options: ['apporter', 'emporter', 'amener', 'emmener'],
});
assert(
  cousinCase.blankWord === 'emmener',
  'fixes apporter → emmener for levar + person (primo/cousin)',
);
assert(
  cousinCase.options?.includes('emmener') === true,
  'person/thing fix keeps emmener in options',
);

const emporterPerson = sanitizeFillGapDirectional({
  blankWord: 'emporter',
  translation: 'Eu vou levar meu amigo ao cinema.',
});
assert(
  emporterPerson.blankWord === 'emmener',
  'fixes emporter → emmener when object is a person',
);

const amenerThing = sanitizeFillGapDirectional({
  blankWord: 'amener',
  translation: 'Eu vou trazer o bolo para a festa.',
});
assert(
  amenerThing.blankWord === 'apporter',
  'fixes amener → apporter when object is a thing',
);

assert(
  swapFrenchAnimacyVerb('emporter', 'person') === 'emmener',
  'animacy swap emporter → emmener',
);

const userScreenshotOk = sanitizeFillGapDirectional({
  blankWord: 'emmener',
  translation:
    'Meu amigo está sozinho em casa, eu acho que deveria levar meu primo para brincar com ele.',
  options: ['emmener', 'emporter', 'amener', 'apporter'],
});
assert(
  userScreenshotOk.blankWord === 'emmener',
  'keeps emmener for levar + primo (correct key)',
);
assert(
  !isDirectionalBlankMismatched(userScreenshotOk),
  'emmener + levar + person is not a mismatch',
);
assert(
  isDirectionalBlankMismatched({
    blankWord: 'apporter',
    translation: 'Eu vou levar meu primo.',
  }),
  'flags apporter + levar + person as mismatch',
);

console.log('\nAll fill-gap directional tests passed.');
