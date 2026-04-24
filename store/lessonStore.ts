import { create } from 'zustand';
import type {
  LessonDefinition,
  HookResult,
  GrammarBridgeResult,
  VocabImageResult,
  Exercise,
  LessonMistakeDocument,
  MissionBriefingResult,
} from '@/types';

export type LessonPhase =
  | 'idle'
  | 'loading'
  | 'intro'      // shown while AI generates in background
  | 'vocabulary'
  | 'hook'
  | 'role-play'  // MISS only — replaces hook, user speaks their lines
  | 'phonetics'  // PRON only — after hook
  | 'mission'    // MISS only — before vocabulary
  | 'grammar'
  | 'practice'
  | 'review'     // mistake review — after practice, before complete
  | 'complete';

interface LessonState {
  // Context
  phase: LessonPhase;
  lesson: LessonDefinition | null;
  interests: string[];

  // Generated content
  hook: HookResult | null;
  missionBriefing: MissionBriefingResult | null; // MISS only — fetched in parallel with hook so it renders first
  grammarBridge: GrammarBridgeResult | null;
  vocabImages: Record<string, VocabImageResult | null>; // keyed by word
  vocabTranslations: Record<string, string>; // keyed by word → PT-BR translation
  knownVocabulary: string[]; // words the user already learned (from Firestore)

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

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Initialise a new lesson session. */
  init: (lesson: LessonDefinition, interests: string[]) => void;

  setPhase: (phase: LessonPhase) => void;
  setKnownVocabulary: (words: string[]) => void;
  setHook: (hook: HookResult) => void;
  mergeHook: (partial: Partial<HookResult>) => void;
  setMissionBriefing: (briefing: MissionBriefingResult) => void;
  completeRolePlay: (spoken: number, totalSpeakable: number) => void;
  setGrammarBridge: (bridge: GrammarBridgeResult) => void;
  setVocabImage: (word: string, image: VocabImageResult | null) => void;
  setVocabTranslation: (word: string, translation: string) => void;
  setExercises: (exercises: Exercise[]) => void;
  setIsLoading: (loading: boolean) => void;
  setDiscoveredVerbs: (verbs: string[]) => void;

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
  vocabTranslations: {},
  knownVocabulary: [],
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
      vocabTranslations: {},
      knownVocabulary: [],
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
    }),

  setPhase: (phase) => set({ phase }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setKnownVocabulary: (knownVocabulary) => set({ knownVocabulary }),

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

  setGrammarBridge: (grammarBridge) => set({ grammarBridge, isLoading: false }),

  setVocabImage: (word, image) =>
    set((state) => ({
      vocabImages: { ...state.vocabImages, [word]: image },
    })),

  setVocabTranslation: (word, translation) =>
    set((state) => ({
      vocabTranslations: { ...state.vocabTranslations, [word]: translation },
    })),

  setExercises: (exercises) => set({ exercises, isLoading: false }),

  recordCorrect: () =>
    set((state) => ({ correctCount: state.correctCount + 1 })),

  recordMistake: (exercise) =>
    set((state) => ({ mistakes: [...state.mistakes, exercise] })),

  nextExercise: () => {
    const { exerciseIndex } = get();
    set({ exerciseIndex: exerciseIndex + 1 });
  },

  setReview: (mistake, exercises) =>
    set({
      reviewMistake: mistake,
      reviewExercises: exercises,
      reviewIndex: 0,
      reviewCorrectCount: 0,
    }),

  recordReviewCorrect: () =>
    set((state) => ({ reviewCorrectCount: state.reviewCorrectCount + 1 })),

  nextReviewExercise: () => {
    const { reviewIndex } = get();
    set({ reviewIndex: reviewIndex + 1 });
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
      vocabTranslations: {},
      knownVocabulary: [],
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
    }),
}));
