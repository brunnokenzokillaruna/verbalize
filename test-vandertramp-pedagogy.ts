/**
 * Smoke tests for Vandertramp piggyback pedagogy (no Gemini call).
 * Run: npx tsx test-vandertramp-pedagogy.ts
 */
import { buildGrammarSteps } from './lib/grammarBridge/buildGrammarSteps';
import { buildGrammarFocusGuidance, resolveConjugationPreviewTense } from './lib/grammarBridge/usagePedagogy';
import { buildGrammarFocusExerciseGuidance } from './lib/practiceExercises/grammarFocusExerciseGuidance';
import {
  enrichBridgeWithVandertramp,
  isVandertrampFocus,
  isVandertrampVerb,
  pickLessonSpotlightVerbs,
  VANDERTRAMP_ACRONYM,
  VANDERTRAMP_ANALOGY,
} from './lib/pedagogy/vandertramp';
import type { GrammarBridgeResult } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

const FOCUS = 'O Auxiliar Être no Passado (Vandertramp)';

assert(isVandertrampFocus(FOCUS), 'detects Vandertramp curriculum focus');
assert(isVandertrampFocus('Auxiliar Être — Passado'), 'detects auxiliaire être focus');
assert(!isVandertrampFocus('O Auxiliar Avoir no Passado'), 'does not flag avoir lesson');
assert(isVandertrampVerb('Aller'), 'aller is Vandertramp');
assert(isVandertrampVerb('naître'), 'naître is Vandertramp');
assert(!isVandertrampVerb('manger'), 'manger is not Vandertramp');

const spotlight = pickLessonSpotlightVerbs(['manger', 'arriver', 'partir', 'café'], 3);
assert(
  spotlight.map((v) => v.infinitive).join(',') === 'arriver,partir,aller',
  `spotlight prefers dialogue verbs then fallback (got ${spotlight.map((v) => v.infinitive).join(',')})`,
);

assert(
  resolveConjugationPreviewTense(FOCUS, 'fr') === 'passé composé',
  'conjugation preview tense is passé composé for Vandertramp',
);

const guidance = buildGrammarFocusGuidance(FOCUS, 'fr');
assert(guidance.includes(VANDERTRAMP_ACRONYM), 'Grammar Bridge prompt cites mnemonic');
assert(guidance.includes('analogy'), 'Grammar Bridge prompt requires analogy');

const exerciseGuidance = buildGrammarFocusExerciseGuidance(FOCUS, 'fr');
assert(exerciseGuidance.includes('AVOIR vs ÊTRE'), 'Practice prompt requires auxiliary choice');
assert(exerciseGuidance.includes(VANDERTRAMP_ACRONYM), 'Practice prompt cites mnemonic');

const bareBridge: GrammarBridgeResult = {
  insight: 'No passado, alguns verbos mudam de auxiliar.',
  bridge: {
    portuguese: 'Eu fui ao mercado.',
    target: 'Je suis allé au marché.',
    difference: 'Movimento usa être.',
  },
};

const enriched = enrichBridgeWithVandertramp(bareBridge, FOCUS, 'fr', ['aller', 'venir']);
assert(enriched.analogy === VANDERTRAMP_ANALOGY, 'enrichment injects analogy');
assert(
  (enriched.survivalTip ?? '').toLowerCase().includes('vandertramp'),
  'enrichment injects survival tip',
);
assert(
  typeof enriched.brazilianTrap === 'object' &&
    (enriched.brazilianTrap?.explanation ?? '').toLowerCase().includes('vandertramp'),
  'enrichment injects trap mnemonic',
);

const steps = buildGrammarSteps(bareBridge, 'fr', 'VERB', FOCUS, ['aller', 'venir']);
const regra = steps.find((s) => s.type === 'regra');
const cuidado = steps.find((s) => s.type === 'cuidado');
assert(Boolean(regra), 'builds regra step');
assert(
  regra?.type === 'regra' && (regra.data.analogy ?? '').includes('VANDERTRAMP'),
  'regra step shows mnemonic analogy',
);
assert(Boolean(cuidado), 'builds cuidado step with trap');
assert(
  cuidado?.type === 'cuidado' &&
    (cuidado.data.survivalTip ?? '').toLowerCase().includes('vandertramp'),
  'cuidado step carries survival tip for just-in-time hint',
);

const untouched = enrichBridgeWithVandertramp(bareBridge, 'O Auxiliar Avoir no Passado', 'fr');
assert(untouched.analogy === bareBridge.analogy, 'non-Vandertramp focus is not enriched');

console.log('\nAll Vandertramp pedagogy checks passed.');
