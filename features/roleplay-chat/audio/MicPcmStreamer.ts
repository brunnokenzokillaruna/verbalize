import { LIVE_INPUT_SAMPLE_RATE } from '../constants';
import { arrayBufferToBase64, downsampleFloat32, float32ToInt16Pcm } from './pcmUtils';

type PcmChunkHandler = (base64Pcm: string) => void;

/**
 * Captures microphone audio and emits 16 kHz PCM16 LE base64 chunks for Live API.
 *
 * Uses ScriptProcessorNode (deprecated but CSP-safe). AudioWorklet requires
 * loading a blob: module, which our Content-Security-Policy script-src blocks.
 */
export class MicPcmStreamer {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private silentGain: GainNode | null = null;
  private onChunk: PcmChunkHandler | null = null;
  private running = false;

  async start(onChunk: PcmChunkHandler): Promise<void> {
    if (this.running) return;
    this.onChunk = onChunk;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.ctx = new AudioContext();
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.processor = this.ctx.createScriptProcessor(4096, 1, 1);
    this.silentGain = this.ctx.createGain();
    this.silentGain.gain.value = 0;

    this.processor.onaudioprocess = (event) => {
      if (!this.running || !this.onChunk || !this.ctx) return;
      const input = event.inputBuffer.getChannelData(0);
      const downsampled = downsampleFloat32(
        input,
        this.ctx.sampleRate,
        LIVE_INPUT_SAMPLE_RATE,
      );
      this.onChunk(arrayBufferToBase64(float32ToInt16Pcm(downsampled)));
    };

    this.source.connect(this.processor);
    this.processor.connect(this.silentGain);
    this.silentGain.connect(this.ctx.destination);
    this.running = true;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    this.onChunk = null;

    try {
      this.processor?.disconnect();
      this.source?.disconnect();
      this.silentGain?.disconnect();
    } catch {
      // ignore
    }

    this.processor = null;
    this.source = null;
    this.silentGain = null;

    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;

    if (this.ctx) {
      await this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
  }

  get isRunning(): boolean {
    return this.running;
  }
}
