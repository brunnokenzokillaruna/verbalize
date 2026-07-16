import { create } from 'zustand';
import type {
  LessonDefinition,
  HookResult,
  GrammarBridgeResult,
  VocabImageResult,
  Exercise,
  LessonMistakeDocument,
  MissionBriefingResult,
  TranslateWordResult,
  CheckpointSessionResult,
} from '@/types';

export type LessonPhase =
  | 'idle'
  | 'loading'
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

interface LessonState {
  // Context
  phase: LessonPhase;
  lesson: LessonDefinition | null;
  interests: string[];

  // Generated content
  hook: HookResult | null;
  missionBriefing: MissionBriefingResult | null; // MISS only — generated from hook dialogue for role-play alignment
  grammarBridge: GrammarBridgeResult | null;
  vocabImages: Record<string, VocabImageResult | null>; // keyed by word
  /** Shared cover/dialogue scene for this lesson (cached by lessonId). */
  sceneImage: VocabImageResult | null;
  vocabTranslations: Record<string, string>; // keyed by word → PT-BR translation
  /** Full AI tooltip payloads keyed by tooltipCacheKey — instant word clicks. */
  wordTooltips: Record<string, TranslateWordResult>;
  knownVocabulary: string[]; // words the user already learned (from Firestore)
  masteredVocabulary: string[]; // words with SRS level ≥4

  // Practice exercises
  exercises: Exercise[];
  exerciseIndex: number;
  correctCount: number;

  // Mistake review
  reviewMistake: LessonMistakeDocument | null;
  reviewExercises: Exercise[];
  reviewIndex: number;
  reviewCorrectCount: number;
  mistakes: Exercise[]; // practice exercises user got wrong

  // Newly discovered verbs in this session (not yet in knownVocabulary at start)
  discoveredVerbs: string[];

  // MISS role-play tracking (how many of the user's lines were actually spoken)
  rolePlayLinesSpoken: number;
  rolePlayTotalSpeakable: number;
  rolePlayComplete: boolean;

  // Loading state
  isLoading: boolean;

  /** True when the grammar bridge retention quiz was answered correctly. */
  bridgeQuizPassed: boolean;

  /** REVIEW checkpoint session content */
  checkpointSession: CheckpointSessionResult | null;
  comprehensionIndex: number;
  comprehensionCorrect: number;
  checkpointProductionIndex: number;
  checkpointProductionCorrect: number;
  checkpointPassed: boolean;

  /** True when the learner accepted at least one spontaneous production attempt this session. */
  spontaneousProductionAccepted: boolean;

  /**
   * Polish of the learner's last accepted free-production answer (target language).
   * Used for the green banner — never a canned unrelated exampleResponse.
   */
  lastProductionPolishHint: string | null;

  setCheckpointSession: (session: CheckpointSessionResult) => void;
  recordComprehensionAnswer: (correct: boolean) => void;
  nextComprehensionQuestion: () => void;
  recordCheckpointProduction: (correct: boolean) => void;
  nextCheckpointProduction: () => void;
  setCheckpointPassed: (passed: boolean) => void;

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Initialise a new lesson session. */
  init: (lesson: LessonDefinition, interests: string[]) => void;

  setPhase: (phase: LessonPhase) => void;
  setKnownVocabulary: (words: string[]) => void;
  setMasteredVocabulary: (words: string[]) => void;
  setHook: (hook: HookResult) => void;
  mergeHook: (partial: Partial<HookResult>) => void;
  setMissionBriefing: (briefing: MissionBriefingResult) => void;
  completeRolePlay: (spoken: number, totalSpeakable: number) => void;
  setGrammarBridge: (bridge: GrammarBridgeResult) => void;
  setVocabImage: (word: string, image: VocabImageResult | null) => void;
  setSceneImage: (image: VocabImageResult | null) => void;
  setVocabTranslation: (word: string, translation: string) => void;
  cacheWordTooltip: (key: string, result: TranslateWordResult) => void;
  setExercises: (exercises: Exercise[]) => void;
  setIsLoading: (loading: boolean) => void;
  setBridgeQuizPassed: (passed: boolean) => void;
  setDiscoveredVerbs: (verbs: string[]) => void;
  markSpontaneousProductionAccepted: () => void;
  setLastProductionPolishHint: (hint: string | null) => void;

  /** Record a correct answer for the current practice exercise. */
  recordCorrect: () => void;

  /** Record a mistake for the current practice exercise. */
  recordMistake: (exercise: Exercise) => void;

  /**
   * Advance to the next practice exercise.
   * Does NOT auto-transition to complete — the page controls that.
   */
  nextExercise: () => void;

  /** Set the mistake to review and its generated exercises. */
  setReview: (mistake: LessonMistakeDocument, exercises: Exercise[]) => void;

  /** Record a correct answer for the current review exercise. */
  recordReviewCorrect: () => void;

  /** Advance to the next review exercise. */
  nextReviewExercise: () => void;

  /** Full reset — call when leaving the lesson. */
  reset: () => void;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  phase: 'idle',
  lesson: null,
  interests: [],
  hook: null,
  missionBriefing: null,
  grammarBridge: null,
  vocabImages: {},
  sceneImage: null,
  vocabTranslations: {},
  wordTooltips: {},
  knownVocabulary: [],
  masteredVocabulary: [],
  discoveredVerbs: [],
  exercises: [],
  exerciseIndex: 0,
  correctCount: 0,
  reviewMistake: null,
  reviewExercises: [],
  reviewIndex: 0,
  reviewCorrectCount: 0,
  mistakes: [],
  rolePlayLinesSpoken: 0,
  rolePlayTotalSpeakable: 0,
  rolePlayComplete: false,
  isLoading: false,
  bridgeQuizPassed: false,
  checkpointSession: null,
  comprehensionIndex: 0,
  comprehensionCorrect: 0,
  checkpointProductionIndex: 0,
  checkpointProductionCorrect: 0,
  checkpointPassed: false,
  spontaneousProductionAccepted: false,
  lastProductionPolishHint: null,

  // ── Actions ────────────────────────────────────────────────────────────────

  init: (lesson, interests) =>
    set({
      lesson,
      interests,
      phase: 'loading',
      hook: null,
      missionBriefing: null,
      grammarBridge: null,
      vocabImages: {},
      sceneImage: null,
      vocabTranslations: {},
      wordTooltips: {},
      knownVocabulary: [],
      masteredVocabulary: [],
      discoveredVerbs: [],
      exercises: [],
      exerciseIndex: 0,
      correctCount: 0,
      reviewMistake: null,
      reviewExercises: [],
      reviewIndex: 0,
      reviewCorrectCount: 0,
      mistakes: [],
      rolePlayLinesSpoken: 0,
      rolePlayTotalSpeakable: 0,
      rolePlayComplete: false,
      isLoading: true,
      bridgeQuizPassed: false,
      checkpointSession: null,
      comprehensionIndex: 0,
      comprehensionCorrect: 0,
      checkpointProductionIndex: 0,
      checkpointProductionCorrect: 0,
      checkpointPassed: false,
      spontaneousProductionAccepted: false,
      lastProductionPolishHint: null,
    }),

  setPhase: (phase) => set({ phase }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setBridgeQuizPassed: (bridgeQuizPassed) => set({ bridgeQuizPassed }),
  setKnownVocabulary: (knownVocabulary) => set({ knownVocabulary }),
  setMasteredVocabulary: (masteredVocabulary) => set({ masteredVocabulary }),

  setHook: (hook) => set({
    hook: { ...hook, newVocabulary: [...new Set(hook.newVocabulary)] },
    isLoading: false,
  }),

  mergeHook: (partial) =>
    set((state) => ({
      hook: state.hook ? { ...state.hook, ...partial } : state.hook,
    })),

  setMissionBriefing: (missionBriefing) => set({ missionBriefing }),

  completeRolePlay: (spoken, totalSpeakable) =>
    set({
      rolePlayLinesSpoken: spoken,
      rolePlayTotalSpeakable: totalSpeakable,
      rolePlayComplete: true,
    }),

  setDiscoveredVerbs: (verbs: string[]) => set({ discoveredVerbs: verbs }),

  markSpontaneousProductionAccepted: () =>
    set({ spontaneousProductionAccepted: true }),

  setLastProductionPolishHint: (lastProductionPolishHint) =>
    set({ lastProductionPolishHint }),

  setGrammarBridge: (grammarBridge) => set({ grammarBridge, isLoading: false }),

  setVocabImage: (word, image) =>
    set((state) => ({
      vocabImages: { ...state.vocabImages, [word]: image },
    })),

  setSceneImage: (sceneImage) => set({ sceneImage }),

  setVocabTranslation: (word, translation) =>
    set((state) => ({
      vocabTranslations: { ...state.vocabTranslations, [word]: translation },
    })),

  cacheWordTooltip: (key, result) =>
    set((state) => ({
      wordTooltips: state.wordTooltips[key]
        ? state.wordTooltips
        : { ...state.wordTooltips, [key]: result },
    })),

  setExercises: (exercises) => set({ exercises, exerciseIndex: 0, correctCount: 0, isLoading: false }),

  setCheckpointSession: (checkpointSession) => set({ checkpointSession, isLoading: false }),

  recordComprehensionAnswer: (correct) =>
    set((state) => ({
      comprehensionCorrect: state.comprehensionCorrect + (correct ? 1 : 0),
    })),

  nextComprehensionQuestion: () =>
    set((state) => ({ comprehensionIndex: state.comprehensionIndex + 1 })),

  recordCheckpointProduction: (correct) =>
    set((state) => ({
      checkpointProductionCorrect: state.checkpointProductionCorrect + (correct ? 1 : 0),
    })),

  nextCheckpointProduction: () =>
    set((state) => ({
      checkpointProductionIndex: state.checkpointProductionIndex + 1,
      lastProductionPolishHint: null,
    })),

  setCheckpointPassed: (checkpointPassed) => set({ checkpointPassed }),

  recordCorrect: () =>
    set((state) => ({ correctCount: state.correctCount + 1 })),

  recordMistake: (exercise) =>
    set((state) => ({ mistakes: [...state.mistakes, exercise] })),

  nextExercise: () => {
    const { exerciseIndex } = get();
    set({ exerciseIndex: exerciseIndex + 1, lastProductionPolishHint: null });
  },

  setReview: (mistake, exercises) =>
    set({
      reviewMistake: mistake,
      reviewExercises: exercises,
      reviewIndex: 0,
      reviewCorrectCount: 0,
      lastProductionPolishHint: null,
    }),

  recordReviewCorrect: () =>
    set((state) => ({ reviewCorrectCount: state.reviewCorrectCount + 1 })),

  nextReviewExercise: () => {
    const { reviewIndex } = get();
    set({ reviewIndex: reviewIndex + 1, lastProductionPolishHint: null });
  },

  reset: () =>
    set({
      phase: 'idle',
      lesson: null,
      interests: [],
      hook: null,
      missionBriefing: null,
      grammarBridge: null,
      vocabImages: {},
      sceneImage: null,
      vocabTranslations: {},
      wordTooltips: {},
      knownVocabulary: [],
      masteredVocabulary: [],
      discoveredVerbs: [],
      exercises: [],
      exerciseIndex: 0,
      correctCount: 0,
      reviewMistake: null,
      reviewExercises: [],
      reviewIndex: 0,
      reviewCorrectCount: 0,
      mistakes: [],
      rolePlayLinesSpoken: 0,
      rolePlayTotalSpeakable: 0,
      rolePlayComplete: false,
      isLoading: false,
      bridgeQuizPassed: false,
      checkpointSession: null,
      comprehensionIndex: 0,
      comprehensionCorrect: 0,
      checkpointProductionIndex: 0,
      checkpointProductionCorrect: 0,
      checkpointPassed: false,
      spontaneousProductionAccepted: false,
      lastProductionPolishHint: null,
    }),
}));
