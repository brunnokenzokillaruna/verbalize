'use server';

import { callGeminiJSON } from '@/services/gemini';
import { validateDialogueCoherence } from '@/lib/validateDialogueCoherence';
import { buildMinimalHookPrompt, type HookGenerationParams } from '@/lib/hookGeneration/buildHookContext';
import { filterHookVocabularyForKnownWords } from '@/lib/hookVocabulary';
import { sanitizeDialogueText, sanitizeVocabularyToken, stripMarkdownEmphasis } from '@/lib/hookSanitize';
import type { SupportedLanguage, ProficiencyLevel, HookResult, LessonTag } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

export type GenerateHookParams = HookGenerationParams;

function pickNames(
  language: SupportedLanguage,
  tag?: LessonTag,
  arcCharacters?: { learner?: string; local?: string },
) {
  if (arcCharacters?.learner && arcCharacters?.local) {
    return { nameA: arcCharacters.learner, nameB: arcCharacters.local };
  }
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

const DIALOGUE_LINE_RANGES: Record<ProficiencyLevel, { min: number; max: number }> = {
  A1: { min: 4, max: 6 },
  A2: { min: 5, max: 7 },
  B1: { min: 6, max: 8 },
  B2: { min: 7, max: 9 },
  C1: { min: 8, max: 10 },
  C2: { min: 10, max: 12 },
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

function normalizeHookResult(
  result: HookResult,
  nameA: string,
  nameB: string,
): HookResult {
  result.dialogue = sanitizeDialogueText(stripForbiddenFillers(result.dialogue));
  result.dialogue = fixDialogueLabels(result.dialogue, nameA, nameB);

  result.newVocabulary = [...new Set(
    result.newVocabulary
      .map((w: string) => sanitizeVocabularyToken(w))
      .filter((w: string) => w.length > 0),
  )];

  if (result.dialogueTranslations) {
    result.dialogueTranslations = result.dialogueTranslations.map((line) =>
      stripMarkdownEmphasis(line),
    );
  }

  if (result.dialogueVerbs) {
    result.dialogueVerbs = [...new Set(
      result.dialogueVerbs
        .map((v: string) => v.trim().toLowerCase())
        .filter((v: string) => v.length > 0),
    )];
  }

  if (result.imageKeywords) {
    const ik: typeof result.imageKeywords = {};
    for (const [k, v] of Object.entries(result.imageKeywords)) ik[k.trim().toLowerCase()] = v;
    result.imageKeywords = ik;
  }

  if (result.imageMatchOptions) {
    const imo: typeof result.imageMatchOptions = {};
    for (const [k, v] of Object.entries(result.imageMatchOptions)) {
      imo[k.trim().toLowerCase()] = v;
    }
    result.imageMatchOptions = imo;
  }

  if (result.vocabTranslations) {
    const vt: typeof result.vocabTranslations = {};
    for (const [k, v] of Object.entries(result.vocabTranslations)) vt[k.trim().toLowerCase()] = v;
    result.vocabTranslations = vt;
  }

  if (result.newChunks?.length) {
    result.newChunks = result.newChunks
      .filter((c) => c.phrase?.trim() && c.translation?.trim())
      .map((c) => ({
        phrase: c.phrase.trim(),
        translation: c.translation.trim(),
        entryType: c.entryType ?? 'expression',
      }));
  }

  if (result.rolePlayConsequences?.length) {
    const dialogueLines = result.dialogue.split('\n').filter((l) => l.trim());
    result.rolePlayConsequences = result.rolePlayConsequences
      .filter(
        (c) =>
          typeof c.npcLineIndex === 'number' &&
          c.npcLineIndex >= 0 &&
          c.npcLineIndex < dialogueLines.length &&
          c.alternateText?.trim() &&
          !/^você\s*:/i.test((dialogueLines[c.npcLineIndex]?.split(':')[0] ?? '').trim()),
      )
      .map((c) => ({
        npcLineIndex: c.npcLineIndex,
        alternateText: c.alternateText.trim(),
        alternateTranslation: c.alternateTranslation?.trim(),
      }));
    if (result.rolePlayConsequences.length === 0) {
      delete result.rolePlayConsequences;
    }
  }

  return result;
}

function buildCoherenceCorrectionBlock(breaks: string[]): string {
  return `

CORREÇÕES OBRIGATÓRIAS (o diálogo anterior falhou no nexo — reescreva completamente):
${breaks.map((b) => `- ${b}`).join('\n')}`;
}

function finalizeHookResult(
  result: HookResult,
  nameA: string,
  nameB: string,
  knownVocabulary: string[] = [],
): HookResult {
  const hook = normalizeHookResult(result, nameA, nameB);
  // Always run: strips known words AND proper nouns / speaker labels.
  return filterHookVocabularyForKnownWords(hook, knownVocabulary, [nameA, nameB]);
}

async function resolveHookCoherence(
  first: HookResult,
  retryWithCorrections: (breaks: string[]) => Promise<HookResult | null>,
  logPrefix: string,
): Promise<HookResult> {
  const coherenceFirst = await validateDialogueCoherence(first.dialogue);
  if (!coherenceFirst) {
    console.warn(`[${logPrefix}] Coherence judge unavailable — accepting first dialogue`);
    return first;
  }
  if (coherenceFirst.pass) {
    console.log(`[${logPrefix}] Coherence pass (score ${coherenceFirst.score})`);
    return first;
  }

  console.warn(
    `[${logPrefix}] Coherence fail (score ${coherenceFirst.score}) — retrying:`,
    coherenceFirst.breaks,
  );

  const second = await retryWithCorrections(coherenceFirst.breaks);
  if (!second) {
    console.warn(`[${logPrefix}] Retry generation failed — keeping first dialogue`);
    return first;
  }

  const coherenceSecond = await validateDialogueCoherence(second.dialogue);
  if (!coherenceSecond) return second;
  if (coherenceSecond.pass || coherenceSecond.score > coherenceFirst.score) {
    console.log(
      `[${logPrefix}] Retry coherence (${coherenceFirst.score} → ${coherenceSecond.score})`,
    );
    return second;
  }

  console.log(
    `[${logPrefix}] Keeping first dialogue (scores: first=${coherenceFirst.score}, retry=${coherenceSecond.score})`,
  );
  return first;
}

/**
 * MINIMAL hook: generates ONLY the critical-path fields so the user can start
 * the lesson quickly. Heavy fields (vocabTranslations, imageKeywords,
 * imageMatchOptions, grammarBridge, curiosidade, phoneticsTip, missionBriefing)
 * are fetched in parallel by useLessonBootstrap via smaller focused actions.
 */
export async function generateHook(params: GenerateHookParams): Promise<HookResult | null> {
  const {
    language,
    level,
    tag,
    interests,
    theme,
    uiTitle,
    grammarFocus,
    knownVocabulary,
    arcCharacters,
    arcSummary,
    lastScenarioSummary,
  } = params;
  const { nameA, nameB } = pickNames(language, tag, arcCharacters);

  const arcBlock = [
    arcSummary ? `Story arc for this theme: ${arcSummary}` : '',
    lastScenarioSummary ? `Previous scene recap: ${lastScenarioSummary}` : '',
  ].filter(Boolean).join('\n');

  const themeContext = theme
    ? `Theme: ${theme}${uiTitle ? ` - Scenario: ${uiTitle}` : ''}${arcBlock ? `\n${arcBlock}` : ''}`
    : `Topic: ${pickTopic(level, interests)}`;
  
  const { min: minLines, max: maxLines } = DIALOGUE_LINE_RANGES[level];
  const lang = LANG_LABEL[language];
  const levelDesc = LEVEL_DESCRIPTORS[level];

  let tagInstruction = '';
  if (tag === 'GRAM') {
    const scenarioLock = uiTitle
      ? `Scenario "${uiTitle}" inside Theme "${theme}"`
      : `Theme "${theme}"`;
    tagInstruction = `- SCENARIO LOCK: The scene MUST match ${scenarioLock}. The grammar focus '${grammarFocus}' must emerge FROM this scene — never pick a random scene just because it fits the rule.
- GRAMMAR IN CONTEXT: Introduce only this grammar focus. Keep other structures simple. The pattern should appear 1–3 times naturally because the conversation needs it — not as isolated observations.
- SPEAKERS MUST REACT: Each line responds to the previous one. BAD: "Le hall est sombre." / "La porte est étroite." GOOD: "On va à l'hôtel ? — Oui, mais le hall est un peu sombre, non ?"`;
  } else if (tag === 'VOC') {
    tagInstruction = `- VOCABULARY LESSON: The 2 new words must fit naturally in the same scene. Conversation flow is priority #1 — never break the dialogue just to showcase a word.
- PREFERRED TARGET: If the Pedagogical Focus names a word (e.g. 'Vocabulário: Bon'), prefer it as one of the 2 new words — but if it does not fit the scene without breaking coherence, pick a different word from the same theme instead.
- SIMPLICITY: Keep lines short (max 8 words) and grammar basic (être/avoir/aller/faire in FR; be/have/go/do in EN).`;
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
- The scenario MUST feel urgent/high-stakes. The learner NEEDS something from the local and has to communicate to get it. Do NOT write a generic casual chat — this is a mission with a concrete goal tied to "${grammarFocus}".
- SATISFYING MISSION RESOLUTION: The dialogue must have a complete narrative arc that resolves the learner's mission. The final lines of the conversation MUST mark the successful completion of the goal or a clear final instruction/guidance (e.g., providing the requested directions, warning of a specific danger and advising what to do, handing over a key/item, or finalizing the purchase/transaction). The dialogue must never end on a cliffhanger, an unanswered question, or a statement that leaves the learner's needs unresolved.`;
  } else if (tag === 'VERB') {
    tagInstruction = `- VERB LESSON: The target verb from '${grammarFocus}' may appear 1–2 times ONLY where it sounds natural in this scene. Do NOT repeat it to teach conjugation — that happens later in Grammar Bridge and Practice exercises.
- CONJUGATION TEACHING: Do NOT force multiple persons or tenses in the hook dialogue. One natural use (e.g. "j'ai oublié ma serviette" or "n'oublie pas !") is enough.
- KEEP IT SIMPLE: Other verbs in the dialogue should stay basic (être/avoir/aller/faire in FR; be/have/go/do in EN).`;
  } else if (tag === 'EXPR') {
    tagInstruction = `- EXPRESSION SHOWCASE: The focus '${grammarFocus}' is a list of fixed expressions or idioms. The dialogue MUST naturally use AT LEAST 2 of these expressions verbatim.
- CONTEXT IS KING: Each expression should be used in a situation that makes its meaning obvious from context, so the learner absorbs it without needing a translation.
- NO GRAMMAR NOISE: Keep the surrounding grammar extremely simple so the fixed expressions stand out as the memorable part of each line.
- CHUNKS: Include 1–2 multi-word expressions from the dialogue in newChunks (full phrase + PT-BR translation, entryType "expression" or "chunk").`;
  } else if (tag === 'CULT') {
    tagInstruction = `- CULTURAL ANCHOR: '${grammarFocus}' is a cultural topic. The dialogue MUST take place in a recognizably French/English-speaking cultural setting and naturally reveal a cultural detail (a habit, an unspoken rule, a food, a place, a social norm).
- SHOW, DON'T TELL: Don't have characters explain culture like tourists. Let the cultural element emerge from what they do or react to naturally.
- CHUNKS: Include 1 cultural collocation or fixed phrase in newChunks when it appears naturally in the dialogue.`;
  }

  const systemPrompt = `Você é um amigo brasileiro muito gente boa e fluente em ${lang}. Seu objetivo é criar conteúdo que pareça 100% humano e zero robótico.
Regras de Humanidade:
- NUNCA use aberturas de IA como "Certamente!", "Aqui está", "Com certeza".
- Use português brasileiro natural, de conversa (ex: "só pra você saber", "olha que legal", "né").
- Proibido usar palavras como "essencial", "crucial", "fundamental", "nuance", "unificar".
- Seja conciso e direto.
Respond with ONLY valid JSON, no markdown, no explanation.
NEVER wrap words in ** or ^^ — the app highlights vocabulary; use plain text only.`;

  const isEarlyLearner = knownVocabulary.length < 30;
  let normalizedKnown = knownVocabulary.map((w) => w.toLowerCase());

  let targetVocabWord = '';
  if (tag === 'VOC') {
    // If grammarFocus looks like "Vocabulário: Bon", extract "bon" and remove it from known list
    // so the AI isn't forced to exclude it from newVocabulary.
    targetVocabWord = grammarFocus.replace(/vocabulario:|vocabulário:|vocabulary:/i, '').trim().toLowerCase();
    if (targetVocabWord) {
      normalizedKnown = normalizedKnown.filter((w) => w !== targetVocabWord);
    }
  }

  const knownVocabInstruction = normalizedKnown.length > 0
    ? `- CRITICAL REPETITION RULE: The user has already learned the following words. You MUST NOT include any of these in 'newVocabulary': [${normalizedKnown.slice(-1000).join(', ')}]`
    : '';

  const dialogueVocabGuard = isEarlyLearner
    ? `- BEGINNER: This student has learned ${knownVocabulary.length === 0 ? 'nothing yet — first lesson' : `only ${knownVocabulary.length} words`}. Prefer the 300 most common ${lang} words, but never sacrifice conversation coherence to stay within a word list.`
    : normalizedKnown.length > 0
      ? `- OPTIONAL RECYCLING: You MAY reuse a few words the student already knows if they fit naturally: [${normalizedKnown.slice(-40).join(', ')}]. Never force recycling — a coherent dialogue always wins.`
      : '';

  const speakerIntro = tag === 'MISS'
    ? `Write a 2-person dialogue in ${lang}. Speaker A is literally "Você" (the Brazilian learner, first-person immersion). Speaker B is a single local character whose label is the role in ${lang} (e.g. Réceptionniste/Receptionist, Serveur/Waiter, Pharmacien/Pharmacist) that best fits the scenario — pick ONE and keep it identical on every line they speak.`
    : `Write a 2-person dialogue in ${lang} between ${nameA} and ${nameB}.`;

  const jsonDialogueTemplate = tag === 'MISS'
    ? `"Você: <line 1>\\n<LocalRole>: <line 2>\\n..."`
    : `"${nameA}: <line 1>\\n${nameB}: <line 2>\\n..."`;

  const newVocabTemplate = targetVocabWord
    ? `["${targetVocabWord}", "non_verb_word_2"]`
    : `["non_verb_word_1", "non_verb_word_2"]`;

  const intentMode = tag === 'MISS' && ['B1', 'B2', 'C1', 'C2'].includes(level);
  
  const translationInstruction = intentMode
    ? `- INTENT MODE TRANSLATIONS: Because this is an advanced mission, 'dialogueTranslations' for the learner's ("Você") lines MUST BE INTENTS, not literal translations. Example: "Diga que você não concorda e sugira ir de trem." or "Peça a conta e pergunte se aceitam cartão." The local's lines should remain normal natural Portuguese translations.`
    : `- NATURAL TRANSLATIONS: 'dialogueTranslations' must be NATURAL Brazilian Portuguese — NO dictionary-style parentheticals. Just how a Brazilian would say it. Use "buscar" (go get) not "procurar" (search) when the speaker already knows where something is.`;

  const prompt = `${speakerIntro}

⚠️ PRIORITY ORDER (when rules conflict, follow this order):
1. Each line must RESPOND to or REACT to the previous line — real conversation, not a word checklist
2. ONE scene, ONE moment, ONE topic thread — no sudden subject changes
3. The 2 new vocabulary words appear naturally within that scene (pick scene-fitting words if needed)
4. Target verb/grammar appears 1–2 times only if it fits naturally — never force repetition
5. Never use false causal links (car/parce que/porque/because) without a real logical connection

Context:
- ${themeContext}
- Pedagogical Focus: ${grammarFocus}
${tagInstruction}

Format:
- Between ${minLines} and ${maxLines} lines, alternating speakers
- Every line MUST begin with the speaker name and a colon
- Unless 'MISS' lesson: speakers are friends — use informal 'tu'/'on' (FR) or casual tone (EN)
- ONE location for the whole dialogue — no teleporting between scenes
- If a line asks a question, the next line must answer it
- Beginning → small development → natural conclusion, all in the same scene
- Stay within ${themeContext} — do not drift to unrelated topics
- Sound human: contractions, varied fillers (FR: Alors, Bah, Oh, Bon; EN: Well, So, Right). FORBIDDEN: "Tiens"
- Strictly 2-party dialogue — never address an invisible waiter/cashier/receptionist

ACTION AND SEMANTICS:
- ACTION PLAN STABILITY: When line N assigns roles (A waits, B goes to get something), lines N+1 onward MUST keep those roles unless someone explicitly changes the plan. BAD: "I wait while you search" → next line "let's wait together".
- FETCH vs SEARCH (FR: chercher vs aller chercher/récupérer): If the speaker already said WHERE the object is, use "aller la/le chercher", "récupérer", "vais la prendre" — NOT "chercher" (unknown location). EN: "go get it" not "look for it" when location is known.
- NO PHANTOM PROPS: Do NOT introduce new objects or places (tree, bench, cupboard) unless mentioned in the previous 1-2 lines or part of the opening scene. Do NOT invent a location just to teach a preposition (e.g. no "under a tree" to use "sous").
- PRESENT MOMENT: Keep the dialogue in present/immediate future. No past-tense anecdotes ("I waited 10 minutes...") unless explicitly reminiscing.
- PREMISE ALIGNMENT: If speaker A frames something as boring, bad, or unpleasant (e.g. "weekend ennuyeux"), speaker B must agree, disagree, or nuance that framing — NOT reply with only enthusiastic positives that contradict the premise.
- ENDING: If someone will go get something, end with them leaving or about to leave — NOT suddenly "I found it" without the fetch action.

❌ BAD — vocabulary checklist (NEVER produce this):
Sarah: "Tu as des chaussures pour le sport dans ton sac ?"
Mathis: "Non, j'ai seulement des baskets."
Sarah: "C'est dommage, car j'ai des chaussettes mais pas de serviettes." ← BROKEN: 'car' has no link to sneakers; towels appear from nowhere
Mathis: "Je vais chercher des serviettes dans l'armoire."
Sarah: "N'oublie pas les vêtements de rechange !" ← BROKEN: new items with no setup

❌ BAD — disconnected observations (NEVER produce this):
"Le hall est sombre." / "La porte est étroite." / "La clé est petite." — nobody is talking TO each other

❌ BAD — key on door (NEVER produce this):
Julia: "j'ai oublié ma clé sur la porte"
Victor: "j'attends pendant que tu la cherches" ← wrong verb; she knows where it is
Julia: "on attend ensemble devant l'immeuble" ← contradicts: both waiting now
Victor: "j'ai attendu sous cet arbre" ← phantom tree + past tense
Julia: "je l'ai trouvée" ← magic resolution without her going to get it

✅ GOOD — key on door (USE THIS PATTERN):
Julia: "Oh non, j'ai oublié ma clé sur la porte !"
Victor: "Bah, j'attends ici pendant que tu vas la chercher."
Julia: "D'accord, attends-moi devant cet immeuble sombre."
Victor: "Pas de souci, je ne bouge pas d'ici."
Julia: "Super, je reviens tout de suite !"

✅ GOOD — each line reacts to the previous (gym bag scene):
Sarah: "On va à la salle ? Tu as tes chaussures ?"
Mathis: "Oui, et mes chaussettes propres aussi. Tu as tout, toi ?"
Sarah: "Ah non, j'ai oublié ma serviette !"
Mathis: "Pas grave, j'en ai une. On y va ?"
Sarah: "Allez, on y va !"

❌ BAD — boring weekend premise broken (NEVER produce this):
Camille: "Tu as passé un bon week-end ?"
Victor: "Oui, j'ai visité le musée, le théâtre, la basilique — c'était génial !" ← contradicts if Camille later says the weekend was boring

✅ GOOD — premise stays consistent:
Camille: "Ton week-end était ennuyeux, non ?"
Victor: "Un peu, oui. Mais la fresque au musée m'a quand même plu."
Camille: "Ah bon ? Moi, l'ascension m'a fatiguée."

Before returning JSON, re-read line by line: does line N make sense because of line N-1? If not, rewrite.
${knownVocabInstruction}
${dialogueVocabGuard}
${translationInstruction}

LEVEL CONSTRAINTS (follow strictly):
${levelDesc}

Output ONLY this JSON object (no extra text):
{
  "dialogue": ${jsonDialogueTemplate},
  "dialogueTranslations": ["<pt-BR line 1>", "<pt-BR line 2>", ...],
  "newVocabulary": ${newVocabTemplate},
  "dialogueVerbs": ["verb_infinitive_1", "verb_infinitive_2", ...],
  "grammarFocus": "one sentence describing the grammar used"${tag === 'EXPR' || tag === 'CULT' ? `,
  "newChunks": [
    { "phrase": "<multi-word expression in ${lang}>", "translation": "<pt-BR>", "entryType": "expression" }
  ]` : ''}${tag === 'MISS' ? `,
  "rolePlayConsequences": [
    {
      "npcLineIndex": 2,
      "alternateText": "NPC line in ${lang} with slightly colder tone",
      "alternateTranslation": "PT-BR translation"
    }
  ]` : ''}
}

Rules:
- dialogue must have between ${minLines} and ${maxLines} lines
- dialogueTranslations: one short PT-BR string per dialogue line (max 15 words each)
- newVocabulary: EXACTLY 2 DISTINCT NON-VERB words as plain lowercase strings (no **, no quotes). Both must appear verbatim in the dialogue.
- dialogueVerbs: List EVERY verb used in the dialogue in its infinitive form.
- NEVER include days of the week, months of the year, or proper nouns in newVocabulary.
- Do NOT include imageKeywords, imageMatchOptions, or vocabTranslations — those are fetched separately.${tag === 'MISS' ? `
- rolePlayConsequences: optional — at most 1 alternate NPC line when the learner's previous turn was inadequate.` : ''}`;

  try {
    const fetchHook = async (correction = ''): Promise<HookResult | null> => {
      const raw = await callGeminiJSON<HookResult>(prompt + correction, systemPrompt, 4096, 0, 'critical');
      if (!raw?.dialogue || raw?.newVocabulary?.length !== 2) {
        console.error('[generateHook] Invalid minimal hook response');
        return null;
      }
      return finalizeHookResult(raw, nameA, nameB, knownVocabulary);
    };

    const first = await fetchHook();
    if (!first) return null;

    return resolveHookCoherence(
      first,
      (breaks) => fetchHook(buildCoherenceCorrectionBlock(breaks)),
      'generateHook',
    );
  } catch (err) {
    console.error('[generateHook] Error:', err);
    return null;
  }
}

/**
 * Stage 1 — fast path: dialogue + vocabulary only (~50% smaller prompt, standard tier).
 * Verbs, chunks, and roleplay consequences load via enrichHookMetadata in background.
 */
export async function generateMinimalHook(params: GenerateHookParams): Promise<HookResult | null> {
  const { prompt, systemPrompt, nameA, nameB } = buildMinimalHookPrompt(params);
  const { knownVocabulary } = params;
  try {
    const fetchHook = async (correction = ''): Promise<HookResult | null> => {
      const raw = await callGeminiJSON<HookResult>(prompt + correction, systemPrompt, 2048, 0, 'standard');
      if (!raw?.dialogue || raw?.newVocabulary?.length !== 2) {
        console.error('[generateMinimalHook] Invalid response');
        return null;
      }
      return finalizeHookResult(raw, nameA, nameB, knownVocabulary);
    };

    const first = await fetchHook();
    if (!first) return null;

    return resolveHookCoherence(
      first,
      (breaks) => fetchHook(buildCoherenceCorrectionBlock(breaks)),
      'generateMinimalHook',
    );
  } catch (err) {
    console.error('[generateMinimalHook] Error:', err);
    return null;
  }
}
