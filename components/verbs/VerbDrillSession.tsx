import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, X, Timer, Zap, ChevronRight, Trophy } from 'lucide-react';
import { ConjugationSpeedExercise } from '@/components/lesson/ConjugationSpeedExercise';
import { generateLocalDrill } from '@/utils/verbDrillGenerator';
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
    nextQuestion();
  }

  // Timer logic
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) {
      setGameState('done');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Handle answer
  function handleAnswer(correct: boolean) {
    if (answered) return;
    setAnswered(true);
    setLastCorrect(correct);
    setTotalAttempted((t) => t + 1);

    if (correct) {
      setCorrectCount((c) => c + 1);
      const points = 10 + (combo * 2);
      setScore((s) => s + points);
      setCombo((c) => c + 1);
    } else {
      setCombo(0);
    }

    // Auto-advance after short delay
    setTimeout(() => {
      if (gameState === 'playing' && timeLeft > 0) {
        nextQuestion();
      }
    }, 800);
  }

  // ── Ready Screen ─────────────────────────────────────────────────────────────
  if (gameState === 'ready') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-in fade-in zoom-in duration-300">
        <div className="flex justify-end p-4">
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-indigo-500 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(99,102,241,0.5)]">
            <Zap size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-black mb-2">Desafio de Verbos</h1>
          <p className="text-lg text-indigo-200 mb-8 max-w-sm">
            Você tem 60 segundos para acertar o maior número de conjugações. O combo multiplica seus pontos!
          </p>
          <button
            onClick={startGame}
            className="w-full max-w-sm py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-lg transition-all active:scale-95 shadow-[0_4px_20px_rgba(99,102,241,0.4)]"
          >
            Começar
          </button>
        </div>
      </div>
    );
  }

  // ── Done Screen ──────────────────────────────────────────────────────────────
  if (gameState === 'done') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.4)]">
            <Trophy size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-amber-500 mb-1">Tempo Esgotado!</h2>
          <p className="text-5xl font-black mb-6">{score} <span className="text-2xl text-slate-400">pts</span></p>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10">
            <div className="bg-white/5 rounded-2xl p-4">
              <p className="text-slate-400 text-sm font-semibold mb-1">Acertos</p>
              <p className="text-2xl font-bold text-emerald-400">{correctCount} <span className="text-sm text-slate-500">/ {totalAttempted}</span></p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4">
              <p className="text-slate-400 text-sm font-semibold mb-1">Precisão</p>
              <p className="text-2xl font-bold text-indigo-400">
                {totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition-all active:scale-95"
            >
              Jogar Novamente
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all active:scale-95"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing Screen ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 overflow-y-auto" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* HUD Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}>
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full font-bold">
            <Timer size={16} />
            <span className="tabular-nums" style={{ color: timeLeft <= 10 ? '#ef4444' : '' }}>0:{timeLeft.toString().padStart(2, '0')}</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Pontos</p>
            <p className="text-xl font-black leading-none tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{score}</p>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col p-5 max-w-lg mx-auto w-full">
        {/* Combo Multiplier indicator */}
        <div className="flex justify-center mb-4 h-6">
          {combo >= 2 && (
            <div className="bg-amber-100 text-amber-600 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-widest animate-in zoom-in spin-in-12 duration-300">
              {combo}x Combo!
            </div>
          )}
        </div>

        {currentDrill ? (
          <ConjugationSpeedExercise
            data={currentDrill}
            onAnswer={handleAnswer}
            answered={answered}
            setIsExerciseReady={() => {}}
            submitTrigger={0}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        )}
      </div>

      {/* Action Blocked Overlay (prevents double clicking while advancing) */}
      {answered && (
        <div className="absolute inset-0 z-10" />
      )}
    </div>
  );
}
