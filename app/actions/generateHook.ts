'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { SupportedLanguage, ProficiencyLevel, HookResult } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

interface GenerateHookParams {
  language: SupportedLanguage;
  level: ProficiencyLevel;
  interests: string[];
  grammarFocus: string;
}

function pickNames(language: SupportedLanguage) {
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

function pickTopic(interests: string[]) {
  const generalTopics = [
    'daily life', 'food & restaurants', 'travel', 'work & career', 'shopping',
    'health & medicine', 'sports & fitness', 'technology', 'nature & environment',
    'art & culture', 'family & relationships', 'education', 'music', 'movies & TV',
    'weather', 'transportation', 'home & living', 'hobbies', 'news & current events',
    'celebrations & holidays', 'history', 'science', 'psychology', 'philosophy',
    'politics & government', 'finance & investing', 'personal development', 'mental health',
    'design & creativity', 'gardening', 'architecture', 'internet & social media',
    'customer service', 'leadership & management', 'productivity & organization',
    'time management', 'language learning', 'culture & traditions',
  ];
  const weighted = [...generalTopics, ...interests.flatMap((i) => [i, i, i])];
  return weighted[Math.floor(Math.random() * weighted.length)];
}

const DIALOGUE_LINES: Record<ProficiencyLevel, number> = {
  A1: 4, A2: 4, B1: 6, B2: 6, C1: 8, C2: 8,
};

/**
 * Concrete CEFR-level descriptors injected into the Gemini prompt so the
 * model produces vocabulary and grammar that truly matches the learner's level.
 */
const LEVEL_DESCRIPTORS: Record<ProficiencyLevel, string> = {
  A1: `
STRICT A1 BEGINNER rules — the learner knows almost nothing yet:
- Vocabulary: use ONLY the 300–500 most common everyday words (e.g. hello, eat, drink, house, water, go, have, be, name, like).  No complex or uncommon words at all.
- Grammar: present tense of être/avoir (FR) or to be/to have (EN) and the most basic -ER verbs (FR) or simple present (EN). Affirmative sentences only or a single simple yes/no question. NO subordinate clauses, NO past, NO future.
- Sentence length: max 8 words per line.
- Topics: greetings, self-introduction, numbers, colors, family, food/drink, daily objects, simple actions.
- Example dialogue line (French): "Marie: Bonjour ! J'ai un café."
- Example dialogue line (English): "Emma: Hello! I have a cat."`,

  A2: `
A2 ELEMENTARY rules — the learner handles basic everyday situations:
- Vocabulary: common everyday vocabulary (500–1 500 words). Simple nouns, verbs, adjectives that appear in daily life.  Avoid rare, abstract or technical words.
- Grammar: present tense, passé composé with avoir (FR) / simple past (EN), futur proche (FR) / going to (EN), basic modals (pouvoir/vouloir FR; can/want EN). Simple connectors: et, mais, parce que / and, but, because. ONE simple subordinate clause at most.
- Sentence length: 8–12 words per line.
- Topics: shopping, café/restaurant, weather, transport, hobbies, professions, daily routines.
- Example dialogue line (French): "Lucas: Hier, j'ai mangé une pizza avec mes amis."
- Example dialogue line (English): "Jake: Yesterday I went to the market with my friend."`,

  B1: `
B1 INTERMEDIATE rules — the learner can handle familiar topics:
- Vocabulary: intermediate vocabulary (1 500–3 000 words). Can use descriptive adjectives, common idiomatic expressions, and topic-specific words.
- Grammar: all A1–A2 structures plus imparfait (FR) / past continuous (EN), futur simple (FR) / will-future (EN), conditionnel présent (FR) / would (EN), simple relative clauses (qui/que/where/who).
- Sentence length: 10–16 words per line.
- Topics: travel, work plans, opinions, health, environment, culture, learning.`,

  B2: `
B2 UPPER-INTERMEDIATE rules — the learner handles complex ideas:
- Vocabulary: varied vocabulary (3 000–6 000 words). Abstract nouns, nuanced verbs, fixed expressions, and collocations are welcome.
- Grammar: all B1 plus subjonctif présent (FR) / subjunctive (EN), plus-que-parfait (FR) / past perfect (EN), passive voice, complex conjunctions (bien que, alors que / although, whereas). Multiple subordinate clauses allowed.
- Sentence length: natural length, typically 12–20 words per line.
- Topics: society, technology, environment, business, cross-cultural issues.`,

  C1: `
C1 ADVANCED rules — the learner operates with sophistication:
- Vocabulary: rich, precise vocabulary including formal register, idioms, and low-frequency words. Stylistic variation is expected.
- Grammar: all B2 structures plus complex inversion, cleft sentences, advanced connectors (certes, en effet, or, d'autant plus que / nonetheless, albeit, henceforth). Participial clauses and gerunds freely used.
- Sentence length: varied, can be long and complex. Native-like rhythm.
- Topics: abstract debates, media analysis, professional contexts, philosophy, science.`,

  C2: `
C2 MASTERY rules — the learner approaches native-speaker fluency:
- Vocabulary: fully native-level including argot, formal/literary registers, and cultural references. No restrictions.
- Grammar: all tenses and moods including literary forms for recognition (passé simple, subjonctif imparfait FR). Stylistic choices freely made.
- Sentence length: fully natural; mirrors authentic native speech or writing.
- Topics: anything — literature, rhetoric, irony, understatement, humor.`,
};

function fixDialogueLabels(dialogue: string, nameA: string, nameB: string): string {
  const lines = dialogue.split('\n').filter((l) => l.trim().length > 0);
  return lines
    .map((line, i) => (/^[^:\n]{1,25}:/.test(line) ? line : `${i % 2 === 0 ? nameA : nameB}: ${line}`))
    .join('\n');
}

/**
 * Super-hook: generates dialogue, grammar bridge, image keywords, and vocab
 * translations in a single Gemini call (4 096 token budget).
 *
 * Falls back automatically to a minimal hook-only call when Gemini returns
 * invalid JSON or hits a quota error, so lessons always load.
 */
export async function generateHook(params: GenerateHookParams): Promise<HookResult | null> {
  const { language, level, interests, grammarFocus } = params;
  const { nameA, nameB } = pickNames(language);
  const topic = pickTopic(interests);
  const lineCount = DIALOGUE_LINES[level];
  const lang = LANG_LABEL[language];
  const levelDesc = LEVEL_DESCRIPTORS[level];

  const systemPrompt = `You are an expert language teacher creating content for Brazilian Portuguese speakers learning ${lang}. Respond with ONLY valid JSON, no markdown, no explanation.`;

  // ── Attempt 1: Super-hook (all fields bundled) ───────────────────────────
  const superPrompt = `Write a 2-person dialogue in ${lang} between ${nameA} and ${nameB}.

Requirements:
- Topic: ${topic}
- Naturally uses this grammar: ${grammarFocus}
- Exactly ${lineCount} lines total, alternating speakers, forming a natural flowing conversation
- Every line MUST begin with the speaker name and a colon

LEVEL CONSTRAINTS (follow these strictly):
${levelDesc}

Output ONLY this JSON object (no extra text):
{
  "dialogue": "${nameA}: <line 1>\\n${nameB}: <line 2>\\n...",
  "dialogueTranslations": ["<pt-BR line 1>", "<pt-BR line 2>", ...],
  "newVocabulary": ["verb_infinitive", "noun1", "noun2", "noun3", "noun4"],
  "verbWord": "verb_infinitive",
  "grammarFocus": "one sentence describing the grammar used",
  "grammarBridge": {
    "rule": "4-6 sentence explanation in Brazilian Portuguese using the Portuguese Bridge Method",
    "targetExample": "Main example in ${lang} from the dialogue",
    "portugueseComparison": "Brazilian Portuguese equivalent of the main example",
    "additionalExamples": [
      { "target": "Second example in ${lang}", "portuguese": "Portuguese equivalent" },
      { "target": "Third example in ${lang}", "portuguese": "Portuguese equivalent" }
    ]
  },
  "imageKeywords": {
    "<vocab word 1>": "short English Pexels search term",
    "<vocab word 2>": "short English Pexels search term",
    "<vocab word 3>": "short English Pexels search term",
    "<vocab word 4>": "short English Pexels search term",
    "<vocab word 5>": "short English Pexels search term"
  },
  "vocabTranslations": {
    "<vocab word 1>": { "translation": "pt-BR", "explanation": "tip in Portuguese ≤20 words", "example": "sentence in ${lang}" },
    "<vocab word 2>": { "translation": "pt-BR", "explanation": "tip in Portuguese ≤20 words", "example": "sentence in ${lang}" },
    "<vocab word 3>": { "translation": "pt-BR", "explanation": "tip in Portuguese ≤20 words", "example": "sentence in ${lang}" },
    "<vocab word 4>": { "translation": "pt-BR", "explanation": "tip in Portuguese ≤20 words", "example": "sentence in ${lang}" },
    "<vocab word 5>": { "translation": "pt-BR", "explanation": "tip in Portuguese ≤20 words", "example": "sentence in ${lang}" }
  }
}

Rules:
- dialogue must have exactly ${lineCount} lines
- newVocabulary: first word is a verb (infinitive), then 4 nouns; all 5 must appear in the dialogue
- verbWord must equal newVocabulary[0]
- dialogueTranslations: ${lineCount} strings, no speaker prefix, natural Brazilian Portuguese
- imageKeywords keys must match the actual vocabulary words in newVocabulary
- vocabTranslations keys must match the actual vocabulary words in newVocabulary`;

  try {
    const result = await callGeminiJSON<HookResult>(superPrompt, systemPrompt, 4096);
    if (result?.dialogue && result?.newVocabulary?.length === 5) {
      result.dialogue = fixDialogueLabels(result.dialogue, nameA, nameB);
      return result;
    }
  } catch (err) {
    console.error('[generateHook] Super-hook failed, falling back to simple hook:', err);
  }

  // ── Fallback: minimal hook-only prompt (original behavior) ───────────────
  console.warn('[generateHook] Using simple hook fallback');
  const simplePrompt = `Write a 2-person dialogue in ${lang} between ${nameA} and ${nameB}.

Requirements:
- Topic: ${topic}
- Naturally uses this grammar: ${grammarFocus}
- Exactly ${lineCount} lines total, alternating speakers
- Every line MUST begin with the speaker name and a colon

LEVEL CONSTRAINTS (follow these strictly):
${levelDesc}

Output this JSON (dialogue must have exactly ${lineCount} lines):
{
  "dialogue": "${nameA}: <first line>\\n${nameB}: <second line>\\n...",
  "dialogueTranslations": ["<pt-BR translation of line 1>", "<pt-BR translation of line 2>", ...],
  "newVocabulary": ["verb_infinitive", "noun1", "noun2", "noun3", "noun4"],
  "verbWord": "verb_infinitive",
  "grammarFocus": "one sentence describing the grammar used"
}

Rules for newVocabulary: first word is a verb in infinitive form, then 4 nouns; all must appear in the dialogue.
Rules for dialogueTranslations: ${lineCount} natural Brazilian Portuguese translations, no speaker prefix.`;

  try {
    const fallback = await callGeminiJSON<HookResult>(simplePrompt, systemPrompt, 1024);
    if (!fallback) return null;
    fallback.dialogue = fixDialogueLabels(fallback.dialogue, nameA, nameB);
    return fallback;
  } catch (err) {
    console.error('[generateHook] Simple hook fallback also failed:', err);
    return null;
  }
}
