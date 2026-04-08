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
  knownVocabulary: string[];
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
- Vocabulary: use ONLY the 300–500 most common everyday words (e.g. hello, eat, drink, walk, look, house, water, go, have, be, name, like, today).
- Grammar: present tense of être/avoir (FR) or to be/to have (EN) and basic -ER verbs (FR) or simple present (EN). Simple yes/no questions allowed. NO past, NO future (except futur proche with 'aller').
- Sentence length: max 8 words per line.
- Tone: Informal and friendly. Use "Salut !", "Ça va ?", "On + verb" (in FR), "Tiens !".
- CONVERSATION EXAMPLE (French, prepositions topic — notice the human reaction):
  Marie: "Salut Hugo ! Ça va ?"
  Hugo: "Salut ! Oui, ça va très bien."
  Marie: "Où est le café ?"
  Hugo: "Il est là, sur la table."
- CONVERSATION EXAMPLE (English):
  Emma: "Hi Jake! How are you?"
  Jake: "I'm great, thanks! And you?"
  Emma: "Good! Where is the coffee?"
  Jake: "It's there, on the table."`,

  A2: `
A2 ELEMENTARY rules — the learner handles basic everyday situations:
- Vocabulary: common everyday vocabulary (500–1 500 words).
- Grammar: present, passé composé with avoir (FR) / simple past (EN), futur proche/simple (FR) / going to/will (EN), basic modals.
- Sentence length: 8–12 words per line.
- Tone: Conversational and alive. Use common fillers (alors, donc, bah, eh bien / so, well, actually).
- CONVERSATION EXAMPLE (French):
  Sophie: "Salut Lucas ! Tu viens au café ?"
  Lucas: "Ah, j'aimerais bien, mais j'ai faim !"
  Sophie: "Moi aussi ! On mange une pizza ?"
  Lucas: "Carrément ! On y va à 14h ?"`,

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
  const { language, level, interests, grammarFocus, knownVocabulary } = params;
  const { nameA, nameB } = pickNames(language);
  const topic = pickTopic(interests);
  const lineCount = DIALOGUE_LINES[level];
  const lang = LANG_LABEL[language];
  const levelDesc = LEVEL_DESCRIPTORS[level];

  const systemPrompt = `You are an expert language teacher creating content for Brazilian Portuguese speakers learning ${lang}. Respond with ONLY valid JSON, no markdown, no explanation.`;

  const isEarlyLearner = knownVocabulary.length < 30; // first ~10 lessons

  const normalizedKnown = knownVocabulary.map((w) => w.toLowerCase());
  const knownVocabInstruction = normalizedKnown.length > 0
    ? `- CRITICAL REPETITION RULE: The user has already learned the following words. You MUST NOT include any of these in 'newVocabulary': [${normalizedKnown.slice(-1000).join(', ')}]`
    : '';

  const vocabConstraint = `- VOCABULARY DYNAMICS: While the 4 new vocabulary words are the focus, you MAY use other common, simple, and transparent words (especially cognates like 'restaurant', 'manger', 'amigo') to ensure the conversation feels natural and human.
- DIALOGUE FLOW: This MUST be a REAL conversation. Use fillers and connectors (FR: "Eh bien", "Alors", "Tiens", "D'accord", "Bah"; EN: "Well", "So", "Actually", "Sure", "Right"). 
- AVOID ROBOTS: One speaker should initiate with a need/feeling/question, and the other should react with emotion or a relevant answer. Avoid the "Question-Answer-Question-Answer" pattern.
- NATURAL TRANSLATIONS: The 'dialogueTranslations' must be NATURAL Portuguese (PT-BR) as spoken in Brazil. NO dictionary-style explanations like "(fazer uma visita a)". Just translate the meaning as a Brazilian would say it in that context.`;

  // ── Attempt 1: Super-hook (all fields bundled) ───────────────────────────
  const superPrompt = `Write a 2-person dialogue in ${lang} between ${nameA} and ${nameB}.

Requirements:
- Topic: ${topic}
- Naturally uses this grammar: ${grammarFocus}
- Exactly ${lineCount} lines total, alternating speakers
- Every line MUST begin with the speaker name and a colon
- CRITICAL COHERENCE: Before writing anything, mentally choose ONE tight, specific scenario within the topic (e.g. "planning a weekend hike", "choosing a dish at a restaurant"). ALL dialogue lines AND ALL vocabulary words must stay within that single scenario from start to finish. Do NOT switch sub-topics mid-dialogue.
- CRITICAL: This must be a REAL conversation. Each line must directly react to what the previous speaker said. The dialogue must have a clear narrative arc — a beginning, a middle exchange, and a natural conclusion. Avoid "visiting" a gym if the context is just going to work out. Choose scenarios where the vocabulary and grammar actually make sense for native speakers.
- AVOID REPETITION and QUESTION BARRAGE.
- The CONVERSATION EXAMPLE inside the LEVEL CONSTRAINTS below shows exactly the style and register you must follow.
- NO STILTED LANGUAGE: Use "On" instead of "Nous" for French (unless very formal), use contractions, and sounds human.
- CONTEXTUAL MATCH: Ensure the scenario justifies the use of the grammar focus. If the focus is "Visiter vs Rendre visite", use a tourist scenario or a museum, not a gym trip.
${knownVocabInstruction}
${vocabConstraint}

LEVEL CONSTRAINTS (follow these strictly):
${levelDesc}

Output ONLY this JSON object (no extra text):
{
  "dialogue": "${nameA}: <line 1>\\n${nameB}: <line 2>\\n...",
  "dialogueTranslations": ["<pt-BR line 1>", "<pt-BR line 2>", ...],
  "newVocabulary": ["non_verb_word_1", "non_verb_word_2", "non_verb_word_3", "non_verb_word_4"],
  "dialogueVerbs": ["verb_infinitive_1", "verb_infinitive_2", ...],
  "grammarFocus": "one sentence describing the grammar used",
  "grammarBridge": {
    "insight": "1 frase de impacto em PT-BR — a sacada central da regra. MAX 20 palavras.",
    "explanation": "2-4 frases em PT-BR explicando a regra com profundidade.",
    "bridge": {
      "portuguese": "A frase-núcleo em PT-BR",
      "target": "O equivalente em ${lang}",
      "difference": "1 frase PT-BR sobre a diferença estrutural chave."
    },
    "items": [
      { "target": "Expressão 1 em ${lang}", "portuguese": "Tradução PT-BR", "logic": "Pequena sacada (OPCIONAL)" }
    ],
    "dialogueExample": {
      "target": "Frase VERBATIM do campo dialogue que melhor ilustra o grammarFocus",
      "portuguese": "Tradução natural PT-BR dessa frase"
    },
    "additionalExamples": [
      { "target": "Exemplo extra em ${lang}", "portuguese": "Equivalente PT-BR" }
    ]
  },
  "imageKeywords": {
    "<vocab word 1>": "short English Pexels search term",
    ...
  },
  "vocabTranslations": {
    "<vocab word 1>": { "translation": "pt-BR", "explanation": "tip in Portuguese ≤20 words", "example": "sentence in ${lang}" },
    ...
  },
  "imageMatchDistractors": {
    "<vocab word 1>": ["distractor_a", "distractor_b", "distractor_c"],
    ...
  }
}

Rules:
- dialogue must have exactly ${lineCount} lines
- newVocabulary: EXACTLY 4 DISTINCT NON-VERB words (no verbs allowed). Nouns, adjectives, or adverbs only. All 4 must appear LITERALLY in the dialogue.
- dialogueVerbs: List EVERY verb used in the dialogue in its infinitive form.
- NEVER include days of the week, months of the year, or proper nouns in newVocabulary.
- imageKeywords, vocabTranslations, imageMatchDistractors: provide data for the 4 words in newVocabulary.
- grammarBridge: (1) Use 'bridge' for single systemic rules (leave 'items' null). (2) Use 'items' for lists of expressions/vocabulary (leave 'bridge' null). (3) If the topic implies a number (e.g., "11 ways"), you MUST provide all of them in 'items'. (4) insight ≤20 words, explanation 2-4 phrases.`;

  try {
    const result = await callGeminiJSON<HookResult>(superPrompt, systemPrompt, 4096);
    if (result?.dialogue && result?.newVocabulary?.length === 4) {
      result.dialogue = fixDialogueLabels(result.dialogue, nameA, nameB);

      // Normalize vocabulary: lowercase all words, remove empty entries, deduplicate.
      result.newVocabulary = [...new Set(
        result.newVocabulary
          .map((w: string) => w.trim().toLowerCase())
          .filter((w: string) => w.length > 0),
      )];

      // Normalize dialogueVerbs
      if (result.dialogueVerbs) {
        result.dialogueVerbs = [...new Set(
          result.dialogueVerbs
            .map((v: string) => v.trim().toLowerCase())
            .filter((v: string) => v.length > 0)
        )];
      }

      // Final normalization of secondary objects
      if (result.vocabTranslations) {
        const vt: typeof result.vocabTranslations = {};
        for (const [k, v] of Object.entries(result.vocabTranslations)) vt[k.trim().toLowerCase()] = v;
        result.vocabTranslations = vt;
      }
      if (result.imageKeywords) {
        const ik: typeof result.imageKeywords = {};
        for (const [k, v] of Object.entries(result.imageKeywords)) ik[k.trim().toLowerCase()] = v;
        result.imageKeywords = ik;
      }
      if (result.imageMatchDistractors) {
        const imd: typeof result.imageMatchDistractors = {};
        for (const [k, v] of Object.entries(result.imageMatchDistractors)) imd[k.trim().toLowerCase()] = v;
        result.imageMatchDistractors = imd;
      }

      return result;
    }
  } catch (err) {
    console.error('[generateHook] Super-hook failed, falling back to simple hook:', err);
  }

  // ── Fallback: minimal hook-only prompt (original behavior) ───────────────
  console.warn('[generateHook] Using simple hook fallback');
  const simplePrompt = `Write a 2-person dialogue in ${lang} between ${nameA} and ${nameB}. Topic: ${topic}. Grammar: ${grammarFocus}.
Make it sound like a NATURAL conversation between humans, using informal language and reactions. Avoid robotic "textbook" sentences.
Output JSON:
{
  "dialogue": "${nameA}: <first line>\\n${nameB}: <second line>\\n...",
  "dialogueTranslations": ["<pt-BR translation 1>", ...],
  "newVocabulary": ["non_verb_1", "non_verb_2", "non_verb_3", "non_verb_4"],
  "dialogueVerbs": ["verb_inf_1", "verb_inf_2", ...],
  "grammarFocus": "one sentence describing the grammar used"
}
Rules: 4 non-verb vocab words, all used in dialogue. List all infinitive verbs used in dialogueVerbs.`;

  try {
    const fallback = await callGeminiJSON<HookResult>(simplePrompt, systemPrompt, 1024);
    if (!fallback) return null;
    fallback.dialogue = fixDialogueLabels(fallback.dialogue, nameA, nameB);

    fallback.newVocabulary = [...new Set(
      (fallback.newVocabulary ?? [])
        .map((w: string) => w.trim().toLowerCase())
        .filter((w: string) => w.length > 0),
    )];

    if (fallback.dialogueVerbs) {
      fallback.dialogueVerbs = [...new Set(
        fallback.dialogueVerbs
          .map((v: string) => v.trim().toLowerCase())
          .filter((v: string) => v.length > 0)
      )];
    }

    return fallback;
  } catch (err) {
    console.error('[generateHook] Simple hook fallback also failed:', err);
    return null;
  }
}
