'use client';

import { useState, useRef } from 'react';
import { Mic, MicOff, CheckCircle, XCircle } from 'lucide-react';
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
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Word-overlap similarity: what fraction of target words appear in transcript. */
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
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recogRef = useRef<unknown>(null);

  // Detect Web Speech API support (client-side only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnySpeechRecognition = any;

  const hasSpeechAPI =
    typeof window !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const langCode = language === 'fr' ? 'fr-FR' : 'en-US';

  function startRecording() {
    if (recording || answered) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR: new () => AnySpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    const rec: AnySpeechRecognition = new SR();
    rec.lang = langCode;
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: AnySpeechRecognition) => {
      const result: string = e.results[0][0].transcript;
      setTranscript(result);
      onAnswer(similarity(data.text, result) >= 0.6);
    };
    rec.onerror = () => {
      setRecording(false);
    };
    rec.onend = () => setRecording(false);
    recogRef.current = rec;
    rec.start();
    setRecording(true);
  }

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

      {/* Controls */}
      <div className="flex items-center gap-3">
        <AudioPlayerButton text={data.text} language={language} size="sm" />

        {!answered && hasSpeechAPI && (
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

        {/* Fallback: self-assess when SpeechRecognition is unavailable */}
        {!answered && !hasSpeechAPI && (
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
        )}
      </div>

      {/* Transcript + result */}
      {answered && transcript && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {similarity(data.text, transcript) >= 0.6
            ? <CheckCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
            : <XCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />}
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Você disse:
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{transcript}</p>
          </div>
        </div>
      )}
    </div>
  );
}
