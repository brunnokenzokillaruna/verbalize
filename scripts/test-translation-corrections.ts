import { diffCorrectionSegments } from '../lib/reverseTranslationDiff';
import { buildTranslationCorrections } from '../lib/reverseTranslationCorrections';

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.error(`FAIL ${label}\n  expected: ${e}\n  actual:   ${a}`);
  }
}

// The reported case: the analysis mentioned the elision and the idiom but never
// the wrong contraction, which is what the learner noticed.
const learner = 'Le ami est vraiment à côté du projet';
const corrected = "L'ami est vraiment à côté de la plaque sur le projet.";

check(
  'diff cobre elisão e contração',
  diffCorrectionSegments(learner, corrected).segments,
  [
    { learner: 'Le ami', correct: "L'ami" },
    { learner: 'du', correct: 'de la plaque sur le' },
  ],
);

// Gemini mentioned only the article: the contraction must be appended.
const partial = buildTranslationCorrections({
  learnerAnswer: learner,
  correctedSentence: corrected,
  feedback: "O artigo 'Le' deve ser 'L'' antes de vogal.",
  modelCorrections: [{ learner: 'Le ami', correct: "L'ami", why: 'elisão antes de vogal' }],
});
check(
  'lacuna do modelo é preenchida pelo diff',
  partial,
  [
    { learner: 'Le ami', correct: "L'ami", why: 'elisão antes de vogal' },
    { learner: 'du', correct: 'de la plaque sur le' },
  ],
);

// When Gemini already covers a difference with a wider span, no duplicate row.
const full = buildTranslationCorrections({
  learnerAnswer: learner,
  correctedSentence: corrected,
  feedback: 'Faltou a expressão idiomática.',
  modelCorrections: [
    { learner: 'Le ami', correct: "L'ami", why: 'elisão antes de vogal' },
    { learner: 'du projet', correct: 'sur le projet', why: "'à côté du projet' é 'ao lado do projeto'" },
  ],
});
check(
  'nenhuma duplicata quando o modelo já cobre',
  full.map((c) => c.learner),
  ['Le ami', 'du projet'],
);

// Invented quotes are dropped: "de la plaque" is not in the learner's answer.
const invented = buildTranslationCorrections({
  learnerAnswer: learner,
  correctedSentence: corrected,
  feedback: '',
  modelCorrections: [{ learner: 'à côté de la plaque', correct: 'à côté de la plaque', why: 'x' }],
});
check(
  'citação inventada é descartada e o diff assume',
  invented.map((c) => `${c.learner}→${c.correct}`),
  ["Le ami→L'ami", 'du→de la plaque sur le'],
);

// A wholesale rewrite is not a list of fixes.
check(
  'reescrita completa não gera lista',
  buildTranslationCorrections({
    learnerAnswer: 'Bonjour comment ça va',
    correctedSentence: "L'ami est vraiment à côté de la plaque.",
    feedback: 'Sua resposta não traduz a frase.',
    modelCorrections: [],
  }),
  [],
);

// Accents count as a difference; a missing final period does not.
check(
  'acento é diferença, pontuação não',
  diffCorrectionSegments('Je suis fatigue', 'Je suis fatigué.').segments,
  [{ learner: 'fatigue', correct: 'fatigué' }],
);

console.log(failures === 0 ? 'OK — todos os casos passaram' : `${failures} falha(s)`);
process.exit(failures === 0 ? 0 : 1);
