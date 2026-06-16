/**
 * Inserts English-only v3 lessons (collocations, phrasal verbs, connected speech).
 * Run: npx tsx scripts/inject-english-v3-lessons.ts
 */
import fs from 'fs';
import path from 'path';
import type { LessonDefinition, SupportedLanguage } from '../types';
import { ENGLISH_LESSONS } from '../lib/curriculum/english';

type NewLessonSpec = Omit<LessonDefinition, 'id' | 'language'> & {
  insertAfterId: string;
};

const ENGLISH_V3: NewLessonSpec[] = [
  // ── A2 Travel phrasal verbs (after routine block starts) ────────────────────
  {
    insertAfterId: 'en-a2-114',
    level: 'A2',
    tag: 'VERB',
    uiTitle: 'Check-in e Bagagem',
    grammarFocus: 'Phrasal Verbs: Check in, Pick up, Drop off',
    theme: 'Tema 9: Minha Casa, Minha Rotina',
  },
  {
    insertAfterId: 'en-a2-114',
    level: 'A2',
    tag: 'VERB',
    uiTitle: 'Descobertas Urbanas',
    grammarFocus: 'Phrasal Verbs: Run out of, Find out, Figure out',
    theme: 'Tema 9: Minha Casa, Minha Rotina',
  },
  {
    insertAfterId: 'en-a2-114',
    level: 'A2',
    tag: 'DIAL',
    uiTitle: 'Frases de Viagem',
    grammarFocus: '5 Frases com Phrasal Verbs em Aeroportos e Hotéis',
    theme: 'Tema 9: Minha Casa, Minha Rotina',
  },
  // ── A2 Collocations (market theme) ──────────────────────────────────────────
  {
    insertAfterId: 'en-a2-140',
    level: 'A2',
    tag: 'VOC',
    uiTitle: 'Make ou Do?',
    grammarFocus: 'Collocations: Make vs Do (Make a mistake, Do homework)',
    theme: 'Tema 10: O Mercado e a Cozinha',
  },
  {
    insertAfterId: 'en-a2-140',
    level: 'A2',
    tag: 'VOC',
    uiTitle: 'Take ou Have?',
    grammarFocus: 'Collocations: Take vs Have (Take a shower, Have a break)',
    theme: 'Tema 10: O Mercado e a Cozinha',
  },
  {
    insertAfterId: 'en-a2-140',
    level: 'A2',
    tag: 'VOC',
    uiTitle: 'Adjetivos Fortes',
    grammarFocus: 'Collocations: Adjective + Noun (Heavy rain, Deep sleep)',
    theme: 'Tema 10: O Mercado e a Cozinha',
  },
  {
    insertAfterId: 'en-a2-140',
    level: 'A2',
    tag: 'MISS',
    uiTitle: 'Dia no Supermercado',
    grammarFocus: 'Prática: Collocations do Cotidiano em Lojas e Mercados',
    theme: 'Tema 10: O Mercado e a Cozinha',
  },
  // ── A2 British English + zero article ───────────────────────────────────────
  {
    insertAfterId: 'en-a2-203',
    level: 'A2',
    tag: 'VOC',
    uiTitle: 'Britânico vs Americano',
    grammarFocus: 'British vs American Vocabulary (Lift/Elevator, Queue/Line)',
    theme: 'Tema 15: Saúde e Farmácia',
  },
  {
    insertAfterId: 'en-a2-211',
    level: 'A2',
    tag: 'GRAM',
    uiTitle: 'Artigo Zero',
    grammarFocus: 'Zero Article: I like music vs I like the music',
    theme: 'Tema 15: Saúde e Farmácia',
  },
  // ── B1 Connected speech ─────────────────────────────────────────────────────
  {
    insertAfterId: 'en-b1-215',
    level: 'B1',
    tag: 'PRON',
    uiTitle: 'Linking Sounds',
    grammarFocus: 'Linking Sounds and Weak Forms (An apple, Cup of tea)',
    theme: 'Tema 16: Relembrando a Infância',
  },
  {
    insertAfterId: 'en-b1-215',
    level: 'B1',
    tag: 'GRAM',
    uiTitle: 'Gonna, Wanna, Gotta',
    grammarFocus: 'Informal Reductions: Gonna, Wanna, Gotta, Kinda',
    theme: 'Tema 16: Relembrando a Infância',
  },
  {
    insertAfterId: 'en-b1-215',
    level: 'B1',
    tag: 'DIAL',
    uiTitle: 'Small Talk Natural',
    grammarFocus: '5 Small Talk Fillers (I mean, You know, Sort of)',
    theme: 'Tema 16: Relembrando a Infância',
  },
  // ── B1 Professional ─────────────────────────────────────────────────────────
  {
    insertAfterId: 'en-b1-278',
    level: 'B1',
    tag: 'MISS',
    uiTitle: 'A Entrevista Decisiva',
    grammarFocus: 'Job Interview: Tell me about yourself, Strengths and Weaknesses',
    theme: 'Tema 19: Vida Profissional e Entrevistas',
  },
  {
    insertAfterId: 'en-b1-278',
    level: 'B1',
    tag: 'DIAL',
    uiTitle: 'E-mail Profissional',
    grammarFocus: '5 Phrases for Professional Email (I am writing to, Please find attached)',
    theme: 'Tema 19: Vida Profissional e Entrevistas',
  },
];

function renumberIds(lessons: LessonDefinition[], language: SupportedLanguage): LessonDefinition[] {
  return lessons.map((lesson, index) => {
    const num = index + 1;
    const level = lesson.level.toLowerCase();
    return {
      ...lesson,
      id: `${language}-${level}-${String(num).padStart(3, '0')}`,
      language,
    };
  });
}

function insertLessons(
  existing: LessonDefinition[],
  specs: NewLessonSpec[],
  language: SupportedLanguage,
): LessonDefinition[] {
  const result = [...existing];
  const byAnchor = new Map<string, NewLessonSpec[]>();

  for (const spec of specs) {
    const list = byAnchor.get(spec.insertAfterId) ?? [];
    list.push(spec);
    byAnchor.set(spec.insertAfterId, list);
  }

  const anchors = [...byAnchor.keys()].sort((a, b) => {
    const ia = result.findIndex((l) => l.id === a);
    const ib = result.findIndex((l) => l.id === b);
    return ib - ia;
  });

  for (const anchorId of anchors) {
    const anchorIdx = result.findIndex((l) => l.id === anchorId);
    if (anchorIdx === -1) throw new Error(`Anchor lesson not found: ${anchorId}`);

    const toInsert = (byAnchor.get(anchorId) ?? []).map(({ insertAfterId: _, ...rest }) => ({
      ...rest,
      language,
      id: 'pending',
    })) as LessonDefinition[];

    result.splice(anchorIdx + 1, 0, ...toInsert);
  }

  return renumberIds(result, language);
}

const root = path.join(process.cwd());
const englishOut = insertLessons(ENGLISH_LESSONS, ENGLISH_V3, 'en');

const content = `import type { LessonDefinition } from "@/types";

export const ENGLISH_LESSONS: LessonDefinition[] = ${JSON.stringify(englishOut, null, 2)};
`;

fs.writeFileSync(path.join(root, 'lib/curriculum/english.ts'), content, 'utf-8');

console.log(`English: ${ENGLISH_LESSONS.length} → ${englishOut.length} lessons (+${englishOut.length - ENGLISH_LESSONS.length})`);

const samples = englishOut.filter((l) =>
  l.grammarFocus.includes('Collocation') ||
  l.grammarFocus.includes('Phrasal Verbs: Check in') ||
  l.grammarFocus.includes('Linking Sounds') ||
  l.grammarFocus.includes('Job Interview'),
);

console.log('\nSample v3 lessons:');
samples.forEach((l) => console.log(`  ${l.id} [${l.tag}] ${l.uiTitle}`));

// Emit v2 anchor indices for migration module
const v2Anchors = [
  { afterId: 'en-a2-114', count: 3 },
  { afterId: 'en-a2-140', count: 4 },
  { afterId: 'en-a2-203', count: 1 },
  { afterId: 'en-a2-211', count: 1 },
  { afterId: 'en-b1-215', count: 3 },
  { afterId: 'en-b1-278', count: 2 },
];

console.log('\nV2 anchor indices (for migration):');
for (const { afterId, count } of v2Anchors) {
  const idx = ENGLISH_LESSONS.findIndex((l) => l.id === afterId);
  console.log(`  { afterIndex: ${idx}, count: ${count} }, // ${afterId}`);
}
