import type { LessonDefinition, SupportedLanguage } from '@/types';

// ─── French Curriculum (A1–A2) ────────────────────────────────────────────────

export const FRENCH_LESSONS: LessonDefinition[] = [
  { id: 'fr-a1-01', language: 'fr', level: 'A1', grammarFocus: 'être — verbo "ser/estar" na primeira pessoa: Je suis, Tu es, Il/Elle est' },
  { id: 'fr-a1-02', language: 'fr', level: 'A1', grammarFocus: 'condicional "Je voudrais" — pedidos educados (equivalente a "Eu gostaria")' },
  { id: 'fr-a1-03', language: 'fr', level: 'A1', grammarFocus: 'avoir — verbo "ter" e expressões com avoir (avoir faim, soif, ans)' },
  { id: 'fr-a1-04', language: 'fr', level: 'A1', grammarFocus: 'artigos definidos e indefinidos — le/la/les, un/une/des' },
  { id: 'fr-a1-05', language: 'fr', level: 'A1', grammarFocus: 'pronomes pessoais sujeito — je, tu, il, elle, nous, vous, ils, elles' },
  { id: 'fr-a1-06', language: 'fr', level: 'A1', grammarFocus: 'negação simples com ne...pas — "Je ne suis pas" / "Il ne mange pas"' },
  { id: 'fr-a1-07', language: 'fr', level: 'A1', grammarFocus: 'perguntas com "est-ce que" e inversão — "Est-ce que tu parles français?"' },
  { id: 'fr-a1-08', language: 'fr', level: 'A1', grammarFocus: 'verbos regulares -ER no presente — parler, manger, habiter' },
  { id: 'fr-a1-09', language: 'fr', level: 'A1', grammarFocus: 'aller — "ir" no presente e expressão "aller + infinitif" (futuro próximo)' },
  { id: 'fr-a1-10', language: 'fr', level: 'A1', grammarFocus: 'adjetivos possessivos — mon/ma/mes, ton/ta/tes, son/sa/ses' },
  { id: 'fr-a2-01', language: 'fr', level: 'A2', grammarFocus: 'passé composé com avoir — "J\'ai mangé", "Tu as vu"' },
  { id: 'fr-a2-02', language: 'fr', level: 'A2', grammarFocus: 'passé composé com être — "Je suis allé(e)", "Il est arrivé"' },
  { id: 'fr-a2-03', language: 'fr', level: 'A2', grammarFocus: 'pronomes de objeto direto e indireto — le/la/les, lui/leur' },
  { id: 'fr-a2-04', language: 'fr', level: 'A2', grammarFocus: 'imparfait — descrições no passado: "Quand j\'étais enfant, je jouais..."' },
  { id: 'fr-a2-05', language: 'fr', level: 'A2', grammarFocus: 'comparativos — plus...que, moins...que, aussi...que' },
];

// ─── English Curriculum (A1–A2) ───────────────────────────────────────────────

export const ENGLISH_LESSONS: LessonDefinition[] = [
  { id: 'en-a1-01', language: 'en', level: 'A1', grammarFocus: 'verb "to be" — I am, You are, He/She is (equivalente ao "ser/estar" em português)' },
  { id: 'en-a1-02', language: 'en', level: 'A1', grammarFocus: 'presente simples com "I would like" — pedidos educados e preferências' },
  { id: 'en-a1-03', language: 'en', level: 'A1', grammarFocus: 'there is / there are — existência e localização de objetos' },
  { id: 'en-a1-04', language: 'en', level: 'A1', grammarFocus: 'presente contínuo — I am eating, She is working (ação acontecendo agora)' },
  { id: 'en-a1-05', language: 'en', level: 'A1', grammarFocus: 'modal "can" — habilidade e permissão: "I can swim", "Can I help you?"' },
  { id: 'en-a2-01', language: 'en', level: 'A2', grammarFocus: 'simple past regular — worked, played, visited (equivalente ao "passado simples")' },
  { id: 'en-a2-02', language: 'en', level: 'A2', grammarFocus: 'simple past irregular — went, ate, saw (verbos irregulares mais comuns)' },
  { id: 'en-a2-03', language: 'en', level: 'A2', grammarFocus: 'futuro com "will" e "going to" — previsões vs. planos concretos' },
  { id: 'en-a2-04', language: 'en', level: 'A2', grammarFocus: 'present perfect — I have been, She has eaten (experiências de vida)' },
  { id: 'en-a2-05', language: 'en', level: 'A2', grammarFocus: 'comparativos e superlativos — bigger/biggest, more interesting/most interesting' },
];

// ─── Lesson selection ─────────────────────────────────────────────────────────

const LESSON_MAP: Record<SupportedLanguage, LessonDefinition[]> = {
  fr: FRENCH_LESSONS,
  en: ENGLISH_LESSONS,
};

/** All lessons for a given language, in curriculum order. */
export function getLessonsForLanguage(language: SupportedLanguage): LessonDefinition[] {
  return LESSON_MAP[language];
}

/**
 * Returns the lesson the user should study next.
 * `currentLessonId` is the ID stored in `profile.lessonProgress[language]`.
 * Falls back to the first lesson if no progress is recorded.
 */
export function getNextLesson(language: SupportedLanguage, currentLessonId?: string): LessonDefinition {
  const lessons = LESSON_MAP[language];
  if (!currentLessonId) return lessons[0];
  const lesson = lessons.find((l) => l.id === currentLessonId);
  return lesson ?? lessons[0];
}

/**
 * Returns the ID of the lesson that comes after `completedLessonId`.
 * Returns null if the completed lesson is the last one in the curriculum.
 */
export function getNextLessonId(language: SupportedLanguage, completedLessonId: string): string | null {
  const lessons = LESSON_MAP[language];
  const idx = lessons.findIndex((l) => l.id === completedLessonId);
  if (idx === -1 || idx >= lessons.length - 1) return null;
  return lessons[idx + 1].id;
}

export function getLessonById(id: string): LessonDefinition | undefined {
  return [...FRENCH_LESSONS, ...ENGLISH_LESSONS].find((l) => l.id === id);
}
