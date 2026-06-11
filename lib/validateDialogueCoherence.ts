import { callGeminiJSON } from '@/services/gemini';

export interface DialogueCoherenceResult {
  score: number;
  pass: boolean;
  breaks: string[];
}

const JUDGE_SYSTEM = `You evaluate whether a two-person dialogue has logical conversational flow ("nexo").
Respond with ONLY valid JSON, no markdown, no explanation.
Do NOT judge vocabulary teaching, grammar drills, or word counts — only coherence.`;

/**
 * Lightweight Gemini judge: scores dialogue line-to-line coherence (1–10).
 * pass = score >= 7 AND no breaks listed.
 */
export async function validateDialogueCoherence(
  dialogue: string,
): Promise<DialogueCoherenceResult | null> {
  const prompt = `Evaluate this dialogue for conversational coherence.

Dialogue:
${dialogue}

Answer these 5 questions internally, then output JSON:
1. Is each line B a plausible response or reaction to line A?
2. Do action roles stay consistent (who waits vs who goes)?
3. Does any new object or place appear without prior setup?
4. Does any verb imply "search/look for" when the location was already stated (use "go get" instead)?
5. Does the ending follow logically from announced actions (no magic resolutions)?

Output ONLY this JSON:
{
  "score": <integer 1-10, 10 = perfect nexo>,
  "breaks": ["<specific problem, e.g. 'line 3: both wait together contradicts line 2 where she should go'>", ...]
}

Rules for breaks:
- List ONLY concrete coherence failures (role flip, phantom object, wrong verb, magic resolution, false causal link, topic jump).
- If the dialogue is coherent, return an empty breaks array.
- score must reflect overall nexo quality.`;

  try {
    const raw = await callGeminiJSON<{ score?: number; breaks?: string[] }>(
      prompt,
      JUDGE_SYSTEM,
      512,
      0,
    );

    const score = typeof raw?.score === 'number'
      ? Math.min(10, Math.max(1, Math.round(raw.score)))
      : 0;
    const breaks = Array.isArray(raw?.breaks)
      ? raw.breaks.filter((b): b is string => typeof b === 'string' && b.trim().length > 0)
      : [];

    if (score === 0) {
      console.error('[validateDialogueCoherence] Invalid judge response');
      return null;
    }

    return {
      score,
      pass: score >= 7 && breaks.length === 0,
      breaks,
    };
  } catch (err) {
    console.error('[validateDialogueCoherence] Error:', err);
    return null;
  }
}
