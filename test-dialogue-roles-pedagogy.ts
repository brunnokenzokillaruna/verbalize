/**
 * Smoke tests for dual-role dialogue piggyback (no Gemini call).
 * Run: npx tsx test-dialogue-roles-pedagogy.ts
 */
import {
  buildDualRoleHookGuidance,
  buildDualRolePracticeGuidance,
  buildMissionRoleFlipCopy,
  invertMissionSpeakableLines,
  isDualRoleScene,
  resolveDialogueRolePair,
  roleLabelForSide,
  sanitizeDualRoleFields,
  shouldOfferMissionRoleFlip,
} from './lib/pedagogy/dialogueRoles';
import { buildTagGuidance } from './lib/practiceExercises/tagGuidance';
import { buildPracticeExercisePrompt } from './lib/practiceExercises/promptBuilder';
import type { ExerciseTypeId } from './lib/practiceExercises/constants';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

const cafe = resolveDialogueRolePair(
  'Tema 7: Pedidos, gentilezas e novos contatos',
  'Contando Suas Origens',
  '5 Frases para Pedidos em Cafés',
);
assert(cafe.sceneKey === 'cafe', 'fr-a1-092 café grammarFocus resolves cafe pair');
assert(cafe.visitorRolePt === 'cliente', 'café visitor is cliente');
assert(cafe.professionalRolePt.includes('garçom'), 'café professional is garçom/atendente');
assert(isDualRoleScene('5 Frases para Pedidos em Cafés'), 'café scene is dual-role eligible');

const hotel = resolveDialogueRolePair('Hotel em Lyon', 'Check-in');
assert(hotel.sceneKey === 'hotel', 'hotel theme resolves hotel pair');
assert(roleLabelForSide(hotel, 'professional') === 'recepcionista', 'hotel professional label');

const generic = resolveDialogueRolePair('Gramática abstrata sem cenário');
assert(generic.sceneKey === 'generic', 'non-situational text falls back to generic');
assert(!isDualRoleScene('Gramática abstrata sem cenário'), 'abstract grammar is not dual-role');

const dialGuidance = buildDualRolePracticeGuidance({
  tag: 'DIAL',
  theme: 'Tema 7: Pedidos, gentilezas e novos contatos',
  uiTitle: 'Contando Suas Origens',
  grammarFocus: '5 Frases para Pedidos em Cafés',
  dialogue: 'Serveur: Vous désirez ?\nVous: Un café, s\'il vous plaît.',
});
assert(dialGuidance.includes('PAPÉIS DUPLA FACE'), 'DIAL café injects dual-role guidance');
assert(dialGuidance.includes('roleSide "visitor"'), 'guidance requires visitor side');
assert(dialGuidance.includes('roleSide "professional"'), 'guidance requires professional side');
assert(dialGuidance.includes('garçom'), 'guidance names professional role');

const gramSkip = buildDualRolePracticeGuidance({
  tag: 'GRAM',
  grammarFocus: '5 Frases para Pedidos em Cafés',
});
assert(gramSkip === '', 'GRAM tag skips dual-role block');

const genericSkip = buildDualRolePracticeGuidance({
  tag: 'DIAL',
  theme: 'Pronomes relativos avançados',
  grammarFocus: 'Qui vs Que',
});
assert(genericSkip === '', 'non-situational DIAL skips dual-role block');

const dialPool = new Set<ExerciseTypeId>([
  'listen-and-respond',
  'free-roleplay',
  'social-roleplay',
  'micro-message',
  'speak-repeat',
  'scrambled-conversation',
]);
const tagText = buildTagGuidance('DIAL', dialPool, 'A1', 40);
assert(tagText.includes('roleSide "visitor"'), 'DIAL tagGuidance requires visitor listen-and-respond');
assert(
  tagText.includes('roleSide "professional"'),
  'DIAL tagGuidance requires professional free-roleplay',
);
assert(
  tagText.includes('free-roleplay'),
  'DIAL tagGuidance allows free-roleplay beside listen-and-respond for inverted roles',
);

const { prompt } = buildPracticeExercisePrompt({
  dialogue: 'Serveur: Bonjour ! Qu\'est-ce que vous prenez ?\nVous: Un café allongé.',
  newVocabulary: ['café', 'prendre', 's\'il vous plaît'],
  verbWord: '',
  grammarFocus: '5 Frases para Pedidos em Cafés',
  theme: 'Tema 7: Pedidos, gentilezas e novos contatos',
  uiTitle: 'Contando Suas Origens',
  tag: 'DIAL',
  language: 'fr',
  level: 'A1',
  knownVocabulary: Array.from({ length: 40 }, (_, i) => `mot${i}`),
  previousTopics: [],
});
assert(prompt.includes('PAPÉIS DUPLA FACE'), 'practice prompt for fr-a1-092 includes dual-role block');
assert(prompt.includes('"roleSide": "professional"'), 'prompt example shows professional free-roleplay');
assert(
  prompt.includes('opposite roleSide') || prompt.includes('UNLESS they use opposite roleSide'),
  'prompt relaxes pairing ban for inverted roles',
);

const hookGuidance = buildDualRoleHookGuidance({
  tag: 'MISS',
  theme: 'Tema 4: O Primeiro Café da Manhã',
  uiTitle: 'A Vitrine da Padaria',
  grammarFocus: 'Prática: Minha vida em casa e no trabalho',
});
assert(hookGuidance.includes('DUAL-ROLE CAST'), 'MISS padaria hook gets dual-role cast guidance');

assert(
  shouldOfferMissionRoleFlip('Tema 4: O Primeiro Café da Manhã', 'A Vitrine da Padaria'),
  'MISS padaria offers mission role flip',
);
const flip = buildMissionRoleFlipCopy('padaria', 'A Vitrine da Padaria');
assert(!!flip && flip.sceneKey === 'cafe', 'flip copy resolves café for padaria');
assert(!!flip && flip.startCta.includes('garçom'), 'flip CTA names professional role');

const inverted = invertMissionSpeakableLines([
  { isUserLine: true, text: 'a' },
  { isUserLine: false, text: 'b' },
]);
assert(inverted[0].isUserLine === false && inverted[1].isUserLine === true, 'invert swaps speakable lines');

const sanitized = sanitizeDualRoleFields({
  context: 'x',
  roleSide: 'PROFESSIONAL',
  learnerRolePt: '  garçom  ',
  interlocutorRolePt: '',
  junk: 1,
});
assert(sanitized.roleSide === 'professional', 'sanitize normalizes roleSide');
assert(sanitized.learnerRolePt === 'garçom', 'sanitize trims learnerRolePt');
assert(!('interlocutorRolePt' in sanitized), 'sanitize drops empty interlocutorRolePt');

console.log('\nAll dual-role pedagogy checks passed.');
