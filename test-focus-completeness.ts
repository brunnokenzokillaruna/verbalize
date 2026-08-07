/**
 * Smoke tests for multi-term grammarFocus completeness.
 * Run: npx tsx test-focus-completeness.ts
 */
import type { GrammarBridgeResult } from './types';
import {
  buildFocusCompletenessPromptBlock,
  extractRequiredFocusTerms,
  findMissingFocusTerms,
  termAppearsInText,
} from './lib/grammarBridge/focusCompleteness';
import { collectLocalBridgeIssues } from './lib/grammarBridge/verifyGrammarBridge';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

assert(
  extractRequiredFocusTerms('Vocabulário: Amener e Emmener').join('|') ===
    'Amener|Emmener',
  'parses Amener e Emmener',
);

assert(
  extractRequiredFocusTerms('Par de Confusão: Amener VS Emmener').join('|') ===
    'Amener|Emmener',
  'parses Amener VS Emmener',
);

assert(
  extractRequiredFocusTerms('Par de Confusão: Rentrer VS Revenir VS Retourner')
    .join('|') === 'Rentrer|Revenir|Retourner',
  'parses three-way VS pair',
);

assert(
  extractRequiredFocusTerms('Par de Confusão: Tard VS En retard').join('|') ===
    'Tard|En retard',
  'parses multi-word VS right side',
);

assert(
  extractRequiredFocusTerms('Vocabulário: Banque, Compte, RIB e Préfecture').length === 4,
  'parses comma + e vocabulary list',
);

assert(
  extractRequiredFocusTerms('Vocabulário: Roupas de Baixo e Acessórios').length === 0,
  'ignores PT theme phrases that are not target lemmas',
);

assert(
  extractRequiredFocusTerms('Pendant — duração').length === 0,
  'single-topic focus yields no required list',
);

assert(
  termAppearsInText('emmener', 'Je vais emmener mon cousin.'),
  'detects exact term',
);
assert(
  termAppearsInText('Amener', 'Eu uso amener pra trazer alguém.'),
  'detects case-insensitive',
);
assert(
  termAppearsInText('emmener', 'Je l’emmène au parc.'),
  'detects conjugated stem emmène',
);

const incomplete: GrammarBridgeResult = {
  insight: 'Amener serve pra trazer alguém até um lugar.',
  items: [
    {
      target: 'amener',
      portuguese: 'trazer alguém',
      logic: 'Movimento em direção a um lugar.',
    },
  ],
};

const missing = findMissingFocusTerms(incomplete, 'Vocabulário: Amener e Emmener');
assert(missing !== null && missing.missingTerms.includes('Emmener'), 'flags missing Emmener');

const complete: GrammarBridgeResult = {
  insight: 'Amener = trazer alguém; emmener = levar alguém embora com você.',
  items: [
    { target: 'amener', portuguese: 'trazer alguém', logic: 'Pra um lugar.' },
    { target: 'emmener', portuguese: 'levar alguém', logic: 'Levar embora com você.' },
  ],
};
assert(
  findMissingFocusTerms(complete, 'Vocabulário: Amener e Emmener') === null,
  'passes when both terms are taught',
);

const localIssues = collectLocalBridgeIssues(
  incomplete,
  'fr',
  'Vocabulário: Amener e Emmener',
);
assert(
  localIssues.some((i) => i.field === 'focusCompleteness' && i.severity === 'core'),
  'local gate marks incomplete focus as core issue',
);

const prompt = buildFocusCompletenessPromptBlock('Vocabulário: Amener e Emmener');
assert(
  prompt.includes('Amener') && prompt.includes('Emmener') && prompt.includes('COMPLETUDE'),
  'prompt block lists both terms',
);
assert(
  buildFocusCompletenessPromptBlock('Pendant') === '',
  'no prompt block for single-term focus',
);

console.log('\nAll focus-completeness tests passed.');
