'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Loader2, CheckCircle, XCircle, SkipForward, RefreshCw, Send, Volume2 } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useAudio } from '@/hooks/useAudio';
import { getStudioVoiceName } from '@/lib/voiceConfig';
import { transcribeSpeech } from '@/app/actions/transcribeSpeech';
import { incrementProductionStats } from '@/services/firestore';
import { recordOralExerciseOutcome } from '@/lib/oralExerciseTracking';
import { useAuthStore } from '@/store/authStore';
import type { ShadowingData, SupportedLanguage } from '@/types';

interface ShadowingExerciseProps {
  data: ShadowingData;
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

function missingWords(target: string, transcript: string): string[] {
  const rWords = new Set(normalizeText(transcript).split(' '));
  return normalizeText(target).split(' ').filter((w) => w && !rWords.has(w));
}

type Phase =
  | 'idle'
  | 'requesting-mic'
  | 'shadowing'
  | 'transcribing'
  | 'review'
  | 'answered';

const SHADOWING_THRESHOLD = 0.8;

export function ShadowingExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: ShadowingExerciseProps) {
  const { user } = useAuthStore();
  const recorder = useVoiceRecorder();
  const { speak, stop: stopAudio, isPlaying, isLoading } = useAudio(getStudioVoiceName(language));
  const hasSpeechAPI = recorder.isSupported;
  const [phase, setPhase] = useState<Phase>(answered ? 'answered' : 'idle');
  const [transcript, setTranscript] = useState('');
  const [recordError, setRecordError] = useState('');
  const audioStartedRef = useRef(false);
  const finishingRef = useRef(false);

  const isCorrect = transcript ? similarity(data.text, transcript) >= SHADOWING_THRESHOLD : null;
  const missed = transcript ? missingWords(data.text, transcript) : [];

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

  const finishShadowing = useCallback(async () => {
    if (finishingRef.current || phase !== 'shadowing') return;
    finishingRef.current = true;
    stopAudio();
    setPhase('transcribing');

    const blob = await recorder.stop();
    if (!blob) {
      finishingRef.current = false;
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
        finishingRef.current = false;
        setPhase('idle');
        setRecordError(result.error);
        return;
      }
      setTranscript(result.text.trim());
      setPhase('review');
    } catch (err) {
      console.error('[ShadowingExercise] transcription failed:', err);
      finishingRef.current = false;
      setPhase('idle');
      setRecordError('Erro ao transcrever. Tente de novo.');
    }
  }, [phase, stopAudio, recorder, language, data.text]);

  useEffect(() => {
    if (phase !== 'shadowing') return;
    if (isPlaying) audioStartedRef.current = true;
    if (audioStartedRef.current && !isPlaying && !isLoading && !finishingRef.current) {
      void finishShadowing();
    }
  }, [phase, isPlaying, isLoading, finishShadowing]);

  async function startShadowing() {
    if (phase === 'shadowing' || phase === 'transcribing' || phase === 'answered') return;
    setRecordError('');
    setTranscript('');
    finishingRef.current = false;
    audioStartedRef.current = false;
    setPhase('requesting-mic');
    await recorder.start();
    if (recorder.error) {
      setPhase('idle');
      setRecordError(recorder.error);
      return;
    }
    setPhase('shadowing');
    void speak(data.text, language);
  }

  function submit(correct: boolean, skipped = false) {
    stopAudio();
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
          backgroundColor: 'rgba(219, 39, 119, 0.08)',
          border: '1px solid rgba(219, 39, 119, 0.25)',
        }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'rgba(219, 39, 119, 0.15)', color: '#db2777' }}
        >
          <Volume2 size={18} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#db2777]">
            Shadowing
          </span>
          <p className="text-sm font-medium leading-relaxed text-[var(--color-text-primary)]">
            Ouça e fale junto com o áudio — tente acompanhar ritmo e entonação.
          </p>
        </div>
      </div>

      <div className="rounded-xl p-6 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)] space-y-3">
        <p className="font-display text-2xl font-bold leading-relaxed text-[var(--color-text-primary)]">
          {data.text}
        </p>
        <p className="text-xs font-medium italic text-[var(--color-text-muted)] opacity-70 border-l-2 border-[#db2777]/30 pl-4">
          {data.translation}
        </p>
        {data.tip && (
          <p className="text-xs text-[var(--color-text-muted)] italic">{data.tip}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-1">
        {phase === 'idle' && hasSpeechAPI && !recordError && (
          <button
            type="button"
            onClick={startShadowing}
            className="flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 active:scale-95 shadow-sm"
            style={{ backgroundColor: '#db2777' }}
          >
            <Mic size={16} />
            <span>Iniciar shadowing</span>
          </button>
        )}

        {phase === 'requesting-mic' && (
          <div
            className="flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
          >
            <Loader2 size={14} className="animate-spin" />
            <span>Preparando áudio e microfone…</span>
          </div>
        )}

        {phase === 'shadowing' && (
          <>
            <div
              className="flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
              style={{ backgroundColor: '#db2777' }}
            >
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span>{isPlaying ? 'Fale junto com o áudio' : 'Finalizando…'}</span>
            </div>
            <button
              type="button"
              onClick={() => void finishShadowing()}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold border border-[var(--color-border)]"
            >
              <Square size={12} fill="currentColor" />
              Parar
            </button>
          </>
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
              {missed.length > 0 && !isCorrect && (
                <p className="text-xs text-[var(--color-error)] mt-2">
                  Palavras faltando: {missed.join(', ')}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => submit(isCorrect ?? false, false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold bg-[#db2777] text-white"
            >
              <Send size={16} />
              Enviar resposta
            </button>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={startShadowing}
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
        <button
          type="button"
          onClick={() => submit(true, true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold bg-[#db2777] text-white"
        >
          <Send size={16} />
          Continuar sem áudio
        </button>
      )}

      {phase === 'answered' && transcript && (
        <div className="flex items-start gap-4 rounded-xl p-5 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]/50 opacity-80">
          <div className="mt-1">
            {isCorrect ? (
              <CheckCircle size={18} className="text-[var(--color-success)]" />
            ) : (
              <XCircle size={18} className="text-[var(--color-error)]" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1 opacity-60">
              Sua fala registrada:
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] italic leading-relaxed">
              &ldquo;{transcript}&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
