/**
 * Smoke tests for answer-key QA guards (no Gemini call).
 * Run: npx tsx test-verify-answer-keys.ts
 */
import type { Exercise } from './types';
import {
  extractAnswerClaim,
  failsLocalAnswerKeyGuard,
  filterByLocalAnswerKeyGuards,
} from './lib/practiceExercises/verifyAnswerKeys';
import { sanitizeFillGapDirectional } from './lib/fillGapDirectionalSanitize';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

const badBlankMissing: Exercise = {
  type: 'context-choice',
  data: {
    sentence: 'Je ___ ce gâteau.',
    blankWord: 'emporter',
    options: ['apporter', 'prendre', 'porter', 'amener'],
    translation: 'Eu levo este bolo.',
  },
};

assert(
  failsLocalAnswerKeyGuard(badBlankMissing) !== null,
  'drops context-choice when blankWord is not in options',
);

const goodBlank: Exercise = {
  type: 'context-choice',
  data: {
    sentence: 'Je ___ ce gâteau.',
    blankWord: 'emporter',
    options: ['apporter', 'emporter', 'prendre', 'amener'],
    translation: 'Eu levo este bolo.',
  },
};

assert(failsLocalAnswerKeyGuard(goodBlank) === null, 'keeps context-choice when blankWord is in options');

const claim = extractAnswerClaim(goodBlank, 0);
assert(claim !== null && claim.claim.includes('emporter'), 'extracts claim including blankWord');

// Person/thing: apporter marked correct for a person must fail local guard
const personThingWrong: Exercise = {
  type: 'context-choice',
  data: {
    sentence: 'Je pense que je devrais ___ mon cousin.',
    blankWord: 'apporter',
    options: ['apporter', 'emporter', 'amener', 'emmener'],
    translation: 'Eu acho que deveria levar meu primo.',
  },
};
assert(
  failsLocalAnswerKeyGuard(personThingWrong)?.includes('person/thing') === true,
  'drops context-choice when apporter is marked correct for a person',
);

const personThingOk: Exercise = {
  type: 'context-choice',
  data: {
    sentence: 'Je pense que je devrais ___ mon cousin.',
    blankWord: 'emmener',
    options: ['emmener', 'emporter', 'amener', 'apporter'],
    translation: 'Eu acho que deveria levar meu primo.',
  },
};
assert(
  failsLocalAnswerKeyGuard(personThingOk) === null,
  'keeps emmener as correct for levar + person',
);

// Screenshot pedagogy case: local directional sanitize + guard
const flipped = sanitizeFillGapDirectional({
  blankWord: 'apporter',
  translation: 'Eu vou levar (trazer para lá) este bolo para a reunião esta noite.',
  options: ['apporter', 'prendre', 'amener', 'porter'],
});
assert(flipped.blankWord === 'emporter', 'directional sanitize fixes wrong key before QA');
assert(
  flipped.options?.includes('emporter') === true,
  'directional sanitize puts corrected blank into options',
);

const cousinFlipped = sanitizeFillGapDirectional({
  blankWord: 'apporter',
  translation: 'Eu acho que deveria levar meu primo para brincar com ele.',
  options: ['apporter', 'emporter', 'amener', 'emmener'],
});
assert(
  cousinFlipped.blankWord === 'emmener',
  'sanitize fixes apporter → emmener for person before QA',
);

const grammarTrapBad: Exercise = {
  type: 'grammar-trap',
  data: {
    scenario: 'test',
    question: 'Qual está correta?',
    options: [
      { sentence: 'A', translation: 'a', isCorrect: true },
      { sentence: 'B', translation: 'b', isCorrect: true },
      { sentence: 'C', translation: 'c', isCorrect: false },
      { sentence: 'D', translation: 'd', isCorrect: false },
    ],
    explanation: 'x',
    trapRule: 'y',
  },
};

assert(
  failsLocalAnswerKeyGuard(grammarTrapBad)?.includes('exactly one') === true,
  'drops grammar-trap with two isCorrect flags',
);

const filtered = filterByLocalAnswerKeyGuards([badBlankMissing, goodBlank]);
assert(filtered.length === 1 && filtered[0] === goodBlank, 'filter keeps only valid answer keys');

const arnaqueLeak: Exercise = {
  type: 'translation-with-constraint',
  data: {
    portuguese_sentence: 'Eu sei que o preço é uma arnaque total, mas vou lá.',
    required_chunk: 'arnaque',
    target_translation: "Je sais que le prix est une arnaque totale, mais j'y vais.",
    acceptable_variants: ["Je sais que c'est une arnaque totale, mais j'y vais."],
  },
};
assert(
  failsLocalAnswerKeyGuard(arnaqueLeak)?.includes('arnaque') === true,
  'drops translation-with-constraint when PT prompt contains required_chunk',
);

const purePtConstraint: Exercise = {
  type: 'translation-with-constraint',
  data: {
    portuguese_sentence: 'Eu sei que o preço é um golpe total, mas vou lá.',
    required_chunk: 'arnaque',
    target_translation: "Je sais que le prix est une arnaque totale, mais j'y vais.",
    acceptable_variants: ["Je sais que c'est une arnaque totale, mais j'y vais."],
  },
};
assert(
  failsLocalAnswerKeyGuard(purePtConstraint) === null,
  'keeps translation-with-constraint when PT uses Portuguese equivalent',
);

console.log('\nAll verify-answer-keys local tests passed.');
