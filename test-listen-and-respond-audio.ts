/**
 * Run: npx tsx --tsconfig tsconfig.json test-listen-and-respond-audio.ts
 */
import {
  isListenAudioCopiedFromLesson,
  normalizeListenAndRespondAudio,
  sanitizeListenAndRespondFields,
} from './lib/listenAndRespondAudio';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

const twoSpeaker = normalizeListenAndRespondAudio(
  `Serveur: Bonjour !\nClient: Bonjour.\nServeur: Qu'est-ce que je vous sers ?`,
  "Qu'est-ce que je vous sers ?",
);
assert(
  twoSpeaker ===
    `Serveur: Bonjour !\nServeur: Qu'est-ce que je vous sers ?`,
  'keeps only interlocutor lines and ends with promptLine',
);
assert(!/Client:/i.test(twoSpeaker), 'strips learner/client lines');

const lesson = `Marie: Tu as passé un bon week-end ?\nLucas: Oui, j'ai visité le musée.`;
const copied = sanitizeListenAndRespondFields({
  dialogueAudio: lesson,
  promptLine: 'Tu as passé un bon week-end ?',
  lessonDialogue: lesson,
});
assert(
  copied.dialogueAudio === 'Marie: Tu as passé un bon week-end ?',
  'when copied from lesson, collapses to interlocutor promptLine only',
);
assert(
  isListenAudioCopiedFromLesson(lesson, lesson) === true,
  'detects copy from lesson dialogue',
);

const recruiter = normalizeListenAndRespondAudio(
  `Recruteur: Merci d'être venu.\nRecruteur: Que pouvez-vous nous apporter ?`,
  'Que pouvez-vous nous apporter ?',
);
assert(
  recruiter.split('\n').every((l) => l.startsWith('Recruteur:')),
  'single recruiter speaker preserved',
);

console.log('\nAll listen-and-respond audio tests passed.');
