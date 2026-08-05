import { LIVE_OUTPUT_SAMPLE_RATE } from '../constants';
import { base64ToArrayBuffer } from './pcmUtils';

/**
 * Queues and plays raw PCM16 LE mono audio (Live API output = 24 kHz).
 * Clears on interruption.
 */
export class AudioPlaybackQueue {
  private ctx: AudioContext | null = null;
  private nextStart = 0;
  private sources: AudioBufferSourceNode[] = [];
  private muted = false;

  async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: LIVE_OUTPUT_SAMPLE_RATE });
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  async enqueueBase64Pcm(base64: string): Promise<void> {
    if (this.muted || !base64) return;

    const ctx = await this.ensureContext();
    const pcm = base64ToArrayBuffer(base64);
    const int16 = new Int16Array(pcm);
    if (int16.length === 0) return;

    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const buffer = ctx.createBuffer(1, float32.length, LIVE_OUTPUT_SAMPLE_RATE);
    buffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now + 0.02, this.nextStart);
    source.start(startAt);
    this.nextStart = startAt + buffer.duration;
    this.sources.push(source);
    source.onended = () => {
      this.sources = this.sources.filter((s) => s !== source);
    };
  }

  /** Stop all queued playback (call on Live `interrupted`). */
  clear(): void {
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }
    this.sources = [];
    if (this.ctx) {
      this.nextStart = this.ctx.currentTime;
    }
  }

  /** Wait until all audio currently queued has finished playing. */
  async waitUntilIdle(): Promise<void> {
    if (!this.ctx || this.sources.length === 0) return;

    const remainingMs = Math.max(0, (this.nextStart - this.ctx.currentTime) * 1000);
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, remainingMs + 80);
    });
  }

  async close(): Promise<void> {
    this.clear();
    if (this.ctx) {
      await this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
  }
}
