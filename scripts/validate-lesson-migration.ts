/**
 * Validates curriculum migration mappings (v1→v2 and v2→v3 EN).
 * Run: npx tsx scripts/validate-lesson-migration.ts
 */
import { FRENCH_LESSONS } from '../lib/curriculum/french';
import { ENGLISH_LESSONS } from '../lib/curriculum/english';
import {
  CURRICULUM_VERSION,
  migrateContentLessonId,
  migrateFrontierLessonId,
  V2_EN_INSERTION_ANCHORS,
} from '../lib/curriculum/lessonIdMigration';

const GAP_V2_MARKERS = [
  'Vogais Fechadas: EU e U',
  'O Som Vibrante do R',
  'Números Grandes: Cent',
  'Metro, RER e Navigo',
  'Liaison Avançada',
  '5 Frases para Consultas',
  'Vocabulário: Banque',
  'Gérondif e Être en train de',
  'Intonação em Perguntas',
  '5 Frases para Telefone',
  'Au Restaurant: Réservation',
  'Carte Vitale et Mutuelle',
];

const GAP_V3_EN_MARKERS = [
  'Phrasal Verbs: Check in, Pick up, Drop off',
  'Collocations: Make vs Do',
  'Linking Sounds and Weak Forms',
  'Job Interview: Tell me about yourself',
];

function isV2GapLesson(grammarFocus: string): boolean {
  return GAP_V2_MARKERS.some((marker) => grammarFocus.includes(marker));
}

function isV3EnGapLesson(grammarFocus: string): boolean {
  return GAP_V3_EN_MARKERS.some((marker) => grammarFocus.includes(marker));
}

function legacyId(language: 'fr' | 'en', index: number, level: string): string {
  return `${language}-${level.toLowerCase()}-${String(index + 1).padStart(3, '0')}`;
}

const checks: Array<{ label: string; pass: boolean }> = [];

// ── v1→v2 FR ───────────────────────────────────────────────────────────────────
{
  const stableLessons = FRENCH_LESSONS.filter((l) => !isV2GapLesson(l.grammarFocus));
  checks.push({
    label: `French stable v1 count is 418 (got ${stableLessons.length})`,
    pass: stableLessons.length === 418,
  });

  const oldNext = legacyId('fr', 119, 'A2');
  const migrated = migrateFrontierLessonId('fr', oldNext, 1);
  const target = FRENCH_LESSONS.find((l) => l.grammarFocus.includes('Vogais Fechadas'))?.id;
  checks.push({
    label: 'FR v1→v2 frontier after fr-a2-119 → EU/U gap',
    pass: migrated === target,
  });
}

// ── v2→v3 EN ─────────────────────────────────────────────────────────────────
{
  checks.push({
    label: `English catalog has 444 lessons (got ${ENGLISH_LESSONS.length})`,
    pass: ENGLISH_LESSONS.length === 444,
  });

  checks.push({
    label: `French catalog unchanged at 430 (got ${FRENCH_LESSONS.length})`,
    pass: FRENCH_LESSONS.length === 430,
  });

  checks.push({
    label: `Curriculum version is ${CURRICULUM_VERSION}`,
    pass: CURRICULUM_VERSION === 3,
  });

  // User finished en-a2-114 (v2 index 113), next was v2 en-a2-115 (index 114)
  const v2Next = legacyId('en', 114, 'A2');
  const v3Frontier = migrateFrontierLessonId('en', v2Next, 2);
  const checkInLesson = ENGLISH_LESSONS.find((l) =>
    l.grammarFocus.includes('Phrasal Verbs: Check in'),
  )?.id;
  checks.push({
    label: 'EN v2→v3 frontier after en-a2-114 → Check-in phrasal lesson',
    pass: v3Frontier === checkInLesson,
  });

  // v2 en-a2-115 content should map to renumbered lesson (shift +3 from insert at 113)
  const v2Content = legacyId('en', 114, 'A2');
  const v3Content = migrateContentLessonId('en', v2Content, 2);
  checks.push({
    label: 'EN v2→v3 content id resolves to valid lesson',
    pass: Boolean(v3Content && ENGLISH_LESSONS.some((l) => l.id === v3Content)),
  });

  // FR v2→v3 should not change valid ids
  checks.push({
    label: 'FR v2→v3 keeps fr-a1-001 unchanged',
    pass: migrateFrontierLessonId('fr', 'fr-a1-001', 2) === 'fr-a1-001',
  });

  // Anchor sum
  const totalV3Inserts = V2_EN_INSERTION_ANCHORS.reduce((sum, anchor) => sum + anchor.count, 0);
  checks.push({
    label: `V2 EN insertion anchors sum to 14 (got ${totalV3Inserts})`,
    pass: totalV3Inserts === 14,
  });
}

const failed = checks.filter((check) => !check.pass);
console.log(`Migration validation: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) {
  console.error('Failures:');
  failed.forEach((check) => console.error('  ✗', check.label));
  process.exit(1);
}
console.log('All migration checks passed.');
