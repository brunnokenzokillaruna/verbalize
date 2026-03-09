'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, RefreshCw, X, Check } from 'lucide-react';
import {
  fetchAllImageCache,
  fetchPexelsAlternatives,
  replaceImageCacheEntry,
  approveImageCacheEntry,
} from '@/app/actions/adminImages';
import type { ImageCacheDocument } from '@/types';

export function ImageCacheManager() {
  const [entries, setEntries] = useState<ImageCacheDocument[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  // Replacement state
  const [replacing, setReplacing] = useState(false);
  const [alternatives, setAlternatives] = useState<Array<{ imageUrl: string; photographer: string }>>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchAllImageCache()
      .then((all) => setEntries(all.filter((e) => !e.approved)))
      .finally(() => setLoading(false));
  }, []);

  const current = entries[index];
  const total = entries.length;

  function closeReplace() {
    setReplacing(false);
    setAlternatives([]);
  }

  function removeCurrentAndAdvance() {
    setEntries((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    // Keep index in bounds: if we removed the last item, go back one
    setIndex((i) => (i >= entries.length - 1 ? Math.max(0, entries.length - 2) : i));
    closeReplace();
  }

  function prev() {
    setIndex((i) => (i > 0 ? i - 1 : total - 1));
    closeReplace();
  }

  function next() {
    setIndex((i) => (i < total - 1 ? i + 1 : 0));
    closeReplace();
  }

  async function handleApprove() {
    if (!current || approving) return;
    setApproving(true);
    try {
      await approveImageCacheEntry(current.word);
      removeCurrentAndAdvance();
    } finally {
      setApproving(false);
    }
  }

  async function handleStartReplace() {
    if (!current) return;
    setReplacing(true);
    setLoadingAlts(true);
    try {
      const alts = await fetchPexelsAlternatives(current.word, current.imageUrl);
      setAlternatives(alts);
    } finally {
      setLoadingAlts(false);
    }
  }

  async function handleSelectAlt(imageUrl: string, photographer: string) {
    if (!current || saving) return;
    setSaving(imageUrl);
    try {
      await replaceImageCacheEntry(current.word, imageUrl, photographer);
      setEntries((prev) =>
        prev.map((e, i) => (i === index ? { ...e, imageUrl, photographer } : e)),
      );
      closeReplace();
    } finally {
      setSaving(null);
    }
  }

  // ── Parse word and language from cache key (e.g. "chat_fr") ──────────────────
  const langSuffix = current?.word.match(/_([a-z]{2})$/)?.[1] ?? '';
  const wordDisplay = langSuffix ? current?.word.slice(0, -(langSuffix.length + 1)) : current?.word;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="h-6 w-6 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}
        />
      </div>
    );
  }

  if (!current) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {total === 0 ? 'Todas as imagens foram revisadas.' : 'Nenhuma imagem em cache ainda.'}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Counter + language badge ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {index + 1} / {total} para revisar
        </p>
        {langSuffix && (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            {langSuffix === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
          </span>
        )}
      </div>

      {/* ── Image card with nav arrows ── */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div className="relative aspect-video w-full">
          <Image
            src={current.imageUrl}
            alt={wordDisplay ?? ''}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 600px"
          />
          {/* Word + credit overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 px-4 py-3"
            style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.72))' }}
          >
            <p className="font-display text-lg font-bold text-white">{wordDisplay}</p>
            <p className="text-xs text-white/70">📷 {current.photographer}</p>
          </div>
        </div>

        {/* Prev arrow */}
        <button
          type="button"
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition-opacity active:opacity-60"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: 'white' }}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Next arrow */}
        <button
          type="button"
          onClick={next}
          aria-label="Próxima"
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition-opacity active:opacity-60"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: 'white' }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ── Action buttons ── */}
      {!replacing && (
        <div className="flex gap-2">
          {/* Approve (checkmark) */}
          <button
            type="button"
            onClick={handleApprove}
            disabled={approving}
            aria-label="Aprovar imagem"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-success-bg, #f0fdf4)',
              borderColor: 'var(--color-success, #16a34a)',
              color: 'var(--color-success, #16a34a)',
            }}
          >
            {approving ? (
              <div
                className="h-4 w-4 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(22,163,74,0.3)', borderTopColor: 'var(--color-success, #16a34a)' }}
              />
            ) : (
              <Check size={18} strokeWidth={2.5} />
            )}
          </button>

          {/* Replace image */}
          <button
            type="button"
            onClick={handleStartReplace}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all active:scale-95"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <RefreshCw size={15} />
            Trocar imagem
          </button>
        </div>
      )}

      {/* ── Alternatives grid ── */}
      {replacing && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Escolha uma alternativa
            </p>
            <button
              type="button"
              onClick={closeReplace}
              className="transition-opacity active:opacity-60"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="Cancelar"
            >
              <X size={16} />
            </button>
          </div>

          {loadingAlts ? (
            <div className="flex items-center justify-center py-8">
              <div
                className="h-5 w-5 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}
              />
            </div>
          ) : alternatives.length === 0 ? (
            <p className="py-4 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Nenhuma alternativa encontrada.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {alternatives.map((alt) => (
                <button
                  key={alt.imageUrl}
                  type="button"
                  onClick={() => handleSelectAlt(alt.imageUrl, alt.photographer)}
                  disabled={saving !== null}
                  className="relative aspect-video overflow-hidden rounded-xl transition-opacity active:opacity-70 disabled:opacity-50"
                >
                  <Image
                    src={alt.imageUrl}
                    alt={wordDisplay ?? ''}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 200px"
                  />
                  {saving === alt.imageUrl && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                    >
                      <div
                        className="h-5 w-5 rounded-full border-2 animate-spin"
                        style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'white' }}
                      />
                    </div>
                  )}
                  <div
                    className="absolute bottom-0 left-0 right-0 px-2 py-1"
                    style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}
                  >
                    <p className="truncate text-[10px] text-white/70">📷 {alt.photographer}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
