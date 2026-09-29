'use server';

import { callGeminiJSON } from '@/services/gemini';
import { validateDialogueCoherence } from '@/lib/validateDialogueCoherence';
import {
  buildMinimalHookPrompt,
  DIALOGUE_LINE_RANGES,
  spokenDialogueGuidance,
  type HookGenerationParams,
} from '@/lib/hookGeneration/buildHookContext';
import { filterHookVocabularyForKnownWords } from '@/lib/hookVocabulary';
import { buildKnownVocabularyMatcher } from '@/lib/vocabCanonical';
import { sanitizeDialogueText, sanitizeVocabularyToken, stripMarkdownEmphasis } from '@/lib/hookSanitize';
import {
  NATURAL_PT_BR_RULE,
  normalizeToEverydayPtBr,
  normalizeToEverydayPtBrOptional,
} from '@/lib/naturalPtBr';
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
      'at a restaurant', 'shopping for clothes', 'going to school', 'cooking a meal',
      'public transport', 'weekend plans', 'a phone call with a friend',
      'at the market', 'asking for directions', 'meeting after class',
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

const LEVEL_DESCRIPTORS: Record<ProficiencyLevel, string> = {
  A1: `
STRICT A1 BEGINNER rules — the learner knows almost nothing yet:
- Vocabulary: the 300–500 most common everyday words.
- Grammar: present tense of être/avoir (FR) or to be/to have (EN) and basic -ER verbs. Intonation questions. NO future except futur proche with "aller". Immediate "j'ai" + past participle is ok only if the scene needs it (j'ai oublié).
- Length: most lines ≤ 8 words. A 1–3 word reaction is a real line, not an error.
- Follow the spoken-register block. Do not run a "Ça va ?" ritual.`,

  A2: `
A2 ELEMENTARY rules — everyday situations, spoken not written:
- Vocabulary: common everyday vocabulary (500–1 500 words).
- Grammar: present, passé composé, futur proche, basic modals — only when the scene needs them.
- Length: content lines about 6–12 words, plus at least one 1–3 word reaction.
- Follow the spoken-register block. No greeting ritual, no "Parfait, à tout de suite !".`,

  B1: `
B1 INTERMEDIATE rules — familiar topics, still spoken:
- Vocabulary: intermediate (1 500–3 000 words), idioms that people actually say.
- Grammar: A2 plus imparfait, conditionnel, simple relatives — only when the scene needs them.
- Length: mix of short reactions and lines of about 8–16 words.
- Follow the spoken-register block. A story about last summer is a conversation, not a report.`,

  B2: `
B2 UPPER-INTERMEDIATE rules:
- Vocabulary: varied, including collocations people use in speech.
- Grammar: subjonctif, complex conjunctions, when the point needs them — not every line.
- Length: natural, mixed with short reactions. Not a row of 20-word sentences.
- Follow the spoken-register block.`,

  C1: `
C1 ADVANCED rules:
- Precise spoken register for the relationship (friend vs colleague vs stranger).
- Native rhythm: understatement, repair, short reactions. Avoid speech-like clauses.
- Follow the spoken-register block.`,

  C2: `
C2 MASTERY rules:
- Native spoken language, including irony. Literary tenses stay out of a casual chat.
- Follow the spoken-register block.`,
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

function normalizeHookResult(
  result: HookResult,
  nameA: string,
  nameB: string,
): HookResult {
  result.dialogue = sanitizeDialogueText(result.dialogue);
  result.dialogue = fixDialogueLabels(result.dialogue, nameA, nameB);

  result.newVocabulary = [...new Set(
    result.newVocabulary
      .map((w: string) => sanitizeVocabularyToken(w))
      .filter((w: string) => w.length > 0),
  )];

  if (result.dialogueTranslations) {
    result.dialogueTranslations = result.dialogueTranslations.map((line) =>
      normalizeToEverydayPtBr(stripMarkdownEmphasis(line)),
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
        translation: normalizeToEverydayPtBr(c.translation.trim()),
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
        alternateTranslation: normalizeToEverydayPtBrOptional(c.alternateTranslation?.trim()),
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
    lastScenarioSummary
      ? `Previous scene recap: ${lastScenarioSummary}\nANTI-REUSE: Do NOT reuse the same situation or mood adjectives from that recap. Start inside a NEW goal or problem — do not replay a "Ça va ?" ritual.`
      : '',
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
- SIMPLICITY: Everyday words. Short reactions are fine. Content lines stay readable, about 4–12 words. Grammar stays basic (être/avoir/aller/faire in FR; be/have/go/do in EN) unless the focus needs one other form.`;
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
- TRANSACTIONAL OPEN: Line 1 (or lines 1–2) MUST start with a short real-life service opening (FR: "Bonjour", "Excusez-moi"; EN: "Hi", "Excuse me") before the request. Then pursue the mission goal.
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

  const systemPrompt = `Você é um amigo brasileiro muito gente boa e fluente em ${lang}. O diálogo no idioma alvo tem que soar falado, como no dia a dia — não como livro didático.
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
    // so the AI isn't forced to exclude it from newVocabulary. A target the learner
    // already has stored stays excluded — it would be stripped after generation
    // anyway, wasting one of the two slots.
    const focusWord = grammarFocus.replace(/vocabulario:|vocabulário:|vocabulary:/i, '').trim().toLowerCase();
    if (focusWord && !buildKnownVocabularyMatcher(knownVocabulary)(focusWord)) {
      targetVocabWord = focusWord;
      normalizedKnown = normalizedKnown.filter((w) => w !== targetVocabWord);
    }
  }

  const knownVocabInstruction = normalizedKnown.length > 0
    ? `- CRITICAL REPETITION RULE: The user has already learned the following words (most recently learned ones last). You MUST NOT put any of them in 'newVocabulary', and neither a plural, feminine or article-glued variant of them (if 'ami' is listed, 'amie'/'amies'/'l'ami' are all forbidden too): [${normalizedKnown.slice(-1000).join(', ')}]`
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
  
  const translationInstruction = `${
    intentMode
      ? `- INTENT MODE TRANSLATIONS: Because this is an advanced mission, 'dialogueTranslations' for the learner's ("Você") lines MUST BE INTENTS, not literal translations. Example: "Diga que você não concorda e sugira ir de trem." or "Peça a conta e pergunte se aceitam cartão." The local's lines should remain normal natural Portuguese translations.`
      : `- NATURAL TRANSLATIONS: 'dialogueTranslations' must be NATURAL Brazilian Portuguese — NO dictionary-style parentheticals. Just how a Brazilian would say it. Use "buscar" (go get) not "procurar" (search) when the speaker already knows where something is.`
  }
${NATURAL_PT_BR_RULE}`;

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
- ONE location for the whole dialogue — no teleporting between scenes
- If a line asks a question, the next line must answer it
- CONVERSATION ARC:
  1. Start inside the scene. A "Ça va ?" / "How are you?" ritual is forbidden. A mission opens with Bonjour / Excusez-moi / Hi, then the goal.
  2. TOPIC: the pedagogical focus, including at least one 1–3 word reaction turn.
  3. CLOSE on a decision or next step. Never "Parfait, merci !", "Merci !", "Perfect, thanks!", or "à tout à l'heure" alone.
- Stay within ${themeContext} — do not drift to unrelated topics
- Strictly 2-party dialogue — never address an invisible waiter/cashier/receptionist

${spokenDialogueGuidance(language, level, tag)}

ACTION AND SEMANTICS:
- ACTION PLAN STABILITY: When line N assigns roles (A waits, B goes to get something), lines N+1 onward MUST keep those roles unless someone explicitly changes the plan. BAD: "I wait while you search" → next line "let's wait together".
- FETCH vs SEARCH (FR: chercher vs aller chercher/récupérer): If the speaker already said WHERE the object is, use "aller la/le chercher", "récupérer", "vais la prendre" — NOT "chercher" (unknown location). EN: "go get it" not "look for it" when location is known.
- NO PHANTOM PROPS: Do NOT introduce new objects or places (tree, bench, cupboard) unless mentioned in the previous 1-2 lines or part of the opening scene. Do NOT invent a location just to teach a preposition (e.g. no "under a tree" to use "sous").
- IMMEDIATE PAST IS FINE ("j'ai oublié", "t'as vu"). Do not add a long reminiscence that leaves the scene ("j'ai attendu dix minutes sous un arbre").
- PREMISE ALIGNMENT: If speaker A frames something negatively (too expensive, too tiring, too late, disappointing…), speaker B must agree, disagree, or nuance that framing — NOT reply with only enthusiastic positives that contradict it.
- SCENE VARIETY: Invent a fresh, realistic micro-situation from Theme / Scenario / grammar focus. Do NOT reuse the same weekend-recap plot or the same mood adjective across lessons. Vary places, goals, and mood.
- ENDING: If someone will go get something, end with them leaving or about to leave — NOT suddenly "I found it" without the fetch action.

❌ BAD — textbook ritual (NEVER produce this):
Marie: "Salut Hugo ! Ça va ?"
Hugo: "Salut ! Oui, ça va très bien."
Marie: "Où est le café ?"
Hugo: "Il est là, sur la table."
Marie: "Parfait, merci !"

❌ BAD — vocabulary checklist (NEVER produce this):
Sarah: "Tu as des chaussures pour le sport dans ton sac ?"
Mathis: "Non, j'ai seulement des baskets."
Sarah: "C'est dommage, car j'ai des chaussettes mais pas de serviettes." ← BROKEN: 'car' has no link; towels appear from nowhere
Mathis: "Je vais chercher des serviettes dans l'armoire."

❌ BAD — disconnected observations (NEVER produce this):
"Le hall est sombre." / "La porte est étroite." — nobody is talking TO each other

❌ BAD — key on door (NEVER produce this):
Julia: "j'ai oublié ma clé sur la porte"
Victor: "j'attends pendant que tu la cherches" ← wrong verb; she knows where it is
Julia: "on attend ensemble devant l'immeuble" ← contradicts: both waiting now
Victor: "j'ai attendu sous cet arbre" ← phantom tree
Julia: "je l'ai trouvée" ← magic resolution without her going to get it

✅ GOOD — key, spoken, with a short reaction:
Julia: "Victor ?"
Victor: "Ouais ?"
Julia: "J'ai oublié la clé sur la porte."
Victor: "Attends. Je reste ici, tu vas la chercher."
Julia: "Ça marche. Je reviens."

✅ GOOD — gym bag, each line reacts:
Sarah: "On va à la salle ?"
Mathis: "Ouais. T'as tes chaussures ?"
Sarah: "Ouais, et des chaussettes propres. Toi ?"
Mathis: "Ah non. J'ai oublié ma serviette."
Sarah: "T'inquiète, j'en ai une."
Mathis: "Grave. On y va."

❌ BAD — premise broken (NEVER produce this):
Léa: "C'est trop cher, ce resto, non ?"
Hugo: "Oui, et en plus c'était génial, j'adore tout !"

✅ GOOD — premise stays consistent:
Léa: "C'est trop cher, ce resto, non ?"
Hugo: "Un peu, ouais."
Léa: "Moi je prends juste une entrée."
Hugo: "Ça marche."

Before returning JSON, re-read line by line: does line N make sense because of line N-1? Does it sound spoken? If not, rewrite.
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
      const raw = await callGeminiJSON<HookResult>(prompt + correction, systemPrompt, 2048, 0, 'critical');
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
