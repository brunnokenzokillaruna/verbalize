/**
 * Unit smoke tests for local free-response evaluation.
 * Run: npx tsx test-evaluate-free-response-local.ts
 */
import { evaluateFreeResponseLocal } from './lib/evaluateFreeResponse/local';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

const baseParams = {
  language: 'fr' as const,
  previousContext: ['Marie: Bonjour!', 'Vous: Bonjour, comment allez-vous?'],
  intent: 'Peça um café com leite de forma educada.',
  expectedLine: 'Un café au lait, s\'il vous plaît.',
  promptLine: 'Qu\'est-ce que je vous sers?',
  evaluationCriteria: 'Pedir um café com leite, registro educado.',
  acceptableThemes: ['pedir café', 'café com leite', 'com educação'],
};

// Empty transcript
const empty = evaluateFreeResponseLocal({ ...baseParams, transcript: '' });
assert(empty.isCorrect === false, 'rejects empty transcript');
assert(empty.evaluator === 'local', 'marks local evaluator');

// Close match to expected line
const close = evaluateFreeResponseLocal({
  ...baseParams,
  transcript: 'Un cafe au lait sil vous plait',
});
assert(close.isCorrect === true, 'accepts close match to expected line');

// Thematic match without exact wording
const thematic = evaluateFreeResponseLocal({
  ...baseParams,
  transcript: 'Je voudrais un grand café avec du lait merci',
  expectedLine: undefined,
});
assert(thematic.isCorrect === true, 'accepts thematic spontaneous response');

// Too short / off-topic
const weak = evaluateFreeResponseLocal({
  ...baseParams,
  transcript: 'oui',
  expectedLine: undefined,
  acceptableThemes: [],
});
assert(weak.isCorrect === false, 'rejects weak off-topic response');

console.log('\nAll evaluateFreeResponseLocal tests passed.');
