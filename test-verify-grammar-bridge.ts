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
} from './lib/grammarBridge/verifyGrammarBridge';
import { buildGrammarSteps } from './lib/grammarBridge/buildGrammarSteps';
import {
  filterUniqueSurvivalTip,
  shouldIncludeSynthesis,
  textOverlap,
} from './lib/grammarBridgeDedup';

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

console.log('\nAll verify-grammar-bridge local tests passed.');
