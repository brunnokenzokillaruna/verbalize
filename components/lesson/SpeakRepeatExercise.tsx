'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, CheckCircle, XCircle, SkipForward, RefreshCw, Send } from 'lucide-react';
import { AudioPlayerButton } from './AudioPlayerButton';
import type { SpeakRepeatData, SupportedLanguage } from '@/types';

interface SpeakRepeatExerciseProps {
  data: SpeakRepeatData;
  language: SupportedLanguage;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
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
  setIsExerciseReady,
  submitTrigger
}: SpeakRepeatExerciseProps) {
  const [hasSpeechAPI, setHasSpeechAPI] = useState(false);
  const [phase, setPhase] = useState<Phase>(answered ? 'answered' : 'idle');
  const [transcript, setTranscript] = useState('');
  const [recordError, setRecordError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null);

  const langCode = language === 'fr' ? 'fr-FR' : 'en-US';
  const isCorrect = transcript ? similarity(data.text, transcript) >= 0.85 : null;

  // Notify parent of readiness
  useEffect(() => {
    if (phase !== 'answered') {
      setIsExerciseReady(phase === 'review' || !hasSpeechAPI || !!recordError);
    } else {
      setIsExerciseReady(false);
    }
  }, [phase, hasSpeechAPI, recordError, setIsExerciseReady]);

  // Listen for global submit
  useEffect(() => {
    if (submitTrigger > 0 && phase !== 'answered') {
      submit(isCorrect ?? true);
    }
  }, [submitTrigger, isCorrect, phase]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setHasSpeechAPI(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (answered) setPhase('answered');
  }, [answered]);

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
    <div className="flex flex-col gap-8">
      {/* Instruction */}
      <div className="flex items-center gap-3 px-1 opacity-70">
        <span className="h-px w-6 bg-[var(--color-border)]" />
        <p className="text-xs font-medium italic text-[var(--color-text-muted)]">
          Ouça a frase e repita em voz alta:
        </p>
      </div>

      {/* Sentence card */}
      <div
        className="rounded-xl p-6 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)] space-y-3"
      >
        <p className="font-display text-2xl font-bold leading-relaxed text-[var(--color-text-primary)]">
          {data.text}
        </p>
        <p className="text-xs font-medium italic text-[var(--color-text-muted)] opacity-70 border-l-2 border-[var(--color-primary)]/20 pl-4">
          {data.translation}
        </p>
      </div>

      {/* Audio & Record Controls */}
      <div className="flex items-center gap-4 px-1">
        <AudioPlayerButton text={data.text} language={language} size="md" />

        {(phase === 'idle' || phase === 'recording') && hasSpeechAPI && !recordError && (
          <button
            type="button"
            onClick={startRecording}
            disabled={phase === 'recording'}
            className="flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 active:scale-95 disabled:opacity-60 shadow-sm"
            style={{
              backgroundColor: phase === 'recording' ? 'var(--color-error)' : 'var(--color-primary)',
              color: '#fff',
            }}
          >
            {phase === 'recording' ? (
              <>
                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                <span>Gravando…</span>
              </>
            ) : (
              <>
                <Mic size={16} />
                <span>Gravar Voz</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Record error */}
      {recordError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 animate-in fade-in duration-300">
          <p className="text-[11px] font-medium text-red-600">
            {recordError}
          </p>
        </div>
      )}

      {/* Review phase: transcript + action buttons */}
      {phase === 'review' && (
        <div className="flex flex-col gap-5 animate-in slide-in-from-bottom-2 duration-500">
          {/* Transcript Feedback */}
          <div
            className="flex items-start gap-4 rounded-xl p-5 bg-[var(--color-surface-raised)]/50 border border-[var(--color-border)]"
          >
            <div className="mt-1">
              {isCorrect
                ? <CheckCircle size={20} className="text-[var(--color-success)]" />
                : <XCircle size={20} className="text-[var(--color-error)]" />}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1 opacity-60">Você disse:</p>
              <p className="text-base font-semibold text-[var(--color-text-primary)] leading-relaxed italic">&ldquo;{transcript}&rdquo;</p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
            >
              <RefreshCw size={14} />
              Refazer
            </button>

            <button
              type="button"
              onClick={() => submit(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-300 active:scale-95 bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20"
            >
              <Send size={15} />
              Enviar Resposta
            </button>

            <button
              type="button"
              onClick={() => submit(true)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] opacity-60 hover:opacity-100 transition-all active:scale-95"
            >
              Pular
              <SkipForward size={14} />
            </button>
          </div>
        </div>
      )}

      {/* No Speech API or after error fallback */}
      {phase === 'idle' && (!hasSpeechAPI || !!recordError) && (
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => submit(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all duration-300 active:scale-95 bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20"
          >
            <Send size={16} />
            Continuar sem áudio
          </button>

          <button
            type="button"
            onClick={() => submit(true)}
            className="flex items-center gap-2 rounded-xl px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] transition-all active:scale-95"
          >
            Pular
          </button>
        </div>
      )}

      {/* Final Answered State Feedback */}
      {phase === 'answered' && transcript && (
        <div
          className="flex items-start gap-4 rounded-xl p-5 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]/50 opacity-80"
        >
          <div className="mt-1">
            {isCorrect
              ? <CheckCircle size={18} className="text-[var(--color-success)]" />
              : <XCircle size={18} className="text-[var(--color-error)]" />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1 opacity-60">Sua fala registrada:</p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] italic leading-relaxed">&ldquo;{transcript}&rdquo;</p>
          </div>
        </div>
      )}
    </div>
  );
}
