/**
 * Listen-and-respond should play ONLY the interlocutor addressing the learner —
 * never the lesson hook dialogue and never the learner's own lines.
 */

const LEARNER_SPEAKER_RE =
  /^(você|voce|tu|je|j'|i|me|moi|client|cliente|élève|eleve|student|learner|aluno|aluna)$/i;

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?;:'"«»-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSpeakerLine(line: string): { speaker: string; content: string } | null {
  const colon = line.indexOf(':');
  if (colon <= 0) return null;
  const speaker = line.slice(0, colon).trim();
  const content = line.slice(colon + 1).trim();
  if (!speaker || !content) return null;
  return { speaker, content };
}

function contentOnlyLines(dialogue: string): string[] {
  return dialogue
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const parts = splitSpeakerLine(l);
      return normalizeText(parts?.content ?? l);
    })
    .filter(Boolean);
}

/** True when exercise audio reuses most lines from the lesson hook dialogue. */
export function isListenAudioCopiedFromLesson(
  dialogueAudio: string,
  lessonDialogue: string,
): boolean {
  const exercise = contentOnlyLines(dialogueAudio);
  const lesson = new Set(contentOnlyLines(lessonDialogue));
  if (exercise.length === 0 || lesson.size === 0) return false;

  const hits = exercise.filter((line) => lesson.has(line)).length;
  return hits >= Math.min(2, exercise.length) || hits / exercise.length >= 0.6;
}

/**
 * Keep 1–3 lines from a single interlocutor; last line must be promptLine.
 * Strips learner turns ("Você:", "Client:", …) and other speakers.
 */
export function normalizeListenAndRespondAudio(
  dialogueAudio: string,
  promptLine: string,
): string {
  const prompt = promptLine.trim();
  const promptNorm = normalizeText(prompt);
  const rawLines = dialogueAudio
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed = rawLines
    .map(splitSpeakerLine)
    .filter((p): p is { speaker: string; content: string } => p !== null);

  let interlocutor: string | null = null;

  for (let i = parsed.length - 1; i >= 0; i--) {
    const { speaker, content } = parsed[i];
    if (LEARNER_SPEAKER_RE.test(speaker)) continue;
    const contentNorm = normalizeText(content);
    if (
      contentNorm === promptNorm ||
      contentNorm.includes(promptNorm) ||
      promptNorm.includes(contentNorm)
    ) {
      interlocutor = speaker;
      break;
    }
  }

  if (!interlocutor) {
    for (let i = parsed.length - 1; i >= 0; i--) {
      if (!LEARNER_SPEAKER_RE.test(parsed[i].speaker)) {
        interlocutor = parsed[i].speaker;
        break;
      }
    }
  }

  interlocutor = interlocutor || 'Interlocuteur';

  let lines = parsed
    .filter((p) => !LEARNER_SPEAKER_RE.test(p.speaker))
    .filter((p) => p.speaker.toLowerCase() === interlocutor!.toLowerCase())
    .map((p) => `${p.speaker}: ${p.content}`);

  if (lines.length === 0 && prompt) {
    return `${interlocutor}: ${prompt}`;
  }

  const lastContent = lines.length
    ? (splitSpeakerLine(lines[lines.length - 1])?.content ?? '')
    : '';
  if (!lastContent || normalizeText(lastContent) !== promptNorm) {
    lines = [
      ...lines.filter((l) => normalizeText(splitSpeakerLine(l)?.content ?? '') !== promptNorm),
      `${interlocutor}: ${prompt}`,
    ];
  }

  if (lines.length > 3) {
    lines = lines.slice(-3);
  }

  return lines.join('\n');
}

export function sanitizeListenAndRespondFields(input: {
  dialogueAudio: string;
  promptLine: string;
  lessonDialogue?: string;
}): { dialogueAudio: string; promptLine: string } {
  const promptLine = input.promptLine.trim();
  let dialogueAudio = normalizeListenAndRespondAudio(input.dialogueAudio, promptLine);

  if (input.lessonDialogue && isListenAudioCopiedFromLesson(dialogueAudio, input.lessonDialogue)) {
    const speaker =
      splitSpeakerLine(dialogueAudio.split('\n')[0] ?? '')?.speaker || 'Interlocuteur';
    dialogueAudio = `${speaker}: ${promptLine}`;
  }

  return { dialogueAudio, promptLine };
}
