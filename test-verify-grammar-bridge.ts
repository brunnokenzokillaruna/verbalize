/**
 * Smoke tests for grammar-bridge accuracy gate (no Gemini call).
 * Run: npx tsx test-verify-grammar-bridge.ts
 */
import type { GrammarBridgeResult } from './types';
import {
  collectLocalBridgeIssues,
  extractBridgeClaims,
  formatIssuesForRegen,
  stripSecondaryIssues,
  salvageRejectedBridge,
} from './lib/grammarBridge/verifyGrammarBridge';
import { buildGrammarSteps } from './lib/grammarBridge/buildGrammarSteps';
import { matchChipInExample, segmentExample, chipLabel, colorizeExample } from './lib/grammarBridge/formulaSlots';
import { looksCutOff, limitToCompleteSentence, looksLikeBrokenPortuguese, mentionsVerb } from './lib/grammarBridge/textClamp';
import {
  filterUniqueSurvivalTip,
  shouldIncludeSynthesis,
  textOverlap,
} from './lib/grammarBridgeDedup';
import {
  applyPtBrLocalizationFixes,
  stripInventedPorSuaVez,
} from './lib/grammarBridge/ptBrLocalization';
import { normalizeGrammarBridgeResult } from './lib/schemas/grammarBridge';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

const goodBridge: GrammarBridgeResult = {
  insight: 'Em francês, il faut é regra geral; devoir é obrigação sua.',
  analogy: 'Pensa assim: il faut = cartaz na parede; devoir = sua tarefa.',
  explanation: [
    'Regra geral: Il faut + infinitivo.',
    'Obrigação pessoal: sujeito + devoir + infinitivo.',
  ],
  survivalTip: 'Regra geral? Il faut. Sua? Je dois.',
  structureFormulas: [
    {
      label: 'Necessidade geral',
      hint: 'Quando é regra pra todo mundo',
      formula: '[il faut] + [infinitivo]',
      example: { target: 'Il faut ranger.', portuguese: 'É preciso organizar.' },
    },
    {
      label: 'Obrigação pessoal',
      hint: 'Quando a obrigação é sua',
      formula: '[Sujeito] + [devoir] + [infinitivo]',
      example: { target: 'Je dois ranger.', portuguese: 'Eu preciso organizar.' },
    },
  ],
  bridge: {
    portuguese: 'A gente ^^tem que^^ organizar.',
    target: 'Il ^^faut^^ organiser.',
    difference: 'Francês usa il faut sem sujeito pessoal.',
  },
  patterns: [
    { label: 'Geral', target: 'Il faut partir.', portuguese: 'É preciso partir.' },
    { label: 'Pessoal', target: 'Je dois partir.', portuguese: 'Eu preciso partir.' },
  ],
  additionalExamples: [
    { target: 'Il faut attendre.', portuguese: 'É preciso esperar.' },
    { target: 'Tu dois étudier.', portuguese: 'Você precisa estudar.' },
  ],
  brazilianTrap: {
    wrong: 'Il dois organiser.',
    right: 'Il faut organiser.',
    wrongPortuguese: 'Ele deve organizar (tradução direta errada).',
    rightPortuguese: 'É preciso organizar.',
    explanation: 'Il dois mistura devoir com o sujeito errado.',
  },
  retentionCheck: {
    question: 'Como você diria obrigação pessoal "eu preciso partir"?',
    options: ['Il faut partir.', 'Je dois partir.'],
    correctIndex: 1,
  },
  dialogueExample: {
    target: 'Il faut organiser la fête.',
    portuguese: 'É preciso organizar a festa.',
  },
};

assert(
  collectLocalBridgeIssues(goodBridge, 'fr').length === 0,
  'good bridge passes local guards',
);

const claims = extractBridgeClaims(goodBridge, 'fr');
assert(claims.some((c) => c.id === 'bridge.target'), 'extracts bridge.target claim');
assert(claims.some((c) => c.id === 'brazilianTrap'), 'extracts brazilianTrap claim');
assert(claims.some((c) => c.id === 'retentionCheck'), 'extracts retentionCheck claim');
assert(
  claims.some((c) => c.claim.includes('PAIR') && c.claim.includes('PT-BR')),
  'claims require PT↔target fidelity',
);
assert(
  claims.filter((c) => c.severity === 'core').length >= 3,
  'has multiple core claims',
);

const trapSame: GrammarBridgeResult = {
  ...goodBridge,
  brazilianTrap: {
    wrong: 'Il faut organiser.',
    right: 'Il faut organiser.',
    explanation: 'mesmo',
  },
};
assert(
  collectLocalBridgeIssues(trapSame, 'fr').some((i) => i.field === 'brazilianTrap'),
  'rejects trap when wrong === right',
);

const mixedPt: GrammarBridgeResult = {
  ...goodBridge,
  bridge: {
    portuguese: 'Eu quero mais',
    target: 'Eu quero mais em francês com o en',
    difference: 'teste',
  },
};
assert(
  collectLocalBridgeIssues(mixedPt, 'fr').some((i) => i.field === 'bridge.target'),
  'rejects Portuguese mixed into bridge.target',
);

const badQuiz: GrammarBridgeResult = {
  ...goodBridge,
  retentionCheck: {
    question: 'Qual?',
    options: ['A', 'B'],
    correctIndex: 5,
  },
};
assert(
  collectLocalBridgeIssues(badQuiz, 'fr').some((i) => i.field === 'retentionCheck'),
  'rejects invalid correctIndex',
);

const secondaryOnly: GrammarBridgeResult = {
  ...goodBridge,
  patterns: [
    { label: 'Geral', target: 'No francês a gente usa il faut', portuguese: 'É preciso.' },
    { label: 'Pessoal', target: 'Je dois partir.', portuguese: 'Eu preciso partir.' },
  ],
};
const secondaryIssues = collectLocalBridgeIssues(secondaryOnly, 'fr');
assert(
  secondaryIssues.some((i) => i.field === 'patterns[0].target' && i.severity === 'secondary'),
  'flags bad pattern as secondary',
);
const stripped = stripSecondaryIssues(secondaryOnly, secondaryIssues);
assert(
  (stripped.patterns?.length ?? 0) === 1,
  'stripSecondaryIssues removes bad pattern only',
);

const regenText = formatIssuesForRegen([
  {
    field: 'bridge.target',
    severity: 'core',
    problem: 'ungrammatical',
    fixHint: 'Fix the French',
  },
]);
assert(regenText.includes('bridge.target') && regenText.includes('Fix the French'), 'formats regen feedback');

// Journey order: regra → formula → apply → cuidado → synthesis → quiz
const steps = buildGrammarSteps(goodBridge, 'fr', 'GRAM');
const types = steps.map((s) => s.type);
assert(types[0] === 'regra', 'first step is regra');
assert(types.includes('formula'), 'includes formula');
assert(types.includes('cuidado'), 'includes cuidado');
assert(types.indexOf('formula') < types.indexOf('cuidado'), 'formula before cuidado');
assert(
  types.indexOf('compare') < types.indexOf('cuidado') ||
    types.indexOf('pattern') < types.indexOf('cuidado') ||
    types.indexOf('dialogue') < types.indexOf('cuidado'),
  'apply examples before cuidado',
);
assert(types.includes('synthesis'), 'includes âncora/synthesis');
assert(types.indexOf('cuidado') < types.indexOf('synthesis'), 'cuidado before synthesis');
assert(types[types.length - 1] === 'quiz', 'quiz is last');

const synth = steps.find((s) => s.type === 'synthesis');
assert(synth?.type === 'synthesis', 'synthesis step exists');
if (synth?.type === 'synthesis') {
  assert(Boolean(synth.data.survivalTip), 'synthesis has survivalTip');
  assert(!synth.data.insight, 'synthesis does not repeat insight');
  assert(!synth.data.trap, 'synthesis does not repeat trap');
}

const regra = steps.find((s) => s.type === 'regra');
assert(regra?.type === 'regra' && Boolean(regra.data.analogy), 'regra carries analogy');

// Dedup: tip that restates insight should be dropped
const overlappingTip = filterUniqueSurvivalTip(goodBridge.insight, goodBridge);
assert(overlappingTip === undefined, 'drops survivalTip that overlaps insight');
assert(textOverlap('casa bola gato mesa livro', 'casa bola gato mesa carro') > 0.5, 'textOverlap detects heavy overlap');

const uniqueTip = filterUniqueSurvivalTip('Geral? Il faut. Pessoal? devoir.', goodBridge);
assert(uniqueTip !== undefined, 'keeps distinctive survivalTip');

assert(shouldIncludeSynthesis(goodBridge) === true, 'includes synthesis when tip is unique');

// PT fidelity: invented "por sua vez" on left-dislocation
assert(
  stripInventedPorSuaVez(
    'Ele, por sua vez, não quer vir.',
    'Lui, il ne veut pas venir.',
  ) === 'Ele não quer vir.',
  'strips invented por sua vez from Lui-dislocation',
);
assert(
  stripInventedPorSuaVez(
    'Por sua vez, ele não quer vir.',
    'Pour sa part, il ne veut pas venir.',
  ) === 'Por sua vez, ele não quer vir.',
  'keeps por sua vez when FR has pour sa part',
);

const badTranslationBridge: GrammarBridgeResult = {
  ...goodBridge,
  additionalExamples: [
    {
      target: 'Lui, il ne veut pas venir.',
      portuguese: 'Ele, por sua vez, não quer vir.',
    },
  ],
};
const fidelityFixed = applyPtBrLocalizationFixes(
  badTranslationBridge,
  'Vocabulário: Amener e Emmener',
  'fr',
);
assert(
  fidelityFixed.additionalExamples?.[0]?.portuguese === 'Ele não quer vir.',
  'localization strips invented por sua vez on display',
);

const normalizedCached = normalizeGrammarBridgeResult(badTranslationBridge, 'fr');
assert(
  normalizedCached?.additionalExamples?.[0]?.portuguese === 'Ele não quer vir.',
  'normalize fixes cached bridges without grammarFocus',
);

const transferSteps = buildGrammarSteps(badTranslationBridge, 'fr', 'VOC');
const transfer = transferSteps.find((s) => s.type === 'transfer');
assert(transfer?.type === 'transfer', 'builds transfer/generalize step');
if (transfer?.type === 'transfer') {
  assert(
    transfer.data.portuguese === 'Ele não quer vir.',
    'Generalize step shows faithful PT for Lui-dislocation',
  );
}

assert(
  segmentExample('[il faut] + [verbo no infinitivo]', 'Il faut ranger.')?.join('|') === 'Il faut|ranger.',
  'segments a bracketed literal plus a slot name',
);
assert(
  segmentExample('[Sujeito] + am / is / are + [número]', 'I am 25.')?.join('|') === 'I|am|25.',
  'segments subject, verb alternative, and number',
);
assert(
  segmentExample('[Sujeito] + [devoir conjugado]', 'Je dois ranger.') === null,
  'skips the builder when a literal chip is absent from the example',
);
assert(matchChipInExample('am / is / are', 'She is 30.') === 'is', 'matches a verb alternative in the example');
assert(matchChipInExample('[sujeito]', 'I am 25.') === null, 'a slot name does not highlight the example');

const verbWithBadTrap: GrammarBridgeResult = {
  insight: 'Prendre serve para tudo que entra no corpo.',
  brazilianTrap: {
    wrong: 'Je bois ce sirop.',
    right: 'Je prends ce sirop.',
    explanation: 'Remédio líquido também usa prendre.',
  },
  verbSpotlight: {
    infinitive: 'prendre',
    meaning: 'tomar / pegar',
    personality: 'O verbo de quando você toma ou pega algo.',
    conjugationPreview: [
      { pronoun: 'je', form: 'prends' },
      { pronoun: 'tu', form: 'prends' },
      { pronoun: 'il', form: 'prend' },
    ],
  },
};
const salvaged = salvageRejectedBridge(verbWithBadTrap, [
  {
    field: 'insight',
    severity: 'core',
    problem: 'prendre is not used for every drink',
  },
  {
    field: 'brazilianTrap',
    severity: 'core',
    problem: 'Je bois ce sirop is correct French',
  },
  {
    field: 'insight',
    severity: 'secondary',
    problem: 'insight may not cover all structureFormulas uses',
  },
]);
assert(salvaged !== null && !salvaged.insight && !salvaged.brazilianTrap, 'salvage drops the rejected trap and insight');
assert(
  salvaged?.verbSpotlight?.conjugationPreview?.length === 3,
  'salvage keeps the conjugation table',
);
const salvagedSteps = salvaged ? buildGrammarSteps(salvaged, 'fr', 'VERB') : [];
assert(
  salvagedSteps.some((step) => step.type === 'conjugation' || step.type === 'verb-intro'),
  'salvaged verb bridge still builds a grammar step',
);
assert(!salvagedSteps.some((step) => step.type === 'cuidado'), 'salvaged verb bridge has no error radar');

assert(chipLabel('[Suj]') === 'Sujeito', 'expands Suj to Sujeito');
assert(
  colorizeExample('[Suj] + [verbo em -re conjugado] + [complemento]', 'Je lis le journal le matin.')
    ?.map((chunk) => `${chunk.role}:${chunk.text}`)
    .join('|') === 'subject:Je|verb:lis|complement:le journal le matin.',
  'colors subject, verb, and complement in the example',
);
assert(
  looksCutOff("é só encaixar o motor no"),
  'flags a sentence cut before the end',
);
assert(
  limitToCompleteSentence('Primeira frase curta. Segunda frase que passa do limite de palavras de propósito.', 4) ===
    'Primeira frase curta.',
  'keeps a finished sentence instead of slicing the next one',
);
assert(looksLikeBrokenPortuguese('Eu ler o livro.') === true, 'flags infinitive Portuguese as a fake thought');
assert(looksLikeBrokenPortuguese('Eu leio o livro.') === false, 'keeps a conjugated Portuguese thought');
assert(mentionsVerb('O presente serve para hábitos.', 'lire') === false, 'generic insight does not name lire');
assert(mentionsVerb('Com lire, o eu vira je lis.', 'lire') === true, 'verb insight names lire');

console.log('\nAll verify-grammar-bridge local tests passed.');
