import { callGeminiJSON } from '@/services/gemini';
import { LANG_LABEL } from '@/lib/practiceExercises/constants';
import type { EvaluateFreeResponseParams, GeminiEvaluationPayload } from './types';

const SYSTEM_PROMPT = `You evaluate whether a language learner's spoken or written response adequately communicates the intended meaning.
Accept grammatically imperfect but communicatively successful answers.
Reject answers that miss the intent, use the wrong language, are empty, or are unrelated.
Feedback must be in Brazilian Portuguese (PT-BR), 1-2 short encouraging sentences.

CRITICAL — feedback rules:
- Comment ONLY on the words the learner actually wrote. Quote from their response, never from the "Example good response".
- NEVER praise or explain an expression the learner did not use. Writing "a expressão 'à la hauteur' é perfeita" about a learner who wrote "à cote de mes attentes" is a serious failure.
- To teach better phrasing, put it in correctedSentence — not in feedback as if the learner had already used it.
- If the learner used an almost-correct form of an idiom, say so plainly and give the right form.

CRITICAL — correctedSentence rules:
- When isCorrect is true: set correctedSentence to a NATURAL polish of the LEARNER's own response in the target language (fix grammar/spelling/word choice) while KEEPING their meaning and topic. Example: learner wrote about climbing a hill → polish that hill sentence; NEVER replace it with an unrelated model answer about a museum, painting, etc.
- If the learner's response is already natural, omit correctedSentence or repeat it unchanged.
- When isCorrect is false: optionally suggest one natural target-language sentence that would fit the situation.
- NEVER copy the "Example good response" into correctedSentence when the learner said something different but acceptable.

Return ONLY valid JSON with keys: isCorrect (boolean), feedback (string), correctedSentence (string, optional).`;

function buildEvaluationPrompt(params: EvaluateFreeResponseParams): string {
  const langLabel = LANG_LABEL[params.language];
  const contextBlock =
    params.previousContext.length > 0
      ? params.previousContext.map((l) => `- ${l}`).join('\n')
      : '(none)';

  const themes =
    params.acceptableThemes && params.acceptableThemes.length > 0
      ? params.acceptableThemes.map((t) => `- ${t}`).join('\n')
      : '(none specified)';

  return `Target language: ${langLabel}

Previous dialogue:
${contextBlock}

Situation / intent (PT-BR): ${params.intent}
${params.evaluationCriteria ? `Evaluation criteria: ${params.evaluationCriteria}` : ''}
${params.promptLine ? `Interlocutor said (${langLabel}): "${params.promptLine}"` : ''}
${params.expectedLine ? `Example good response (${langLabel}): "${params.expectedLine}"` : ''}

Acceptable themes (any of these ideas counts as success):
${themes}

Learner response (${langLabel}): "${params.transcript.trim()}"

Does the learner response pragmatically fit the situation and communicate the intent?`;
}

export async function evaluateFreeResponseGemini(
  params: EvaluateFreeResponseParams,
): Promise<GeminiEvaluationPayload | null> {
  try {
    const result = await callGeminiJSON<GeminiEvaluationPayload>(
      buildEvaluationPrompt(params),
      SYSTEM_PROMPT,
      384,
      0,
      'lightweight',
    );

    if (typeof result.isCorrect !== 'boolean' || typeof result.feedback !== 'string') {
      return null;
    }

    return {
      isCorrect: result.isCorrect,
      feedback: result.feedback.trim(),
      correctedSentence: result.correctedSentence?.trim() || undefined,
    };
  } catch (err) {
    console.warn('[evaluateFreeResponseGemini] Gemini failed, caller should fallback:', err);
    return null;
  }
}
