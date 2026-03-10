'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getUserVocabulary, updateVocabTranslation, getCachedImage } from '@/services/firestore';
import { translateWord } from '@/app/actions/translateWord';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';

// ── SRS level labels ──────────────────────────────────────────────────────────

const SRS_LABELS = ['Iniciante', 'Básico', 'Aprendendo', 'Bom', 'Ótimo', 'Dominado'];

const SRS_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: 'var(--color-error-bg)',    text: 'var(--color-error)'   },
  1: { bg: 'var(--color-vocab-bg)',    text: 'var(--color-vocab)'   },
  2: { bg: 'var(--color-vocab-bg)',    text: 'var(--color-vocab)'   },
  3: { bg: 'var(--color-bridge-bg)',   text: 'var(--color-bridge)'  },
  4: { bg: 'var(--color-bridge-bg)',   text: 'var(--color-bridge)'  },
  5: { bg: 'var(--color-success-bg)',  text: 'var(--color-success)' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNextReview(ts: { toDate?: () => Date } | Date | null | undefined): string {
  if (!ts) return '';
  const date = typeof (ts as { toDate?: () => Date }).toDate === 'function'
    ? (ts as { toDate: () => Date }).toDate()
    : ts instanceof Date ? ts : new Date();
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Para revisar hoje';
  if (diffDays === 1) return 'Revisar amanhã';
  return `Revisar em ${diffDays} dias`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VocabularyPage() {
  const { user, profile } = useAuthStore();
  const [items, setItems] = useState<UserVocabularyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);

  const language = (profile?.currentTargetLanguage ?? 'fr') as SupportedLanguage;

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      const vocab = await getUserVocabulary(user.uid, language);

      // Batch-fetch latest image URLs from image_cache in parallel.
      // image_cache is the source of truth (updated by admin / new fetches),
      // so it overrides potentially stale URLs stored in user_vocabulary.
      const cacheResults = await Promise.all(
        vocab.map((v) => getCachedImage(`${v.word}_${language}`)),
      );
      const enriched = vocab.map((v, i) => ({
        ...v,
        imageUrl: cacheResults[i]?.imageUrl ?? v.imageUrl,
      }));

      setItems(enriched);
      setLoading(false);

      // Lazily enrich placeholder translations (word === translation)
      const placeholders = vocab.filter((v) => v.translation === v.word || !v.translation);
      if (placeholders.length === 0) return;

      setEnriching(true);
      await Promise.all(
        placeholders.map(async (item) => {
          const result = await translateWord(item.word, '', language);
          if (result?.translation && result.translation !== item.word) {
            await updateVocabTranslation(user.uid, item.word, language, result.translation);
            setItems((prev) =>
              prev.map((v) =>
                v.word === item.word ? { ...v, translation: result.translation } : v,
              ),
            );
          }
        }),
      );
      setEnriching(false);
    })();
  }, [user, language]);

  // ── Split into due-today vs learned ────────────────────────────────────────

  const now = new Date();
  const dueToday: UserVocabularyDocument[] = [];
  const learned: UserVocabularyDocument[] = [];

  for (const item of items) {
    const reviewDate =
      item.nextReview && typeof (item.nextReview as { toDate?: () => Date }).toDate === 'function'
        ? (item.nextReview as { toDate: () => Date }).toDate()
        : null;
    if (reviewDate && reviewDate <= now) {
      dueToday.push(item);
    } else {
      learned.push(item);
    }
  }

  // ── Loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-3"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Carregando vocabulário…
        </p>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center pb-24"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
        >
          <BookOpen size={32} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Nenhuma palavra ainda
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Conclua sua primeira lição e as palavras que você aprender aparecerão aqui.
        </p>
      </div>
    );
  }

  // ── Main view ───────────────────────────────────────────────────────────────

  const LANG_LABEL: Record<SupportedLanguage, string> = { fr: '🇫🇷 Francês', en: '🇬🇧 Inglês' };

  return (
    <div
      className="min-h-dvh pb-24 md:pb-10"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-5 pt-8 pb-4"
        style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl">
          <div className="flex items-end justify-between">
            <div>
              <h1
                className="font-display text-2xl font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Meu Vocabulário
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {LANG_LABEL[language]} · {items.length} palavra{items.length !== 1 ? 's' : ''}
              </p>
            </div>
            {enriching && (
              <div className="flex items-center gap-1.5 pb-0.5">
                <Loader2 size={13} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Traduzindo…
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-5 pt-5 flex flex-col gap-6">
        {/* Due today section */}
        {dueToday.length > 0 && (
          <section>
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--color-error)' }}
            >
              Para revisar hoje ({dueToday.length})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dueToday.map((item) => (
                <VocabCard key={item.word} item={item} language={language} urgent />
              ))}
            </div>
          </section>
        )}

        {/* Learned section */}
        {learned.length > 0 && (
          <section>
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Aprendido ({learned.length})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {learned.map((item) => (
                <VocabCard key={item.word} item={item} language={language} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// ── VocabCard sub-component ───────────────────────────────────────────────────

function VocabCard({
  item,
  language,
  urgent = false,
}: {
  item: UserVocabularyDocument;
  language: SupportedLanguage;
  urgent?: boolean;
}) {
  const level = Math.min(Math.max(item.srsLevel ?? 0, 0), 5);
  const srsColor = SRS_COLORS[level];
  const isPlaceholder = item.translation === item.word || !item.translation;

  return (
    <div
      className="flex items-center rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${urgent ? 'var(--color-error)' : 'var(--color-border)'}`,
      }}
    >
      {/* Image thumbnail */}
      <div
        className="relative h-[72px] w-[72px] shrink-0"
        style={{ backgroundColor: 'var(--color-surface-raised)' }}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.word}
            fill
            className="object-cover"
            sizes="72px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-2xl opacity-25">📖</span>
          </div>
        )}
      </div>

      {/* Content: word/translation + SRS badge/audio */}
      <div className="flex flex-1 items-center gap-4 px-4 py-3 min-w-0">
        <div className="flex-1 min-w-0">
          <p
            className="font-display text-xl font-semibold leading-tight"
            style={{ color: 'var(--color-vocab)' }}
          >
            {item.word}
          </p>
          <p
            className="mt-0.5 text-sm truncate"
            style={{
              color: isPlaceholder ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
              fontStyle: isPlaceholder ? 'italic' : 'normal',
            }}
          >
            {isPlaceholder ? 'traduzindo…' : item.translation}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {formatNextReview(item.nextReview as Parameters<typeof formatNextReview>[0])}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className="rounded-lg px-2 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: srsColor.bg, color: srsColor.text }}
          >
            {SRS_LABELS[level]}
          </span>
          <AudioPlayerButton text={item.word} language={language} size="sm" />
        </div>
      </div>
    </div>
  );
}
