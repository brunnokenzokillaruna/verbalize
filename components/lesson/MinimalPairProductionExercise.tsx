'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, CheckCircle, XCircle, SkipForward, RefreshCw, Send } from 'lucide-react';
import { AudioPlayerButton } from './AudioPlayerButton';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeSpeech } from '@/app/actions/transcribeSpeech';
import { incrementProductionStats } from '@/services/firestore';
import { recordOralExerciseOutcome } from '@/lib/oralExerciseTracking';
import { useAuthStore } from '@/store/authStore';
import type { MinimalPairData, SupportedLanguage } from '@/types';

interface MinimalPairProductionExerciseProps {
  data: MinimalPairData;
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
    .replace(/[^a-z0-9\s'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordMatchScore(spoken: string, target: string): number {
  const spokenNorm = normalizeText(spoken);
  const targetNorm = normalizeText(target);
  if (!spokenNorm || !targetNorm) return 0;
  if (spokenNorm === targetNorm) return 1;
  if (spokenNorm.includes(targetNorm) || targetNorm.includes(spokenNorm)) return 0.95;

  const spokenWords = spokenNorm.split(' ');
  const targetWords = targetNorm.split(' ');
  if (spokenWords.includes(targetNorm) || targetWords.includes(spokenNorm)) return 0.95;

  const targetChars = new Set(targetNorm.replace(/\s/g, ''));
  let overlap = 0;
  for (const ch of spokenNorm.replace(/\s/g, '')) {
    if (targetChars.has(ch)) overlap += 1;
  }
  return overlap / Math.max(targetNorm.replace(/\s/g, '').length, 1);
}

function evaluateSpokenWord(
  transcript: string,
  correctWord: string,
  wrongWord: string,
): boolean {
  const correctScore = wordMatchScore(transcript, correctWord);
  const wrongScore = wordMatchScore(transcript, wrongWord);
  return correctScore >= 0.9 && correctScore >= wrongScore;
}

type Phase = 'idle' | 'requesting-mic' | 'recording' | 'transcribing' | 'review' | 'answered';

export function MinimalPairProductionExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: MinimalPairProductionExerciseProps) {
  const { user } = useAuthStore();
  const wrongWord = data.correctWord === data.wordA ? data.wordB : data.wordA;
  const recorder = useVoiceRecorder();
  const hasSpeechAPI = recorder.isSupported;
  const [phase, setPhase] = useState<Phase>(answered ? 'answered' : 'idle');
  const [transcript, setTranscript] = useState('');
  const [recordError, setRecordError] = useState('');

  const isCorrect = transcript
    ? evaluateSpokenWord(transcript, data.correctWord, wrongWord)
    : null;

  useEffect(() => {
    if (phase !== 'answered') {
      setIsExerciseReady(phase === 'review' || !hasSpeechAPI || !!recordError);
    } else {
      setIsExerciseReady(false);
    }
  }, [phase, hasSpeechAPI, recordError, setIsExerciseReady]);

  const initialSubmitTriggerRef = useRef(submitTrigger);
  useEffect(() => {
    if (submitTrigger === initialSubmitTriggerRef.current) return;
    if (phase !== 'answered') {
      submit(isCorrect ?? true, phase === 'review');
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
      form.append('prompt', data.correctWord);
      const result = await transcribeSpeech(form);
      if ('error' in result) {
        setPhase('idle');
        setRecordError(result.error);
        return;
      }
      setTranscript(result.text.trim());
      setPhase('review');
    } catch (err) {
      console.error('[MinimalPairProductionExercise] transcription failed:', err);
      setPhase('idle');
      setRecordError('Erro ao transcrever. Tente de novo.');
    }
  }

  function submit(correct: boolean, skipped = false) {
    setPhase('answered');
    if (user) {
      incrementProductionStats(user.uid, 'oral', correct).catch(console.error);
      recordOralExerciseOutcome(user.uid, skipped ? 'skipped' : 'completed');
    }
    onAnswer(correct);
  }

  return (
    <div className="flex flex-col gap-7">
      <div
        className="flex items-start gap-3 rounded-xl p-4"
        style={{
          backgroundColor: 'var(--color-vocab-bg)',
          border: '1px solid rgba(217,119,6,0.3)',
        }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
          style={{ backgroundColor: 'rgba(217,119,6,0.2)' }}
        >
          🎙️
        </div>
        <div className="flex flex-col gap-1">
          <span
            className="text-[9px] font-black uppercase tracking-[0.2em]"
            style={{ color: 'var(--color-vocab)' }}
          >
            Par mínimo falado
          </span>
          <p
            className="text-sm font-medium leading-relaxed"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Ouça os dois sons e fale a palavra que completa a frase.
          </p>
        </div>
      </div>

      <div className="rounded-xl p-5 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]">
        <p className="font-display text-lg leading-relaxed text-[var(--color-text-primary)]">
          {data.sentenceContext.replace(data.correctWord, '______')}
        </p>
        <p className="mt-2 text-xs italic text-[var(--color-text-muted)]">{data.translation}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(['A', 'B'] as const).map((choice) => {
          const word = choice === 'A' ? data.wordA : data.wordB;
          return (
            <div
              key={choice}
              className="flex flex-col items-center gap-3 rounded-xl px-4 py-5 border-2 border-[var(--color-border)] bg-[var(--color-surface)]"
            >
              <AudioPlayerButton text={word} language={language} size="md" />
              <span className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">
                {word}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-1">
        {phase === 'idle' && hasSpeechAPI && !recordError && (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 active:scale-95 shadow-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Mic size={16} />
            <span>Falar palavra</span>
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
            <span>Analisando…</span>
          </div>
        )}
      </div>

      {recordError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100">
          <p className="text-[11px] font-medium text-red-600">{recordError}</p>
        </div>
      )}

      {phase === 'review' && (
        <div className="flex flex-col gap-5 animate-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-start gap-4 rounded-xl p-5 bg-[var(--color-surface-raised)]/50 border border-[var(--color-border)]">
            <div className="mt-1">
              {isCorrect ? (
                <CheckCircle size={20} className="text-[var(--color-success)]" />
              ) : (
                <XCircle size={20} className="text-[var(--color-error)]" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1 opacity-60">
                Você disse:
              </p>
              <p className="text-base font-semibold text-[var(--color-text-primary)] leading-relaxed italic">
                &ldquo;{transcript}&rdquo;
              </p>
              {!isCorrect && (
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  Esperado: <span className="font-bold text-[var(--color-text-primary)]">{data.correctWord}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => submit(isCorrect ?? false, false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold bg-[var(--color-primary)] text-white"
            >
              <Send size={16} />
              Enviar resposta
            </button>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest border border-[var(--color-border)]"
              >
                <RefreshCw size={14} />
                Refazer
              </button>
              <button
                type="button"
                onClick={() => submit(true, true)}
                className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest border border-[var(--color-border)]"
              >
                Pular
                <SkipForward size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'idle' && (!hasSpeechAPI || !!recordError) && (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => submit(true, true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold bg-[var(--color-primary)] text-white"
          >
            <Send size={16} />
            Continuar sem áudio
          </button>
        </div>
      )}

      {phase === 'answered' && transcript && (
        <div className="px-1 border-l-2 border-[var(--color-primary)]/20 pl-4 py-2 opacity-90">
          <p className="text-sm italic leading-relaxed text-[var(--color-text-muted)]">{data.tip}</p>
        </div>
      )}
    </div>
  );
}
