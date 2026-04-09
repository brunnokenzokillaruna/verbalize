import type { Exercise, LessonStage } from '@/types';

export function buildMistakeContext(exercise: Exercise): string {
  switch (exercise.type) {
    case 'context-choice':
      return `Fill-in-the-blank: "${exercise.data.sentence}" — correct answer: "${exercise.data.blankWord}"`;
    case 'error-correction':
      return `Error correction: "${exercise.data.sentence_with_error}" — error: "${exercise.data.error_word}", correct: "${exercise.data.correct_word}"`;
    case 'reverse-translation':
      return `Reverse translation: "${exercise.data.portuguese_sentence}" → "${exercise.data.target_translation}"`;
    case 'audio-dictation':
      return `Audio dictation: "${exercise.data.text}"`;
    case 'speak-repeat':
      return `Speak & repeat: "${exercise.data.text}"`;
    case 'sentence-builder':
      return `Sentence builder: correct order "${exercise.data.correctOrder.join(' ')}"`;
    case 'social-roleplay':
      return `Social Roleplay content — context: "${exercise.data.context}"`;
    case 'scrambled-conversation':
      return `Scrambled conversation with ${exercise.data.lines.length} lines`;
    case 'interactive-subtitles':
      return `Subtitles fix: "${exercise.data.correctText}"`;
    case 'logic-connectors':
      return `Connectors: "${exercise.data.partA} [ ] ${exercise.data.partB}"`;
  }
}

export function phaseToStage(phase: string): LessonStage {
  switch (phase) {
    case 'vocabulary': return 'vocabulary';
    case 'hook':       return 'hook';
    case 'grammar':    return 'grammar';
    case 'practice':   return 'practice';
    case 'review':     return 'review';
    case 'complete':   return 'review';
    default:           return 'hook';
  }
}
