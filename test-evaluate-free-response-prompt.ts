/**
 * Smoke tests for free-response evaluation prompts.
 * Run: npx tsx test-evaluate-free-response-prompt.ts
 */
import {
  buildEvaluationPrompt,
  FREE_RESPONSE_SYSTEM_PROMPT,
} from './lib/evaluateFreeResponse/prompt';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

assert(
  FREE_RESPONSE_SYSTEM_PROMPT.includes('no hidden checklist'),
  'system prompt forbids a hidden checklist',
);
assert(
  FREE_RESPONSE_SYSTEM_PROMPT.includes('cleaning the hat'),
  'system prompt uses the hat/mud example of an invented extra beat',
);

const openPrompt = buildEvaluationPrompt({
  language: 'fr',
  previousContext: ['Oh non ! Regarde, ton chapeau est tombé dans la boue !'],
  intent: 'O chapéu caiu na lama.',
  promptLine: 'Oh non ! Regarde, ton chapeau est tombé dans la boue !',
  evaluationCriteria: 'Mencionar limpar o chapéu.',
  acceptableThemes: ['lamentar', 'limpar o chapéu'],
  openEnded: true,
  transcript: "C'est dommage!",
});

assert(openPrompt.includes('OPEN-ENDED'), 'open-ended scoring mode is set for free roleplay');
assert(
  openPrompt.includes('NOT a mandatory checklist'),
  'criteria are labeled as optional directions',
);
assert(openPrompt.includes('ANY ONE'), 'themes are alternatives, not a full checklist');

const taskPrompt = buildEvaluationPrompt({
  language: 'fr',
  previousContext: [],
  intent: 'Peça um café.',
  promptLine: "Qu'est-ce que je vous sers ?",
  transcript: 'Un café, s\'il vous plaît.',
});
assert(taskPrompt.includes('Scoring mode: TASK'), 'task mode remains the default');

console.log('\nAll evaluate-free-response prompt tests passed.');
