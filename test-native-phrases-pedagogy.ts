/**
 * Smoke tests for native spoken-phrase piggyback (no Gemini call).
 * Run: npx tsx test-native-phrases-pedagogy.ts
 */
import {
  buildNativePhraseExerciseGuidance,
  buildNativePhraseHookGuidance,
  enrichHookWithNativeChunks,
  findNativePhrasesInText,
  isNativeFrenchPhrase,
  NATIVE_FRENCH_PHRASES,
  pickNativePhrasesForLesson,
} from './lib/pedagogy/nativePhrases';
import type { HookResult } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

assert(NATIVE_FRENCH_PHRASES.length >= 100, `bank has breadth (got ${NATIVE_FRENCH_PHRASES.length})`);
assert(
  NATIVE_FRENCH_PHRASES.some((p) => p.region === 'qc'),
  'bank includes Québec everyday phrases',
);
assert(
  NATIVE_FRENCH_PHRASES.some((p) => p.region === 'fr' && p.phrase === 'Grave !'),
  'bank includes France spoken Grave !',
);

assert(isNativeFrenchPhrase('Carrément !'), 'detects Carrément');
assert(isNativeFrenchPhrase('du coup...'), 'detects Du coup case-insensitive');
assert(isNativeFrenchPhrase('Pantoute !'), 'detects Québec Pantoute');
assert(isNativeFrenchPhrase('Faque...'), 'detects Québec Faque');
assert(!isNativeFrenchPhrase('bonjour'), 'does not flag plain bonjour');

const a1 = pickNativePhrasesForLesson({
  language: 'fr',
  level: 'A1',
  tag: 'DIAL',
  theme: 'Aeroporto',
  grammarFocus: '5 reações positivas',
  limit: 6,
});
assert(a1.length > 0, 'A1 DIAL picks phrases');
assert(
  a1.every((p) => p.minLevel === 'A1'),
  'A1 pool stays at A1 phrases only',
);

const a2 = pickNativePhrasesForLesson({
  language: 'fr',
  level: 'A2',
  tag: 'DIAL',
  theme: 'Final de semana',
  grammarFocus: 'Contando o que aconteceu',
  limit: 6,
});
assert(
  a2.some((p) => p.fn === 'reaction' || p.fn === 'agreement' || p.fn === 'connector'),
  'A2 includes spoken reaction/agreement/connector',
);
assert(
  a2.some((p) => p.region === 'qc'),
  'A2+ picks include at least one Québec line when available',
);

const pickA = pickNativePhrasesForLesson({
  language: 'fr',
  level: 'A2',
  tag: 'DIAL',
  theme: 'Café com amigo',
  grammarFocus: 'Combinar um horário',
  uiTitle: 'Marcando o café',
  limit: 6,
}).map((p) => p.phrase);

const pickB = pickNativePhrasesForLesson({
  language: 'fr',
  level: 'A2',
  tag: 'DIAL',
  theme: 'Problema no metrô',
  grammarFocus: 'Pedir ajuda',
  uiTitle: 'Atraso na linha',
  limit: 6,
}).map((p) => p.phrase);

assert(
  pickA.join('|') !== pickB.join('|'),
  'different lessons get different phrase sets',
);

const pickAAgain = pickNativePhrasesForLesson({
  language: 'fr',
  level: 'A2',
  tag: 'DIAL',
  theme: 'Café com amigo',
  grammarFocus: 'Combinar um horário',
  uiTitle: 'Marcando o café',
  limit: 6,
}).map((p) => p.phrase);

assert(
  pickA.join('|') === pickAAgain.join('|'),
  'same lesson keeps a stable phrase set',
);

assert(
  pickNativePhrasesForLesson({
    language: 'en',
    level: 'A2',
    tag: 'DIAL',
  }).length === 0,
  'English lessons do not get French bank',
);

assert(
  pickNativePhrasesForLesson({
    language: 'fr',
    level: 'A2',
    tag: 'GRAM',
  }).length === 0,
  'GRAM tags do not force native phrase bank',
);

const hookGuidance = buildNativePhraseHookGuidance({
  language: 'fr',
  level: 'A2',
  tag: 'MISS',
  theme: 'Missão no café',
  grammarFocus: 'Pedir a conta',
});
assert(hookGuidance.includes('FRASES NATIVAS'), 'hook guidance present for MISS');
assert(hookGuidance.includes('PROIBIDO repetir sempre'), 'guidance forbids defaulting to the same reactions');
assert(hookGuidance.includes('QC'), 'hook guidance labels Québec picks');

const exerciseGuidance = buildNativePhraseExerciseGuidance({
  language: 'fr',
  level: 'A2',
  tag: 'EXPR',
  grammarFocus: '5 reações nativas: Carrément, Ah bon ?',
});
assert(exerciseGuidance.includes('EXERCÍCIO DE FLUÊNCIA'), 'practice guidance present for EXPR');

const dialogue = `Sophie: On se voit à 18h ?
Lucas: Carrément !
Sophie: Du coup, devant le métro ?
Lucas: Ça marche !
Camille: Pantoute !`;

const hits = findNativePhrasesInText(dialogue);
assert(hits.some((h) => h.phrase.includes('Carrément')), 'finds Carrément in dialogue');
assert(hits.some((h) => h.phrase.includes('Ça marche')), 'finds Ça marche in dialogue');
assert(hits.some((h) => h.phrase.includes('Pantoute')), 'finds Pantoute in dialogue');

const bare: HookResult = {
  dialogue,
  newVocabulary: ['métro'],
  grammarFocus: 'combinar um encontro',
  newChunks: [],
};

const enriched = enrichHookWithNativeChunks(bare);
assert((enriched.newChunks?.length ?? 0) >= 1, 'enrichment adds SRS chunks');
assert(
  enriched.newChunks!.some((c) => c.entryType === 'expression'),
  'chunks marked as expression',
);

console.log(`\nBank size: ${NATIVE_FRENCH_PHRASES.length} phrases`);
console.log('All native-phrase pedagogy checks passed.');
