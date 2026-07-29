import type { Exercise } from '@/types';

function normalizeComparable(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Hint that polishes the learner's own accepted answer — never a canned
 * unrelated exampleResponse from exercise generation.
 */
export function formatProductionPolishHint(
  learnerText: string,
  correctedSentence: string | undefined | null,
): string | null {
  const polish = correctedSentence?.trim();
  if (!polish) return null;
  if (normalizeComparable(polish) === normalizeComparable(learnerText)) return null;
  return `Versão mais natural da sua resposta: ${polish}`;
}

const FREE_PRODUCTION_TYPES = new Set([
  'micro-message',
  'free-roleplay',
  'listen-and-respond',
  'prompted-monologue',
  'story-continuation',
  'spot-the-register',
]);

export function isFreeProductionExerciseType(type: Exercise['type']): boolean {
  return FREE_PRODUCTION_TYPES.has(type);
}

/**
 * Returns a short PT-BR elaboration line for a correct answer (local, no Gemini).
 * For free-production types, prefer `productionPolishHint` from evaluation —
 * never present a canned exampleResponse as if it corrected the learner's words.
 */
export function getLocalElaborationHint(
  exercise: Exercise,
  productionPolishHint?: string | null,
): string | null {
  if (productionPolishHint) return productionPolishHint;

  switch (exercise.type) {
    case 'grammar-trap':
      return exercise.data.trapRule || exercise.data.explanation;
    case 'bridge-choice':
      return exercise.data.trapRule || exercise.data.explanation;
    case 'social-roleplay':
      return exercise.data.explanation;
    case 'free-roleplay':
      // Pragmatic PT-BR tip only — not the French/English exampleResponse.
      return exercise.data.explanation?.trim() || null;
    case 'listening-comprehension':
      return exercise.data.explanationPt;
    case 'inference-tone':
      return exercise.data.explanationPt;
    case 'connected-speech':
      return exercise.data.explanationPt;
    case 'story-continuation':
      return exercise.data.explanationPt;
    case 'spot-the-register':
      return exercise.data.explanationPt;
    case 'prompted-monologue':
      return exercise.data.explanationPt;
    case 'minimal-pair':
    case 'minimal-pair-production':
      return exercise.data.tip;
    case 'conjugation-speed':
      return `Forma correta: «${exercise.data.correctForm}» em «${exercise.data.exampleSentence}».`;
    case 'context-choice':
      return `«${exercise.data.blankWord}» completa a ideia: ${exercise.data.translation}`;
    case 'sentence-builder':
      return (
        exercise.data.explanation ||
        `A ordem natural é: ${exercise.data.correctOrder.join(' ')}.`
      );
    case 'error-correction':
      return exercise.data.explanation;
    case 'logic-connectors':
      return `O conector «${exercise.data.correctConnector}» liga as duas partes: ${exercise.data.translation}`;
    case 'listen-and-select':
      return exercise.data.translation;
    case 'word-bank-translation':
      return exercise.data.hint || `Ordem correta: ${exercise.data.correctOrder.join(' ')}.`;
    case 'reverse-translation':
      // Prefer productionPolishHint (AI note / soft correction). Only fall back
      // to the canned model line when there is no evaluation hint.
      return exercise.data.hint || `Tradução modelo: ${exercise.data.target_translation}`;
    case 'paraphrase':
      return exercise.data.hint || `Outra forma válida: ${exercise.data.target_paraphrase}`;
    case 'fill-gap-production':
      return `A palavra-chave aqui é «${exercise.data.blankWord}».`;
    case 'micro-message':
    case 'listen-and-respond':
      // Canned exampleResponse must not appear as "the natural answer" after
      // the learner was already accepted for a different valid reply.
      return null;
    case 'speak-repeat':
      return exercise.data.translation;
    case 'shadowing':
      return exercise.data.tip ?? exercise.data.translation;
    case 'translation-with-constraint':
      return exercise.data.constraint_explanation ?? `Use «${exercise.data.required_chunk}» na tradução.`;
    case 'voicemail-dictation':
      return exercise.data.key_points?.length
        ? `Pontos-chave: ${exercise.data.key_points.join('; ')}`
        : exercise.data.expected_summary;
    default:
      return null;
  }
}
