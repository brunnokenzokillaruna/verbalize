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

  /** Bumped when the lesson catalog changes in a breaking way (see lessonIdMigration). */
  curriculumVersion?: number;

  /** Audit trail for the most recent curriculum migration applied to this user. */
  curriculumMigrationMeta?: {
    version: number;
    fromVersion: number;
    progressChanges: Array<{ language: SupportedLanguage; from: string; to: string }>;
    migratedAt?: Timestamp;
  };

  /** Oral and written production attempt counters (optional — lazy backfill). */
  productionStats?: {
    oralAttempts: number;
    oralAccepted: number;
    /** Spontaneous oral production (not echo/repeat). Phase 0+. */
    oralSpontaneousAttempts?: number;
    oralSpontaneousAccepted?: number;
    freeWriteAttempts: number;
    freeWriteAccepted: number;
    /** Accepted production sentences this week (resets each Monday UTC). */
    weeklyAccepted?: number;
    /** Oral accepted this week (echo + spontaneous). */
    weeklyOralAccepted?: number;
    /** Spontaneous oral accepted this week (subset of weeklyOralAccepted). */
    weeklyOralSpontaneousAccepted?: number;
    /** Written accepted this week (free production). */
    weeklyWriteAccepted?: number;
    weeklyWeekStart?: string;
    /** Oral exercises finished with recording/evaluation (not skip / no-mic bypass). */
    oralExerciseCompleted?: number;
    /** Oral exercises skipped or bypassed without recording. */
    oralExerciseSkipped?: number;
    lastUpdated?: Timestamp;
  };

  /** Immersion preference for UI instructions. */
  immersionMode?: 'auto' | 'always' | 'never';

  /** Last scenario summary for narrative continuity within a theme arc. */
  lastScenarioSummary?: string;
}

// ─── Vocabulary & SRS ─────────────────────────────────────────────────────────

export interface UserVocabularyDocument {
  id: string;
  uid: string;
  language: 'fr' | 'en';

  word: string;
  wordKey?: string;
  translation: string;
  imageUrl?: string;
  wordType?: 'verb' | 'noun';
  entryType?: 'word' | 'chunk' | 'collocation' | 'expression' | 'phrasal_verb';
  productionCount?: number;
  encounterCount?: number;
  knowledgeMode?: 'passive' | 'active';

  // SRS Data
  firstSeen: Timestamp;
  lastReview: Timestamp;
  nextReview: Timestamp;
  srsLevel: number; // 0–5 indicating memory strength
  mistakeCount: number;
}

// ─── Image Cache ──────────────────────────────────────────────────────────────

export interface ImageCacheDocument {
  word: string; // Document ID (e.g., "gazon_fr" or "scene_fr-a1-001")
  language: string;
  imageUrl: string;
  photographer: string;
  createdAt: Timestamp;
  approved?: boolean;    // true = validated for learners
  translation?: string;  // pt-BR meaning used for image search
  searchKeyword?: string;
  /** vocab = word flashcard; lesson_scene = shared cover/dialogue scene */
  kind?: 'vocab' | 'lesson_scene';
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
  /** Lesson tag at completion time (for analytics). */
  lessonTag?: LessonTag;
  /** Learner accepted at least one spontaneous production attempt in this session. */
  hadSpontaneousProductionAccepted?: boolean;
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
  schemaVersion?: number;
  hook?: HookResult;
  grammarBridge?: GrammarBridgeResult;
  exercises?: Exercise[];
  missionBriefing?: MissionBriefingResult; // MISS lessons only
  checkpointSession?: CheckpointSessionResult; // REVIEW lessons only
  createdAt: Timestamp;
}

// ─── Lesson ───────────────────────────────────────────────────────────────────

export type LessonStage =
  | 'intro'
  | 'vocabulary'
  | 'hook'
  | 'role-play'
  | 'phonetics'
  | 'mission'
  | 'grammar'
  | 'practice'
  | 'review'
  | 'complete'
  | 'briefing'
  | 'comprehension'
  | 'production'
  | 'debrief';

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
  | 'listening-comprehension'
  | 'social-roleplay'
  | 'scrambled-conversation'
  | 'interactive-subtitles'
  | 'logic-connectors'
  | 'grammar-trap'
  | 'minimal-pair'
  | 'minimal-pair-production'
  | 'conjugation-speed'
  | 'listen-and-respond'
  | 'free-roleplay'
  | 'micro-message'
  | 'paraphrase'
  | 'fill-gap-production'
  | 'shadowing'
  | 'translation-with-constraint'
  | 'voicemail-dictation'
  | 'inference-tone'
  | 'connected-speech'
  | 'story-continuation'
  | 'spot-the-register'
  | 'prompted-monologue';

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
  /** MISS only — alternate NPC lines when the learner's previous turn was inadequate. */
  rolePlayConsequences?: RolePlayConsequence[];
  newChunks?: Array<{ phrase: string; translation: string; entryType: 'chunk' | 'collocation' | 'expression' | 'phrasal_verb' }>;
}

export interface RolePlayConsequence {
  /** 0-based index of the NPC dialogue line to swap when the preceding user turn failed. */
  npcLineIndex: number;
  alternateText: string;
  alternateTranslation?: string;
}

export interface GrammarBridgeResult {
  // ── Novo formato estruturado (Portuguese Bridge Method) ───────────────────
  insight?: string;           // 1 frase "aha!" em PT-BR — o gancho imediato
  analogy?: string;           // 1 frase "pensa assim…" — analogia do dia a dia (opcional)
  explanation?: string | string[]; // 2-4 frases em PT-BR explicando a regra com profundidade. Pode ser um array para múltiplos tópicos.
  survivalTip?: string;       // Dica de sobrevivência ultra curta, ≤12 palavras
  culturalNote?: string;      // Detalhe ou curiosidade cultural de uso, ≤15 palavras
  structureFormula?: string;   // OPCIONAL: representação em cápsulas. ex: "[Sujeito] + [avoir (conjugado)] + mal + [à la / au / aux / à l']"
  structureFormulas?: Array<{
    label: string;
    formula: string;
    hint?: string;            // 1 frase: quando usar esta construção
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
  additionalExamples?: Array<{ target: string; portuguese: string }>; // até 2 exemplos extras
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

export type LessonTag = 'GRAM' | 'VOC' | 'DIAL' | 'MISS' | 'PRON' | 'VERB' | 'EXPR' | 'CULT' | 'REVIEW';

export interface LessonDefinition {
  id: string;
  language: SupportedLanguage;
  level: ProficiencyLevel;
  tag: LessonTag;
  uiTitle?: string;
  grammarFocus: string;
  theme: string;
  arcCharacters?: { learner?: string; local?: string };
  arcSummary?: string;
}

export interface CheckpointComprehensionQuestion {
  questionPt: string;
  options: string[];
  correctIndex: number;
  explanationPt: string;
  /** Grammar focus this item samples from the prior lesson window. */
  topicFocus?: string;
}

export interface CheckpointTopicResult {
  topic: string;
  skill: 'comprehension' | 'production';
  correct: boolean;
}

export interface CheckpointSessionResult {
  briefing: string;
  dialogueAudio: string;
  comprehensionQuestions: CheckpointComprehensionQuestion[];
  productionExercises: Exercise[];
  /** Parallel to productionExercises — which window topic each item assesses. */
  productionTopics?: string[];
  /** Full prior window (retrieval cues). */
  coveredTopics: string[];
  /** Subset actually sampled in dialogue / items. */
  assessedTopics?: string[];
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
  linkedExerciseId?: string;
  chainAnchorPhrase?: string;
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

/** Phase 5 P6 — extended spontaneous monologue from a prompt (oral production). */
export interface PromptedMonologueData {
  contextPt: string;
  promptPt: string;
  speakingGoalPt: string;
  evaluationCriteria: string;
  acceptableThemes: string[];
  exampleMonologue: string;
  keyPoints?: string[];
  explanationPt: string;
}

/** Phase 5 P5 — rewrite a dialogue line with wrong register. */
export interface SpotTheRegisterData {
  context: string;
  dialogueLines: string[];
  wrongLineIndex: number;
  registerIssuePt: string;
  targetRegisterPt: string;
  evaluationCriteria: string;
  acceptableThemes: string[];
  correctedLine: string;
  explanationPt: string;
}

/** Phase 5 P5 — continue a micro-narrative with free written production. */
export interface StoryContinuationData {
  storyOpening: string;
  storyTranslation: string;
  contextPt: string;
  promptPt: string;
  evaluationCriteria: string;
  acceptableThemes: string[];
  exampleContinuation: string;
  explanationPt: string;
}

/** Phase 5 P4 — listen for liaison/linking and transcribe connected speech. */
export interface ConnectedSpeechData {
  audioText: string;
  translation: string;
  contextPt: string;
  phenomenonPt: string;
  segmentedForm: string;
  linkedForm: string;
  expected_transcription: string;
  acceptable_variants: string[];
  explanationPt: string;
}

/** Phase 5 P4 — compare two utterances and infer tone/register. */
export interface InferenceToneData {
  contextPt: string;
  questionPt: string;
  targetTonePt: string;
  audioTextA: string;
  audioTextB: string;
  labelA: string;
  labelB: string;
  correctOption: 'A' | 'B';
  explanationPt: string;
}

/** Phase 5 P3 — listen to a longer voicemail, summarize in PT-BR. */
export interface VoicemailDictationData {
  audioText: string;
  contextPt: string;
  expected_summary: string;
  acceptable_summaries: string[];
  key_points?: string[];
}

/** Phase 5 P3 — translate PT→target but must include a lesson chunk. */
export interface TranslationWithConstraintData {
  portuguese_sentence: string;
  required_chunk: string;
  target_translation: string;
  acceptable_variants: string[];
  constraint_explanation?: string;
}

/** Phase 5 P2 — speak along with continuous audio (shadowing). */
export interface ShadowingData {
  text: string;
  translation: string;
  tip?: string;
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

export interface ListeningComprehensionData {
  dialogueAudio: string;
  questionPt: string;
  options: string[];
  correctIndex: number;
  explanationPt: string;
  linkedExerciseId?: string;
  chainAnchorPhrase?: string;
}

/** Phase 1 — listen to interlocutor prompt, respond orally (spontaneous). */
export interface ListenAndRespondData {
  /** 1–3 lines from ONE interlocutor only (Speaker: line). Not the lesson hook dialogue. */
  dialogueAudio: string;
  promptLine: string;
  contextPt: string;
  evaluationCriteria: string;
  acceptableThemes: string[];
  exampleResponse: string;
  linkedExerciseId?: string;
  chainAnchorPhrase?: string;
}

/** Phase 2 — situational roleplay with free written/spoken response. */
export interface FreeRoleplayData {
  context: string;
  promptLine: string;
  evaluationCriteria: string;
  acceptableThemes: string[];
  exampleResponse: string;
  explanation: string;
}

/** Phase 2 — informal written reply (chat/message). */
export interface MicroMessageData {
  context: string;
  incomingMessage: string;
  translation: string;
  evaluationCriteria: string;
  exampleResponse: string;
}

/** Phase 5 — rewrite same meaning with different words (written production). */
export interface ParaphraseData {
  source_sentence: string;
  source_translation: string;
  target_paraphrase: string;
  acceptable_variants: string[];
  hint?: string;
}

/** Phase 5 — open blank production (not MCQ). */
export interface FillGapProductionData {
  sentence: string;
  blankWord: string;
  translation: string;
  acceptable_variants?: string[];
}

export type Exercise =
  | { type: 'context-choice';         data: ContextChoiceData }
  | { type: 'sentence-builder';       data: SentenceBuilderData }
  | { type: 'image-match';            data: ImageMatchData }
  | { type: 'reverse-translation';    data: ReverseTranslationData }
  | { type: 'word-bank-translation';  data: WordBankTranslationData }
  | { type: 'bridge-choice';          data: BridgeChoiceData }
  | { type: 'listen-and-select';      data: ListenAndSelectData }
  | { type: 'listening-comprehension'; data: ListeningComprehensionData }
  | { type: 'audio-dictation';        data: DictationData }
  | { type: 'error-correction';       data: ErrorCorrectionData }
  | { type: 'speak-repeat';           data: SpeakRepeatData }
  | { type: 'social-roleplay';        data: SocialRoleplayData }
  | { type: 'scrambled-conversation'; data: ScrambledConversationData }
  | { type: 'interactive-subtitles';  data: InteractiveSubtitlesData }
  | { type: 'logic-connectors';       data: LogicConnectorsData }
  | { type: 'grammar-trap';           data: GrammarTrapData }
  | { type: 'minimal-pair';           data: MinimalPairData }
  | { type: 'minimal-pair-production'; data: MinimalPairData }
  | { type: 'conjugation-speed';      data: ConjugationSpeedData }
  | { type: 'listen-and-respond';     data: ListenAndRespondData }
  | { type: 'free-roleplay';          data: FreeRoleplayData }
  | { type: 'micro-message';          data: MicroMessageData }
  | { type: 'paraphrase';             data: ParaphraseData }
  | { type: 'fill-gap-production';    data: FillGapProductionData }
  | { type: 'shadowing';              data: ShadowingData }
  | { type: 'translation-with-constraint'; data: TranslationWithConstraintData }
  | { type: 'voicemail-dictation';       data: VoicemailDictationData }
  | { type: 'inference-tone';            data: InferenceToneData }
  | { type: 'connected-speech';          data: ConnectedSpeechData }
  | { type: 'story-continuation';        data: StoryContinuationData }
  | { type: 'spot-the-register';        data: SpotTheRegisterData }
  | { type: 'prompted-monologue';      data: PromptedMonologueData };
