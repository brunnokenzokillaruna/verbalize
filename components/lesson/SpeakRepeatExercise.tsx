'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, CheckCircle, XCircle, SkipForward } from 'lucide-react';
import { AudioPlayerButton } from './AudioPlayerButton';
import type { SpeakRepeatData, SupportedLanguage } from '@/types';

interface SpeakRepeatExerciseProps {
  data: SpeakRepeatData;
  language: SupportedLanguage;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(target: string, transcript: string): number {
  const tWords = normalizeText(target).split(' ');
  const rWords = new Set(normalizeText(transcript).split(' '));
  const matches = tWords.filter((w) => rWords.has(w)).length;
  return matches / Math.max(tWords.length, 1);
}

export function SpeakRepeatExercise({
  data,
  language,
  onAnswer,
  answered,
}: SpeakRepeatExerciseProps) {
  // Detect after mount to avoid SSR/hydration mismatch
  const [hasSpeechAPI, setHasSpeechAPI] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordError, setRecordError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setHasSpeechAPI(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const langCode = language === 'fr' ? 'fr-FR' : 'en-US';

  function startRecording() {
    if (recording || answered) return;
    setRecordError('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: new () => any = w.SpeechRecognition || w.webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR();
    rec.lang = langCode;
    rec.continuous = false;
    rec.interimResults = false;
    let resultReceived = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      resultReceived = true;
      const result: string = e.results[0][0].transcript;
      setTranscript(result);
      onAnswer(similarity(data.text, result) >= 0.6);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      setRecording(false);
      if (e.error === 'not-allowed') {
        setRecordError('Permissão de microfone negada. Use os botões abaixo.');
      } else {
        setRecordError('Não foi possível gravar. Use os botões abaixo.');
      }
    };
    rec.onend = () => {
      setRecording(false);
      if (!resultReceived) {
        setRecordError('Nenhuma fala detectada. Tente novamente ou use os botões abaixo.');
      }
    };
    recogRef.current = rec;
    rec.start();
    setRecording(true);
  }

  const isCorrect = transcript ? similarity(data.text, transcript) >= 0.6 : null;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        Ouça a frase e repita em voz alta:
      </p>

      {/* Sentence card */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <p className="font-display text-xl leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
          {data.text}
        </p>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          {data.translation}
        </p>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <AudioPlayerButton text={data.text} language={language} size="sm" />

        {!answered && hasSpeechAPI && !recordError && (
          <button
            type="button"
            onClick={startRecording}
            disabled={recording}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
            style={{
              backgroundColor: recording ? 'var(--color-error-bg)' : 'var(--color-primary)',
              color: recording ? 'var(--color-error)' : 'var(--color-text-inverse)',
              border: recording ? '1px solid var(--color-error)' : 'none',
            }}
          >
            {recording ? <MicOff size={15} /> : <Mic size={15} />}
            {recording ? 'Gravando…' : 'Gravar'}
          </button>
        )}

        {/* Skip button — always visible while unanswered */}
        {!answered && (
          <button
            type="button"
            onClick={() => onAnswer(true)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-95"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            <SkipForward size={14} />
            Pular
          </button>
        )}
      </div>

      {/* Self-assess fallback (when API unavailable or errored) */}
      {!answered && (recordError || !hasSpeechAPI) && (
        <div className="flex flex-col gap-2">
          {recordError && (
            <p className="text-xs rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
              {recordError}
            </p>
          )}
          <div className="flex items-center gap-2">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Você disse corretamente?</p>
            <button
              type="button"
              onClick={() => onAnswer(true)}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold"
              style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => onAnswer(false)}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold"
              style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}
            >
              Não
            </button>
          </div>
        </div>
      )}

      {/* Transcript + result */}
      {answered && transcript && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {isCorrect
            ? <CheckCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
            : <XCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />}
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Você disse:</p>
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{transcript}</p>
          </div>
        </div>
      )}
    </div>
  );
}
