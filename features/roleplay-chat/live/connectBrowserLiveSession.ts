import type { LiveServerMessage } from '@google/genai';
import { LIVE_ROLEPLAY_MODEL, LIVE_VOICE_NAME } from '../constants';

export interface BrowserLiveSession {
  sendRealtimeInput: (input: {
    audio?: { data: string; mimeType: string };
    text?: string;
    audioStreamEnd?: boolean;
  }) => void;
  close: () => void;
}

export interface BrowserLiveConnectParams {
  token: string;
  model?: string;
  systemInstruction: string;
  onMessage: (message: LiveServerMessage) => void;
  onError: (message: string) => void;
  onClose: (code: number, reason: string) => void;
}

/**
 * Browser Live API client that avoids the SDK WebSocket URL bug
 * (`wss://...googleapis.com//ws/...` double slash), which often fails
 * in browsers while Node's `ws` package still connects.
 *
 * Waits for `setupComplete` before resolving so mic audio is not sent early.
 */
export function connectBrowserLiveSession(
  params: BrowserLiveConnectParams,
): Promise<BrowserLiveSession> {
  const modelName = params.model || LIVE_ROLEPLAY_MODEL;
  const token = params.token.trim();
  if (!token.startsWith('auth_tokens/')) {
    return Promise.reject(new Error('Token efêmero inválido.'));
  }

  const model = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
  const url =
    'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha' +
    `.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token)}`;

  return new Promise((resolve, reject) => {
    let settled = false;
    let setupDone = false;
    const ws = new WebSocket(url);

    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        // ignore
      }
      reject(new Error(message));
    };

    const session: BrowserLiveSession = {
      sendRealtimeInput(input) {
        if (ws.readyState !== WebSocket.OPEN) return;
        const realtimeInput: Record<string, unknown> = {};
        if (input.audio) {
          realtimeInput.audio = {
            data: input.audio.data,
            mimeType: input.audio.mimeType,
          };
        }
        if (input.text !== undefined) realtimeInput.text = input.text;
        if (input.audioStreamEnd !== undefined) {
          realtimeInput.audioStreamEnd = input.audioStreamEnd;
        }
        ws.send(JSON.stringify({ realtimeInput }));
      },
      close() {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close(1000, 'client_close');
        }
      },
    };

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          setup: {
            model,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: LIVE_VOICE_NAME },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: params.systemInstruction }],
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            contextWindowCompression: { slidingWindow: {} },
          },
        }),
      );
    };

    ws.onmessage = async (event: MessageEvent) => {
      try {
        const raw =
          typeof event.data === 'string'
            ? event.data
            : event.data instanceof Blob
              ? await event.data.text()
              : new TextDecoder().decode(event.data as ArrayBuffer);
        const message = JSON.parse(raw) as LiveServerMessage & {
          error?: { message?: string; code?: number };
        };

        if (message.error) {
          const msg =
            message.error.message ||
            `Erro do Live API${message.error.code ? ` (${message.error.code})` : ''}`;
          params.onError(msg);
          fail(msg);
          return;
        }

        if (message.setupComplete && !setupDone) {
          setupDone = true;
          settled = true;
          resolve(session);
        }

        params.onMessage(message);
      } catch (err) {
        console.warn('[browser-live] failed to parse message', err);
      }
    };

    ws.onerror = () => {
      if (!settled) {
        fail(
          'Falha ao abrir WebSocket com o Gemini Live. Verifique a rede e tente novamente.',
        );
      } else {
        params.onError('Erro na conexão de voz com o Gemini Live.');
      }
    };

    ws.onclose = (event: CloseEvent) => {
      const reason = event.reason || '(sem motivo)';
      params.onClose(event.code, reason);
      if (!settled) {
        fail(
          `Conexão Live encerrada antes do setup (código ${event.code}: ${reason}).`,
        );
      }
    };

    window.setTimeout(() => {
      if (!settled) {
        fail('Tempo esgotado ao conectar ao Gemini Live.');
      }
    }, 20_000);
  });
}
