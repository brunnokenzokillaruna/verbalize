'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, Loader2 } from 'lucide-react';
import { getUserMistakes } from '@/services/firestore';
import { LanguageFlag } from '@/components/LanguageFlag';
import { MistakeListSheet } from '@/components/mistakes/MistakeListSheet';
import { MISTAKE_THEME } from '@/components/mistakes/mistakeTheme';
import type { LessonMistakeDocument } from '@/types';

export function MistakesSection({
  uid,
  onCountChange,
}: {
  uid: string;
  onCountChange?: (count: number) => void;
}) {
  const router = useRouter();
  const [mistakes, setMistakes] = useState<LessonMistakeDocument[]>([]);
  const [mistakesLoading, setMistakesLoading] = useState(true);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    setMistakesLoading(true);
    getUserMistakes(uid)
      .then((list) => {
        setMistakes(list);
        onCountChange?.(list.length);
        setMistakesLoading(false);
      })
      .catch(() => {
        onCountChange?.(0);
        setMistakesLoading(false);
      });
  }, [uid, onCountChange]);

  function startReview(mistake: LessonMistakeDocument) {
    if (mistake.id) router.push(`/review?id=${mistake.id}`);
  }

  if (mistakesLoading) {
    return (
      <div className="flex items-center gap-2.5 py-3 animate-fade-in">
        <Loader2 size={16} className="animate-spin text-text-muted" />
        <span className="text-sm text-text-muted">Carregando revisões…</span>
      </div>
    );
  }

  if (mistakes.length === 0) {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-4 border border-border bg-surface animate-slide-up-spring delay-75"
        style={{ borderColor: 'rgba(5,150,105,0.2)', backgroundColor: 'var(--color-success-bg)' }}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: 'var(--color-success)' }}
        >
          <Check size={16} strokeWidth={3} />
        </span>
        <div>
          <p className="text-sm font-bold text-success">Nenhum erro pendente</p>
          <p className="text-xs text-text-secondary mt-0.5">Continue praticando assim.</p>
        </div>
      </div>
    );
  }

  const next = mistakes[0];
  const remaining = mistakes.length - 1;

  return (
    <>
      <div
        className="rounded-2xl border-2 overflow-hidden animate-slide-up-spring delay-75"
        style={{
          borderColor: MISTAKE_THEME.accent,
          backgroundColor: 'var(--color-surface)',
          boxShadow: '0 3px 0 rgba(220, 38, 38, 0.12)',
        }}
      >
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white font-display text-lg font-bold"
              style={{
                backgroundColor: MISTAKE_THEME.accent,
                boxShadow: `0 2px 0 ${MISTAKE_THEME.accentDark}`,
              }}
            >
              {mistakes.length}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-error">
                Revisão pendente
              </p>
              <p className="font-display text-base font-bold text-text-primary mt-0.5 leading-snug line-clamp-2">
                {next.grammarFocus}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <LanguageFlag language={next.language} size="sm" />
                <span className="text-[10px] font-bold text-text-muted">{next.level}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => startReview(next)}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
            style={{
              backgroundColor: MISTAKE_THEME.accent,
              boxShadow: `0 3px 0 ${MISTAKE_THEME.accentDark}`,
            }}
          >
            Revisar agora
            <ChevronRight size={16} />
          </button>

          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setShowList(true)}
              className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer text-center py-1"
            >
              Ver todos os erros ({mistakes.length})
            </button>
          )}
        </div>
      </div>

      {showList && (
        <MistakeListSheet
          mistakes={mistakes}
          onSelect={(m) => {
            setShowList(false);
            startReview(m);
          }}
          onClose={() => setShowList(false)}
        />
      )}
    </>
  );
}
