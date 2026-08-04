/** Convert Float32 mono samples (-1..1) to 16-bit LE PCM bytes. */
export function float32ToInt16Pcm(float32: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/** Downsample Float32 audio from sourceRate to targetRate using linear interpolation. */
export function downsampleFloat32(
  input: Float32Array,
  sourceRate: number,
  targetRate: number,
): Float32Array {
  if (sourceRate === targetRate) return input;
  if (sourceRate < targetRate) {
    // Rare: upsample with nearest — Live accepts other rates but we prefer 16k.
    const ratio = targetRate / sourceRate;
    const outLength = Math.floor(input.length * ratio);
    const output = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
      output[i] = input[Math.min(input.length - 1, Math.floor(i / ratio))];
    }
    return output;
  }

  const ratio = sourceRate / targetRate;
  const outLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    output[i] = sum / Math.max(1, end - start);
  }
  return output;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
