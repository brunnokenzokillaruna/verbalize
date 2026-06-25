/**
 * Unit smoke test for adaptive tier upgrades on mastered vocabulary.
 * Run: npx tsx test-adaptive-tier.ts
 */
import { applyAdaptiveTier } from './lib/practiceExercises/adaptiveTier';
import type { Exercise } from './types';

const mastered = ['bonjour', 'café', 'merci'];

const contextChoice: Exercise = {
  type: 'context-choice',
  data: {
    sentence: '___ , comment allez-vous ?',
    blankWord: 'Bonjour',
    translation: 'Olá, como vai?',
    options: ['Bonjour', 'Merci', 'Au revoir', 'Salut'],
  },
};

const sentenceBuilder: Exercise = {
  type: 'sentence-builder',
  data: {
    words: ['Bonjour', 'et', 'merci'],
    correctOrder: ['Bonjour', 'et', 'merci'],
    translation: 'Olá e obrigado.',
    explanation: 'Cumprimento simples.',
  },
};

const untouched: Exercise = {
  type: 'context-choice',
  data: {
    sentence: 'Je ___ un thé.',
    blankWord: 'prends',
    translation: 'Eu tomo um chá.',
    options: ['prends', 'mange', 'bois', 'fais'],
  },
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

const result = applyAdaptiveTier([contextChoice, sentenceBuilder, untouched], mastered);

assert(result[0].type === 'fill-gap-production', 'mastered blank → fill-gap-production');
assert(result[1].type === 'reverse-translation', 'mastered sentence-builder → reverse-translation');
assert(result[2].type === 'context-choice', 'unmastered word stays context-choice');

console.log('\nAll applyAdaptiveTier tests passed.');
