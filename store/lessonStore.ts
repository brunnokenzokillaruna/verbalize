import { create } from 'zustand';
import type {
  LessonDefinition,
  HookResult,
  GrammarBridgeResult,
  VocabImageResult,
  Exercise,
} from '@/types';

export type LessonPhase =
  | 'idle'
  | 'loading'
  | 'hook'
  | 'grammar'
  | 'vocabulary'
  | 'practice'
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

  // Exercises
  exercises: Exercise[];
  exerciseIndex: number;
  correctCount: number;

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

  /** Record a correct answer for the current exercise. */
  recordCorrect: () => void;

  /**
   * Advance to the next exercise.
   * Transitions to 'complete' when all exercises are done.
   */
  nextExercise: () => void;

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
      isLoading: true,
    }),

  setPhase: (phase) => set({ phase }),
  setIsLoading: (isLoading) => set({ isLoading }),

  setHook: (hook) => set({ hook, isLoading: false }),

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
    const { exerciseIndex, exercises } = get();
    const next = exerciseIndex + 1;
    if (next >= exercises.length) {
      set({ phase: 'complete' });
    } else {
      set({ exerciseIndex: next });
    }
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
      isLoading: false,
    }),
}));
