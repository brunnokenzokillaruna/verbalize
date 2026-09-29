'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, MessageSquare, XCircle } from 'lucide-react';
import type { ScrambledConversationData } from '@/types';

interface ScrambledConversationProps {
  data: ScrambledConversationData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

function speakerAndText(line: string): { speaker: string; text: string } {
  const match = line.match(/^([^:]+):\s*(.+)/);
  return {
    speaker: match?.[1]?.trim() ?? '',
    text: match?.[2]?.trim() ?? line,
  };
}

function LineCard({
  line,
  locked,
  selected,
  tone,
  onSelect,
}: {
  line: string;
  locked?: boolean;
  selected?: boolean;
  tone?: 'correct' | 'wrong';
  onSelect?: () => void;
}) {
  const { speaker, text } = speakerAndText(line);
  const clickable = !!onSelect && !locked;

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onSelect}
      className="flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left"
      style={{
        backgroundColor:
          tone === 'correct'
            ? 'rgba(16,185,129,0.08)'
            : tone === 'wrong'
              ? 'rgba(239,68,68,0.08)'
              : selected
                ? 'var(--color-primary-light)'
                : 'var(--color-surface)',
        borderColor:
          tone === 'correct'
            ? 'rgba(16,185,129,0.45)'
            : tone === 'wrong'
              ? 'rgba(239,68,68,0.45)'
              : selected
                ? 'var(--color-primary)'
                : 'var(--color-border)',
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      {speaker && (
        <span className="mt-0.5 shrink-0 rounded-md border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10.5px] font-black uppercase tracking-wider text-[var(--color-primary)]">
          {speaker}
        </span>
      )}
      <span className="text-[15px] font-semibold leading-relaxed text-[var(--color-text-primary)]">{text}</span>
      {tone === 'correct' && <CheckCircle2 size={18} className="ml-auto shrink-0 text-emerald-500" />}
      {tone === 'wrong' && <XCircle size={18} className="ml-auto shrink-0 text-red-500" />}
    </button>
  );
}

export function ScrambledConversation({
  data,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: ScrambledConversationProps) {
  const lines = data.lines;
  const [placedCount, setPlacedCount] = useState(1);
  const [picked, setPicked] = useState<string | null>(null);
  const [missed, setMissed] = useState<string | null>(null);
  const handledTrigger = useRef(0);

  const pool = useMemo(() => {
    const remaining = lines.slice(placedCount);
    const order = new Map(data.shuffledLines.map((line, index) => [line, index]));
    return [...remaining].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  }, [data.shuffledLines, lines, placedCount]);

  useEffect(() => {
    setIsExerciseReady(!answered && picked !== null && missed === null);
  }, [answered, missed, picked, setIsExerciseReady]);

  useEffect(() => {
    if (submitTrigger === 0 || submitTrigger === handledTrigger.current || answered || missed) return;
    handledTrigger.current = submitTrigger;
    if (!picked) return;

    const expected = lines[placedCount];
    if (picked !== expected) {
      setMissed(picked);
      onAnswer(false);
      return;
    }

    const nextCount = placedCount + 1;
    if (nextCount >= lines.length) {
      setPlacedCount(nextCount);
      onAnswer(true);
      return;
    }

    setPlacedCount(nextCount);
    setPicked(null);
  }, [answered, lines, missed, onAnswer, picked, placedCount, submitTrigger]);

  const placed = lines.slice(0, placedCount);
  const finished = answered && missed === null && placedCount >= lines.length;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className="rounded-2xl border border-dashed border-[var(--color-border)] p-4.5"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="mb-2.5 flex items-center gap-2 text-[var(--color-text-muted)]">
          <MessageSquare size={15} className="text-[var(--color-vocab)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Qual fala vem agora?</span>
        </div>
        <p className="border-l-4 border-[var(--color-vocab)] py-1 pl-3.5 text-base font-semibold leading-relaxed text-[var(--color-text-secondary)]">
          A primeira fala já está no lugar. Escolha só a próxima.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {placed.map((line) => (
          <LineCard key={line} line={line} locked tone={finished || missed ? 'correct' : undefined} />
        ))}
        {missed && (
          <>
            <LineCard line={missed} tone="wrong" />
            <LineCard line={lines[placedCount]} tone="correct" />
          </>
        )}
      </div>

      {!answered && !missed && placedCount < lines.length && (
        <div className="flex flex-col gap-2">
          {pool.map((line) => (
            <LineCard
              key={line}
              line={line}
              selected={picked === line}
              onSelect={() => setPicked(line)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
