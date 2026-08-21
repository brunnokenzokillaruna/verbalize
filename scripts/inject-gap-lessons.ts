/**
 * Inserts gap-filling lessons into French & English curricula and renumbers IDs.
 * Run: npx tsx scripts/inject-gap-lessons.ts
 */
import fs from 'fs';
import path from 'path';
import type { LessonDefinition, SupportedLanguage } from '../types';

import { FRENCH_LESSONS } from '../lib/curriculum/french';
import { ENGLISH_LESSONS } from '../lib/curriculum/english';

type NewLessonSpec = Omit<LessonDefinition, 'id' | 'language'> & {
  insertAfterId: string;
};

const FRENCH_NEW: NewLessonSpec[] = [
  // ── A2 Phonetics (after routine block starts) ───────────────────────────────
  {
    insertAfterId: 'fr-a2-119',
    level: 'A2',
    tag: 'PRON',
    uiTitle: 'O Som do EU e do U',
    grammarFocus: 'Vogais Fechadas: EU e U (feu / tu)',
    theme: 'Tema 9: Minha Casa, Minha Rotina',
  },
  {
    insertAfterId: 'fr-a2-119',
    level: 'A2',
    tag: 'PRON',
    uiTitle: 'O R Francês',
    grammarFocus: 'O som vibrante do R e a ligação entre palavras',
    theme: 'Tema 9: Minha Casa, Minha Rotina',
  },
  // ── A2 Numbers ──────────────────────────────────────────────────────────────
  {
    insertAfterId: 'fr-a2-177',
    level: 'A2',
    tag: 'VOC',
    uiTitle: 'Preços Grandes',
    grammarFocus: 'Números grandes: cem, mil e milhão',
    theme: 'Tema 13: Clima, Natureza e Passeios',
  },
  // ── A2 Transport ────────────────────────────────────────────────────────────
  {
    insertAfterId: 'fr-a2-178',
    level: 'A2',
    tag: 'VOC',
    uiTitle: 'Comprando o Bilhete',
    grammarFocus: 'Bilhetes de transporte e troca de linha',
    theme: 'Tema 13: Clima, Natureza e Passeios',
  },
  // ── A2 Phonetics (liaison) ──────────────────────────────────────────────────
  {
    insertAfterId: 'fr-a2-188',
    level: 'A2',
    tag: 'PRON',
    uiTitle: 'Ligação entre Palavras',
    grammarFocus: 'Ligação fonética: quando é obrigatória ou proibida',
    theme: 'Tema 14: Rotina do Escritório e da Cidade',
  },
  // ── A2 Health & Admin ───────────────────────────────────────────────────────
  {
    insertAfterId: 'fr-a2-196',
    level: 'A2',
    tag: 'DIAL',
    uiTitle: 'Na Consulta Médica',
    grammarFocus: '5 frases para consulta: marcar horário, sintomas e receita',
    theme: 'Tema 15: Saúde e Farmácia',
  },
  {
    insertAfterId: 'fr-a2-196',
    level: 'A2',
    tag: 'VOC',
    uiTitle: 'Abrir uma Conta',
    grammarFocus: 'Vocabulário de banco, conta e documentos administrativos',
    theme: 'Tema 15: Saúde e Farmácia',
  },
  // ── A2 Gérondif (before A2 review) ──────────────────────────────────────────
  {
    insertAfterId: 'fr-a2-203',
    level: 'A2',
    tag: 'GRAM',
    uiTitle: 'Ação em Andamento',
    grammarFocus: "Gerúndio e 'estar fazendo' + infinitivo",
    theme: 'Tema 15: Saúde e Farmácia',
  },
  // ── B1 Phonetics & Communication ────────────────────────────────────────────
  {
    insertAfterId: 'fr-b1-206',
    level: 'B1',
    tag: 'PRON',
    uiTitle: 'Entonação e Ritmo',
    grammarFocus: 'Intonação em Perguntas, Negação e Ênfase',
    theme: 'Tema 16: Relembrando a Infância',
  },
  {
    insertAfterId: 'fr-b1-220',
    level: 'B1',
    tag: 'DIAL',
    uiTitle: 'Ligação Telefônica',
    grammarFocus: '5 frases para telefone: ligações, recados e compromissos',
    theme: 'Tema 17: Fofocas e Histórias Indiretas',
  },
  {
    insertAfterId: 'fr-b1-240',
    level: 'B1',
    tag: 'MISS',
    uiTitle: 'Jantar Reservado',
    grammarFocus: 'No restaurante: reserva, cardápio, conta e gorjeta',
    theme: 'Tema 18: Sonhos, Hipóteses e O Futuro',
  },
  {
    insertAfterId: 'fr-b1-240',
    level: 'B1',
    tag: 'CULT',
    uiTitle: 'Saúde na França',
    grammarFocus: 'Sistema de saúde francês: cartão de saúde e plano complementar',
    theme: 'Tema 18: Sonhos, Hipóteses e O Futuro',
  },
];

const ENGLISH_NEW: NewLessonSpec[] = [
  {
    insertAfterId: 'en-a2-119',
    level: 'A2',
    tag: 'PRON',
    uiTitle: 'The Schwa Sound',
    grammarFocus: 'The Schwa /ə/ in Unstressed Syllables',
    theme: 'Tema 9: Minha Casa, Minha Rotina',
  },
  {
    insertAfterId: 'en-a2-119',
    level: 'A2',
    tag: 'PRON',
    uiTitle: 'Silent Letters',
    grammarFocus: 'Silent Letters: K, B, W and GH in Common Words',
    theme: 'Tema 9: Minha Casa, Minha Rotina',
  },
  {
    insertAfterId: 'en-a2-177',
    level: 'A2',
    tag: 'VOC',
    uiTitle: 'Preços Grandes',
    grammarFocus: 'Números grandes: cem, mil e milhão',
    theme: 'Tema 13: Clima, Natureza e Passeios',
  },
  {
    insertAfterId: 'en-a2-178',
    level: 'A2',
    tag: 'VOC',
    uiTitle: 'Comprando o Bilhete',
    grammarFocus: 'Bilhetes de transporte público e baldeações',
    theme: 'Tema 13: Clima, Natureza e Passeios',
  },
  {
    insertAfterId: 'en-a2-188',
    level: 'A2',
    tag: 'PRON',
    uiTitle: 'Word Stress Patterns',
    grammarFocus: 'Word Stress: Two-Syllable Nouns vs Verbs',
    theme: 'Tema 14: Rotina do Escritório e da Cidade',
  },
  {
    insertAfterId: 'en-a2-196',
    level: 'A2',
    tag: 'DIAL',
    uiTitle: 'At the Doctor',
    grammarFocus: '5 Phrases for Appointments: Symptoms and Prescriptions',
    theme: 'Tema 15: Saúde e Farmácia',
  },
  {
    insertAfterId: 'en-a2-196',
    level: 'A2',
    tag: 'VOC',
    uiTitle: 'Opening an Account',
    grammarFocus: 'Vocabulary: Bank, Account, Sort Code and GP Registration',
    theme: 'Tema 15: Saúde e Farmácia',
  },
  {
    insertAfterId: 'en-a2-203',
    level: 'A2',
    tag: 'GRAM',
    uiTitle: 'Action in Progress',
    grammarFocus: 'Present Continuous: Be + -ing vs Simple Present',
    theme: 'Tema 15: Saúde e Farmácia',
  },
  {
    insertAfterId: 'en-b1-206',
    level: 'B1',
    tag: 'PRON',
    uiTitle: 'Intonation and Rhythm',
    grammarFocus: 'Intonation in Questions, Negation and Emphasis',
    theme: 'Tema 16: Relembrando a Infância',
  },
  {
    insertAfterId: 'en-b1-220',
    level: 'B1',
    tag: 'DIAL',
    uiTitle: 'Phone Call',
    grammarFocus: '5 Phrases for Phone Calls: Voicemail and Scheduling',
    theme: 'Tema 17: Fofocas e Histórias Indiretas',
  },
  {
    insertAfterId: 'en-b1-240',
    level: 'B1',
    tag: 'MISS',
    uiTitle: 'Reserved Dinner',
    grammarFocus: 'At the Restaurant: Booking, Menu, Bill and Tip',
    theme: 'Tema 18: Sonhos, Hipóteses e O Futuro',
  },
  {
    insertAfterId: 'en-b1-240',
    level: 'B1',
    tag: 'CULT',
    uiTitle: 'NHS and Health Insurance',
    grammarFocus: 'UK Health System: NHS, GP and Private Insurance',
    theme: 'Tema 18: Sonhos, Hipóteses e O Futuro',
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

  // Group specs by anchor; preserve order within each anchor group
  const byAnchor = new Map<string, NewLessonSpec[]>();
  for (const spec of specs) {
    const list = byAnchor.get(spec.insertAfterId) ?? [];
    list.push(spec);
    byAnchor.set(spec.insertAfterId, list);
  }

  // Process anchors from highest index to lowest so indices stay valid
  const anchors = [...byAnchor.keys()].sort((a, b) => {
    const ia = result.findIndex((l) => l.id === a);
    const ib = result.findIndex((l) => l.id === b);
    return ib - ia;
  });

  for (const anchorId of anchors) {
    const anchorIdx = result.findIndex((l) => l.id === anchorId);
    if (anchorIdx === -1) {
      throw new Error(`Anchor lesson not found: ${anchorId}`);
    }
    const toInsert = (byAnchor.get(anchorId) ?? []).map(({ insertAfterId: _, ...rest }) => ({
      ...rest,
      language,
      id: 'pending',
    })) as LessonDefinition[];
    result.splice(anchorIdx + 1, 0, ...toInsert);
  }

  return renumberIds(result, language);
}

function writeCurriculumFile(
  filePath: string,
  exportName: string,
  lessons: LessonDefinition[],
) {
  const content = `import type { LessonDefinition } from "@/types";

export const ${exportName}: LessonDefinition[] = ${JSON.stringify(lessons, null, 2)};
`;
  fs.writeFileSync(filePath, content, 'utf-8');
}

const root = path.join(process.cwd());
const frenchOut = insertLessons(FRENCH_LESSONS, FRENCH_NEW, 'fr');
const englishOut = insertLessons(ENGLISH_LESSONS, ENGLISH_NEW, 'en');

writeCurriculumFile(path.join(root, 'lib/curriculum/french.ts'), 'FRENCH_LESSONS', frenchOut);
writeCurriculumFile(path.join(root, 'lib/curriculum/english.ts'), 'ENGLISH_LESSONS', englishOut);

console.log(`French: ${FRENCH_LESSONS.length} → ${frenchOut.length} lessons (+${frenchOut.length - FRENCH_LESSONS.length})`);
console.log(`English: ${ENGLISH_LESSONS.length} → ${englishOut.length} lessons (+${englishOut.length - ENGLISH_LESSONS.length})`);

// Verify new lessons landed at expected themes
const newFrIds = frenchOut.filter(
  (l) =>
    l.grammarFocus.includes('Gérondif') ||
    l.grammarFocus.includes('Metro, RER') ||
    l.grammarFocus.includes('Carte Vitale') ||
    l.grammarFocus.includes('EU e U'),
);
console.log('\nSample inserted French lessons:');
newFrIds.forEach((l) => console.log(`  ${l.id} [${l.tag}] ${l.uiTitle} — ${l.grammarFocus}`));
