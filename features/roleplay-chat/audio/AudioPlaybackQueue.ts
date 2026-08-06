import { LIVE_OUTPUT_SAMPLE_RATE } from '../constants';
import { base64ToArrayBuffer } from './pcmUtils';

/**
 * Queues and plays raw PCM16 LE mono audio (Live API output = 24 kHz).
 * Clears on interruption.
 *
 * Also exposes an utterance clock so the UI can run karaoke highlighting
 * against estimated word timings while the character speaks.
 */
export class AudioPlaybackQueue {
  private ctx: AudioContext | null = null;
  private nextStart = 0;
  private sources: AudioBufferSourceNode[] = [];
  private muted = false;
  /** AudioContext time when the current assistant utterance began. */
  private utteranceOrigin: number | null = null;

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

  /** Seconds since the current utterance started, or null if idle. */
  getUtteranceElapsed(): number | null {
    if (!this.ctx || this.utteranceOrigin === null) return null;
    return Math.max(0, this.ctx.currentTime - this.utteranceOrigin);
  }

  /** Total scheduled duration of the current utterance (may grow as chunks arrive). */
  getUtteranceDuration(): number | null {
    if (!this.ctx || this.utteranceOrigin === null) return null;
    return Math.max(0.05, this.nextStart - this.utteranceOrigin);
  }

  isActivelyPlaying(): boolean {
    if (!this.ctx || this.utteranceOrigin === null) return false;
    return this.sources.length > 0 || this.ctx.currentTime < this.nextStart - 0.02;
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

    // New utterance when the queue was drained / interrupted.
    if (this.utteranceOrigin === null || now >= this.nextStart - 0.01) {
      this.utteranceOrigin = startAt;
    }

    source.start(startAt);
    this.nextStart = startAt + buffer.duration;
    this.sources.push(source);
    source.onended = () => {
      this.sources = this.sources.filter((s) => s !== source);
      if (
        this.sources.length === 0 &&
        this.ctx &&
        this.ctx.currentTime >= this.nextStart - 0.05
      ) {
        this.utteranceOrigin = null;
      }
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
    this.utteranceOrigin = null;
    if (this.ctx) {
      this.nextStart = this.ctx.currentTime;
    }
  }

  /** Wait until all audio currently queued has finished playing. */
  async waitUntilIdle(): Promise<void> {
    if (!this.ctx || (this.sources.length === 0 && this.utteranceOrigin === null)) return;

    const remainingMs = Math.max(0, (this.nextStart - this.ctx.currentTime) * 1000);
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, remainingMs + 80);
    });
    this.utteranceOrigin = null;
  }

  async close(): Promise<void> {
    this.clear();
    if (this.ctx) {
      await this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
  }
}
