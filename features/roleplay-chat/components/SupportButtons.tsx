'use client';

import { useEffect, useRef, useState } from 'react';
import { HelpCircle, MessageSquareDashed, RefreshCw } from 'lucide-react';
import { COACH_NOTES } from '@/features/roleplay-chat/coachNotes';
import type { CoachNoteKind } from '@/features/roleplay-chat/types';

const ORDER: CoachNoteKind[] = ['repeat', 'simplify', 'suggest'];

const ICONS: Record<CoachNoteKind, typeof RefreshCw> = {
  repeat: RefreshCw,
  simplify: MessageSquareDashed,
  suggest: HelpCircle,
};

/** In-conversation lifelines — the character reacts without leaving the scene. */
export function SupportButtons({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (kind: CoachNoteKind) => boolean;
}) {
  const [sent, setSent] = useState<CoachNoteKind | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  function handleClick(kind: CoachNoteKind) {
    if (!onSend(kind)) return;
    setSent(kind);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSent(null), 2500);
  }

  return (
    <div className="flex gap-1.5 px-4 pb-1">
      {ORDER.map((kind) => {
        const Icon = ICONS[kind];
        const active = sent === kind;
        return (
          <button
            key={kind}
            type="button"
            disabled={disabled}
            onClick={() => handleClick(kind)}
            title={COACH_NOTES[kind].hintPt}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-bold transition-colors disabled:opacity-40 cursor-pointer"
            style={{
              backgroundColor: active ? 'var(--color-primary-light)' : 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
          >
            <Icon size={13} />
            {active ? 'Pedido feito' : COACH_NOTES[kind].labelPt}
          </button>
        );
      })}
    </div>
  );
}
