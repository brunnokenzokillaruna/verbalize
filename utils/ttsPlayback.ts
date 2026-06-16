type SpeechBlock = { start: number; end: number; duration: number };

function findSpeechBlocks(
  data: Float32Array,
  threshold: number,
  sampleRate: number,
): SpeechBlock[] {
  const minSpeech = Math.floor(sampleRate * 0.025);
  const blocks: SpeechBlock[] = [];
  let i = 0;

  while (i < data.length) {
    while (i < data.length && Math.abs(data[i]) <= threshold) i++;
    if (i >= data.length) break;
    const start = i;
    while (i < data.length && Math.abs(data[i]) > threshold) i++;
    const end = i;
    if (end - start >= minSpeech) {
      blocks.push({ start, end, duration: end - start });
    }
  }

  return blocks;
}

function computeRmsEnvelope(
  data: Float32Array,
  sampleRate: number,
  windowMs = 12,
): { rms: number[]; hop: number } {
  const windowSize = Math.max(8, Math.floor((sampleRate * windowMs) / 1000));
  const hop = Math.max(4, Math.floor(windowSize / 2));
  const rms: number[] = [];

  for (let i = 0; i < data.length; i += hop) {
    const end = Math.min(i + windowSize, data.length);
    let sum = 0;
    for (let j = i; j < end; j++) sum += data[j] * data[j];
    rms.push(Math.sqrt(sum / (end - i)));
  }

  return { rms, hop };
}

/**
 * Finds a cut point when the tail is a short bump after a quiet valley.
 */
function findEnvelopeTailCut(
  data: Float32Array,
  sampleRate: number,
): number | null {
  const { rms, hop } = computeRmsEnvelope(data, sampleRate);
  if (rms.length < 8) return null;

  const peak = Math.max(...rms);
  if (peak <= 0.001) return null;

  const speechThreshold = peak * 0.15;
  const valleyThreshold = peak * 0.05;

  const segments: { start: number; end: number; frames: number }[] = [];
  let segStart = -1;

  for (let i = 0; i < rms.length; i++) {
    if (rms[i] >= speechThreshold) {
      if (segStart < 0) segStart = i;
    } else if (segStart >= 0) {
      segments.push({ start: segStart, end: i - 1, frames: i - segStart });
      segStart = -1;
    }
  }

  if (segStart >= 0) {
    segments.push({
      start: segStart,
      end: rms.length - 1,
      frames: rms.length - segStart,
    });
  }

  if (segments.length < 2) return null;

  const last = segments[segments.length - 1];
  const prev = segments[segments.length - 2];
  const gapFrames = last.start - prev.end - 1;
  const gapSec = (gapFrames * hop) / sampleRate;
  const tailSec = (last.frames * hop) / sampleRate;
  const tailRatio = last.frames / Math.max(prev.frames, 1);

  let minBetween = peak;
  for (let i = prev.end + 1; i < last.start; i++) {
    minBetween = Math.min(minBetween, rms[i]);
  }

  // Only trim very short trailing blips (clicks / repeated syllables), not real clauses.
  if (
    minBetween <= valleyThreshold &&
    gapSec >= 0.06 &&
    tailSec <= 0.18 &&
    tailRatio <= 0.15
  ) {
    return Math.min(data.length, (prev.end + 1) * hop + hop);
  }

  return null;
}

function copyTrimmedBuffer(buffer: AudioBuffer, cutEnd: number): AudioBuffer {
  const trimmed = new AudioBuffer({
    length: cutEnd,
    numberOfChannels: buffer.numberOfChannels,
    sampleRate: buffer.sampleRate,
  });

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    trimmed.copyToChannel(buffer.getChannelData(ch).subarray(0, cutEnd), ch);
  }

  return trimmed;
}

/** Never remove more than this fraction of the clip (guards against mid-sentence cuts). */
const MAX_TRIM_FRACTION = 0.12;

function isSpuriousTailBlock(
  gapSec: number,
  tailSec: number,
  tailRatio: number,
): boolean {
  // Real speech after a natural pause is usually >200ms; artifacts are brief blips.
  return gapSec >= 0.06 && tailSec <= 0.18 && tailRatio <= 0.15;
}

/**
 * Trims trailing TTS junk: silence followed by a short groan / syllable repeat
 * common in neural voices and MP3 tails.
 */
export function trimTrailingTtsArtifact(buffer: AudioBuffer): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const data = buffer.getChannelData(0);
  const threshold = 0.01;
  const blocks = findSpeechBlocks(data, threshold, sampleRate);

  let cutEnd = buffer.length;

  if (blocks.length >= 2) {
    const last = blocks[blocks.length - 1];
    const prev = blocks[blocks.length - 2];
    const gapSec = (last.start - prev.end) / sampleRate;
    const tailSec = last.duration / sampleRate;
    const tailRatio = last.duration / Math.max(prev.duration, 1);

    if (isSpuriousTailBlock(gapSec, tailSec, tailRatio)) {
      cutEnd = prev.end;
    } else {
      cutEnd = last.end;
    }
  } else if (blocks.length === 1) {
    cutEnd = blocks[0].end;
  }

  const envelopeCut = findEnvelopeTailCut(data, sampleRate);
  if (envelopeCut !== null && envelopeCut < cutEnd) {
    cutEnd = envelopeCut;
  }

  cutEnd = Math.min(buffer.length, cutEnd + Math.floor(sampleRate * 0.03));

  const trimmedFraction = 1 - cutEnd / buffer.length;
  if (trimmedFraction > MAX_TRIM_FRACTION) return buffer;

  if (cutEnd >= buffer.length - 48) return buffer;

  return copyTrimmedBuffer(buffer, cutEnd);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export type TtsPlaybackHandle = {
  stop: () => void;
};

/**
 * Decodes MP3, trims trailing artifacts, plays via Web Audio API.
 */
export async function playTrimmedMp3Base64(
  base64: string,
  audioContext: AudioContext,
  onEnded: () => void,
): Promise<TtsPlaybackHandle> {
  const arrayBuffer = base64ToArrayBuffer(base64);
  const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  const trimmed = trimTrailingTtsArtifact(decoded);

  const source = audioContext.createBufferSource();
  source.buffer = trimmed;
  source.connect(audioContext.destination);

  source.onended = onEnded;

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  source.start(0);

  return {
    stop: () => {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    },
  };
}
