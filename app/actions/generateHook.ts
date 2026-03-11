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
- Vocabulary: use ONLY the 300–500 most common everyday words (e.g. hello, eat, drink, house, water, go, have, be, name, like). No complex or uncommon words at all.
- Grammar: present tense of être/avoir (FR) or to be/to have (EN) and the most basic -ER verbs (FR) or simple present (EN). Simple yes/no questions or "où est…?" allowed. NO subordinate clauses, NO past, NO future.
- Sentence length: max 8 words per line.
- Topics: greetings, self-introduction, numbers, colors, family, food/drink, daily objects, simple actions.
- CONVERSATION EXAMPLE (French, prepositions topic — notice how each line reacts to the previous):
  Marie: "Où est mon sac ?"
  Hugo: "Il est sous la table."
  Marie: "Et mon livre ? Il est là aussi ?"
  Hugo: "Non, ton livre est sur la chaise."
- CONVERSATION EXAMPLE (English):
  Emma: "Where is my bag?"
  Jake: "It is under the table."
  Emma: "And my book? Is it there too?"
  Jake: "No, your book is on the chair."`,

  A2: `
A2 ELEMENTARY rules — the learner handles basic everyday situations:
- Vocabulary: common everyday vocabulary (500–1 500 words). Simple nouns, verbs, adjectives that appear in daily life. Avoid rare, abstract or technical words.
- Grammar: present tense, passé composé with avoir (FR) / simple past (EN), futur proche (FR) / going to (EN), basic modals (pouvoir/vouloir FR; can/want EN). Simple connectors: et, mais, parce que / and, but, because. ONE simple subordinate clause at most.
- Sentence length: 8–12 words per line.
- Topics: shopping, café/restaurant, weather, transport, hobbies, professions, daily routines.
- CONVERSATION EXAMPLE (French):
  Sophie: "Tu veux aller au café cet après-midi ?"
  Lucas: "Oui, bonne idée ! J'ai très faim."
  Sophie: "Moi aussi. J'ai mangé seulement une pomme ce matin."
  Lucas: "D'accord, on y va à 14h ?"`,

  B1: `
B1 INTERMEDIATE rules — the learner can handle familiar topics:
- Vocabulary: intermediate vocabulary (1 500–3 000 words). Can use descriptive adjectives, common idiomatic expressions, and topic-specific words.
- Grammar: all A1–A2 structures plus imparfait (FR) / past continuous (EN), futur simple (FR) / will-future (EN), conditionnel présent (FR) / would (EN), simple relative clauses (qui/que/where/who).
- Sentence length: 10–16 words per line.
- Topics: travel, work plans, opinions, health, environment, culture, learning.
- CONVERSATION EXAMPLE (French):
  Camille: "Tu as déjà visité la Bretagne ? J'aimerais y aller cet été."
  Thomas: "Oui, j'y suis allé l'année dernière. C'est magnifique, surtout les côtes."
  Camille: "Vraiment ? Qu'est-ce que tu as fait là-bas ?"
  Thomas: "On faisait du vélo tous les jours et on mangeait des crêpes. Je te recommande vraiment !"`,

  B2: `
B2 UPPER-INTERMEDIATE rules — the learner handles complex ideas:
- Vocabulary: varied vocabulary (3 000–6 000 words). Abstract nouns, nuanced verbs, fixed expressions, and collocations are welcome.
- Grammar: all B1 plus subjonctif présent (FR) / subjunctive (EN), plus-que-parfait (FR) / past perfect (EN), passive voice, complex conjunctions (bien que, alors que / although, whereas). Multiple subordinate clauses allowed.
- Sentence length: natural length, typically 12–20 words per line.
- Topics: society, technology, environment, business, cross-cultural issues.
- CONVERSATION EXAMPLE (French):
  Julie: "Je ne comprends pas pourquoi les gens utilisent autant les réseaux sociaux, bien qu'ils sachent que c'est mauvais pour leur santé mentale."
  Marc: "C'est vrai, mais il faut reconnaître que ces plateformes ont été conçues pour créer une dépendance. Ce n'est pas si simple d'arrêter."
  Julie: "Tu as raison. J'avais essayé de supprimer mes comptes l'an dernier, mais je n'avais pas tenu plus d'une semaine."
  Marc: "Moi, j'ai choisi de les utiliser de façon consciente — une heure maximum par jour. Ça change vraiment la donne."`,

  C1: `
C1 ADVANCED rules — the learner operates with sophistication:
- Vocabulary: rich, precise vocabulary including formal register, idioms, and low-frequency words. Stylistic variation is expected.
- Grammar: all B2 structures plus complex inversion, cleft sentences, advanced connectors (certes, en effet, or, d'autant plus que / nonetheless, albeit, henceforth). Participial clauses and gerunds freely used.
- Sentence length: varied, can be long and complex. Native-like rhythm.
- Topics: abstract debates, media analysis, professional contexts, philosophy, science.
- CONVERSATION EXAMPLE (French):
  Laure: "Ce qui me frappe dans ce roman, c'est la façon dont l'auteur déconstruit l'idée même de progrès — non pas pour rejeter la modernité, mais pour en interroger les présupposés."
  Antoine: "Certes, et c'est d'autant plus pertinent que cette remise en question vient d'un personnage lui-même issu du monde scientifique. L'ironie est délibérée, je pense."
  Laure: "Tout à fait. D'ailleurs, il y a une scène au troisième chapitre où ce paradoxe est poussé à son paroxysme — le chercheur détruit ses propres données."
  Antoine: "Je l'ai lue différemment : moins comme un acte de destruction que comme une forme de libération. C'est là que le texte devient véritablement ambigu."`,

  C2: `
C2 MASTERY rules — the learner approaches native-speaker fluency:
- Vocabulary: fully native-level including argot, formal/literary registers, and cultural references. No restrictions.
- Grammar: all tenses and moods including literary forms for recognition (passé simple, subjonctif imparfait FR). Stylistic choices freely made.
- Sentence length: fully natural; mirrors authentic native speech or writing.
- Topics: anything — literature, rhetoric, irony, understatement, humor.
- CONVERSATION EXAMPLE (French):
  Hélène: "Tu sais, j'ai relu Flaubert ce week-end et je me suis demandé si Emma Bovary ne serait pas aujourd'hui une grande consommatrice de contenus lifestyle sur Instagram — la même insatisfaction, la même fuite vers l'idéal."
  Romain: "C'est une lecture séduisante, quoiqu'elle risque de réduire Flaubert à une simple métaphore contemporaine. Ce qui fait la force du roman, c'est précisément l'époque : l'ennui provincial du XIXe, irréductible à nos angoisses numériques."
  Hélène: "Sans doute, mais l'ennui, lui, est transhistorique. Et puis, il y aurait quelque chose de vertigineux à imaginer Emma Bovary bloquée dans ses propres algorithmes de recommandation."
  Romain: "Là, tu me donnes envie d'écrire un essai. Ou du moins de me verser un autre verre."`,
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
- Exactly ${lineCount} lines total, alternating speakers
- Every line MUST begin with the speaker name and a colon
- CRITICAL: This must be a REAL conversation. Each line must directly react to what the previous speaker said (ask a question, answer it, agree, disagree, express surprise, follow up, etc.). The dialogue must have a clear narrative arc — a beginning, a middle exchange, and a natural conclusion. Do NOT write isolated sentences that happen to share a topic. Each speaker must address the other person, not just state facts independently.
- BAD example (NEVER do this — isolated sentences, not a conversation): A: "I eat pasta." B: "I also eat soup." A: "The restaurant is good." B: "I like food."
- The CONVERSATION EXAMPLE inside the LEVEL CONSTRAINTS below shows exactly the style and register you must follow.

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
  },
  "imageMatchDistractors": {
    "<vocab word 1>": ["distractor_a", "distractor_b", "distractor_c"],
    "<vocab word 2>": ["distractor_a", "distractor_b", "distractor_c"],
    "<vocab word 3>": ["distractor_a", "distractor_b", "distractor_c"],
    "<vocab word 4>": ["distractor_a", "distractor_b", "distractor_c"],
    "<vocab word 5>": ["distractor_a", "distractor_b", "distractor_c"]
  }
}

Rules:
- dialogue must have exactly ${lineCount} lines
- newVocabulary: first word is a verb (infinitive), then 4 nouns; all 5 must appear in the dialogue
- verbWord must equal newVocabulary[0]
- dialogueTranslations: ${lineCount} strings, no speaker prefix, natural Brazilian Portuguese
- imageKeywords keys must match the actual vocabulary words in newVocabulary
- vocabTranslations keys must match the actual vocabulary words in newVocabulary
- imageMatchDistractors keys must match the actual vocabulary words in newVocabulary
- imageMatchDistractors: for each vocab word, provide 3 concrete nouns in ${lang} from a COMPLETELY different semantic category (e.g., if the word is "restaurant", distractors could be "avion", "chien", "montagne"). The distractors must be visually unambiguous and obviously wrong for that word's image. Do NOT use other words from newVocabulary as distractors.`;

  try {
    const result = await callGeminiJSON<HookResult>(superPrompt, systemPrompt, 4096);
    if (result?.dialogue && result?.newVocabulary?.length === 5) {
      result.dialogue = fixDialogueLabels(result.dialogue, nameA, nameB);

      // Normalize: verbWord must be present at newVocabulary[0].
      // Gemini sometimes returns a verbWord that is absent from the list
      // (or puts it at a non-zero index), causing the verb to be saved as
      // a noun or lost entirely. Fix it deterministically here.
      if (result.verbWord) {
        const idx = result.newVocabulary.indexOf(result.verbWord);
        if (idx === -1) {
          // verbWord not in list — insert at front, drop the last noun
          result.newVocabulary = [result.verbWord, ...result.newVocabulary.slice(0, 4)];
        } else if (idx !== 0) {
          // verbWord is in the list but not first — move it to front
          result.newVocabulary = [
            result.verbWord,
            ...result.newVocabulary.filter((w) => w !== result.verbWord),
          ];
        }
      }

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
- CRITICAL: This must be a REAL conversation. Each line must directly react to what the previous speaker said. Do NOT write isolated sentences — each speaker must address the other person. Follow the CONVERSATION EXAMPLE in the LEVEL CONSTRAINTS below.

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

    // Same normalization as super-hook: ensure verbWord is at newVocabulary[0]
    if (fallback.verbWord && fallback.newVocabulary?.length) {
      const idx = fallback.newVocabulary.indexOf(fallback.verbWord);
      if (idx === -1) {
        fallback.newVocabulary = [fallback.verbWord, ...fallback.newVocabulary.slice(0, 4)];
      } else if (idx !== 0) {
        fallback.newVocabulary = [
          fallback.verbWord,
          ...fallback.newVocabulary.filter((w) => w !== fallback.verbWord),
        ];
      }
    }

    return fallback;
  } catch (err) {
    console.error('[generateHook] Simple hook fallback also failed:', err);
    return null;
  }
}
