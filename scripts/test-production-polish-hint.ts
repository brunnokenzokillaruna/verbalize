/**
 * Run: npx tsx scripts/test-production-polish-hint.ts
 */
import {
  formatProductionPolishHint,
  formatTranslationCorrectionHint,
  getLocalElaborationHint,
} from '../lib/elaborationHints';
import type { Exercise } from '../types/index';

let failed = 0;
function assert(name: string, condition: boolean, detail?: string) {
  if (condition) console.log(`PASS ${name}`);
  else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

assert(
  'polish of learner answer is shown',
  formatProductionPolishHint(
    "j'ai montre une colline pour voir une belle vue",
    "J'ai monté une colline pour voir une belle vue.",
  ) === "Sua frase corrigida: J'ai monté une colline pour voir une belle vue.",
);

assert(
  'identical polish is omitted',
  formatProductionPolishHint('Salut !', 'Salut!') === null,
);

assert(
  'missing polish is omitted',
  formatProductionPolishHint('anything', undefined) === null,
);

assert(
  'translation hint lists errors then corrected learner sentence',
  formatTranslationCorrectionHint({
    learnerText: "Samedi, je n'ai mange q'un morceau du pain",
    note: "Corrija: mange → mangé; q'un → qu'un; du pain → de pain.",
    correctedSentence: "Samedi, je n'ai mangé qu'un morceau de pain",
  }) ===
    "Corrija: mange → mangé; q'un → qu'un; du pain → de pain.\nSua frase corrigida: Samedi, je n'ai mangé qu'un morceau de pain",
);

const micro: Exercise = {
  type: 'micro-message',
  data: {
    context: 'x',
    incomingMessage: 'Salut',
    translation: 'Oi',
    evaluationCriteria: 'y',
    exampleResponse: 'Salut ! J\'ai exploré le musée.',
  },
};

assert(
  'micro-message does not show canned exampleResponse alone',
  getLocalElaborationHint(micro) === null,
);

assert(
  'micro-message prefers production polish',
  getLocalElaborationHint(micro, "Sua frase corrigida: J'ai monté une colline.") ===
    "Sua frase corrigida: J'ai monté une colline.",
);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nAll assertions passed');
