/**
 * Smoke test for production exercise enforcement.
 * Run: npx tsx test-practice-production.ts
 * Requires GEMINI_API_KEY in environment.
 */
import { generatePracticeExercises } from './app/actions/generatePracticeExercises';
import { sessionHasProduction } from './lib/practiceExercises/productionTypes';
import { ENFORCE_PRODUCTION_PER_LESSON } from './lib/practiceExercises/constants';

const TAGS = ['GRAM', 'VOC', 'DIAL'] as const;
const LEVELS = ['A1', 'B1'] as const;

async function main() {
  console.log(`ENFORCE_PRODUCTION_PER_LESSON=${ENFORCE_PRODUCTION_PER_LESSON}\n`);

  let passed = 0;
  let failed = 0;

  for (const tag of TAGS) {
    for (const level of LEVELS) {
      const vocabCount = level === 'A1' ? 10 : 50;
      console.log(`Testing tag=${tag} level=${level} vocab=${vocabCount}...`);

      const exercises = await generatePracticeExercises({
        dialogue: 'Marie: Bonjour!\nPaul: Salut, comment ça va?',
        newVocabulary: ['bonjour', 'salut'],
        verbWord: '',
        grammarFocus: 'Greetings',
        theme: 'Tema teste',
        uiTitle: 'Test scenario',
        tag,
        language: 'fr',
        level,
        knownVocabulary: Array.from({ length: vocabCount }, (_, i) => `word${i}`),
        previousTopics: [],
        grammarBridge: null,
      });

      if (!exercises || exercises.length === 0) {
        console.error('  FAIL: no exercises returned');
        failed++;
        continue;
      }

      const hasProd = sessionHasProduction(exercises);
      const types = exercises.map((e) => e.type).join(', ');
      console.log(`  types: [${types}] production=${hasProd}`);

      if (ENFORCE_PRODUCTION_PER_LESSON && !hasProd) {
        console.error('  FAIL: missing production exercise');
        failed++;
      } else {
        console.log('  OK');
        passed++;
      }
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
