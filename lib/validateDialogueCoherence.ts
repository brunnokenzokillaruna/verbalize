import { callGeminiJSON } from '@/services/gemini';

export interface DialogueCoherenceResult {
  score: number;
  pass: boolean;
  breaks: string[];
}

const JUDGE_SYSTEM = `You evaluate whether a two-person dialogue has logical flow AND sounds like everyday speech.
Respond with ONLY valid JSON, no markdown, no explanation.
Do NOT reward textbook drills. Coherent classroom French/English still fails.`;

/**
 * Local gate for the patterns the model copies from old classroom examples.
 * A 1–3 word reaction is required. A "Ça va ?" ritual or a bare "merci" close fails.
 */
export function textbookSpokenBreaks(dialogue: string): string[] {
  const contents = dialogue
    .split('\n')
    .map((line) => line.replace(/^[^:]+:\s*/, '').trim())
    .filter((line) => line.length > 0);
  if (contents.length < 3) return [];

  const breaks: string[] = [];
  const isMission = /você\s*:/i.test(dialogue);

  const isTextbookClose = (text: string) => {
    const close = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[.!?…]+$/g, '')
      .trim();
    return /^(parfait,?\s*merci|perfect,?\s*thanks|merci|thanks|thank you|a tout a l'heure|see you|see you later)$/.test(close);
  };

  const hasReaction = contents.some((text) => {
    if (isTextbookClose(text)) return false;
    const words = text.replace(/[«»"“”]/g, '').split(/\s+/).filter(Boolean);
    return words.length >= 1 && words.length <= 3;
  });
  if (!hasReaction) {
    breaks.push('No short reaction turn (1–3 words, e.g. "Ouais.", "Ah bon ?", "Ça marche.", "Yeah.").');
  }

  if (!isMission) {
    const open = contents[0].toLowerCase();
    if (/ça va\s*\?/.test(open) || /how are you|how's it going|how’s it going/.test(open)) {
      breaks.push('Opens with a Ça va / How are you ritual. Start inside the scene.');
    }
  }

  if (isTextbookClose(contents[contents.length - 1])) {
    breaks.push('Closes with a textbook "merci" / "thanks" instead of a next step or short agreement.');
  }

  return breaks;
}

/**
 * Lightweight Gemini judge: scores dialogue line-to-line coherence (1–10)
 * and spoken naturalness. pass = score >= 7 AND no breaks listed.
 */
export async function validateDialogueCoherence(
  dialogue: string,
): Promise<DialogueCoherenceResult | null> {
  const localBreaks = textbookSpokenBreaks(dialogue);
  const prompt = `Evaluate this dialogue for conversational coherence AND everyday spoken language.

Dialogue:
${dialogue}

Answer these questions internally, then output JSON:
1. Is each line B a plausible response or reaction to line A?
2. Do action roles stay consistent (who waits vs who goes)?
3. Does any new object or place appear without prior setup?
4. Does any verb imply "search/look for" when the location was already stated (use "go get" instead)?
5. Does the ending follow logically from announced actions (no magic resolutions)?
6. If one speaker frames something negatively (expensive, tiring, late, disappointing…), do the other speaker's replies stay consistent with that framing?
7. Spoken register: does it sound like people talking, or like a textbook?
   Fail a textbook if it opens with a "Ça va ?" / "How are you?" ritual, closes with only "Parfait, merci" / "Perfect, thanks" / a bare "Merci",
   or if every line is a complete written sentence with no short reaction ("Ouais.", "Ah bon ?", "Yeah.", "Hold on.").
   French friends should use spoken forms (t'as, j'ai pas, y a, ouais) rather than "est-ce que" and "ne…pas" on every line.
   A service scene may use "Bonjour" and "vous". A1 may keep "ne". Do not fail those.

Output ONLY this JSON:
{
  "score": <integer 1-10, 10 = perfect nexo AND spoken rhythm>,
  "breaks": ["<specific problem>", ...]
}

Rules for breaks:
- List ONLY concrete failures (role flip, phantom object, wrong verb, magic resolution, topic jump, textbook ritual, no short reaction, written register).
- A service "Bonjour" is fine. A friend "Ça va ?" ritual is not.
- If the dialogue is coherent AND spoken, return an empty breaks array.
- score must reflect both nexo and how spoken it sounds. Textbook but logical dialogue scores 5 or below.`;

  try {
    const raw = await callGeminiJSON<{ score?: number; breaks?: string[] }>(
      prompt,
      JUDGE_SYSTEM,
      512,
      0,
      'standard',
    );

    const judgeScore = typeof raw?.score === 'number'
      ? Math.min(10, Math.max(1, Math.round(raw.score)))
      : 0;
    const judgeBreaks = Array.isArray(raw?.breaks)
      ? raw.breaks.filter((b): b is string => typeof b === 'string' && b.trim().length > 0)
      : [];

    if (judgeScore === 0 && localBreaks.length === 0) {
      console.error('[validateDialogueCoherence] Invalid judge response');
      return null;
    }

    const breaks = [...judgeBreaks, ...localBreaks];
    const score = localBreaks.length > 0 ? Math.min(judgeScore || 4, 6) : judgeScore;

    return {
      score,
      pass: score >= 7 && breaks.length === 0,
      breaks,
    };
  } catch (err) {
    console.error('[validateDialogueCoherence] Error:', err);
    if (localBreaks.length > 0) {
      return { score: 4, pass: false, breaks: localBreaks };
    }
    return null;
  }
}
