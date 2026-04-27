'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Mic,
  CheckCircle2,
  XCircle,
  RefreshCw,
  SkipForward,
  Eye,
  EyeOff,
  Volume2,
  Square,
  Loader2,
} from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeSpeech } from '@/app/actions/transcribeSpeech';
import { evaluateFreeResponse } from '@/app/actions/evaluateFreeResponse';
import { getFixedVoiceName } from '@/lib/voiceConfig';
import type { SupportedLanguage } from '@/types';

interface LessonMissionRolePlayProps {
  dialogue: string;
  dialogueTranslations?: string[];
  language: SupportedLanguage;
  intentMode?: boolean;
  onComplete: (spoken: number, totalSpeakable: number) => void;
}

interface DialogueLine {
  rawIndex: number;
  speaker: string;
  text: string;
  translation?: string;
  isUserLine: boolean;
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

const CORRECT_THRESHOLD = 0.7; // MISS is more tolerant than SpeakRepeat (0.85)

type RecState =
  | 'idle'
  | 'requesting-mic'
  | 'recording'
  | 'transcribing'
  | 'review-correct'
  | 'review-retry'
  | 'done';

export function LessonMissionRolePlay({
  dialogue,
  dialogueTranslations,
  language,
  intentMode = false,
  onComplete,
}: LessonMissionRolePlayProps) {
  const lines = useMemo<DialogueLine[]>(() => {
    return dialogue
      .split('\n')
      .filter((l) => l.trim())
      .map((line, i) => {
        const match = line.match(/^([^:]+):\s*(.+)/);
        const speaker = match?.[1]?.trim() ?? `Linha ${i + 1}`;
        const text = match?.[2]?.trim() ?? line;
        return {
          rawIndex: i,
          speaker,
          text,
          translation: dialogueTranslations?.[i],
          isUserLine: /^você$/i.test(speaker.replace(/\s+/g, '')),
        };
      });
  }, [dialogue, dialogueTranslations]);

  const totalSpeakable = useMemo(() => lines.filter((l) => l.isUserLine).length, [lines]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [spokenCount, setSpokenCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [recState, setRecState] = useState<RecState>('idle');
  const [transcript, setTranscript] = useState('');
  const [recordError, setRecordError] = useState('');
  const [evalFeedback, setEvalFeedback] = useState('');
  const [evalCorrected, setEvalCorrected] = useState('');
  const fixedVoice = useMemo(() => getFixedVoiceName(language), [language]);
  const { speak, stop: stopAudio } = useAudio(fixedVoice);
  const recorder = useVoiceRecorder();
  const hasSpeechAPI = recorder.isSupported;

  const current = lines[currentIdx];
  const isLast = currentIdx >= lines.length - 1;
  const completedRef = useRef(false);

  // Auto-play the local's line when it becomes current
  useEffect(() => {
    if (!current) return;
    if (current.isUserLine) return;
    // small delay so the UI has time to animate the new bubble in
    const t = setTimeout(() => {
      speak(current.text, language).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [currentIdx, current, language, speak]);

  // Reset per-line state when advancing
  useEffect(() => {
    setRecState('idle');
    setTranscript('');
    setRecordError('');
    setShowHint(false);
    setEvalFeedback('');
    setEvalCorrected('');
  }, [currentIdx]);

  function advance(spokeSuccessfully: boolean) {
    if (spokeSuccessfully) setSpokenCount((c) => c + 1);
    if (isLast) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete(spokeSuccessfully ? spokenCount + 1 : spokenCount, totalSpeakable);
      }
      setRecState('done');
      return;
    }
    setCurrentIdx((i) => i + 1);
  }

  async function startRecording() {
    if (!current || !current.isUserLine) return;
    if (recState === 'recording' || recState === 'transcribing') return;
    stopAudio();
    setRecordError('');
    setTranscript('');
    setRecState('requesting-mic');
    await recorder.start();
    // recorder.start() updates its own state; mirror the outcome here.
    // If the hook surfaced an error (permission denied, no mic), reflect it.
    if (recorder.error) {
      setRecState('idle');
      setRecordError(recorder.error);
      return;
    }
    setRecState('recording');
  }

  async function stopRecording() {
    if (!current || !current.isUserLine) return;
    if (recState !== 'recording') return;
    setRecState('transcribing');
    const blob = await recorder.stop();
    if (!blob) {
      setRecState('idle');
      setRecordError(recorder.error || 'Nenhuma fala detectada. Tente de novo.');
      return;
    }

    try {
      const form = new FormData();
      form.append('file', blob, 'utterance.webm');
      form.append('language', language);
      // Bias Whisper toward the target phrase — cuts hallucinations on
      // 2-3s clips of non-native speech dramatically.
      form.append('prompt', current.text);

      const result = await transcribeSpeech(form);
      if ('error' in result) {
        setRecState('idle');
        setRecordError(result.error);
        return;
      }

      const said = result.text.trim();
      setTranscript(said);

      if (intentMode) {
        setRecState('transcribing');
        const contextLines = lines.slice(Math.max(0, currentIdx - 3), currentIdx).map(l => `${l.speaker}: ${l.text}`);
        const evalResult = await evaluateFreeResponse({
          transcript: said,
          intent: current.translation || '',
          language,
          previousContext: contextLines,
        });

        if (evalResult.error) {
          setRecState('idle');
          setRecordError(evalResult.feedback);
          return;
        }

        setEvalFeedback(evalResult.feedback);
        setEvalCorrected(evalResult.correctedSentence || '');
        setRecState(evalResult.isCorrect ? 'review-correct' : 'review-retry');
      } else {
        const score = similarity(current.text, said);
        setRecState(score >= CORRECT_THRESHOLD ? 'review-correct' : 'review-retry');
      }
    } catch (err) {
      console.error('[LessonMissionRolePlay] transcription failed:', err);
      setRecState('idle');
      setRecordError('Erro ao transcrever. Tente de novo.');
    }
  }

  const score = transcript && current ? similarity(current.text, transcript) : 0;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}
          >
            <Mic size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h2
              className="font-display text-xl font-black tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Entre em cena
            </h2>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Fale suas falas — você é o protagonista
            </p>
          </div>
        </div>
        <div
          className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider shrink-0"
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
            border: '1.5px solid var(--color-border)',
          }}
        >
          {Math.min(currentIdx + 1, lines.length)} / {lines.length}
        </div>
      </div>

      {/* Past lines — dimmed history */}
      <div className="flex flex-col gap-3">
        {lines.slice(0, currentIdx).map((line, i) => (
          <PastLineBubble key={i} line={line} />
        ))}
      </div>

      {/* Current line */}
      {current && recState !== 'done' && (
        <div className="flex flex-col gap-4 animate-slide-up">
          {current.isUserLine ? (
            <UserTurn
              line={current}
              showHint={showHint}
              hasSpeechAPI={hasSpeechAPI}
              recState={recState}
              transcript={transcript}
              recordError={recordError}
              score={score}
              intentMode={intentMode}
              evalFeedback={evalFeedback}
              evalCorrected={evalCorrected}
              onToggleHint={() => setShowHint((s) => !s)}
              onRecord={startRecording}
              onStopRecord={stopRecording}
              onSkip={() => advance(false)}
              onConfirm={() => advance(true)}
              onRetry={() => startRecording()}
              onPlayTarget={() => speak(current.text, language).catch(() => {})}
            />
          ) : (
            <LocalTurn
              line={current}
              onReplay={() => speak(current.text, language).catch(() => {})}
              onNext={() => advance(false)}
            />
          )}
        </div>
      )}

      {/* Done state */}
      {recState === 'done' && (
        <div
          className="rounded-2xl p-5 flex items-center gap-3 animate-scale-in"
          style={{
            backgroundColor: 'var(--color-success-bg)',
            border: '2px solid var(--color-success)',
          }}
        >
          <CheckCircle2 size={22} style={{ color: 'var(--color-success)' }} strokeWidth={2.5} />
          <div className="flex-1">
            <p className="text-sm font-black" style={{ color: 'var(--color-success)' }}>
              Conversa encerrada!
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Você falou {spokenCount} de {totalSpeakable} falas.
              {' '}Avance para a prática quando estiver pronto.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function PastLineBubble({ line }: { line: DialogueLine }) {
  const isUser = line.isUserLine;
  return (
    <div className={`flex gap-3 opacity-55 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
        style={{
          backgroundColor: isUser ? 'var(--color-primary-light)' : 'var(--color-surface-raised)',
          color: isUser ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        }}
      >
        {isUser ? 'V' : line.speaker.charAt(0).toUpperCase()}
      </div>
      <div
        className={`rounded-2xl px-3.5 py-2 max-w-[80%] text-xs ${isUser ? '' : 'text-right'}`}
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <p
          className="text-[9px] font-black uppercase tracking-widest mb-0.5 opacity-70"
          style={{ color: isUser ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        >
          {line.speaker}
        </p>
        {line.text}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function LocalTurn({
  line,
  onReplay,
  onNext,
}: {
  line: DialogueLine;
  onReplay: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-row-reverse gap-3 animate-slide-up">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-md"
        style={{ backgroundColor: '#ec4899' }}
      >
        {line.speaker.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <p
          className="text-[10px] font-black uppercase tracking-widest mb-1.5 text-right"
          style={{ color: '#ec4899' }}
        >
          {line.speaker}
        </p>
        <div
          className="rounded-2xl p-4 text-right"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid #ec489933',
          }}
        >
          <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
            {line.text}
          </p>
          {line.translation && (
            <p
              className="mt-2 text-xs italic"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {line.translation}
            </p>
          )}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onReplay}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              border: '1.5px solid var(--color-border)',
            }}
          >
            <Volume2 size={12} />
            Ouvir de novo
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-white transition active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
              boxShadow: '0 4px 12px rgba(29,94,212,0.3)',
            }}
          >
            Minha vez →
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function UserTurn({
  line,
  showHint,
  hasSpeechAPI,
  recState,
  transcript,
  recordError,
  score,
  intentMode,
  evalFeedback,
  evalCorrected,
  onToggleHint,
  onRecord,
  onStopRecord,
  onSkip,
  onConfirm,
  onRetry,
  onPlayTarget,
}: {
  line: DialogueLine;
  showHint: boolean;
  hasSpeechAPI: boolean;
  recState: RecState;
  transcript: string;
  recordError: string;
  score: number;
  intentMode: boolean;
  evalFeedback: string;
  evalCorrected: string;
  onToggleHint: () => void;
  onRecord: () => void;
  onStopRecord: () => void;
  onSkip: () => void;
  onConfirm: () => void;
  onRetry: () => void;
  onPlayTarget: () => void;
}) {
  return (
    <div className="flex flex-row gap-3 animate-slide-up">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-md"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        V
      </div>
      <div className="flex-1">
        <p
          className="text-[10px] font-black uppercase tracking-widest mb-1.5"
          style={{ color: 'var(--color-primary)' }}
        >
          Você · Sua vez 🎙️
        </p>

        {/* Hint / target text toggle */}
        <div
          className="rounded-2xl p-4 transition-all"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            border: '2px dashed var(--color-primary)',
          }}
        >
          {intentMode ? (
            <>
              <p
                className="text-base font-semibold leading-relaxed"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {line.translation}
              </p>
              {showHint && (
                <p className="mt-2 text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
                  Dica de como falar: &ldquo;{line.text}&rdquo;
                </p>
              )}
            </>
          ) : showHint ? (
            <>
              <p
                className="text-base font-semibold leading-relaxed"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {line.text}
              </p>
              {line.translation && (
                <p className="mt-2 text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
                  {line.translation}
                </p>
              )}
            </>
          ) : line.translation ? (
            <p className="text-sm italic leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              &ldquo;{line.translation}&rdquo;
            </p>
          ) : (
            <p className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>
              Fale o que você diria nessa situação.
            </p>
          )}
        </div>

        {/* Controls row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleHint}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              border: '1.5px solid var(--color-border)',
            }}
          >
            {showHint ? <EyeOff size={12} /> : <Eye size={12} />}
            {showHint ? 'Esconder frase' : 'Ver frase'}
          </button>
          {showHint && (
            <button
              type="button"
              onClick={onPlayTarget}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                border: '1.5px solid var(--color-border)',
              }}
            >
              <Volume2 size={12} />
              Ouvir modelo
            </button>
          )}
        </div>

        {/* Recording / feedback zone */}
        <div className="mt-4">
          {recState === 'idle' && !hasSpeechAPI && (
            <FallbackNoMic onSkip={onSkip} />
          )}

          {recState === 'idle' && hasSpeechAPI && (
            <div className="flex flex-col gap-2.5">
              {recordError && (
                <p className="text-[11px] font-medium" style={{ color: 'var(--color-error)' }}>
                  {recordError}
                </p>
              )}
              <button
                type="button"
                onClick={onRecord}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-black text-white transition active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, var(--color-success) 0%, #059669 100%)',
                  boxShadow: '0 6px 18px rgba(16,185,129,0.35)',
                }}
              >
                <Mic size={16} />
                Gravar minha fala
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition active:scale-95"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-muted)',
                }}
              >
                Pular fala
                <SkipForward size={12} />
              </button>
            </div>
          )}

          {recState === 'requesting-mic' && (
            <div
              className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-semibold"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Loader2 size={16} className="animate-spin" />
              Liberando microfone…
            </div>
          )}

          {recState === 'recording' && (
            <button
              type="button"
              onClick={onStopRecord}
              className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-black text-white transition active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                boxShadow: '0 6px 18px rgba(239,68,68,0.35)',
              }}
            >
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                Gravando —
              </span>
              <Square size={14} fill="currentColor" />
              Parar e enviar
            </button>
          )}

          {recState === 'transcribing' && (
            <div
              className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-semibold"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Loader2 size={16} className="animate-spin" />
              Analisando sua fala (Whisper)…
            </div>
          )}

          {recState === 'review-correct' && (
            <div className="flex flex-col gap-2.5 animate-slide-up">
              <div
                className="flex items-start gap-3 rounded-2xl p-4"
                style={{
                  backgroundColor: 'var(--color-success-bg)',
                  border: '2px solid var(--color-success)',
                }}
              >
                <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} strokeWidth={2.5} />
                <div>
                  <p className="text-xs font-black" style={{ color: 'var(--color-success)' }}>
                    {intentMode ? 'Perfeito!' : `Perfeito! (${Math.round(score * 100)}% de precisão)`}
                  </p>
                  <div className="mt-1.5">
                    {intentMode ? (
                      <p className="text-sm">{evalFeedback}</p>
                    ) : (
                      <WordDiff target={line.text} transcript={transcript} />
                    )}
                  </div>
                  {intentMode && evalCorrected && (
                    <p className="mt-2 text-xs font-bold text-[var(--color-success)] opacity-90">
                      Dica: {evalCorrected}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onConfirm}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white transition active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, var(--color-success) 0%, #059669 100%)',
                  boxShadow: '0 6px 18px rgba(16,185,129,0.35)',
                }}
              >
                Continuar →
              </button>
            </div>
          )}

          {recState === 'review-retry' && (
            <div className="flex flex-col gap-2.5 animate-slide-up">
              <div
                className="flex items-start gap-3 rounded-2xl p-4"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.06)',
                  border: '2px solid rgba(239,68,68,0.4)',
                }}
              >
                <XCircle size={20} style={{ color: '#ef4444' }} strokeWidth={2.5} />
                <div>
                  <p className="text-xs font-black" style={{ color: '#ef4444' }}>
                    {intentMode ? 'Precisa melhorar' : `Quase lá (${Math.round(score * 100)}%)`}
                  </p>
                  <div className="mt-1.5">
                    {intentMode ? (
                      <p className="text-sm">{evalFeedback}</p>
                    ) : (
                      <WordDiff target={line.text} transcript={transcript} />
                    )}
                  </div>
                  {intentMode && evalCorrected && (
                    <p className="mt-2 text-xs font-bold text-[#ef4444] opacity-90">
                      Tente dizer: {evalCorrected}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition active:scale-95"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    border: '1.5px solid var(--color-border)',
                  }}
                >
                  <RefreshCw size={12} />
                  Tentar de novo
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-white transition active:scale-95"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Continuar
                  <SkipForward size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

/**
 * Shows the target phrase with each word colored green (matched) or red
 * (missed) based on the user's transcript.
 */
function WordDiff({ target, transcript }: { target: string; transcript: string }) {
  const spokenWords = new Set(normalizeText(transcript).split(' '));
  const targetWords = target.split(/\s+/);

  return (
    <p className="text-xs leading-relaxed flex flex-wrap gap-x-1">
      {targetWords.map((word, i) => {
        const matched = spokenWords.has(normalizeText(word));
        return (
          <span
            key={i}
            className="font-semibold"
            style={{
              color: matched ? 'var(--color-success)' : '#ef4444',
              textDecoration: matched ? 'none' : 'underline',
              textDecorationStyle: matched ? undefined : 'wavy',
              textUnderlineOffset: '3px',
            }}
          >
            {word}
          </span>
        );
      })}
    </p>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function FallbackNoMic({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[11px] text-center" style={{ color: 'var(--color-text-muted)' }}>
        Microfone não disponível nesse navegador — você ainda pode praticar lendo em voz alta.
      </p>
      <button
        type="button"
        onClick={onSkip}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
        }}
      >
        Próxima fala →
      </button>
    </div>
  );
}
