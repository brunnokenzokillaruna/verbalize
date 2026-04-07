import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { getUserMistakes } from '@/services/firestore';
import { SectionLabel } from './SectionLabel';
import type { LessonMistakeDocument } from '@/types';

export function MistakesSection({ uid }: { uid: string }) {
  const router = useRouter();
  const [mistakes, setMistakes] = useState<LessonMistakeDocument[]>([]);
  const [mistakesLoading, setMistakesLoading] = useState(true);
  const [mistakeIndex, setMistakeIndex] = useState(0);

  useEffect(() => {
    setMistakesLoading(true);
    getUserMistakes(uid)
      .then((list) => { setMistakes(list); setMistakesLoading(false); })
      .catch(() => setMistakesLoading(false));
  }, [uid]);

  return (
    <section className="flex flex-col gap-4 animate-slide-up-spring delay-300">
      <div className="flex items-center justify-between">
        <SectionLabel>Erros para revisar</SectionLabel>
        {mistakes.length > 0 && (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-bold"
            style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}
          >
            {mistakes.length}
          </span>
        )}
      </div>

      {mistakesLoading ? (
        <div className="flex items-center gap-2.5 rounded-2xl px-4 py-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Carregando erros…</span>
        </div>
      ) : mistakes.length === 0 ? (
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-4"
          style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid rgba(5,150,105,0.2)' }}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'var(--color-success)', background: 'linear-gradient(135deg, #059669, #10b981)' }}
          >
            <Check size={15} color="white" strokeWidth={3} />
          </span>
          <p className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>
            Nenhum erro pendente. Continue assim! 🎉
          </p>
        </div>
      ) : (() => {
        const safeIndex = Math.min(mistakeIndex, mistakes.length - 1);
        const m = mistakes[safeIndex];
        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-stretch gap-2">
              <button
                type="button"
                disabled={safeIndex === 0}
                onClick={() => setMistakeIndex((i) => Math.max(0, i - 1))}
                className="flex w-9 shrink-0 items-center justify-center rounded-xl transition-all active:scale-90 disabled:opacity-30"
                style={{ backgroundColor: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                aria-label="Erro anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                className="card-lift flex flex-1 items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition-all active:opacity-80"
                onClick={() => m.id && router.push(`/review?id=${m.id}`)}
                style={{ backgroundColor: 'var(--color-surface)', border: '1.5px solid var(--color-error)', boxShadow: '0 0 0 3px var(--color-error-bg)' }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5"
                  style={{ backgroundColor: 'var(--color-error-bg)' }}
                >
                  <AlertCircle size={15} style={{ color: 'var(--color-error)' }} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs">{m.language === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Nível {m.level}</span>
                  </div>
                  <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                    {m.grammarFocus}
                  </p>
                  <p className="mt-0.5 text-xs line-clamp-2 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                    {m.mistakeContext}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5 self-center ml-1">
                  <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>Revisar</span>
                  <ChevronRight size={13} style={{ color: 'var(--color-primary)' }} />
                </div>
              </button>

              <button
                type="button"
                disabled={safeIndex >= mistakes.length - 1}
                onClick={() => setMistakeIndex((i) => Math.min(mistakes.length - 1, i + 1))}
                className="flex w-9 shrink-0 items-center justify-center rounded-xl transition-all active:scale-90 disabled:opacity-30"
                style={{ backgroundColor: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                aria-label="Próximo erro"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between px-1">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Toque para revisar · ao acertar 100% o erro é removido
              </p>
              {mistakes.length > 1 && (
                <span className="text-xs font-bold tabular-nums shrink-0 ml-2" style={{ color: 'var(--color-text-muted)' }}>
                  {safeIndex + 1} / {mistakes.length}
                </span>
              )}
            </div>
          </div>
        );
      })()}
    </section>
  );
}
