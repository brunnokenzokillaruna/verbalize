'use client';

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { ScrambledConversationData } from '@/types';
import { ChevronUp, ChevronDown, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';

const SWAP_TRANSITION = 'transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1)';

interface ScrambledConversationProps {
  data: ScrambledConversationData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

interface ConversationItemProps {
  line: string;
  index: number;
  totalLines: number;
  answered: boolean;
  isCorrectPos: boolean;
  isAnimating: boolean;
  isSwapping: boolean;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  registerRef: (line: string, el: HTMLDivElement | null) => void;
}

function ConversationItem({
  line,
  index,
  totalLines,
  answered,
  isCorrectPos,
  isAnimating,
  isSwapping,
  onMoveUp,
  onMoveDown,
  registerRef,
}: ConversationItemProps) {
  const match = line.match(/^([^:]+):\s*(.+)/);
  const speaker = match ? match[1].trim() : '';
  const text = match ? match[2].trim() : line;

  let stateStyles = 'border border-white/5 bg-white/5 text-[var(--color-text-primary)]';

  if (answered) {
    if (isCorrectPos) {
      stateStyles =
        'bg-[rgba(16,185,129,0.08)] border border-emerald-500/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.03)]';
    } else {
      stateStyles = 'bg-[rgba(239,68,68,0.08)] border border-red-500/40 text-red-200';
    }
  } else if (isSwapping) {
    stateStyles =
      'border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/8 text-[var(--color-text-primary)] shadow-[0_4px_20px_rgba(29,94,212,0.12)]';
  } else {
    stateStyles =
      'border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-[var(--color-text-primary)]';
  }

  return (
    <div
      ref={(el) => registerRef(line, el)}
      className={`flex items-center gap-3.5 p-4 rounded-xl ${stateStyles}`}
      style={{ willChange: isSwapping ? 'transform' : undefined }}
    >
      {!answered && (
        <div className="flex flex-col gap-1 shrink-0">
          <button
            type="button"
            disabled={index === 0 || isAnimating}
            onClick={() => onMoveUp(index)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronUp size={14} className="text-[var(--color-text-secondary)]" />
          </button>
          <button
            type="button"
            disabled={index === totalLines - 1 || isAnimating}
            onClick={() => onMoveDown(index)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronDown size={14} className="text-[var(--color-text-secondary)]" />
          </button>
        </div>
      )}

      <span className="text-[10px] font-black tracking-widest text-[var(--color-text-muted)] opacity-60 shrink-0">
        #{index + 1}
      </span>

      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3.5 flex-1">
        {speaker && (
          <span className="inline-flex self-start sm:self-auto items-center rounded-md px-2 py-0.5 text-[10.5px] font-black uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 shrink-0">
            {speaker}
          </span>
        )}
        <span className="text-[15px] font-semibold leading-relaxed flex-1">{text}</span>
      </div>

      {answered && isCorrectPos && <CheckCircle2 size={18} className="text-emerald-500 shrink-0 ml-3" />}
      {answered && !isCorrectPos && <XCircle size={18} className="text-red-500 shrink-0 ml-3" />}
    </div>
  );
}

interface SwapSnapshot {
  ids: [string, string];
  firstRects: Map<string, DOMRect>;
}

export function ScrambledConversation({
  data,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: ScrambledConversationProps) {
  const [currentOrder, setCurrentOrder] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swappingLines, setSwappingLines] = useState<Set<string>>(new Set());

  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const swapSnapshot = useRef<SwapSnapshot | null>(null);

  const registerRef = useCallback((line: string, el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(line, el);
    else itemRefs.current.delete(line);
  }, []);

  useEffect(() => {
    setCurrentOrder(data.shuffledLines);
    setIsExerciseReady(true);
  }, [data, setIsExerciseReady]);

  const swapItems = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length || isAnimating || answered) return;

    const idA = currentOrder[index];
    const idB = currentOrder[targetIndex];
    const elA = itemRefs.current.get(idA);
    const elB = itemRefs.current.get(idB);

    const firstRects = new Map<string, DOMRect>();
    if (elA) firstRects.set(idA, elA.getBoundingClientRect());
    if (elB) firstRects.set(idB, elB.getBoundingClientRect());

    swapSnapshot.current = { ids: [idA, idB], firstRects };
    setSwappingLines(new Set([idA, idB]));
    setIsAnimating(true);

    setCurrentOrder((prev) => {
      const copy = [...prev];
      [copy[index], copy[targetIndex]] = [copy[targetIndex], copy[index]];
      return copy;
    });
  };

  const handleMoveUp = (index: number) => swapItems(index, 'up');
  const handleMoveDown = (index: number) => swapItems(index, 'down');

  useLayoutEffect(() => {
    const snapshot = swapSnapshot.current;
    if (!snapshot) return;
    swapSnapshot.current = null;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsAnimating(false);
      setSwappingLines(new Set());
      return;
    }

    const { ids, firstRects } = snapshot;
    let completed = 0;
    const total = ids.length;

    const finishOne = () => {
      completed += 1;
      if (completed >= total) {
        setIsAnimating(false);
        setSwappingLines(new Set());
      }
    };

    for (const id of ids) {
      const el = itemRefs.current.get(id);
      const first = firstRects.get(id);
      if (!el || !first) {
        finishOne();
        continue;
      }

      const last = el.getBoundingClientRect();
      const deltaY = first.top - last.top;

      if (Math.abs(deltaY) < 1) {
        finishOne();
        continue;
      }

      el.style.transition = 'none';
      el.style.transform = `translateY(${deltaY}px)`;
      el.style.zIndex = '10';
      el.getBoundingClientRect();

      requestAnimationFrame(() => {
        let cleaned = false;
        const cleanup = () => {
          if (cleaned) return;
          cleaned = true;
          el.style.transition = '';
          el.style.transform = '';
          el.style.zIndex = '';
          finishOne();
        };

        el.style.transition = SWAP_TRANSITION;
        el.style.transform = 'translateY(0)';
        el.addEventListener('transitionend', cleanup, { once: true });
        window.setTimeout(cleanup, 320);
      });
    }
  }, [currentOrder]);

  const handleCheck = () => {
    const isCorrect = JSON.stringify(currentOrder) === JSON.stringify(data.lines);
    onAnswer(isCorrect);
  };

  useEffect(() => {
    if (submitTrigger > 0 && !answered && currentOrder.length > 0) {
      handleCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className="rounded-2xl p-4.5 border border-dashed border-[var(--color-border)] backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)' }}
      >
        <div className="flex items-center gap-2 mb-2.5 text-[var(--color-text-muted)]">
          <MessageSquare size={15} className="text-[var(--color-vocab)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Desafio de Diálogo</span>
        </div>
        <div className="border-l-4 border-[var(--color-vocab)] pl-3.5 py-1">
          <p className="text-base font-semibold text-[var(--color-text-secondary)] leading-relaxed">
            Ordene as falas abaixo para formar uma conversa lógica e natural.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {currentOrder.map((line, index) => {
          const isCorrectPos = answered && line === data.lines[index];
          return (
            <ConversationItem
              key={line}
              line={line}
              index={index}
              totalLines={currentOrder.length}
              answered={answered}
              isCorrectPos={isCorrectPos}
              isAnimating={isAnimating}
              isSwapping={swappingLines.has(line)}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              registerRef={registerRef}
            />
          );
        })}
      </div>

      {answered && JSON.stringify(currentOrder) !== JSON.stringify(data.lines) && (
        <div className="mt-2 rounded-xl p-4 bg-[rgba(16,185,129,0.04)] border border-emerald-500/20 animate-slide-up-spring">
          <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
            <span>💡</span> Ordem Correta da Conversa:
          </h4>
          <div className="flex flex-col gap-2.5 pl-3 border-l-2 border-emerald-500/30">
            {data.lines.map((line, idx) => {
              const match = line.match(/^([^:]+):\s*(.+)/);
              const speaker = match ? match[1].trim() : '';
              const text = match ? match[2].trim() : line;
              return (
                <div key={idx} className="flex items-center gap-2.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <span className="font-bold text-emerald-500/80 tabular-nums shrink-0">#{idx + 1}</span>
                  {speaker && (
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      {speaker}
                    </span>
                  )}
                  <span className="flex-1">{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
