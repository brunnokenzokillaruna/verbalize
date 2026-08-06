/**
 * Verifies PT-BR purity no longer false-positives on shared cognates,
 * and still flags real target-language leaks like "clocher".
 *
 * Run: node --experimental-strip-types scripts/test-checkpoint-ptbr-cognates.ts
 */
import {
  extractDialogueContentWords,
  findLeakedTargetWord,
  isListeningComprehensionPtBrPure,
} from '../lib/practiceExercises/validatePtBrText';

const dialogue = `Marie: Qu'est-ce que tu as fait ce week-end?
Vous: J'ai vu un film avec mes amis samedi.
Marie: C'etait bien? Tu as aime le cinema?
Vous: Oui, mais apres on est alles au restaurant.`;

let failed = 0;

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

assert(
  'cognate cinema allowed in PT question',
  isListeningComprehensionPtBrPure({
    questionPt: 'O que eles fizeram depois do cinema?',
    options: ['Foram ao restaurante', 'Foram dormir', 'Ficaram no parque'],
    explanationPt: 'Depois do filme, eles foram ao restaurante.',
    lessonVocabulary: [],
    dialogueAudio: dialogue,
  }),
);

assert(
  'weekend cognate allowed',
  isListeningComprehensionPtBrPure({
    questionPt: 'Eles falaram do weekend?',
    options: ['Sim, do week-end', 'Nao', 'So do trabalho'],
    explanationPt: 'Sim, perguntaram sobre o weekend.',
    lessonVocabulary: [],
    dialogueAudio: dialogue,
  }),
);

assert(
  'real French leak still blocked',
  !isListeningComprehensionPtBrPure({
    questionPt: 'Onde fica o clocher?',
    options: ['Perto do clocher', 'Na praia', 'No mercado'],
    explanationPt: 'O clocher fica no centro.',
    lessonVocabulary: ['clocher'],
    dialogueAudio: 'Guide: Voici le clocher du village.',
  }),
);

assert(
  'French elision inside single quotes does not false-positive',
  isListeningComprehensionPtBrPure({
    questionPt: "O que a frase 'C'était le meilleur film' indica?",
    options: [
      'O uso do comparativo de superioridade.',
      'O uso do superlativo relativo.',
      'Uma instrução no modo imperativo.',
    ],
    explanationPt:
      "A estrutura 'le meilleur' (o melhor) é a forma superlativa de 'bon', indicando o grau máximo.",
    lessonVocabulary: [],
    dialogueAudio: `Julie: C'était le meilleur film que j'ai vu cette année !
Marc: Pendant le film, j'ai mangé tout mon pop-corn.`,
  }),
);

assert(
  'French mais vs Portuguese mais does not false-positive',
  isListeningComprehensionPtBrPure({
    questionPt: 'Como Marc descreve o seu final de semana?',
    options: [
      'Como um final de semana comum.',
      'Como o melhor final de semana do mês.',
      'Como um final de semana muito cansativo.',
    ],
    explanationPt:
      "Marc diz 'c'était le meilleur week-end du mois', utilizando o superlativo para expressar que foi o mais positivo.",
    lessonVocabulary: [],
    dialogueAudio: `Julie: Tu as passé un bon week-end ?
Marc: Oui, c'était le meilleur week-end du mois !
Marc: Si, j'ai travaillé, mais j'ai fini très vite.`,
  }),
);

const leak = findLeakedTargetWord(
  'Onde fica o clocher da igreja?',
  extractDialogueContentWords('Guide: Voici le clocher du village.'),
);
assert('clocher detected as leak', leak === 'clocher', `got ${leak}`);

assert(
  'arnaque leak in PT translation prompt flagged',
  findLeakedTargetWord(
    'Eu sei que o preço é uma arnaque total, mas vou lá.',
    ['arnaque'],
  ) === 'arnaque',
);

assert(
  'pure PT prompt with golpe allowed',
  findLeakedTargetWord(
    'Eu sei que o preço é um golpe total, mas vou lá.',
    ['arnaque'],
  ) === null,
);

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nAll assertions passed');
