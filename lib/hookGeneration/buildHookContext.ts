import { NATURAL_PT_BR_RULE_COMPACT } from '@/lib/naturalPtBr';
import { buildKnownVocabularyMatcher } from '@/lib/vocabCanonical';
import type { SupportedLanguage, ProficiencyLevel, LessonTag } from '@/types';

/**
 * How many known words the fast-path prompt carries. The list is ordered oldest
 * first, so the tail holds the words the learner just saw — the ones the model
 * is most likely to reach for again.
 */
const KNOWN_WORDS_IN_PROMPT = 150;

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

export const DIALOGUE_LINE_RANGES: Record<ProficiencyLevel, { min: number; max: number }> = {
  A1: { min: 6, max: 8 },
  A2: { min: 8, max: 10 },
  B1: { min: 10, max: 12 },
  B2: { min: 10, max: 13 },
  C1: { min: 12, max: 14 },
  C2: { min: 12, max: 16 },
};

const COMPACT_LEVEL: Record<ProficiencyLevel, string> = {
  A1: 'A1: simple words, present or aller+infinitive. Fragments and one short reaction. No "Ça va ?" ritual.',
  A2: 'A2: spoken forms (t\'as, j\'ai pas, y a, on, ouais). Intonation questions. One short reaction. Close on a next step.',
  B1: 'B1: same spoken rhythm; imparfait/conditionnel only when the scene needs them.',
  B2: 'B2: spoken rhythm, varied vocab, a real back-and-forth — not an interview.',
  C1: 'C1: native spoken rhythm, register fits the relationship.',
  C2: 'C2: native spoken rhythm, including irony and understatement. Still a conversation, not a speech.',
};

/** Few-shot rhythm + register. The model copies this more than abstract rules. */
export function spokenDialogueGuidance(
  language: SupportedLanguage,
  level: ProficiencyLevel,
  tag: LessonTag,
): string {
  const advanced = level !== 'A1';
  const mission = tag === 'MISS';

  const relationship = mission
    ? `Register: "Você" speaks to one staff member or stranger. French uses "vous" unless they are clearly friends. English stays polite. Open with Bonjour / Excusez-moi / Hi, then the goal. Include one short reaction ("D'accord.", "Tout de suite.").`
    : `Register — pick ONE relationship and keep it for the whole dialogue:
- Friends, classmates, family, couple: French "tu", English casual.
- Shop, café staff, receptionist, stranger: French "vous", English polite.
Do not turn friends into waiter-talk mid-scene.`;

  const speech = language === 'fr'
    ? advanced
      ? `Spoken French, required:
- Write how people talk, not a textbook.
- Drop "ne": "j'ai pas", "c'est pas".
- Use "t'as", "t'es", "j'sais pas", "y a", and "on" for "nous".
- Questions by intonation ("t'as faim ?"), not "est-ce que" or inversion.
- Prefer "ouais" / "nan" over "oui" / "non".
- At least one turn is ONLY a short reaction (1–3 words): "Ah bon ?", "Ouais.", "Grave.", "Attends.", "Ça marche.", "T'inquiète."
- Do not start lines with "Alors".
- Do not open with "Ça va ?" and do not close with "Parfait, merci !" or a bare "Merci".
- Close on a decision or next step.`
      : `Spoken French for beginners:
- Simple everyday words. Present tense, or "aller" + infinitive.
- Fragments are real lines: "Sur la table.", "J'arrive.", "Le bus ?"
- At least one turn is a short reaction (1–3 words): "Ah bon ?", "D'accord.", "Oui."
- Questions by intonation. "y a" and "on" are fine. Keep "ne" when dropping it would hide the grammar point.
- Do not open with "Ça va ?" and do not close with "Parfait, merci !".`
    : advanced
      ? `Spoken English, required:
- Contractions and short turns. "Yeah" / "Nah", not "Yes, I would like that."
- Intonation questions ("You hungry?") instead of "Do you want to…?" on every line.
- At least one turn is 1–3 words: "Yeah.", "Hold on.", "No way.", "Got it."
- Do not open with "How are you?" and do not close with "Perfect, thanks!".
- Close on a decision or next step.`
      : `Spoken English for beginners:
- Simple words and fragments: "On the table.", "I'm coming.", "The bus?"
- At least one short reaction: "Yeah?", "Okay."
- Do not open with "How are you?" and do not close with "Perfect, thanks!".`;

  const example = mission
    ? ''
    : language === 'fr'
      ? advanced
        ? `Copy this rhythm, not this topic or this length. Add beats until you hit the line count:
Sophie: "T'es où ?"
Lucas: "Au taf, pourquoi ?"
Sophie: "J'ai trop faim. On se prend un truc ?"
Lucas: "Ouais, vas-y."
Sophie: "Devant la boulangerie, à une heure ?"
Lucas: "Ça marche. J'arrive."`
        : `Copy this rhythm, not this topic or this length. Add beats until you hit the line count:
Marie: "Le café ?"
Hugo: "Sur la table."
Marie: "Ah bon ?"
Hugo: "Oui, là."
Marie: "J'arrive."`
      : advanced
        ? `Copy this rhythm, not this topic or this length. Add beats until you hit the line count:
Emma: "Where are you?"
Jake: "Still at work. Why?"
Emma: "I'm starving. Food?"
Jake: "Yeah, let's go."
Emma: "Bakery at one?"
Jake: "Works. I'm coming."`
        : `Copy this rhythm, not this topic or this length. Add beats until you hit the line count:
Emma: "The coffee?"
Jake: "On the table."
Emma: "Yeah?"
Jake: "Right there."
Emma: "I'm coming."`;

  return [relationship, speech, example].filter(Boolean).join('\n');
}

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
      return `MISSION: "Você" + one local role in the target language. Start with Bonjour/Excusez-moi/Hi, then urgent goal tied to "${grammarFocus}", then resolve.`;
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
    ? `ANTI-REUSE: Do not repeat the previous scene's situation or mood adjectives. Start inside a NEW goal or problem.`
    : `SCENE VARIETY: Invent a fresh real-life micro-situation from Theme / Focus. Vary places, goals, and mood.`;

  const themeContext = theme
    ? `Theme: ${theme}${uiTitle ? ` · ${uiTitle}` : ''}${arcBlock ? ` · ${arcBlock}` : ''}`
    : `Topic: ${pickTopic(level, interests)}`;

  let normalizedKnown = knownVocabulary.map((w) => w.toLowerCase());
  let targetVocabWord = '';
  if (tag === 'VOC') {
    const focusWord = grammarFocus.replace(/vocabulario:|vocabulário:|vocabulary:/i, '').trim().toLowerCase();
    // Already-stored targets stay excluded — they get stripped after generation anyway.
    if (focusWord && !buildKnownVocabularyMatcher(knownVocabulary)(focusWord)) {
      targetVocabWord = focusWord;
      normalizedKnown = normalizedKnown.filter((w) => w !== targetVocabWord);
    }
  }

  const knownBlock =
    normalizedKnown.length > 0
      ? `Already learned (most recent last) — forbidden in newVocabulary, including plural / feminine / article-glued variants: [${normalizedKnown.slice(-KNOWN_WORDS_IN_PROMPT).join(', ')}]`
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

  const conversationArc =
    tag === 'MISS'
      ? `Arc: Bonjour / Excusez-moi / Hi → the concrete goal → a clear resolution. Include one short reaction.`
      : `Arc: start inside the scene (a "Ça va ?" / "How are you?" ritual is forbidden) → the lesson focus, with one short reaction turn → close on a decision or next step, never "Parfait, merci !" / "Perfect, thanks!".`;

  const prompt = `${speakerIntro}

Context: ${themeContext}
Focus: ${grammarFocus}
${compactTagInstruction(tag, grammarFocus, uiTitle, theme)}
${knownBlock}
${antiReuse}

${spokenDialogueGuidance(language, level, tag)}

Rules:
- ${minLines}–${maxLines} lines; each line starts with "Name: "
- ONE scene; each line reacts to the previous line
- ${conversationArc}
- A 1–3 word reaction counts as a full line. Most other lines stay short. Fragments are correct.
- PREMISE ALIGNMENT: If speaker A frames something negatively (too expensive, too tiring, disappointing…), speaker B must agree, disagree, or nuance — NOT only enthusiastic positives that contradict it
- Exactly 2 newVocabulary items (non-verbs, lowercase, appear in dialogue)
- NEVER include days of the week, months of the year, speaker names, or other proper nouns in newVocabulary (e.g. Alice, Marie, Paris)
- ${translationRule}
- ${NATURAL_PT_BR_RULE_COMPACT}
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
