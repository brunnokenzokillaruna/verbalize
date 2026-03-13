'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, CheckCircle, XCircle, SkipForward, RefreshCw, Send } from 'lucide-react';
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

type Phase = 'idle' | 'recording' | 'review' | 'answered';

export function SpeakRepeatExercise({
  data,
  language,
  onAnswer,
  answered,
}: SpeakRepeatExerciseProps) {
  const [hasSpeechAPI, setHasSpeechAPI] = useState(false);
  const [phase, setPhase] = useState<Phase>(answered ? 'answered' : 'idle');
  const [transcript, setTranscript] = useState('');
  const [recordError, setRecordError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setHasSpeechAPI(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (answered) setPhase('answered');
  }, [answered]);

  const langCode = language === 'fr' ? 'fr-FR' : 'en-US';
  const isCorrect = transcript ? similarity(data.text, transcript) >= 0.85 : null;

  function startRecording() {
    if (phase === 'recording' || phase === 'answered') return;
    setRecordError('');
    setTranscript('');
    setPhase('recording');
    try {
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
        setPhase('review');
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onerror = (e: any) => {
        setPhase('idle');
        if (e.error === 'not-allowed') {
          setRecordError('Permissão de microfone negada.');
        } else if (e.error === 'network') {
          setRecordError('Serviço de voz bloqueado (extensão do navegador?).');
        } else {
          setRecordError('Gravação falhou. Use os botões abaixo.');
        }
      };
      rec.onend = () => {
        if (!resultReceived) {
          setPhase('idle');
          setRecordError('Nenhuma fala detectada. Tente novamente.');
        }
      };
      recogRef.current = rec;
      rec.start();
    } catch {
      setPhase('idle');
      setRecordError('Gravação não disponível neste navegador.');
    }
  }

  function submit(correct: boolean) {
    setPhase('answered');
    onAnswer(correct);
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

      {/* Audio row — Record button only shown in idle/recording phases */}
      <div className="flex flex-wrap items-center gap-3">
        <AudioPlayerButton text={data.text} language={language} size="sm" />

        {(phase === 'idle' || phase === 'recording') && hasSpeechAPI && !recordError && (
          <button
            type="button"
            onClick={startRecording}
            disabled={phase === 'recording'}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
            style={{
              backgroundColor: phase === 'recording' ? 'var(--color-error-bg)' : 'var(--color-primary)',
              color: phase === 'recording' ? 'var(--color-error)' : 'var(--color-text-inverse)',
              border: phase === 'recording' ? '1px solid var(--color-error)' : 'none',
            }}
          >
            {phase === 'recording' ? <MicOff size={15} /> : <Mic size={15} />}
            {phase === 'recording' ? 'Gravando…' : 'Gravar'}
          </button>
        )}
      </div>

      {/* Record error */}
      {recordError && (
        <p
          className="text-xs rounded-xl px-3 py-2"
          style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}
        >
          {recordError}
        </p>
      )}

      {/* Review phase: transcript + 3 action buttons */}
      {phase === 'review' && (
        <div className="flex flex-col gap-3">
          {/* Transcript */}
          <div
            className="flex items-start gap-3 rounded-2xl p-4"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {isCorrect
              ? <CheckCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
              : <XCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Você disse:</p>
              <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{transcript}</p>
            </div>
          </div>

          {/* 3 action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <RefreshCw size={14} />
              Gravar novamente
            </button>

            <button
              type="button"
              onClick={() => submit(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
              }}
            >
              <Send size={14} />
              Enviar
            </button>

            <button
              type="button"
              onClick={() => submit(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all active:scale-95"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
              }}
            >
              <SkipForward size={13} />
              Pular
            </button>
          </div>
        </div>
      )}

      {/* No Speech API or after error: just Enviar + Pular */}
      {phase === 'idle' && (!hasSpeechAPI || !!recordError) && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => submit(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
            }}
          >
            <Send size={14} />
            Enviar
          </button>

          <button
            type="button"
            onClick={() => submit(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all active:scale-95"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            <SkipForward size={13} />
            Pular
          </button>
        </div>
      )}

      {/* Answered state: show final transcript */}
      {phase === 'answered' && transcript && (
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
