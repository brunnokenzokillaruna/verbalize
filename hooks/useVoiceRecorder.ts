'use client';

import { useCallback, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'requesting-mic' | 'recording' | 'stopping';

interface UseVoiceRecorderResult {
  state: RecorderState;
  error: string;
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
  isSupported: boolean;
}

/**
 * Captures short user utterances via MediaRecorder for server-side transcription.
 * - Prefers audio/webm;codecs=opus (Chrome/Edge/Firefox) or audio/mp4 (Safari).
 * - start() requests mic permission on first call.
 * - stop() returns the finalised Blob (or null on failure).
 * - The consumer is responsible for uploading the blob and clearing error on retry.
 */
export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const start = useCallback(async () => {
    setError('');
    if (!isSupported) {
      setError('Gravação de áudio não suportada neste navegador.');
      return;
    }
    if (state === 'recording' || state === 'requesting-mic') return;

    setState('requesting-mic');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = pickSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const resolver = stopResolverRef.current;
        stopResolverRef.current = null;
        const type = recorder.mimeType || 'audio/webm';
        const blob = chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type }) : null;
        cleanup();
        setState('idle');
        resolver?.(blob);
      };
      recorder.onerror = (e) => {
        console.error('[useVoiceRecorder] MediaRecorder error:', e);
        setError('Falha na gravação. Tente de novo.');
        const resolver = stopResolverRef.current;
        stopResolverRef.current = null;
        cleanup();
        setState('idle');
        resolver?.(null);
      };

      recorder.start();
      setState('recording');
    } catch (err) {
      const domErr = err as DOMException;
      if (domErr?.name === 'NotAllowedError' || domErr?.name === 'SecurityError') {
        setError('Permissão de microfone negada.');
      } else if (domErr?.name === 'NotFoundError') {
        setError('Nenhum microfone encontrado.');
      } else {
        setError('Não foi possível acessar o microfone.');
      }
      cleanup();
      setState('idle');
    }
  }, [isSupported, state, cleanup]);

  const stop = useCallback((): Promise<Blob | null> => {
    const rec = mediaRecorderRef.current;
    if (!rec || rec.state === 'inactive') {
      cleanup();
      setState('idle');
      return Promise.resolve(null);
    }
    setState('stopping');
    return new Promise<Blob | null>((resolve) => {
      stopResolverRef.current = resolve;
      try {
        rec.stop();
      } catch {
        stopResolverRef.current = null;
        cleanup();
        setState('idle');
        resolve(null);
      }
    });
  }, [cleanup]);

  return { state, error, start, stop, isSupported };
}

function pickSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return undefined;
}
