'use server';

import type { SupportedLanguage } from '@/types';

const GROQ_TRANSCRIPTION_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = 'whisper-large-v3-turbo';

export interface TranscribeResult {
  text: string;
  language: string;
  durationMs: number;
}

/**
 * Transcribes a short user utterance via Groq's Whisper Large v3 Turbo.
 * - Called from SpeakRepeatExercise and LessonMissionRolePlay.
 * - Free tier: 2 000 req/day + 7 200 audio-seconds/hour — plenty for this usage.
 * - Input is FormData carrying a `file` (audio blob) and `language` field.
 * - Returns the transcript (lowercased, trimmed) plus latency for telemetry.
 */
export async function transcribeSpeech(formData: FormData): Promise<TranscribeResult | { error: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('[transcribeSpeech] GROQ_API_KEY is not set');
    return { error: 'Serviço de transcrição indisponível.' };
  }

  const audio = formData.get('file');
  const language = (formData.get('language') as SupportedLanguage | null) ?? 'en';
  const prompt = formData.get('prompt'); // optional: target phrase hint for biasing

  if (!(audio instanceof Blob)) {
    return { error: 'Áudio inválido.' };
  }
  if (audio.size === 0) {
    return { error: 'Áudio vazio.' };
  }
  if (audio.size > 25 * 1024 * 1024) {
    return { error: 'Áudio maior que o limite de 25MB.' };
  }

  const groqForm = new FormData();
  // Groq's transcription endpoint accepts the blob as-is; the `name`
  // component of the file entry is what it uses for format detection.
  const fileName = `audio.${guessExtension(audio.type)}`;
  groqForm.append('file', audio, fileName);
  groqForm.append('model', MODEL);
  groqForm.append('language', language);
  groqForm.append('response_format', 'json');
  groqForm.append('temperature', '0');
  if (typeof prompt === 'string' && prompt.length > 0 && prompt.length < 240) {
    // Whisper's `prompt` biases toward the target phrase, which dramatically
    // reduces hallucinations on 2-3s clips of non-native speech.
    groqForm.append('prompt', prompt);
  }

  const started = performance.now();
  try {
    const res = await fetch(GROQ_TRANSCRIPTION_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: groqForm,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[transcribeSpeech] Groq error ${res.status}:`, text.slice(0, 300));
      if (res.status === 401) return { error: 'Chave da API inválida.' };
      if (res.status === 429) return { error: 'Limite de uso atingido. Tente de novo em alguns segundos.' };
      return { error: 'Falha ao transcrever. Tente de novo.' };
    }

    const data = (await res.json()) as { text?: string; language?: string };
    const text = (data.text ?? '').trim();
    return {
      text,
      language: data.language ?? language,
      durationMs: Math.round(performance.now() - started),
    };
  } catch (err) {
    console.error('[transcribeSpeech] Error:', err);
    return { error: 'Erro de rede ao transcrever.' };
  }
}

function guessExtension(mime: string): string {
  if (!mime) return 'webm';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mpeg')) return 'mp3';
  return 'webm';
}
