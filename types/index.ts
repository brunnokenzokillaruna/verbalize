import type { Timestamp } from 'firebase/firestore';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserDocument {
  uid: string;
  email: string;
  name: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;

  // Personalization
  profession: string;
  interests: string[];
  languageGoals: string;
  currentTargetLanguage: 'fr' | 'en';

  // High-level stats
  currentStreak: number;
  totalLessonsCompleted: number;
  lastLessonDate?: Timestamp; // date-only (midnight UTC) of the last completed lesson

  // Per-language lesson progress: maps language → ID of the next lesson to study
  lessonProgress?: Partial<Record<SupportedLanguage, string>>;
}

// ─── Vocabulary & SRS ─────────────────────────────────────────────────────────

export interface UserVocabularyDocument {
  id: string;
  uid: string;
  language: 'fr' | 'en';

  word: string;
  translation: string;
  imageUrl?: string;
  wordType?: 'verb' | 'noun';

  // SRS Data
  firstSeen: Timestamp;
  lastReview: Timestamp;
  nextReview: Timestamp;
  srsLevel: number; // 0–5 indicating memory strength
  mistakeCount: number;
}

// ─── Image Cache ──────────────────────────────────────────────────────────────

export interface ImageCacheDocument {
  word: string; // Document ID (e.g., "apple_isolated")
  language: string;
  imageUrl: string;
  photographer: string;
  createdAt: Timestamp;
  approved?: boolean;    // true = excluded from admin review queue
  translation?: string;  // pt-BR translation, cached for admin display
}

// ─── Lesson Mistakes ──────────────────────────────────────────────────────────

export interface LessonMistakeDocument {
  id?: string;             // Firestore doc ID
  uid: string;
  language: SupportedLanguage;
  grammarFocus: string;    // e.g. "Present tense of être"
  mistakeContext: string;  // description of what went wrong, used as AI context
  lessonId: string;
  level: ProficiencyLevel;
  createdAt: Timestamp;
}

// ─── Lesson Log ───────────────────────────────────────────────────────────────

export interface LessonLogDocument {
  id: string;
  uid: string;
  language: 'fr' | 'en';
  lessonId: string;
  completedAt: Timestamp;
  score: number; // 0–100
}

// ─── Verbs ────────────────────────────────────────────────────────────────────

export interface VerbDocument {
  infinitive: string; // Document ID
  language: 'fr' | 'en';
  translation: string;

  conjugations: {
    present: Record<string, string>;
    past?: Record<string, string>;
    future?: Record<string, string>;
    conditional?: Record<string, string>;
    subjunctive?: Record<string, string>;
    imperfect?: Record<string, string>;
  };

  exampleSentences: Array<{
    target: string;
    portuguese: string;
  }>;
}

// ─── Pre-generated Lesson Cache ───────────────────────────────────────────────

export interface PregeneratedLessonDocument {
  uid: string;
  lessonId: string;
  hook: HookResult;
  grammarBridge?: GrammarBridgeResult;
  exercises?: Exercise[];
  missionBriefing?: MissionBriefingResult; // MISS lessons only
  createdAt: Timestamp;
}

// ─── Lesson ───────────────────────────────────────────────────────────────────

export type LessonStage = 'intro' | 'vocabulary' | 'hook' | 'role-play' | 'phonetics' | 'mission' | 'grammar' | 'practice' | 'review';

export type SupportedLanguage = 'fr' | 'en';

export type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ExerciseType =
  | 'context-choice'
  | 'sentence-builder'
  | 'audio-dictation'
  | 'speak-repeat'
  | 'error-correction'
  | 'reverse-translation'
  | 'social-roleplay'
  | 'scrambled-conversation'
  | 'interactive-subtitles'
  | 'logic-connectors'
  | 'grammar-trap'
  | 'minimal-pair'
  | 'conjugation-speed';

// ─── Server Action Result Types ───────────────────────────────────────────────

export interface TranslateWordResult {
  translation: string;
  explanation: string;
  example: string;
}

export interface PhoneticsTipResult {
  title: string;
  explanation: string;
  examples: Array<{ word: string; soundsLike: string; tip: string }>;
  brazilianTrap: string;
}

export interface MissionBriefingResult {
  scenario: string;
  objectives: string[];
  keyPhrases: string[];
  stakes?: string;       // 1 short PT-BR sentence: what's at risk if the mission fails
  timePressure?: string; // short PT-BR label for the urgency badge (e.g., "Urgente", "Antes do trem sair")
}

export interface HookResult {
  dialogue: string;
  dialogueTranslations?: string[]; // pt-BR translations, one per dialogue line
  newVocabulary: string[];
  grammarFocus: string;
  verbWord?: string;
  // Bundled from super-hook (eliminates separate Gemini round-trips)
  grammarBridge?: GrammarBridgeResult;
  imageKeywords?: Record<string, string>;            // word → Pexels search term
  vocabTranslations?: Record<string, TranslateWordResult>; // word → translation data
  dialogueVerbs?: string[];                          // all verbs (infinitives) used in the dialogue
  curiosidade?: string;                              // engaging fun fact in casual PT-BR, every lesson
  phoneticsTip?: PhoneticsTipResult;                 // PRON only
  missionBriefing?: MissionBriefingResult;           // MISS only
}

export interface GrammarBridgeResult {
  // ── Novo formato estruturado (Portuguese Bridge Method) ───────────────────
  insight?: string;           // 1 frase "aha!" em PT-BR — o gancho imediato
  explanation?: string | string[]; // 2-4 frases em PT-BR explicando a regra com profundidade. Pode ser um array para múltiplos tópicos.
  bridge?: {
    portuguese: string;       // Padrão/frase como se diz em PT-BR
    target: string;           // Equivalente na língua-alvo
    difference: string;       // 1 frase PT-BR explicando a diferença chave, ≤15 palavras
  };
  dialogueExample?: {
    target: string;           // Frase real do diálogo atual
    portuguese: string;       // Equivalente PT-BR
  };
  additionalExamples?: Array<{ target: string; portuguese: string }>; // 2 exemplos extras
  items?: Array<{ target: string; portuguese: string; logic?: string }>; // OPCIONAL: Usado para lições com múltiplos itens (ex: interrogativas, expressões)
  brazilianTrap?: string;     // O "Radar do Erro": foca em interferências do PT-BR
  usageContext?: string;      // O "Cenário de Uso": explica a vibe social (formal, casual, etc)
  patterns?: Array<{          // "Pattern Strips": mostra a regra em 2-3 variações rápidas
    label: string;            // ex: "Plural", "Negativa", "Pessoa"
    target: string;
    portuguese: string;
  }>;

  // ── Verb Spotlight (apenas para lições de tag VERB) ───────────────────────
  verbSpotlight?: {
    infinitive: string;          // ex: "être"
    meaning: string;             // ex: "ser / estar"
    personality: string;         // 1 frase: "jeito" do verbo em PT-BR, ≤15 palavras
    frequencyNote?: string;      // ex: "3º verbo mais usado em francês", ≤12 palavras
    idiomaticExpressions?: Array<{ target: string; portuguese: string }>; // 1-2 expressões fixas
    conjugationPreview?: Array<{ pronoun: string; form: string }>; // 3-6 conjugações principais no presente
  };

  // ── Campos legados (backward compat com lessons cacheadas no Firestore) ───
  rule?: string;
  targetExample?: string;
  portugueseComparison?: string;
}

export interface VocabImageResult {
  imageUrl: string;
  imageAlt: string;
}

// ─── Curriculum & Lesson Engine ───────────────────────────────────────────────

export type LessonTag = 'GRAM' | 'VOC' | 'DIAL' | 'MISS' | 'PRON' | 'VERB' | 'EXPR' | 'CULT';

export interface LessonDefinition {
  id: string;
  language: SupportedLanguage;
  level: ProficiencyLevel;
  tag: LessonTag;
  uiTitle?: string;
  grammarFocus: string;
  theme: string;
}

// ─── Exercise Data Types ──────────────────────────────────────────────────────

export interface ContextChoiceData {
  sentence: string;      // "Je ___ un café." (blank represented as ___)
  blankWord: string;     // the correct answer
  options: string[];     // 4 options including the correct one
  translation: string;   // Portuguese translation of the full sentence
}

export interface SentenceBuilderData {
  words: string[];        // shuffled word list
  correctOrder: string[]; // correct arrangement
  translation: string;    // Portuguese translation
}

export interface ReverseTranslationData {
  portuguese_sentence: string;
  target_translation: string;
  acceptable_variants: string[];
  hint?: string;
}

export interface DictationData {
  text: string;        // text to play via TTS
  translation: string; // Portuguese hint
}

export interface ErrorCorrectionData {
  sentence_with_error: string;
  error_word: string;
  correct_word: string;
  explanation: string; // in Portuguese
  acceptable_answers?: string[]; // other grammatically valid alternatives
}

export interface SpeakRepeatData {
  text: string;        // sentence to say aloud (in target language)
  translation: string; // Portuguese hint
}

export interface SocialRoleplayData {
  context: string;      // A short setup (e.g. "Você está em um café")
  promptLine: string;   // What the other person says
  options: string[];    // 3 possible responses
  correctIndex: number;
  explanation: string;  // Why this is the best response
}

export interface ScrambledConversationData {
  lines: string[];         // The lines in correct order
  shuffledLines: string[]; // Shuffled for the user to sort
}

export interface InteractiveSubtitlesData {
  correctText: string;     // The original clean sentence
  errorText: string;       // The sentence with some words swapped/wrong
  wrongWords: string[];    // The words the user must click to "fix"
  translations: string;    // Portuguese translation
}

export interface LogicConnectorsData {
  partA: string;           // First part of the sentence
  partB: string;           // Second part
  options: string[];       // Connector options (but, because, so...)
  correctConnector: string;
  translation: string;
}

export interface GrammarTrapData {
  scenario: string;        // PT-BR: brief context about the trap being tested
  question: string;        // PT-BR: question shown to the student
  options: Array<{
    sentence: string;      // Sentence in target language
    translation: string;   // PT-BR translation
    isCorrect: boolean;    // Exactly ONE must be true
  }>;
  explanation: string;     // PT-BR: explanation shown when the student answers wrong
  trapRule: string;        // PT-BR: 1 short sentence about the Brazilian error pattern
}

export interface MinimalPairData {
  wordA: string;           // First word (target language)
  wordB: string;           // Second word (minimal pair)
  correctWord: string;     // Which word is being asked about — must equal wordA or wordB
  sentenceContext: string; // A sentence using the correctWord in context
  translation: string;     // PT-BR translation of the sentence
  tip: string;             // PT-BR: pronunciation tip to distinguish the pair
}

export interface ConjugationSpeedData {
  verb: string;            // Infinitive form
  pronoun: string;         // Subject pronoun (e.g. "je", "il", "nous")
  tense: string;           // PT-BR tense name (e.g. "presente")
  correctForm: string;     // Correct conjugated form
  options: string[];       // 4 options (1 correct + 3 distractors)
  exampleSentence: string; // Full sentence using the correct form
  translation: string;     // PT-BR translation
}

export type Exercise =
  | { type: 'context-choice';         data: ContextChoiceData }
  | { type: 'sentence-builder';       data: SentenceBuilderData }
  | { type: 'reverse-translation';    data: ReverseTranslationData }
  | { type: 'audio-dictation';        data: DictationData }
  | { type: 'error-correction';       data: ErrorCorrectionData }
  | { type: 'speak-repeat';           data: SpeakRepeatData }
  | { type: 'social-roleplay';        data: SocialRoleplayData }
  | { type: 'scrambled-conversation'; data: ScrambledConversationData }
  | { type: 'interactive-subtitles';  data: InteractiveSubtitlesData }
  | { type: 'logic-connectors';       data: LogicConnectorsData }
  | { type: 'grammar-trap';           data: GrammarTrapData }
  | { type: 'minimal-pair';           data: MinimalPairData }
  | { type: 'conjugation-speed';      data: ConjugationSpeedData };
