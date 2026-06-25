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
    case 'shadowing':
      return `Shadowing: "${exercise.data.text}"`;
    case 'translation-with-constraint':
      return `Constraint translation: "${exercise.data.portuguese_sentence}" → must include "${exercise.data.required_chunk}"`;
    case 'voicemail-dictation':
      return `Voicemail summary: heard "${exercise.data.audioText.slice(0, 80)}..." → "${exercise.data.expected_summary}"`;
    case 'inference-tone':
      return `Tone inference: ${exercise.data.questionPt} — correct: ${exercise.data.correctOption} (${exercise.data.targetTonePt})`;
    case 'connected-speech':
      return `Connected speech: ${exercise.data.phenomenonPt} — "${exercise.data.expected_transcription}"`;
    case 'story-continuation':
      return `Story continuation: "${exercise.data.storyOpening.slice(0, 60)}..." → "${exercise.data.exampleContinuation}"`;
    case 'spot-the-register':
      return `Register fix: line ${exercise.data.wrongLineIndex + 1} → "${exercise.data.correctedLine}" (${exercise.data.registerIssuePt})`;
    case 'prompted-monologue':
      return `Prompted monologue: "${exercise.data.promptPt}" → "${exercise.data.exampleMonologue.slice(0, 80)}..."`;
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
    case 'grammar-trap':
      return `Grammar trap: "${exercise.data.options.find(o => o.isCorrect)?.sentence}" — trapRule: "${exercise.data.trapRule}"`;
    case 'minimal-pair':
    case 'minimal-pair-production':
      return `Minimal pair: context "${exercise.data.sentenceContext}" — correct word: "${exercise.data.correctWord}" vs wrong option.`;
    case 'conjugation-speed':
      return `Conjugation speed: "${exercise.data.pronoun}" + "${exercise.data.verb}" — correct form: "${exercise.data.correctForm}"`;
    case 'image-match':
      return `Image match: word "${exercise.data.targetWord}" (${exercise.data.translation})`;
    case 'word-bank-translation':
      return `Word bank translation: "${exercise.data.portuguese_sentence}" → "${exercise.data.correctOrder.join(' ')}"`;
    case 'bridge-choice':
      return `Bridge choice: "${exercise.data.question}" — correct: "${exercise.data.options[exercise.data.correctIndex]}"`;
    case 'listen-and-select':
      return `Listen and select: "${exercise.data.audioText}"`;
    case 'listening-comprehension':
      return `Listening comprehension: "${exercise.data.questionPt}" — correct: "${exercise.data.options[exercise.data.correctIndex]}"`;
    case 'listen-and-respond':
      return `Listen and respond: "${exercise.data.promptLine}" — example: "${exercise.data.exampleResponse}"`;
    case 'free-roleplay':
      return `Free roleplay: "${exercise.data.promptLine}" — example: "${exercise.data.exampleResponse}"`;
    case 'micro-message':
      return `Micro message: "${exercise.data.incomingMessage}" — example reply: "${exercise.data.exampleResponse}"`;
    case 'paraphrase':
      return `Paraphrase: "${exercise.data.source_sentence}" → "${exercise.data.target_paraphrase}"`;
    case 'fill-gap-production':
      return `Fill gap: "${exercise.data.sentence}" — correct: "${exercise.data.blankWord}"`;
  }
}

export function phaseToStage(phase: string): LessonStage {
  switch (phase) {
    case 'intro':      return 'intro';
    case 'mission':    return 'mission';
    case 'vocabulary': return 'vocabulary';
    case 'hook':       return 'hook';
    case 'role-play':  return 'role-play';
    case 'phonetics':  return 'phonetics';
    case 'grammar':    return 'grammar';
    case 'practice':   return 'practice';
    case 'review':     return 'review';
    case 'briefing':   return 'mission';
    case 'comprehension': return 'hook';
    case 'production': return 'practice';
    case 'debrief':    return 'review';
    case 'complete':   return 'review';
    default:           return 'hook';
  }
}
