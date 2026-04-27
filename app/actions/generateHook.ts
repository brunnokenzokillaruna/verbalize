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

function pickNames(language: SupportedLanguage, tag?: LessonTag) {
  // MISS lessons use first-person immersion: the Brazilian learner ("Você")
  // is one of the speakers. The second speaker is a local role chosen by
  // the AI based on the scenario (Recepcionista, Garçom, Atendente, etc.).
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
  A1: 6, A2: 6, B1: 8, B2: 8, C1: 10, C2: 10,
};

const LEVEL_DESCRIPTORS: Record<ProficiencyLevel, string> = {
  A1: `
STRICT A1 BEGINNER rules — the learner knows almost nothing yet:
- Vocabulary: use ONLY the 300–500 most common everyday words (e.g. hello, eat, drink, walk, look, house, water, go, have, be, name, like, today).
- Grammar: present tense of être/avoir (FR) or to be/to have (EN) and basic -ER verbs (FR) or simple present (EN). Simple yes/no questions allowed. NO past, NO future (except futur proche with 'aller').
- Sentence length: max 8 words per line.
- Tone: Informal and friendly. Use "Salut !", "Ça va ?", "On + verb" (in FR).
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
  // For MISS lessons the role label is picked by the AI per-scenario, so we
  // only force "Você" on odd lines and leave even-line labels untouched.
  if (nameA === 'Você' && nameB === '__LOCAL_ROLE__') {
    const evenLineMatch = lines.find((line, i) => i % 2 !== 0 && /^[^:\n]{1,30}:/.test(line));
    const detectedRole = evenLineMatch?.match(/^([^:\n]{1,30}):/)?.[1]?.trim() ?? 'Atendente';
    return lines
      .map((line, i) => {
        if (/^[^:\n]{1,30}:/.test(line)) return line;
        return `${i % 2 === 0 ? 'Você' : detectedRole}: ${line}`;
      })
      .join('\n');
  }
  return lines
    .map((line, i) => (/^[^:\n]{1,25}:/.test(line) ? line : `${i % 2 === 0 ? nameA : nameB}: ${line}`))
    .join('\n');
}

function stripForbiddenFillers(dialogue: string): string {
  return dialogue
    .replace(/\bTiens\s*,\s*/gi, '')
    .replace(/\bTiens\s*!\s*/gi, '')
    .replace(/\bTiens\b\s*/gi, '');
}

/**
 * MINIMAL hook: generates ONLY the critical-path fields so the user can start
 * the lesson in 1-2 seconds. Secondary fields (grammarBridge, curiosidade,
 * phoneticsTip, missionBriefing, imageKeywords, vocabTranslations) are fetched
 * in parallel by useLessonBootstrap via smaller focused actions.
 */
export async function generateHook(params: GenerateHookParams): Promise<HookResult | null> {
  const { language, level, tag, interests, theme, uiTitle, grammarFocus, knownVocabulary } = params;
  const { nameA, nameB } = pickNames(language, tag);
  
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
    tagInstruction = `- MISSION MODE — FIRST-PERSON IMMERSION: This is a role-play lesson. The STUDENT IS the Brazilian traveler. The dialogue MUST be a direct 1-on-1 exchange between "Você" (the learner, speaking ${lang}) and a single local character.
- SPEAKER A is literally labeled "Você" on every line they speak — NEVER a first name.
- SPEAKER B is labeled with the LOCAL'S ROLE IN ${lang.toUpperCase()}, chosen to fit the scenario "${uiTitle ?? theme ?? grammarFocus}". Examples (French): "Réceptionniste", "Serveur", "Serveuse", "Caissier", "Pharmacien", "Policier", "Chauffeur", "Vendeur", "Agent". Examples (English): "Receptionist", "Waiter", "Cashier", "Pharmacist", "Officer", "Driver", "Clerk", "Agent". Pick ONE role that obviously matches the scene — do NOT invent names.
- The role label MUST be identical on every line spoken by Speaker B (no variation, no switching).
- "Você" speaks in ${lang} (even though the label is Portuguese) — this is the learner practicing. The other speaker also speaks ${lang}.
- The scenario MUST feel urgent/high-stakes. The learner NEEDS something from the local and has to communicate to get it. Do NOT write a generic casual chat — this is a mission with a concrete goal tied to "${grammarFocus}".`;
  } else if (tag === 'VERB') {
    tagInstruction = `- VERB PROTAGONIST: The lesson's focus is a single verb mentioned in '${grammarFocus}'. That verb MUST be the PROTAGONIST of the dialogue — it has to appear at least 3 times across the lines.
- CONJUGATION VARIETY: Show the target verb in AT LEAST 2 different persons (e.g. "je", "il", "on", "nous" / "I", "you", "she", "we") so the learner SEES the conjugation shift in context. If the level allows, add 1 different tense too (e.g. one present + one passé composé / simple past).
- AVOID OTHER NEW VERBS: Every other verb in the dialogue should be a very basic verb the student already knows (être/avoir/aller/faire in FR; be/have/go/do in EN). The target verb is the only verb worth teaching here.
- NATURAL DIALOGUE: Don't make it feel like a conjugation drill — the verb must appear organically inside a real human conversation.`;
  } else if (tag === 'EXPR') {
    tagInstruction = `- EXPRESSION SHOWCASE: The focus '${grammarFocus}' is a list of fixed expressions or idioms. The dialogue MUST naturally use AT LEAST 2 of these expressions verbatim.
- CONTEXT IS KING: Each expression should be used in a situation that makes its meaning obvious from context, so the learner absorbs it without needing a translation.
- NO GRAMMAR NOISE: Keep the surrounding grammar extremely simple so the fixed expressions stand out as the memorable part of each line.`;
  } else if (tag === 'CULT') {
    tagInstruction = `- CULTURAL ANCHOR: '${grammarFocus}' is a cultural topic. The dialogue MUST take place in a recognizably French/English-speaking cultural setting and naturally reveal a cultural detail (a habit, an unspoken rule, a food, a place, a social norm).
- SHOW, DON'T TELL: Don't have characters explain culture like tourists. Let the cultural element emerge from what they do or react to naturally.`;
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

  const speakerIntro = tag === 'MISS'
    ? `Write a 2-person dialogue in ${lang}. Speaker A is literally "Você" (the Brazilian learner, first-person immersion). Speaker B is a single local character whose label is the role in ${lang} (e.g. Réceptionniste/Receptionist, Serveur/Waiter, Pharmacien/Pharmacist) that best fits the scenario — pick ONE and keep it identical on every line they speak.`
    : `Write a 2-person dialogue in ${lang} between ${nameA} and ${nameB}.`;

  const jsonDialogueTemplate = tag === 'MISS'
    ? `"Você: <line 1>\\n<LocalRole>: <line 2>\\n..."`
    : `"${nameA}: <line 1>\\n${nameB}: <line 2>\\n..."`;

  const intentMode = tag === 'MISS' && ['B1', 'B2', 'C1', 'C2'].includes(level);
  
  const translationInstruction = intentMode
    ? `- INTENT MODE TRANSLATIONS: Because this is an advanced mission, 'dialogueTranslations' for the learner's ("Você") lines MUST BE INTENTS, not literal translations. Example: "Diga que você não concorda e sugira ir de trem." or "Peça a conta e pergunte se aceitam cartão." The local's lines should remain normal natural Portuguese translations.`
    : `- NATURAL TRANSLATIONS: 'dialogueTranslations' must be NATURAL Brazilian Portuguese — NO dictionary-style parentheticals. Just how a Brazilian would say it.`;

  const prompt = `${speakerIntro}

Requirements:
- ${themeContext}
- Pedadogical Focus: ${grammarFocus}
${tagInstruction}
- Exactly ${lineCount} lines total, alternating speakers
- Every line MUST begin with the speaker name and a colon
- CRITICAL SCENE COHERENCE: Pick ONE specific physical location AND ONE specific moment in time for the whole dialogue (e.g. "inside the plane during the flight", "at the café table after ordering", "in front of the hotel reception desk"). The location and time MUST NOT CHANGE across lines. If the characters start on a plane, they stay on the plane for every line — do NOT teleport them to another room, building, or scene. If a transition is narratively needed, it must be explicit and realistic (e.g. "let's get off", "we arrived, let's go inside"), and the dialogue must END at the new place, not mix scenes.
- LOGICAL CONTINUITY: Every line must be a direct, realistic reaction to the previous one — same conversation, same place, consistent timeline. No sudden topic jumps, no unexplained changes in setting, no contradictions.
- REAL-WORLD USEFULNESS: The dialogue must sound like something two real people would actually say in that exact situation. A Brazilian learner should be able to reuse these exact lines if they found themselves in that scene.
- NARRATIVE ARC: Clear beginning (who/where/what's happening), middle (small development or reaction), natural conclusion (a resolution, decision, or closing remark) — all inside the SAME scene.
- The entire dialogue MUST stay within the ${themeContext} provided. Do NOT drift to other topics.
- AVOID REPETITION and QUESTION BARRAGE. Do not start multiple lines with the same filler or interjection.
- NO STILTED LANGUAGE: Use contractions, "On" instead of "Nous" in French (unless formal), sounds human.
${knownVocabInstruction}
${dialogueVocabGuard}
- DIALOGUE FLOW: Use fillers SPARINGLY and VARIED across lines (FR allowed: "Eh bien", "Alors", "Bah", "Oh", "Ah", "Bon", "Dis donc"; EN allowed: "Well", "So", "Actually", "Right", "Look", "You know"). FORBIDDEN word: "Tiens" — never use it, in any line, under any circumstance. Do NOT repeat the same filler twice in the same dialogue.
${translationInstruction}

LEVEL CONSTRAINTS (follow strictly):
${levelDesc}

Output ONLY this JSON object (no extra text):
{
  "dialogue": ${jsonDialogueTemplate},
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
    "<vocab word 1>": { "translation": "pt-BR word/phrase", "explanation": "dica de uso em PT-BR SIMPLES, ≤15 palavras — linguagem de amigo, sem jargão gramatical (nada de 'substantivo feminino', 'locução adverbial', 'distinção semântica'). Prefira exemplos concretos a termos técnicos.", "example": "one sentence in ${lang} using the word" },
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

    result.dialogue = stripForbiddenFillers(result.dialogue);
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
