'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { SupportedLanguage, ProficiencyLevel, HookResult, LessonTag } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

interface GenerateHookParams {
  language: SupportedLanguage;
  level: ProficiencyLevel;
  tag: LessonTag;
  interests: string[];
  theme: string;
  uiTitle?: string;
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

const TOPICS_BY_LEVEL: Record<ProficiencyLevel, string[]> = {
  A1: [
    'greetings and introductions', 'daily routine at home', 'family members',
    'food and drinks (café or kitchen)', 'colors and simple descriptions',
    'school and school supplies', 'shopping at a small market', 'pets and animals',
    'telling the time', 'simple weather', 'numbers and ages',
  ],
  A2: [
    'weekend plans', 'at a restaurant', 'shopping for clothes', 'going to school',
    'talking about family', 'describing your home', 'public transport',
    'a visit to a doctor', 'planning a short trip', 'sports and hobbies',
    'cooking a meal', 'a phone call with a friend',
  ],
  B1: [
    'travel plans', 'work and career', 'health and wellbeing', 'environment',
    'culture and events', 'technology (everyday)', 'education', 'food & restaurants',
    'sports & fitness', 'home improvement', 'celebrations & holidays',
  ],
  B2: [
    'society and current events', 'technology and innovation', 'environment & sustainability',
    'business and finance', 'cross-cultural differences', 'media and communication',
    'psychology and behavior', 'design and creativity', 'leadership & management',
  ],
  C1: [
    'abstract debates', 'media analysis', 'professional contexts', 'philosophy',
    'science and research', 'politics & governance', 'art & literature',
    'economics and globalization', 'ethics and values',
  ],
  C2: [
    'literature', 'rhetoric and irony', 'history and heritage', 'satire',
    'complex social issues', 'language and linguistics', 'philosophy of mind',
  ],
};

function pickTopic(level: ProficiencyLevel, interests: string[]) {
  const levelTopics = TOPICS_BY_LEVEL[level];
  if (level === 'A1' || level === 'A2') {
    return levelTopics[Math.floor(Math.random() * levelTopics.length)];
  }
  const weighted = [...levelTopics, ...interests.flatMap((i) => [i, i])];
  return weighted[Math.floor(Math.random() * weighted.length)];
}

const DIALOGUE_LINES: Record<ProficiencyLevel, number> = {
  A1: 4, A2: 4, B1: 6, B2: 6, C1: 8, C2: 8,
};

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
- Topics: society, technology, environment, business, cross-cultural issues.`,

  C1: `
C1 ADVANCED rules — the learner operates with sophistication:
- Vocabulary: rich, precise vocabulary including formal register, idioms, and low-frequency words. Stylistic variation is expected.
- Grammar: all B2 structures plus complex inversion, cleft sentences, advanced connectors. Participial clauses and gerunds freely used.
- Sentence length: varied, can be long and complex. Native-like rhythm.`,

  C2: `
C2 MASTERY rules — the learner approaches native-speaker fluency:
- Vocabulary: fully native-level including argot, formal/literary registers, and cultural references. No restrictions.
- Grammar: all tenses and moods including literary forms for recognition (passé simple, subjonctif imparfait FR). Stylistic choices freely made.`,
};

function fixDialogueLabels(dialogue: string, nameA: string, nameB: string): string {
  const lines = dialogue.split('\n').filter((l) => l.trim().length > 0);
  return lines
    .map((line, i) => (/^[^:\n]{1,25}:/.test(line) ? line : `${i % 2 === 0 ? nameA : nameB}: ${line}`))
    .join('\n');
}

/**
 * MINIMAL hook: generates ONLY the critical-path fields so the user can start
 * the lesson in 1-2 seconds. Secondary fields (grammarBridge, curiosidade,
 * phoneticsTip, missionBriefing, imageKeywords, vocabTranslations) are fetched
 * in parallel by useLessonBootstrap via smaller focused actions.
 */
export async function generateHook(params: GenerateHookParams): Promise<HookResult | null> {
  const { language, level, tag, interests, theme, uiTitle, grammarFocus, knownVocabulary } = params;
  const { nameA, nameB } = pickNames(language);
  
  // NARRATIVE ANCHOR: Use the curated theme and uiTitle instead of random topics
  const themeContext = theme ? `Theme: ${theme}${uiTitle ? ` - Scenario: ${uiTitle}` : ''}` : `Topic: ${pickTopic(level, interests)}`;
  
  const lineCount = DIALOGUE_LINES[level];
  const lang = LANG_LABEL[language];
  const levelDesc = LEVEL_DESCRIPTORS[level];

  let tagInstruction = '';
  if (tag === 'GRAM') {
    tagInstruction = `- ATOMIC GRAMMAR RULE: This lesson's primary focus is '${grammarFocus}'. You MUST ensure this is the ONLY new grammatical concept or complex verb introduced. If a specific verb is mentioned in the focus, it should be the protagonist of the dialogue.
- SIMPLICITY: Keep the rest of the sentence structure extremely simple so the student can isolate the grammar focus easily.`;
  } else if (tag === 'VOC') {
    tagInstruction = `- VOCABULARY OVER EVERYTHING: The dialogue is merely a vehicle for the 4 words in 'newVocabulary'. Keep the dialogue lines SHORT (max 6 words) and the grammar invisible.
- FOCUS: Do NOT introduce ANY new grammar or complex verbs. Use only the most basic verbs (être/avoir/aller/faire in FR, be/have/go/do in EN) to support the vocabulary.`;
  } else if (tag === 'PRON') {
    tagInstruction = `- PHONETIC FOCUS: The dialogue should naturally feature many instances of the sounds or letters in '${grammarFocus}'.
- AUDIO QUALITY: Keep sentences short and clear so the student can focus on hearing the target sounds.`;
  } else if (tag === 'DIAL') {
    tagInstruction = `- CONVERSATIONAL FLOW: This is a "Ways to Say" or "Dialogue" lesson. Use extremely natural, idiomatic, and high-frequency expressions.
- VARIETY: Ensure the speakers react naturally with the expressions mentioned in '${grammarFocus}'.`;
  } else if (tag === 'MISS') {
    tagInstruction = `- MISSION MODE: This is a practical application lesson. The dialogue MUST simulate a specific real-world scenario relevant to a BRAZILIAN visiting a French-speaking country (or English-speaking country) for the first time.
- SCENARIO IDEAS: checking in at a Parisian hotel, ordering food at a French brasserie, buying medicine at a French pharmacy, asking for directions in Paris, shopping at a French supermarket, reporting a lost item at an airport.
- The scenario MUST match the grammarFocus and feel urgent/high-stakes. Make the Brazilian character need something and have to communicate to get it. Do NOT write a generic casual chat — this is a mission.`;
  }

  const systemPrompt = `You are an expert language teacher creating content for Brazilian Portuguese speakers learning ${lang}. Respond with ONLY valid JSON, no markdown, no explanation.`;

  const isEarlyLearner = knownVocabulary.length < 30;
  const normalizedKnown = knownVocabulary.map((w) => w.toLowerCase());

  const knownVocabInstruction = normalizedKnown.length > 0
    ? `- CRITICAL REPETITION RULE: The user has already learned the following words. You MUST NOT include any of these in 'newVocabulary': [${normalizedKnown.slice(-1000).join(', ')}]`
    : '';

  const dialogueVocabGuard = isEarlyLearner
    ? `- ⚠️ ULTRA-BEGINNER DIALOGUE: This student has learned ${knownVocabulary.length === 0 ? 'nothing yet — this is their very first lesson' : `only ${knownVocabulary.length} words so far`}. Every word in the dialogue (EXCEPT the 4 new vocabulary words) MUST be among the 300 most common ${lang} words. Examples of allowed words: être, avoir, aller, manger, boire, aimer, vouloir, faire, voir, dire, savoir, pouvoir, venir; bonjour, salut, oui, non, merci, s'il vous plaît, pardon, d'accord, voilà; je, tu, il, elle, on, nous, vous, ils; le, la, les, un, une, des, mon, ton, son, notre, votre; ici, là, bien, très, aussi, avec, pour, dans, sur, de, à, et, mais, ou. NO low-frequency, technical, or topic-specific words outside the 4 new vocab words.`
    : normalizedKnown.length > 0
      ? `- VOCABULARY RECYCLING: The student already knows these words — use them naturally throughout the dialogue so they get repeated exposure: [${normalizedKnown.slice(-80).join(', ')}]. The 4 new vocab words are the ONLY truly new content words. Every other content word in the dialogue must come from the student's known list or be a very basic function word.`
      : '';

  const prompt = `Write a 2-person dialogue in ${lang} between ${nameA} and ${nameB}.

Requirements:
- ${themeContext}
- Pedadogical Focus: ${grammarFocus}
${tagInstruction}
- Exactly ${lineCount} lines total, alternating speakers
- Every line MUST begin with the speaker name and a colon
- CRITICAL COHERENCE: The entire dialogue MUST take place within the specific ${themeContext} provided. Do NOT drift to other topics.
- Every line must logically follow the previous one to create a realistic, single cohesive scene.
- Each line must directly react to the previous speaker. Natural narrative arc — beginning, middle, natural conclusion.
- AVOID REPETITION and QUESTION BARRAGE.
- NO STILTED LANGUAGE: Use contractions, "On" instead of "Nous" in French (unless formal), sounds human.
${knownVocabInstruction}
${dialogueVocabGuard}
- DIALOGUE FLOW: Use fillers (FR: "Eh bien", "Alors", "Tiens", "Bah"; EN: "Well", "So", "Actually", "Right").
- NATURAL TRANSLATIONS: 'dialogueTranslations' must be NATURAL Brazilian Portuguese — NO dictionary-style parentheticals. Just how a Brazilian would say it.

LEVEL CONSTRAINTS (follow strictly):
${levelDesc}

Output ONLY this JSON object (no extra text):
{
  "dialogue": "${nameA}: <line 1>\\n${nameB}: <line 2>\\n...",
  "dialogueTranslations": ["<pt-BR line 1>", "<pt-BR line 2>", ...],
  "newVocabulary": ["non_verb_word_1", "non_verb_word_2", "non_verb_word_3", "non_verb_word_4"],
  "dialogueVerbs": ["verb_infinitive_1", "verb_infinitive_2", ...],
  "grammarFocus": "one sentence describing the grammar used",
  "imageKeywords": {
    "<vocab word 1>": "short English Pexels search term (3-5 words, single object, neutral background)",
    "<vocab word 2>": "...",
    "<vocab word 3>": "...",
    "<vocab word 4>": "..."
  },
  "vocabTranslations": {
    "<vocab word 1>": { "translation": "pt-BR word/phrase", "explanation": "usage tip in PT-BR ≤15 words", "example": "one sentence in ${lang} using the word" },
    "<vocab word 2>": { "translation": "...", "explanation": "...", "example": "..." },
    "<vocab word 3>": { "translation": "...", "explanation": "...", "example": "..." },
    "<vocab word 4>": { "translation": "...", "explanation": "...", "example": "..." }
  }
}

Rules:
- dialogue must have exactly ${lineCount} lines
- newVocabulary: EXACTLY 4 DISTINCT NON-VERB words (no verbs allowed). Nouns, adjectives, or adverbs only. All 4 must appear LITERALLY in the dialogue.
- dialogueVerbs: List EVERY verb used in the dialogue in its infinitive form.
- NEVER include days of the week, months of the year, or proper nouns in newVocabulary.
- imageKeywords: one concise English Pexels search term per vocabulary word.
- vocabTranslations: provide for all 4 vocabulary words.`;

  try {
    // thinkingBudget=0 disables Gemini 2.5 Flash's thinking step — trades
    // a touch of quality for ~2-3s faster response, which is the whole point
    // of the minimal-hook split.
    const result = await callGeminiJSON<HookResult>(prompt, systemPrompt, 2000, 0);
    if (!result?.dialogue || result?.newVocabulary?.length !== 4) {
      console.error('[generateHook] Invalid minimal hook response');
      return null;
    }

    result.dialogue = fixDialogueLabels(result.dialogue, nameA, nameB);

    result.newVocabulary = [...new Set(
      result.newVocabulary
        .map((w: string) => w.trim().toLowerCase())
        .filter((w: string) => w.length > 0),
    )];

    if (result.dialogueVerbs) {
      result.dialogueVerbs = [...new Set(
        result.dialogueVerbs
          .map((v: string) => v.trim().toLowerCase())
          .filter((v: string) => v.length > 0)
      )];
    }

    if (result.imageKeywords) {
      const ik: typeof result.imageKeywords = {};
      for (const [k, v] of Object.entries(result.imageKeywords)) ik[k.trim().toLowerCase()] = v;
      result.imageKeywords = ik;
    }

    if (result.vocabTranslations) {
      const vt: typeof result.vocabTranslations = {};
      for (const [k, v] of Object.entries(result.vocabTranslations)) vt[k.trim().toLowerCase()] = v;
      result.vocabTranslations = vt;
    }

    return result;
  } catch (err) {
    console.error('[generateHook] Error:', err);
    return null;
  }
}
