'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type RevealApi = {
  isOpen: (key: string) => boolean;
  open: (key: string) => void;
};

const GrammarRevealContext = createContext<RevealApi | null>(null);

export function GrammarRevealState({
  resetKey,
  children,
}: {
  resetKey: string;
  children: ReactNode;
}) {
  const [seenKey, setSeenKey] = useState(resetKey);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  if (seenKey !== resetKey) {
    setSeenKey(resetKey);
    setOpenKeys([]);
  }

  const api: RevealApi = {
    isOpen: (key) => openKeys.includes(key),
    open: (key) =>
      setOpenKeys((current) => (current.includes(key) ? current : [...current, key])),
  };

  return <GrammarRevealContext.Provider value={api}>{children}</GrammarRevealContext.Provider>;
}

export function useGrammarReveal(revealKey: string): { isOpen: boolean; open: () => void } {
  const ctx = useContext(GrammarRevealContext);
  const [localOpen, setLocalOpen] = useState(false);

  if (!ctx) {
    return { isOpen: localOpen, open: () => setLocalOpen(true) };
  }

  return {
    isOpen: ctx.isOpen(revealKey),
    open: () => ctx.open(revealKey),
  };
}

export function RevealOnTap({
  revealKey,
  label,
  children,
}: {
  revealKey: string;
  label: string;
  children: ReactNode;
}) {
  const { isOpen, open } = useGrammarReveal(revealKey);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={open}
        className="self-center rounded-xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary min-h-[44px] transition-colors hover:bg-primary/15"
      >
        {label}
      </button>
    );
  }

  return <div className="flex flex-col gap-3 motion-safe:animate-slide-up-spring">{children}</div>;
}
