import type { SupportedLanguage, ProficiencyLevel, LessonTag } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

const DIALOGUE_LINE_RANGES: Record<ProficiencyLevel, { min: number; max: number }> = {
  A1: { min: 4, max: 6 },
  A2: { min: 5, max: 7 },
  B1: { min: 6, max: 8 },
  B2: { min: 7, max: 9 },
  C1: { min: 8, max: 10 },
  C2: { min: 10, max: 12 },
};

const COMPACT_LEVEL: Record<ProficiencyLevel, string> = {
  A1: 'A1: ≤8 words/line, present tense, top-300 words, friendly tone.',
  A2: 'A2: 8–12 words/line, everyday vocab, conversational fillers ok.',
  B1: 'B1: intermediate vocab, imparfait/conditionnel ok, 10–16 words/line.',
  B2: 'B2: varied vocab, complex clauses, natural length.',
  C1: 'C1: advanced vocab and grammar, native-like rhythm.',
  C2: 'C2: native-level, all registers.',
};

export interface HookGenerationParams {
  language: SupportedLanguage;
  level: ProficiencyLevel;
  tag: LessonTag;
  interests: string[];
  theme: string;
  uiTitle?: string;
  grammarFocus: string;
  knownVocabulary: string[];
  arcCharacters?: { learner?: string; local?: string };
  arcSummary?: string;
  lastScenarioSummary?: string;
}

export function pickHookNames(
  language: SupportedLanguage,
  tag?: LessonTag,
  arcCharacters?: { learner?: string; local?: string },
) {
  if (arcCharacters?.learner && arcCharacters?.local) {
    return { nameA: arcCharacters.learner, nameB: arcCharacters.local };
  }
  if (tag === 'MISS') {
    return { nameA: 'Você', nameB: '__LOCAL_ROLE__' };
  }
  const femaleNames = language === 'fr'
    ? ['Marie', 'Sophie', 'Camille', 'Lea', 'Emma', 'Chloe', 'Manon', 'Ines', 'Sarah',
      'Jade', 'Louise', 'Alice', 'Lina', 'Julia', 'Eva', 'Clara', 'Lucie', 'Romane',
      'Agathe', 'Jeanne', 'Margaux', 'Noemie', 'Elise', 'Anais']
    : ['Emma', 'Sarah', 'Olivia', 'Chloe'];
  const maleNames = language === 'fr'
    ? ['Lucas', 'Thomas', 'Julien', 'Antoine', 'Louis', 'Hugo', 'Arthur', 'Nathan',
      'Gabriel', 'Raphael', 'Leo', 'Enzo', 'Paul', 'Jules', 'Adam', 'Victor',
      'Noah', 'Ethan', 'Mathis', 'Maxime', 'Alexandre', 'Clement', 'Baptiste', 'Romain']
    : ['Jake', 'Michael', 'Daniel', 'Ryan'];
  return {
    nameA: femaleNames[Math.floor(Math.random() * femaleNames.length)],
    nameB: maleNames[Math.floor(Math.random() * maleNames.length)],
  };
}

function pickTopic(level: ProficiencyLevel, interests: string[]): string {
  const topics: Record<ProficiencyLevel, string[]> = {
    A1: ['greetings', 'food at home', 'family', 'daily routine'],
    A2: ['restaurant', 'shopping', 'cooking', 'transport', 'market', 'after class', 'phone call', 'weekend plans'],
    B1: ['travel', 'work', 'health', 'culture', 'technology'],
    B2: ['society', 'environment', 'business', 'media'],
    C1: ['debates', 'professional contexts', 'science'],
    C2: ['literature', 'history', 'complex social issues'],
  };
  const pool = topics[level];
  if (level === 'A1' || level === 'A2') {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const weighted = [...pool, ...interests.flatMap((i) => [i, i])];
  return weighted[Math.floor(Math.random() * weighted.length)];
}

function compactTagInstruction(tag: LessonTag, grammarFocus: string, uiTitle?: string, theme?: string): string {
  switch (tag) {
    case 'MISS':
      return `MISSION: "Você" + one local role in the target language. Urgent goal tied to "${grammarFocus}".`;
    case 'VOC':
      return `VOC: scene fits theme; target word from "${grammarFocus}" must be one of the 2 new vocab items.`;
    case 'VERB':
      return `VERB: use target verb from "${grammarFocus}" at most 1–2 times naturally.`;
    case 'GRAM':
      return `GRAM: grammar "${grammarFocus}" emerges naturally from scene "${uiTitle ?? theme ?? ''}".`;
    case 'EXPR':
      return `EXPR: use ≥2 expressions from "${grammarFocus}" in context.`;
    case 'CULT':
      return `CULT: reveal cultural detail about "${grammarFocus}" through action, not lecture.`;
    case 'DIAL':
      return `DIAL: realistic conversation; pragmatic focus "${grammarFocus}".`;
    case 'PRON':
      return `PRON: highlight pronunciation patterns from "${grammarFocus}".`;
    default:
      return '';
  }
}

export function buildMinimalHookPrompt(params: HookGenerationParams): {
  prompt: string;
  systemPrompt: string;
  nameA: string;
  nameB: string;
} {
  const {
    language,
    level,
    tag,
    interests,
    theme,
    uiTitle,
    grammarFocus,
    knownVocabulary,
    arcSummary,
    lastScenarioSummary,
    arcCharacters,
  } = params;

  const lang = LANG_LABEL[language];
  const { nameA, nameB } = pickHookNames(language, tag, arcCharacters);
  const { min: minLines, max: maxLines } = DIALOGUE_LINE_RANGES[level];

  const arcBlock = [arcSummary, lastScenarioSummary ? `Previous: ${lastScenarioSummary}` : '']
    .filter(Boolean)
    .join(' · ');

  const antiReuse = lastScenarioSummary
    ? `ANTI-REUSE: Do not repeat the previous scene's situation, mood adjectives, or stock openers. Invent a new micro-scene from Theme / Focus.`
    : `SCENE VARIETY: Invent a fresh real-life micro-situation from Theme / Focus. Avoid repeating the same stock opener or mood adjective across lessons.`;

  const themeContext = theme
    ? `Theme: ${theme}${uiTitle ? ` · ${uiTitle}` : ''}${arcBlock ? ` · ${arcBlock}` : ''}`
    : `Topic: ${pickTopic(level, interests)}`;

  let normalizedKnown = knownVocabulary.map((w) => w.toLowerCase());
  let targetVocabWord = '';
  if (tag === 'VOC') {
    targetVocabWord = grammarFocus.replace(/vocabulario:|vocabulário:|vocabulary:/i, '').trim().toLowerCase();
    if (targetVocabWord) {
      normalizedKnown = normalizedKnown.filter((w) => w !== targetVocabWord);
    }
  }

  const knownBlock =
    normalizedKnown.length > 0
      ? `Do NOT repeat in newVocabulary: [${normalizedKnown.slice(-80).join(', ')}]`
      : '';

  const speakerIntro =
    tag === 'MISS'
      ? `2-person ${lang} dialogue. Speaker A = "Você". Speaker B = one local role label in ${lang}.`
      : `2-person ${lang} dialogue between ${nameA} and ${nameB}.`;

  const jsonDialogueTemplate =
    tag === 'MISS'
      ? `"Você: line1\\nRole: line2\\n..."`
      : `"${nameA}: line1\\n${nameB}: line2\\n..."`;

  const newVocabTemplate = targetVocabWord
    ? `["${targetVocabWord}", "word2"]`
    : `["word1", "word2"]`;

  const intentMode = tag === 'MISS' && ['B1', 'B2', 'C1', 'C2'].includes(level);
  const translationRule = intentMode
    ? `dialogueTranslations: Você lines = intent in PT-BR ("Diga que..."); other lines = natural PT-BR.`
    : `dialogueTranslations: natural PT-BR, one string per dialogue line (≤15 words).`;

  const systemPrompt = `You create ${lang} micro-dialogues for Brazilian learners. Respond with ONLY valid JSON. No markdown (** or ^^). Plain vocabulary words only.`;

  const prompt = `${speakerIntro}

Context: ${themeContext}
Focus: ${grammarFocus}
${compactTagInstruction(tag, grammarFocus, uiTitle, theme)}
${knownBlock}
${antiReuse}

Rules:
- ${minLines}–${maxLines} lines; each line starts with "Name: "
- ONE scene; each line reacts to the previous line
- Sound like a real conversation people would have — specific to the scene, not a grammar drill
- PREMISE ALIGNMENT: If speaker A frames something negatively (too expensive, too tiring, disappointing…), speaker B must agree, disagree, or nuance — NOT only enthusiastic positives that contradict it
- Exactly 2 newVocabulary items (non-verbs, lowercase, appear in dialogue)
- NEVER include days of the week, months of the year, speaker names, or other proper nouns in newVocabulary (e.g. Alice, Marie, Paris)
- ${translationRule}
- grammarFocus: one sentence describing grammar used
- No markdown; no extra JSON fields

Output ONLY:
{
  "dialogue": ${jsonDialogueTemplate},
  "dialogueTranslations": ["...", "..."],
  "newVocabulary": ${newVocabTemplate},
  "grammarFocus": "..."
}

Level: ${COMPACT_LEVEL[level]}`;

  return { prompt, systemPrompt, nameA, nameB };
}
