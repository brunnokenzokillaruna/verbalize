import type { Exercise } from '@/types';

/**
 * Returns a short PT-BR elaboration line for a correct answer (local, no Gemini).
 */
export function getLocalElaborationHint(exercise: Exercise): string | null {
  switch (exercise.type) {
    case 'grammar-trap':
      return exercise.data.trapRule || exercise.data.explanation;
    case 'bridge-choice':
      return exercise.data.trapRule || exercise.data.explanation;
    case 'social-roleplay':
    case 'free-roleplay':
      return exercise.data.explanation;
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
      return exercise.data.hint || `Tradução modelo: ${exercise.data.target_translation}`;
    case 'paraphrase':
      return exercise.data.hint || `Outra forma válida: ${exercise.data.target_paraphrase}`;
    case 'fill-gap-production':
      return `A palavra-chave aqui é «${exercise.data.blankWord}».`;
    case 'micro-message':
      return `Resposta natural: ${exercise.data.exampleResponse}`;
    case 'listen-and-respond':
      return `Exemplo de resposta: ${exercise.data.exampleResponse}`;
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
