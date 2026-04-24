'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, CheckCircle, XCircle, SkipForward, RefreshCw, Send } from 'lucide-react';
import { AudioPlayerButton } from './AudioPlayerButton';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeSpeech } from '@/app/actions/transcribeSpeech';
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

type Phase = 'idle' | 'requesting-mic' | 'recording' | 'transcribing' | 'review' | 'answered';

export function SpeakRepeatExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger
}: SpeakRepeatExerciseProps) {
  const recorder = useVoiceRecorder();
  const hasSpeechAPI = recorder.isSupported;
  const [phase, setPhase] = useState<Phase>(answered ? 'answered' : 'idle');
  const [transcript, setTranscript] = useState('');
  const [recordError, setRecordError] = useState('');

  const isCorrect = transcript ? similarity(data.text, transcript) >= 0.85 : null;

  // Notify parent of readiness
  useEffect(() => {
    if (phase !== 'answered') {
      setIsExerciseReady(phase === 'review' || !hasSpeechAPI || !!recordError);
    } else {
      setIsExerciseReady(false);
    }
  }, [phase, hasSpeechAPI, recordError, setIsExerciseReady]);

  // Listen for global submit. Ignore the trigger value present at mount —
  // it may already be > 0 from a previously-submitted exercise on the same page,
  // which would otherwise auto-submit this exercise before the user records.
  const initialSubmitTriggerRef = useRef(submitTrigger);
  useEffect(() => {
    if (submitTrigger === initialSubmitTriggerRef.current) return;
    if (phase !== 'answered') {
      submit(isCorrect ?? true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  useEffect(() => {
    if (answered) setPhase('answered');
  }, [answered]);

  async function startRecording() {
    if (phase === 'recording' || phase === 'transcribing' || phase === 'answered') return;
    setRecordError('');
    setTranscript('');
    setPhase('requesting-mic');
    await recorder.start();
    if (recorder.error) {
      setPhase('idle');
      setRecordError(recorder.error);
      return;
    }
    setPhase('recording');
  }

  async function stopRecording() {
    if (phase !== 'recording') return;
    setPhase('transcribing');
    const blob = await recorder.stop();
    if (!blob) {
      setPhase('idle');
      setRecordError(recorder.error || 'Nenhuma fala detectada. Tente de novo.');
      return;
    }
    try {
      const form = new FormData();
      form.append('file', blob, 'utterance.webm');
      form.append('language', language);
      form.append('prompt', data.text);
      const result = await transcribeSpeech(form);
      if ('error' in result) {
        setPhase('idle');
        setRecordError(result.error);
        return;
      }
      setTranscript(result.text.trim());
      setPhase('review');
    } catch (err) {
      console.error('[SpeakRepeatExercise] transcription failed:', err);
      setPhase('idle');
      setRecordError('Erro ao transcrever. Tente de novo.');
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

        {phase === 'idle' && hasSpeechAPI && (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 active:scale-95 shadow-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Mic size={16} />
            <span>Gravar Voz</span>
          </button>
        )}

        {phase === 'requesting-mic' && (
          <div
            className="flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
          >
            <Loader2 size={14} className="animate-spin" />
            <span>Liberando microfone…</span>
          </div>
        )}

        {phase === 'recording' && (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 active:scale-95 shadow-sm"
            style={{ backgroundColor: 'var(--color-error)' }}
          >
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span>Gravando</span>
            <Square size={12} fill="currentColor" />
            <span>Parar</span>
          </button>
        )}

        {phase === 'transcribing' && (
          <div
            className="flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
          >
            <Loader2 size={14} className="animate-spin" />
            <span>Analisando (Whisper)…</span>
          </div>
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
          <div className="flex flex-col gap-2.5">
            {/* Primary action — full width, no wrap */}
            <button
              type="button"
              onClick={() => submit(true)}
              className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl py-3.5 text-sm font-bold tracking-wide transition-all duration-200 ease-out bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[var(--color-primary)]/40 active:scale-[0.98] active:translate-y-0"
            >
              <Send size={16} />
              Enviar Resposta
            </button>

            {/* Secondary actions — equal weight, not muted */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-200 ease-out bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg)] hover:border-[var(--color-primary)]/40 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
              >
                <RefreshCw size={14} />
                Refazer
              </button>

              <button
                type="button"
                onClick={() => submit(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-200 ease-out bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg)] hover:border-[var(--color-primary)]/40 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
              >
                Pular
                <SkipForward size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Speech API or after error fallback */}
      {phase === 'idle' && (!hasSpeechAPI || !!recordError) && (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => submit(true)}
            className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl py-3.5 text-sm font-bold tracking-wide transition-all duration-200 ease-out bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[var(--color-primary)]/40 active:scale-[0.98] active:translate-y-0"
          >
            <Send size={16} />
            Continuar sem áudio
          </button>

          <button
            type="button"
            onClick={() => submit(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-200 ease-out bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg)] hover:border-[var(--color-primary)]/40 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
          >
            Pular
            <SkipForward size={14} />
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
