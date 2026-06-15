export type ParsedMistakeContext =
  | {
      kind: 'error-correction';
      sentence: string;
      errorWord: string;
      correctWord: string;
    }
  | {
      kind: 'context-choice';
      sentence: string;
      correctAnswer: string;
    }
  | {
      kind: 'reverse-translation';
      portuguese: string;
      target: string;
    }
  | {
      kind: 'conjugation-speed';
      pronoun: string;
      verb: string;
      correctForm: string;
    }
  | {
      kind: 'bridge-choice';
      question: string;
      correct: string;
    }
  | { kind: 'plain'; text: string };

const QUOTED = '"(.+?)"';

export function parseMistakeContext(raw: string): ParsedMistakeContext {
  const text = raw.trim();

  const errorCorrection = new RegExp(
    `^Error correction:\\s*${QUOTED}\\s*[—–-]\\s*error:\\s*${QUOTED},\\s*correct:\\s*${QUOTED}$`,
    'i',
  ).exec(text);
  if (errorCorrection) {
    return {
      kind: 'error-correction',
      sentence: errorCorrection[1],
      errorWord: errorCorrection[2],
      correctWord: errorCorrection[3],
    };
  }

  const fillBlank = new RegExp(
    `^Fill-in-the-blank:\\s*${QUOTED}\\s*[—–-]\\s*correct answer:\\s*${QUOTED}$`,
    'i',
  ).exec(text);
  if (fillBlank) {
    return {
      kind: 'context-choice',
      sentence: fillBlank[1],
      correctAnswer: fillBlank[2],
    };
  }

  const reverse = new RegExp(
    `^Reverse translation:\\s*${QUOTED}\\s*→\\s*${QUOTED}$`,
    'i',
  ).exec(text);
  if (reverse) {
    return {
      kind: 'reverse-translation',
      portuguese: reverse[1],
      target: reverse[2],
    };
  }

  const conjugation = new RegExp(
    `^Conjugation speed:\\s*${QUOTED}\\s*\\+\\s*${QUOTED}\\s*[—–-]\\s*correct form:\\s*${QUOTED}$`,
    'i',
  ).exec(text);
  if (conjugation) {
    return {
      kind: 'conjugation-speed',
      pronoun: conjugation[1],
      verb: conjugation[2],
      correctForm: conjugation[3],
    };
  }

  const bridge = new RegExp(
    `^Bridge choice:\\s*${QUOTED}\\s*[—–-]\\s*correct:\\s*${QUOTED}$`,
    'i',
  ).exec(text);
  if (bridge) {
    return {
      kind: 'bridge-choice',
      question: bridge[1],
      correct: bridge[2],
    };
  }

  return { kind: 'plain', text };
}

export function highlightErrorWord(sentence: string, errorWord: string): {
  before: string;
  match: string;
  after: string;
} | null {
  const index = sentence.indexOf(errorWord);
  if (index === -1) return null;
  return {
    before: sentence.slice(0, index),
    match: errorWord,
    after: sentence.slice(index + errorWord.length),
  };
}
