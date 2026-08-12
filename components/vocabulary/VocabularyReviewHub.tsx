'use client';

import { useState, type ReactNode } from 'react';
import {
  Layers,
  Brain,
  ImageIcon,
  Clock,
  Shuffle,
  Loader2,
  Zap,
} from 'lucide-react';
import { REVIEW_SESSION_SIZE, countPassiveOnlyInSession } from '@/utils/reviewSession';
import { isPassiveOnlyVocabulary } from '@/lib/vocabKnowledgeMode';
import { SRS_BAR_COLOR } from '@/components/vocabulary/SrsBar';
import type { ReviewMode } from '@/hooks/useVocabReview';
import type { UserVocabularyDocument } from '@/types';

type VocabularyReviewHubProps = {
  dueCount: number;
  reviewedTodayCount: number;
  sessionPreview: UserVocabularyDocument[];
  contextLoading: boolean;
  onStartReview: (mode: ReviewMode) => void;
  onReshuffle: () => void;
};

type ModeConfig = {
  mode: ReviewMode;
  title: string;
  description: string;
  icon: ReactNode;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  shadow: string;
  estimate: string;
};

const MODES: ModeConfig[] = [
  {
    mode: 'flashcard',
    title: 'Cartões',
    description: 'Vire o cartão e avalie se lembrou da tradução.',
    icon: <Layers size={22} />,
    borderColor: 'var(--color-primary)',
    iconBg: 'var(--color-primary-light)',
    iconColor: 'var(--color-primary)',
    shadow: '0 4px 0 var(--color-primary-light)',
    estimate: '~3 min',
  },
  {
    mode: 'context',
    title: 'Em contexto',
    description: 'Complete frases em situações reais com ajuda da IA.',
    icon: <Brain size={22} />,
    borderColor: 'var(--color-verb)',
    iconBg: 'rgba(124, 58, 237, 0.12)',
    iconColor: 'var(--color-verb)',
    shadow: '0 4px 0 rgba(124, 58, 237, 0.15)',
    estimate: '~5 min',
  },
  {
    mode: 'visual',
    title: 'Visual',
    description: 'Escolha a imagem que representa cada palavra.',
    icon: <ImageIcon size={22} />,
    borderColor: 'var(--color-warning)',
    iconBg: 'var(--color-warning-bg)',
    iconColor: 'var(--color-warning)',
    shadow: '0 4px 0 rgba(245, 158, 11, 0.15)',
    estimate: '~4 min',
  },
];

function ReviewProgressRing({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 100;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 88 88" aria-hidden>
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="6"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={pct >= 100 ? 'var(--color-success)' : 'var(--color-primary)'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="text-center">
        <p
          className="font-display text-xl font-bold leading-none"
          style={{ color: pct >= 100 ? 'var(--color-success)' : 'var(--color-text-primary)' }}
        >
          {pct}%
        </p>
        <p className="text-[10px] font-bold text-text-muted mt-0.5">hoje</p>
      </div>
    </div>
  );
}

export function VocabularyReviewHub({
  dueCount,
  reviewedTodayCount,
  sessionPreview,
  contextLoading,
  onStartReview,
  onReshuffle,
}: VocabularyReviewHubProps) {
  const [startingMode, setStartingMode] = useState<ReviewMode | null>(null);

  const sessionCount = sessionPreview.length;
  const passiveInSession = countPassiveOnlyInSession(sessionPreview);
  const sessionsLeft = Math.ceil(dueCount / REVIEW_SESSION_SIZE);
  const reviewedToday = reviewedTodayCount;
  const totalToday = dueCount + reviewedToday;
  const remainingAfterSession = Math.max(0, dueCount - sessionCount);
  const queueSubtitle = [
    passiveInSession > 0
      ? `${passiveInSession} ${passiveInSession === 1 ? 'priorizada' : 'priorizadas'} para produção`
      : null,
    remainingAfterSession > 0
      ? `${remainingAfterSession} ficam para a próxima rodada`
      : passiveInSession === 0
        ? 'Todas as pendentes nesta sessão'
        : null,
  ]
    .filter(Boolean)
    .join(' · ');

  async function handleStart(mode: ReviewMode) {
    setStartingMode(mode);
    try {
      await onStartReview(mode);
    } finally {
      setStartingMode(null);
    }
  }

  return (
    <div className="flex flex-col gap-5 animate-slide-up-spring">
      {/* Progress hero */}
      <div
        className="rounded-2xl border-2 p-5 flex items-center gap-5"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-surface) 60%)',
          borderColor: 'var(--color-primary)',
          boxShadow: '0 4px 0 rgba(29, 94, 212, 0.12)',
        }}
      >
        <ReviewProgressRing done={reviewedToday} total={totalToday} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: 'var(--color-error)' }} />
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Revisão de hoje
            </p>
          </div>
          <p className="font-display text-xl font-bold text-text-primary mt-1">
            {dueCount} pendente{dueCount !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            {sessionsLeft} sessão{sessionsLeft !== 1 ? 'ões' : ''} de {sessionCount} palavras
            {reviewedToday > 0 && ` · ${reviewedToday} já revisada${reviewedToday !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Mode cards */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted px-0.5">
          Escolha como revisar
        </p>

        {MODES.map((config) => {
          const isLoading = startingMode === config.mode || (config.mode === 'context' && contextLoading);
          const isDisabled = isLoading || startingMode !== null;

          return (
            <button
              key={config.mode}
              type="button"
              disabled={isDisabled}
              onClick={() => handleStart(config.mode)}
              className="flex items-start gap-4 rounded-2xl p-4 text-left transition-all active:scale-[0.98] border-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-70 disabled:cursor-wait"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: config.borderColor,
                boxShadow: config.shadow,
              }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: config.iconBg, color: config.iconColor }}
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base font-bold text-text-primary">
                  {config.title}
                </h3>
                <p className="text-xs mt-0.5 leading-relaxed text-text-secondary">
                  {config.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: config.iconBg, color: config.iconColor }}
                  >
                    {sessionCount} palavras
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-text-muted">
                    <Clock size={10} />
                    {config.estimate}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Session queue */}
      <div
        className="rounded-2xl border border-border bg-surface overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <div>
            <p className="text-xs font-bold text-text-primary">
              Fila da sessão
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">{queueSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onReshuffle}
            disabled={startingMode !== null || contextLoading}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold border border-border text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            aria-label="Embaralhar palavras da sessão"
          >
            <Shuffle size={12} />
            Embaralhar
          </button>
        </div>

        <div className="px-4 py-3.5 flex flex-wrap gap-2">
          {sessionPreview.map((item) => {
            const level = Math.min(Math.max(item.srsLevel ?? 0, 0), 5);
            const color = SRS_BAR_COLOR[level];
            const passiveOnly = isPassiveOnlyVocabulary(item);
            return (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold border"
                style={{
                  backgroundColor: passiveOnly ? 'var(--color-primary-light)' : 'var(--color-bg)',
                  borderColor: passiveOnly ? 'color-mix(in srgb, var(--color-primary) 35%, var(--color-border))' : 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                title={passiveOnly ? 'Ainda não produzida — prioridade na revisão' : undefined}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                {item.word}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
