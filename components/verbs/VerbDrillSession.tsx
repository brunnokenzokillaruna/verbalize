import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, X, Zap, Trophy, Sparkles, BookOpen } from 'lucide-react';
import { ConjugationSpeedExercise } from '@/components/lesson/ConjugationSpeedExercise';
import { DrillTimerRing } from '@/components/verbs/DrillTimerRing';
import { generateLocalDrill, SPRINT_TENSE_KEYS } from '@/utils/verbDrillGenerator';
import { saveBestSprintScore, readBestSprintScore } from '@/utils/verbChallengeStorage';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import type { VerbDocument, ConjugationSpeedData, SupportedLanguage } from '@/types';

const DRILL_DURATION = 60;
const COUNTDOWN_SECONDS = 3;

type MissedEntry = {
  verb: string;
  pronoun: string;
  tense: string;
  correctForm: string;
};

interface VerbDrillSessionProps {
  verbs: VerbDocument[];
  language: SupportedLanguage;
  uid: string;
  onClose: () => void;
  onReviewVerb?: (word: string) => void;
}

export function VerbDrillSession({
  verbs,
  language,
  uid,
  onClose,
  onReviewVerb,
}: VerbDrillSessionProps) {
  const [gameState, setGameState] = useState<'countdown' | 'playing' | 'done'>('countdown');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [timeLeft, setTimeLeft] = useState(DRILL_DURATION);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const [currentDrill, setCurrentDrill] = useState<ConjugationSpeedData | null>(null);
  const [answered, setAnswered] = useState(false);
  const [combo, setCombo] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [missedVerbs, setMissedVerbs] = useState<MissedEntry[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const sessionEndPlayedRef = useRef(false);
  const gameStateRef = useRef(gameState);
  const timeLeftRef = useRef(timeLeft);
  const comboRef = useRef(combo);
  const scoreRef = useRef(score);

  const { play: playSound } = useSoundEffects();

  gameStateRef.current = gameState;
  timeLeftRef.current = timeLeft;
  comboRef.current = combo;
  scoreRef.current = score;

  const nextQuestion = useCallback(() => {
    if (verbs.length === 0) return;
    const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
    const drill = generateLocalDrill(randomVerb, { allowedTenses: SPRINT_TENSE_KEYS });
    setCurrentDrill(drill);
    setAnswered(false);
  }, [verbs]);

  function resetRound() {
    setGameState('countdown');
    setCountdown(COUNTDOWN_SECONDS);
    setTimeLeft(DRILL_DURATION);
    setScore(0);
    setCorrectCount(0);
    setTotalAttempted(0);
    setCombo(0);
    setMissedVerbs([]);
    setShowExitConfirm(false);
    sessionEndPlayedRef.current = false;
    setIsNewRecord(false);
    setCurrentDrill(null);
    setAnswered(false);
  }

  function finishRound(finalScore: number) {
    const previousBest = readBestSprintScore(uid, language) ?? 0;
    const best = saveBestSprintScore(uid, language, finalScore);
    setBestScore(best);
    setIsNewRecord(finalScore > previousBest && finalScore > 0);
    setGameState('done');
  }

  // Countdown before play
  useEffect(() => {
    if (gameState !== 'countdown') return;
    if (countdown <= 0) {
      setGameState('playing');
      nextQuestion();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [gameState, countdown, nextQuestion]);

  // Game timer
  useEffect(() => {
    if (gameState !== 'playing' || showExitConfirm) return;
    if (timeLeft <= 0) {
      finishRound(scoreRef.current);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, timeLeft, showExitConfirm, uid, language]);

  useEffect(() => {
    if (gameState === 'done' && !sessionEndPlayedRef.current) {
      sessionEndPlayedRef.current = true;
      playSound('session-end');
    }
  }, [gameState, playSound]);

  function handleAnswer(correct: boolean) {
    if (answered) return;
    setAnswered(true);
    setTotalAttempted((t) => t + 1);

    const drill = currentDrill;

    if (correct) {
      setCorrectCount((c) => c + 1);
      const nextCombo = comboRef.current + 1;
      const points = 10 + comboRef.current * 2;
      setScore((s) => s + points);
      setCombo(nextCombo);
      if (nextCombo >= 3) {
        playSound('combo', { comboLevel: Math.min(nextCombo, 5) });
      } else {
        playSound('correct');
      }
    } else {
      setCombo(0);
      playSound('incorrect');
      if (drill) {
        setMissedVerbs((prev) => {
          const exists = prev.some((m) => m.verb === drill.verb && m.correctForm === drill.correctForm);
          if (exists) return prev;
          return [
            ...prev,
            {
              verb: drill.verb,
              pronoun: drill.pronoun,
              tense: drill.tense,
              correctForm: drill.correctForm,
            },
          ];
        });
      }
    }

    const delay = correct ? 650 : 1800;
    setTimeout(() => {
      if (gameStateRef.current === 'playing' && timeLeftRef.current > 0) {
        nextQuestion();
      }
    }, delay);
  }

  function handleCloseRequest() {
    if (gameState === 'playing') {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showExitConfirm) {
          setShowExitConfirm(false);
        } else {
          handleCloseRequest();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, showExitConfirm]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getFocusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0);

    const focusable = getFocusable();
    focusable[0]?.focus();

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusableElements = getFocusable();
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        if (active === first || !focusableElements.includes(active)) {
          last.focus();
          e.preventDefault();
        }
      } else if (active === last || !focusableElements.includes(active)) {
        first.focus();
        e.preventDefault();
      }
    };

    container.addEventListener('keydown', handleFocusTrap);
    return () => container.removeEventListener('keydown', handleFocusTrap);
  }, [gameState, showExitConfirm, currentDrill, answered, timeLeft, countdown]);

  // ── Countdown ────────────────────────────────────────────────────────────────
  if (gameState === 'countdown') {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 flex flex-col animate-fade-in"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="flex justify-end p-5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verb active:scale-95"
            style={{ backgroundColor: 'var(--color-surface-raised)', border: '1.5px solid var(--color-border)' }}
            aria-label="Fechar sprint"
          >
            <X size={18} className="text-text-muted" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
            Sprint de Conjugação
          </p>
          <div
            className="font-display text-8xl font-black tabular-nums animate-scale-in"
            style={{ color: 'var(--color-verb)' }}
          >
            {countdown || 'Go!'}
          </div>
          <p className="mt-4 text-sm text-text-secondary max-w-xs">
            Escolha a forma correta o mais rápido que puder. Combos valem pontos extras.
          </p>
        </div>
      </div>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
  if (gameState === 'done') {
    const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;
    const headline =
      accuracy >= 80 ? 'Excelente sprint!' : accuracy >= 50 ? 'Bom treino!' : 'Continue praticando!';

    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 flex flex-col overflow-y-auto animate-fade-in"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="flex flex-col items-center p-6 text-center max-w-md mx-auto w-full py-10">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
            style={{
              backgroundColor: isNewRecord ? 'var(--color-warning-bg)' : 'var(--color-verb-bg)',
              border: `2px solid ${isNewRecord ? 'var(--color-warning)' : 'var(--color-verb)'}`,
              color: isNewRecord ? 'var(--color-warning)' : 'var(--color-verb)',
            }}
          >
            <Trophy size={36} />
          </div>

          <h2 className="font-display text-xl font-black text-text-primary">{headline}</h2>
          {isNewRecord && (
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-warning flex items-center gap-1 justify-center">
              <Sparkles size={12} />
              Novo recorde!
            </p>
          )}

          <p className="font-display text-5xl font-black mt-3 text-text-primary">
            {score}
            <span className="text-lg font-bold text-text-muted ml-1">pts</span>
          </p>
          {bestScore > 0 && (
            <p className="text-xs text-text-muted mt-1">Recorde: {bestScore} pts</p>
          )}

          <div className="grid grid-cols-2 gap-3 w-full mt-6 mb-6">
            <div className="rounded-2xl p-4 text-center bg-surface border border-border">
              <p className="text-[10px] font-black uppercase tracking-wider mb-1 text-text-muted">Acertos</p>
              <p className="text-2xl font-black text-success">
                {correctCount}
                <span className="text-xs font-semibold text-text-muted"> / {totalAttempted}</span>
              </p>
            </div>
            <div className="rounded-2xl p-4 text-center bg-surface border border-border">
              <p className="text-[10px] font-black uppercase tracking-wider mb-1 text-text-muted">Precisão</p>
              <p className="text-2xl font-black text-verb">{accuracy}%</p>
            </div>
          </div>

          {missedVerbs.length > 0 && (
            <div className="w-full mb-6 text-left rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5">
                <BookOpen size={12} />
                Revisar depois
              </p>
              <ul className="flex flex-col gap-2">
                {missedVerbs.slice(0, 5).map((m) => (
                  <li key={`${m.verb}-${m.correctForm}`}>
                    <button
                      type="button"
                      onClick={() => {
                        onReviewVerb?.(m.verb);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-all active:scale-[0.99] cursor-pointer border border-border bg-surface-raised hover:border-verb/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verb"
                    >
                      <span className="text-sm font-bold text-text-primary">{m.verb}</span>
                      <span className="text-xs text-text-muted shrink-0">
                        {m.pronoun} → <span className="font-semibold text-verb">{m.correctForm}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 w-full">
            <button
              type="button"
              onClick={resetRound}
              className="w-full py-4 rounded-2xl text-white font-extrabold text-base transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verb"
              style={{ backgroundColor: 'var(--color-verb)', boxShadow: '0 4px 0 #6d28d9' }}
            >
              Sprint de novo
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-extrabold text-base transition-all active:scale-[0.98] border border-border bg-surface-raised text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verb"
            >
              Voltar para Verbos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto animate-fade-in"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="flex items-center justify-between p-4 border-b bg-surface border-border"
      >
        <button
          type="button"
          onClick={handleCloseRequest}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verb active:scale-95"
          style={{ backgroundColor: 'var(--color-surface-raised)', border: '1.5px solid var(--color-border)' }}
          aria-label="Sair do sprint"
        >
          <X size={18} className="text-text-muted" />
        </button>

        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted hidden sm:block">
          Sprint de Conjugação
        </p>

        <div className="flex items-center gap-3">
          <DrillTimerRing timeLeft={timeLeft} totalSeconds={DRILL_DURATION} />
          <div className="text-right min-w-[3rem]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Pontos</p>
            <p className="text-xl font-black leading-none tabular-nums text-text-primary">{score}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-5 max-w-lg mx-auto w-full">
        <div className="flex justify-center mb-4 h-7">
          {combo >= 2 && (
            <div
              className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-scale-in flex items-center gap-1"
              style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}
            >
              <Zap size={12} fill="currentColor" />
              {combo}x combo
            </div>
          )}
        </div>

        {currentDrill ? (
          <ConjugationSpeedExercise
            data={currentDrill}
            language={language}
            variant="drill"
            onAnswer={handleAnswer}
            answered={answered}
            setIsExerciseReady={() => {}}
            submitTrigger={0}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-verb" size={32} />
          </div>
        )}
      </div>

      {answered && <div className="absolute inset-0 z-10" aria-hidden />}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl p-6 text-center animate-scale-in bg-surface border-2 border-border">
            <h3 className="font-display text-xl font-black mb-2 text-text-primary">
              Sair do sprint?
            </h3>
            <p className="text-sm font-semibold mb-6 leading-relaxed text-text-secondary">
              Sua pontuação desta rodada será perdida.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-xl font-extrabold text-sm border-2 border-border bg-surface-raised text-text-primary active:scale-95"
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-extrabold text-sm text-white bg-error active:scale-95"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
