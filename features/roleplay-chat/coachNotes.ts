import type { CoachNoteKind } from './types';

/**
 * Silent stage directions the learner can trigger mid-conversation.
 * The Live system instruction tells the model to follow them without
 * ever reading them aloud, so immersion is preserved.
 */
export const COACH_NOTE_PREFIX = '[COACH]';

export const COACH_NOTES: Record<
  CoachNoteKind,
  { labelPt: string; hintPt: string; instruction: string }
> = {
  repeat: {
    labelPt: 'Não entendi',
    hintPt: 'O personagem repete a última fala mais devagar.',
    instruction:
      'The learner did not understand. Say your previous line again, slower and with simpler words.',
  },
  simplify: {
    labelPt: 'Mais fácil',
    hintPt: 'O personagem passa a falar de forma mais simples.',
    instruction:
      'From now on, use shorter sentences and easier vocabulary for the rest of this conversation.',
  },
  suggest: {
    labelPt: 'Como respondo?',
    hintPt: 'O personagem sugere uma frase que você pode usar.',
    instruction:
      'The learner is stuck. Still in character, offer one short example sentence they could say right now, then wait.',
  },
};

export function buildCoachNote(kind: CoachNoteKind): string {
  return `${COACH_NOTE_PREFIX} ${COACH_NOTES[kind].instruction}`;
}
