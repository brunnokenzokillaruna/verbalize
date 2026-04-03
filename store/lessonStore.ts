import { create } from 'zustand';
import type {
  LessonDefinition,
  HookResult,
  GrammarBridgeResult,
  VocabImageResult,
  Exercise,
  LessonMistakeDocument,
} from '@/types';

export type LessonPhase =
  | 'idle'
  | 'loading'
  | 'vocabulary'
  | 'hook'
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
  grammarBridge: GrammarBridgeResult | null;
  vocabImages: Record<string, VocabImageResult | null>; // keyed by word
  vocabTranslations: Record<string, string>; // keyed by word → PT-BR translation

  // Practice exercises
  exercises: Exercise[];
  exerciseIndex: number;
  correctCount: number;

  // Mistake review
  reviewMistake: LessonMistakeDocument | null;
  reviewExercises: Exercise[];
  reviewIndex: number;
  reviewCorrectCount: number;

  // Loading state
  isLoading: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Initialise a new lesson session. */
  init: (lesson: LessonDefinition, interests: string[]) => void;

  setPhase: (phase: LessonPhase) => void;
  setHook: (hook: HookResult) => void;
  setGrammarBridge: (bridge: GrammarBridgeResult) => void;
  setVocabImage: (word: string, image: VocabImageResult | null) => void;
  setVocabTranslation: (word: string, translation: string) => void;
  setExercises: (exercises: Exercise[]) => void;
  setIsLoading: (loading: boolean) => void;

  /** Record a correct answer for the current practice exercise. */
  recordCorrect: () => void;

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
  grammarBridge: null,
  vocabImages: {},
  vocabTranslations: {},
  exercises: [],
  exerciseIndex: 0,
  correctCount: 0,
  reviewMistake: null,
  reviewExercises: [],
  reviewIndex: 0,
  reviewCorrectCount: 0,
  isLoading: false,

  // ── Actions ────────────────────────────────────────────────────────────────

  init: (lesson, interests) =>
    set({
      lesson,
      interests,
      phase: 'loading',
      hook: null,
      grammarBridge: null,
      vocabImages: {},
      vocabTranslations: {},
      exercises: [],
      exerciseIndex: 0,
      correctCount: 0,
      reviewMistake: null,
      reviewExercises: [],
      reviewIndex: 0,
      reviewCorrectCount: 0,
      isLoading: true,
    }),

  setPhase: (phase) => set({ phase }),
  setIsLoading: (isLoading) => set({ isLoading }),

  setHook: (hook) => set({
    hook: { ...hook, newVocabulary: [...new Set(hook.newVocabulary)] },
    isLoading: false,
  }),

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
      grammarBridge: null,
      vocabImages: {},
      vocabTranslations: {},
      exercises: [],
      exerciseIndex: 0,
      correctCount: 0,
      reviewMistake: null,
      reviewExercises: [],
      reviewIndex: 0,
      reviewCorrectCount: 0,
      isLoading: false,
    }),
}));
