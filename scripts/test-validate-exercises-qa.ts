/**
 * Run: npx tsx scripts/test-validate-exercises-qa.ts
 */
import fs from 'fs';
import path from 'path';
import type { Exercise } from '../types/index';
import type { ExerciseTypeId } from '../lib/practiceExercises/constants';
import {
  isA2PlusLevel,
  isAnchoredToLesson,
  isSolidFreeRoleplay,
  isSolidMicroMessage,
} from '../lib/practiceExercises/lessonContentAnchor';

function loadEnv(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(path.join(process.cwd(), '.env.local'));
loadEnv(path.join(process.cwd(), '.env'));

let failed = 0;
function assert(name: string, condition: boolean, detail?: string) {
  if (condition) console.log(`PASS ${name}`);
  else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  assert('A2 is A2+', isA2PlusLevel('A2'));
  assert('A1 is not A2+', !isA2PlusLevel('A1'));

  const anchored: Exercise = {
    type: 'context-choice',
    data: {
      sentence: 'Je veux un ___.',
      blankWord: 'café',
      options: ['café', 'livre', 'chien'],
      translation: 'Eu quero um café.',
    },
  };
  assert(
    'anchors when vocab overlaps',
    isAnchoredToLesson(anchored, ['café', 'vouloir'], 'Sophie: Je veux un café.'),
  );

  const unanchored: Exercise = {
    type: 'context-choice',
    data: {
      sentence: 'The ___ is blue.',
      blankWord: 'sky',
      options: ['sky', 'car', 'book'],
      translation: 'O céu é azul.',
    },
  };
  assert(
    'rejects unanchored drill',
    !isAnchoredToLesson(unanchored, ['café', 'vouloir'], 'Sophie: Je veux un café.'),
  );

  assert(
    'rejects trivial free-roleplay',
    !isSolidFreeRoleplay({
      evaluationCriteria: 'ok',
      exampleResponse: 'hi',
      acceptableThemes: ['x'],
    }),
  );

  assert(
    'accepts solid micro-message',
    isSolidMicroMessage({
      evaluationCriteria: 'Accept informal yes/no and a short plan.',
      exampleResponse: 'Oui, vers 20h !',
    }),
  );

  // Integration path (needs env for gemini module side-effects).
  if (process.env.GEMINI_API_KEY) {
    const { validateAndSanitizeExercises } = await import(
      '../lib/practiceExercises/validateGeneratedExercises'
    );
    const allowed = new Set<ExerciseTypeId>(['reverse-translation', 'free-roleplay', 'micro-message']);
    const withHint = await validateAndSanitizeExercises(
      [
        {
          type: 'reverse-translation',
          data: {
            portuguese_sentence: 'Eu quero um café.',
            target_translation: 'Je veux un café.',
            acceptable_variants: ["Je voudrais un café."],
            hint: 'Use vouloir',
          },
        },
      ] as Exercise[],
      allowed,
      'fr',
      {
        level: 'A2',
        lessonVocabulary: ['café', 'vouloir'],
        lessonDialogue: 'Sophie: Je veux un café.',
      },
    );
    assert('A2 strips reverse-translation hint', withHint.length === 1);
    assert(
      'hint deleted for A2+',
      (withHint[0]?.data as { hint?: string }).hint === undefined,
    );
  } else {
    console.log('SKIP integration validateAndSanitizeExercises (no GEMINI_API_KEY)');
  }

  if (failed > 0) {
    console.error(`${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log('validate-exercises QA OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
