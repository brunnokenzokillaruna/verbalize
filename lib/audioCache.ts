import { createHash } from 'crypto';
import type { AudioCacheDocument, AudioCacheProvider, SupportedLanguage } from '@/types';

/** Stay under Firestore's 1 MiB doc limit with headroom for metadata. */
export const AUDIO_CACHE_MAX_BYTES = 850_000;

export type AudioCachePayload = {
  provider: AudioCacheProvider;
  model: string;
  language: SupportedLanguage;
  sourceKey: string;
  chunks: string[];
  mimeType: 'audio/mpeg' | 'audio/wav';
  monolithic?: boolean;
  speakerVoices?: Array<{ speaker: string; voiceName: string }>;
};

export function buildAudioCacheId(
  provider: AudioCacheProvider,
  model: string,
  language: SupportedLanguage,
  sourceKey: string,
): string {
  const material = `${provider}|${model}|${language}|${sourceKey.trim().toLowerCase()}`;
  return createHash('sha256').update(material).digest('hex').slice(0, 40);
}

export function estimateAudioCacheByteSize(chunks: string[]): number {
  // Base64 length is a close upper bound on stored string size in Firestore.
  return chunks.reduce((sum, chunk) => sum + chunk.length, 0);
}

export function canPersistAudioCache(chunks: string[]): boolean {
  if (chunks.length === 0) return false;
  if (chunks.some((chunk) => !chunk)) return false;
  return estimateAudioCacheByteSize(chunks) <= AUDIO_CACHE_MAX_BYTES;
}

export function toAudioCacheWriteData(
  id: string,
  payload: AudioCachePayload,
): Omit<AudioCacheDocument, 'createdAt'> {
  return {
    id,
    provider: payload.provider,
    model: payload.model,
    language: payload.language,
    sourceKey: payload.sourceKey,
    chunks: payload.chunks,
    mimeType: payload.mimeType,
    monolithic: payload.monolithic,
    speakerVoices: payload.speakerVoices,
    byteSize: estimateAudioCacheByteSize(payload.chunks),
  };
}
