import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, X, Timer, Zap, ChevronRight, Trophy } from 'lucide-react';
import { ConjugationSpeedExercise } from '@/components/lesson/ConjugationSpeedExercise';
import { generateLocalDrill } from '@/utils/verbDrillGenerator';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import type { VerbDocument, ConjugationSpeedData } from '@/types';

interface VerbDrillSessionProps {
  verbs: VerbDocument[];
  onClose: () => void;
}

export function VerbDrillSession({ verbs, onClose }: VerbDrillSessionProps) {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'done'>('ready');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);

  const [currentDrill, setCurrentDrill] = useState<ConjugationSpeedData | null>(null);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [combo, setCombo] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sessionEndPlayedRef = useRef(false);

  const { play: playSound } = useSoundEffects();

  // Generate a new question
  const nextQuestion = useCallback(() => {
    if (verbs.length === 0) return;
    const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
    const drill = generateLocalDrill(randomVerb);
    setCurrentDrill(drill);
    setAnswered(false);
    setLastCorrect(null);
  }, [verbs]);

  // Start the game
  function startGame() {
    setGameState('playing');
    setTimeLeft(60);
    setScore(0);
    setCorrectCount(0);
    setTotalAttempted(0);
    setCombo(0);
    setShowExitConfirm(false);
    sessionEndPlayedRef.current = false;
    nextQuestion();
  }

  // Timer logic
  useEffect(() => {
    if (gameState !== 'playing' || showExitConfirm) return;
    if (timeLeft <= 0) {
      setGameState('done');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, timeLeft, showExitConfirm]);

  useEffect(() => {
    if (gameState === 'done' && !sessionEndPlayedRef.current) {
      sessionEndPlayedRef.current = true;
      playSound('session-end');
    }
  }, [gameState, playSound]);

  // Handle answer
  function handleAnswer(correct: boolean) {
    if (answered) return;
    setAnswered(true);
    setLastCorrect(correct);
    setTotalAttempted((t) => t + 1);

    if (correct) {
      setCorrectCount((c) => c + 1);
      const nextCombo = combo + 1;
      const points = 10 + (combo * 2);
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
    }

    // Auto-advance after short delay
    setTimeout(() => {
      if (gameState === 'playing' && timeLeft > 0) {
        nextQuestion();
      }
    }, 800);
  }

  // Handle exit confirmation request
  function handleCloseRequest() {
    if (gameState === 'playing') {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  }

  // Listen for Escape key down
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

  // Focus trap
  useEffect(() => {
    if (gameState !== 'ready' && gameState !== 'playing' && gameState !== 'done') return;
    const container = containerRef.current;
    if (!container) return;

    const getFocusable = () => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0);
    };

    const focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

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
      } else {
        if (active === last || !focusableElements.includes(active)) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleFocusTrap);
    return () => container.removeEventListener('keydown', handleFocusTrap);
  }, [gameState, showExitConfirm, currentDrill, answered, timeLeft]);

  // ── Ready Screen ─────────────────────────────────────────────────────────────
  if (gameState === 'ready') {
    return (
      <div 
        ref={containerRef}
        className="fixed inset-0 z-50 flex flex-col animate-fade-in"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="flex justify-end p-5">
          <button 
            onClick={onClose} 
            className="flex h-9 w-9 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#f59e0b] active:scale-95"
            style={{ backgroundColor: 'var(--color-surface-raised)', border: '1.5px solid var(--color-border)' }}
            aria-label="Fechar desafio"
          >
            <X size={18} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto w-full">
          <div 
            className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 animate-float"
            style={{ 
              backgroundColor: 'var(--color-verb)', 
              boxShadow: '0 12px 32px rgba(124, 58, 237, 0.35)',
              color: '#fff'
            }}
          >
            <Zap size={44} />
          </div>
          <h1 
            className="font-display text-3xl font-black mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Desafio de Verbos
          </h1>
          <p 
            className="text-sm font-semibold mb-8 leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Você tem 60 segundos para acertar o maior número de conjugações. O combo de acertos multiplica seus pontos!
          </p>
          <button
            onClick={startGame}
            className="w-full py-4 rounded-2xl text-white font-extrabold text-base transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#f59e0b]"
            style={{ 
              backgroundColor: 'var(--color-verb)',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.3)'
            }}
          >
            Começar Desafio
          </button>
        </div>
      </div>
    );
  }

  // ── Done Screen ──────────────────────────────────────────────────────────────
  if (gameState === 'done') {
    const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;
    return (
      <div 
        ref={containerRef}
        className="fixed inset-0 z-50 flex flex-col animate-fade-in"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto w-full">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ 
              backgroundColor: 'var(--color-warning-bg)', 
              border: '2px solid var(--color-warning-border)',
              color: 'var(--color-warning)',
              boxShadow: '0 12px 32px rgba(245, 158, 11, 0.2)'
            }}
          >
            <Trophy size={40} />
          </div>
          <h2 
            className="text-lg font-black uppercase tracking-widest"
            style={{ color: 'var(--color-warning)' }}
          >
            Tempo Esgotado!
          </h2>
          <p 
            className="font-display text-5xl font-black mt-2 mb-8"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {score} <span className="text-xl font-bold" style={{ color: 'var(--color-text-muted)' }}>pts</span>
          </p>
          
          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div 
              className="rounded-2xl p-4 text-center"
              style={{ 
                backgroundColor: 'var(--color-surface)', 
                border: '1.5px solid var(--color-border)' 
              }}
            >
              <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Acertos</p>
              <p className="text-2xl font-black" style={{ color: 'var(--color-success)' }}>
                {correctCount} <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>/ {totalAttempted}</span>
              </p>
            </div>
            <div 
              className="rounded-2xl p-4 text-center"
              style={{ 
                backgroundColor: 'var(--color-surface)', 
                border: '1.5px solid var(--color-border)' 
              }}
            >
              <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Precisão</p>
              <p className="text-2xl font-black" style={{ color: 'var(--color-verb)' }}>
                {accuracy}%
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl text-white font-extrabold text-base transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#f59e0b]"
              style={{ 
                backgroundColor: 'var(--color-verb)',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.3)'
              }}
            >
              Desafiar Novamente
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-extrabold text-base transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#f59e0b]"
              style={{ 
                backgroundColor: 'var(--color-surface-raised)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              Voltar para Verbos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing Screen ───────────────────────────────────────────────────────────
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto animate-fade-in" 
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* HUD Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <button 
          onClick={handleCloseRequest} 
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#f59e0b] active:scale-95" 
          style={{ backgroundColor: 'var(--color-surface-raised)', border: '1.5px solid var(--color-border)' }}
          aria-label="Sair do desafio"
        >
          <X size={18} style={{ color: 'var(--color-text-muted)' }} />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full font-bold">
            <Timer size={16} />
            <span className="tabular-nums" style={{ color: timeLeft <= 10 ? 'var(--color-error)' : '' }}>0:{timeLeft.toString().padStart(2, '0')}</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Pontos</p>
            <p className="text-xl font-black leading-none tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{score}</p>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col p-5 max-w-lg mx-auto w-full">
        {/* Combo Multiplier indicator */}
        <div className="flex justify-center mb-4 h-6">
          {combo >= 2 && (
            <div 
              className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-widest animate-in zoom-in spin-in-12 duration-300"
              style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}
            >
              {combo}x Combo!
            </div>
          )}
        </div>

        {currentDrill ? (
          <ConjugationSpeedExercise
            data={currentDrill}
            language={verbs[0]?.language}
            onAnswer={handleAnswer}
            answered={answered}
            setIsExerciseReady={() => {}}
            submitTrigger={0}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-verb)' }} />
          </div>
        )}
      </div>

      {/* Action Blocked Overlay (prevents double clicking while advancing) */}
      {answered && (
        <div className="absolute inset-0 z-10" />
      )}

      {/* Exit Confirmation Modal Overlay */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-sm rounded-3xl p-6 text-center animate-scale-in"
            style={{ backgroundColor: 'var(--color-surface)', border: '2px solid var(--color-border)' }}
          >
            <h3 className="font-display text-xl font-black mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Sair do Desafio?
            </h3>
            <p className="text-sm font-semibold mb-6 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Seu progresso e pontuação acumulados nesta rodada serão perdidos. Tem certeza?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-xl font-extrabold text-sm border-2 border-[var(--color-border)] transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#f59e0b]"
                style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-extrabold text-sm text-white transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#f59e0b]"
                style={{ backgroundColor: 'var(--color-error)' }}
              >
                Sair do Jogo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
