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
  approved?: boolean;    // true = approved for visual exercises
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
  status?: 'generating' | 'ready' | 'failed';
  hook?: HookResult;
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
  | 'image-match'
  | 'audio-dictation'
  | 'speak-repeat'
  | 'error-correction'
  | 'reverse-translation'
  | 'word-bank-translation'
  | 'bridge-choice'
  | 'listen-and-select'
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
  partOfSpeech?: string;
  infinitive?: string;
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
  imageMatchOptions?: Record<string, {
    distractors: string[];
    semanticFields: string[];
  }>;
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
  survivalTip?: string;       // Dica de sobrevivência ultra curta, ≤12 palavras
  culturalNote?: string;      // Detalhe ou curiosidade cultural de uso, ≤15 palavras
  structureFormula?: string;   // OPCIONAL: representação em cápsulas. ex: "[Sujeito] + [avoir (conjugado)] + mal + [à la / au / aux / à l']"
  structureFormulas?: Array<{
    label: string;
    formula: string;
    example?: { target: string; portuguese: string }; // Exemplo real que instancia esta fórmula
  }>; // Alternativas quando a regra tem 2+ construções
  formulaExample?: { target: string; portuguese: string }; // Exemplo real quando há só UMA fórmula
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
  brazilianTrap?: {
    wrong: string;
    right: string;
    explanation: string;
    subtitle?: string;        // Subtítulo dinâmico do Radar de Erro (ex.: "Evite a tradução direta")
    wrongPortuguese?: string; // Tradução PT-BR da frase errada (wrong)
    rightPortuguese?: string; // Tradução PT-BR da frase correta (right)
  } | string;                 // O "Radar do Erro": foca em interferências do PT-BR (suporta objeto ou string para retrocompatibilidade)
  retentionCheck?: {
    question: string;
    options: string[];
    correctIndex: number;
  };
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
  explanation?: string;   // PT-BR: why this word order is correct (shown after a wrong answer)
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
  /** Full corrected sentence — preferred for validation and rewrite mode. */
  corrected_sentence?: string;
  /** 0-based index of error_word in sentence_with_error when it appears more than once. */
  error_span_start?: number;
  /** replace = type only the replacement word; rewrite = type the full corrected sentence. */
  answer_mode?: 'replace' | 'rewrite';
  translation: string; // Portuguese translation of the correct sentence
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
  corrections?: Array<{
    wrong: string;
    correct: string;
    options: string[];
  }>;
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

export interface ImageMatchData {
  targetWord: string;
  translation: string;
  contextSentence?: string;
  options: Array<{
    word: string;
    imageUrl: string;
    imageAlt: string;
  }>;
  correctWord: string;
}

export interface WordBankTranslationData {
  portuguese_sentence: string;
  words: string[];
  correctOrder: string[];
  acceptable_variants?: string[][];
  hint?: string;
}

export interface BridgeChoiceData {
  scenario: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  trapRule?: string;
}

export interface ListenAndSelectData {
  audioText: string;
  options: string[];
  correctIndex: number;
  translation: string;
}

export type Exercise =
  | { type: 'context-choice';         data: ContextChoiceData }
  | { type: 'sentence-builder';       data: SentenceBuilderData }
  | { type: 'image-match';            data: ImageMatchData }
  | { type: 'reverse-translation';    data: ReverseTranslationData }
  | { type: 'word-bank-translation';  data: WordBankTranslationData }
  | { type: 'bridge-choice';          data: BridgeChoiceData }
  | { type: 'listen-and-select';      data: ListenAndSelectData }
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
