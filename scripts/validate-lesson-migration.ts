/**
 * Validates curriculum migration mappings (v1→v2 and v2→v3 EN).
 * Run: npx tsx scripts/validate-lesson-migration.ts
 */
import { FRENCH_LESSONS } from '../lib/curriculum/french';
import { ENGLISH_LESSONS } from '../lib/curriculum/english';
import { getNextLessonId } from '../lib/curriculum';
import {
  CURRICULUM_VERSION,
  migrateContentLessonId,
  migrateFrontierLessonId,
  V2_EN_INSERTION_ANCHORS,
} from '../lib/curriculum/lessonIdMigration';

const GAP_V2_MARKERS = [
  'Vogais Fechadas: EU e U',
  'O som vibrante do R',
  'Números grandes: cem',
  'Bilhetes de transporte e troca de linha',
  'Ligação fonética: quando é obrigatória',
  '5 frases para consulta',
  'Vocabulário de banco, conta',
  "Gerúndio e 'estar fazendo'",
  'Intonação em Perguntas',
  '5 frases para telefone',
  'No restaurante: reserva',
  'Sistema de saúde francês',
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
    label: `French stable lessons keep the v1 base plus later inserts (got ${stableLessons.length})`,
    pass: stableLessons.length === 440,
  });

  // Shift at this index is 0, so the stored id must stay the same lesson
  // even after 9xx lessons were inserted earlier in the array.
  const oldNext = legacyId('fr', 119, 'A2');
  const migrated = migrateFrontierLessonId('fr', oldNext, 1);
  checks.push({
    label: 'FR v1→v2 frontier fr-a2-120 stays on that id after later inserts',
    pass: migrated === 'fr-a2-120',
  });

  checks.push({
    label: 'FR current id fr-b1-220 is unchanged for a v3 profile',
    pass: migrateFrontierLessonId('fr', 'fr-b1-220', 3) === 'fr-b1-220',
  });

  checks.push({
    label: 'Futuro próximo sits immediately after aller',
    pass: getNextLessonId('fr', 'fr-a1-021') === 'fr-a1-904',
  });

  checks.push({
    label: 'B1 futuro próximo sits after the last B1 lesson and before B2',
    pass:
      getNextLessonId('fr', 'fr-b1-309') === 'fr-b1-919' &&
      getNextLessonId('fr', 'fr-b1-919') === 'fr-b2-310',
  });

  const reviewCount = FRENCH_LESSONS.filter((lesson) => lesson.tag === 'REVIEW').length;
  checks.push({
    label: `French checkpoints stay at 43 (got ${reviewCount})`,
    pass: reviewCount === 43,
  });
}

// ── v2→v3 EN ─────────────────────────────────────────────────────────────────
{
  checks.push({
    label: `English catalog has 444 lessons (got ${ENGLISH_LESSONS.length})`,
    pass: ENGLISH_LESSONS.length === 444,
  });

  checks.push({
    label: `French catalog has 450 lessons (got ${FRENCH_LESSONS.length})`,
    pass: FRENCH_LESSONS.length === 450,
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
