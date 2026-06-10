'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { RotateCw, X as XIcon, Check as CheckIcon } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { ReviewSessionShell } from './ReviewSessionShell';
import { ReviewResultsScreen } from './ReviewResultsScreen';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';
import type { ReviewResult } from './reviewTypes';
import { isMissingTranslation } from '@/utils/vocabHelpers';

type CardDirection = 'fr-to-pt' | 'pt-to-fr';

const FLIP_DURATION_MS = 500;

interface FlashcardReviewSessionProps {
  state: 'ready' | 'running' | 'done';
  items: UserVocabularyDocument[];
  currentIdx: number;
  results: ReviewResult[];
  language: SupportedLanguage;
  savingResults: boolean;
  onStart: () => void;
  onAnswer: (correct: boolean) => void;
  onFinish: () => void;
  onClose: () => void;
}

function pickDirection(item: UserVocabularyDocument): CardDirection {
  const canPtToFr = !isMissingTranslation(item);
  if (!canPtToFr) return 'fr-to-pt';
  return Math.random() < 0.5 ? 'fr-to-pt' : 'pt-to-fr';
}

export function FlashcardReviewSession({
  state,
  items,
  currentIdx,
  results,
  language,
  savingResults,
  onStart,
  onAnswer,
  onFinish,
  onClose,
}: FlashcardReviewSessionProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [streak, setStreak] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = items.length;
  const currentItem = state === 'running' ? items[currentIdx] : null;

  const directions = useMemo(
    () => items.map((item) => pickDirection(item)),
    [items],
  );

  useEffect(() => {
    setIsFlipped(false);
    setIsAnimating(false);
  }, [currentIdx, state]);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, []);

  if (state === 'done') {
    return (
      <ReviewResultsScreen
        title="Cartões concluídos"
        results={results}
        sessionItems={items}
        savingResults={savingResults}
        correctLabel="Lembrei"
        incorrectLabel="Esqueci"
        onFinish={onFinish}
        onClose={onClose}
      />
    );
  }

  if (state === 'ready') {
    return (
      <ReviewSessionShell
        modeLabel="Cartões"
        current={0}
        total={total}
        onCloseRequest={onClose}
      >
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 mx-auto max-w-lg w-full text-center gap-8">
          <div>
            <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Pronto para revisar?
            </h2>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              {total} cartões nesta sessão
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            {[
              { step: '1', text: 'Veja a palavra ou tradução' },
              { step: '2', text: 'Toque para revelar a resposta' },
              { step: '3', text: 'Avalie se você lembrou' },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-center gap-4 rounded-xl px-4 py-3 border"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                  {item.step}
                </span>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onStart}
            className="w-full rounded-2xl px-6 py-4 text-base font-semibold text-white transition-all active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--color-primary)',
              boxShadow: '0 4px 16px rgba(29, 94, 212, 0.3)',
            }}
          >
            Começar cartões
          </button>
        </div>
      </ReviewSessionShell>
    );
  }

  if (!currentItem) return null;

  const direction = directions[currentIdx];
  const targetLangLabel = language === 'fr' ? 'francês' : 'inglês';
  const promptText =
    direction === 'fr-to-pt' ? 'Qual é a tradução?' : `Como se diz em ${targetLangLabel}?`;
  const frontText =
    direction === 'fr-to-pt' ? currentItem.word : currentItem.translation;
  const backWord = currentItem.word;
  const backTranslation = currentItem.translation;
  const audioText = direction === 'fr-to-pt' ? currentItem.word : currentItem.word;

  function handleAnswer(correct: boolean) {
    if (isAnimating) return;

    if (correct) setStreak((s) => s + 1);
    else setStreak(0);

    // Flip back to the front before advancing — avoids showing the next card's answer mid-animation
    if (isFlipped) {
      setIsAnimating(true);
      setIsFlipped(false);
      flipTimerRef.current = setTimeout(() => {
        setIsAnimating(false);
        onAnswer(correct);
      }, FLIP_DURATION_MS);
      return;
    }

    onAnswer(correct);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!isFlipped || touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 60) handleAnswer(true);
    else if (delta < -60) handleAnswer(false);
    touchStartX.current = null;
  }

  const footer = (
    <div
      className="px-5 pt-3 flex gap-4 transition-all duration-300"
      style={{
        opacity: isFlipped && !isAnimating ? 1 : 0,
        pointerEvents: isFlipped && !isAnimating ? 'auto' : 'none',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      <button
        type="button"
        onClick={() => handleAnswer(false)}
        className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl py-5 transition-all active:scale-[0.98]"
        style={{
          backgroundColor: 'var(--color-error-bg)',
          border: '2px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: '#ef4444' }}>
          <XIcon size={24} color="#fff" strokeWidth={3} />
        </div>
        <span className="text-sm font-bold" style={{ color: '#ef4444' }}>Esqueci</span>
      </button>

      <button
        type="button"
        onClick={() => handleAnswer(true)}
        className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl py-5 transition-all active:scale-[0.98]"
        style={{
          backgroundColor: 'var(--color-success-bg)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
        }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-success)' }}>
          <CheckIcon size={24} color="#fff" strokeWidth={3} />
        </div>
        <span className="text-sm font-bold" style={{ color: 'var(--color-success)' }}>Lembrei</span>
      </button>
    </div>
  );

  return (
    <ReviewSessionShell
      modeLabel="Cartões"
      current={currentIdx + 1}
      total={total}
      onCloseRequest={onClose}
      footer={footer}
    >
      <div className="flex-1 px-5 py-4 mx-auto max-w-lg w-full flex flex-col items-center justify-center">
        {streak >= 2 && (
          <div
            className="mb-4 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-in zoom-in"
            style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}
          >
            {streak} em sequência!
          </div>
        )}

        <div
          className="relative w-full aspect-[3/4] max-h-[58vh] transition-all duration-500 rounded-3xl"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            cursor: !isFlipped && !isAnimating ? 'pointer' : 'default',
          }}
          onClick={() => {
            if (!isFlipped && !isAnimating) setIsFlipped(true);
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col rounded-3xl overflow-hidden"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-primary)',
              boxShadow: '0 12px 40px rgba(29, 94, 212, 0.15)',
              backfaceVisibility: 'hidden',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: `transform ${FLIP_DURATION_MS}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
            }}
          >
            {currentItem.imageUrl && (
              <div className="relative w-full h-[45%] shrink-0">
                <Image
                  src={currentItem.imageUrl}
                  alt={currentItem.word}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)' }}
                />
              </div>
            )}

            <div className="flex flex-col items-center justify-center flex-1 p-6 gap-4">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--color-primary)' }}
              >
                {promptText}
              </p>
              <p
                className="font-display text-4xl font-bold text-center break-words w-full"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {frontText}
              </p>
              {direction === 'fr-to-pt' && (
                <AudioPlayerButton text={audioText} language={language} size="lg" />
              )}
            </div>

            {!isFlipped && (
              <div className="flex justify-center pb-6">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full animate-bounce"
                  style={{ backgroundColor: 'var(--color-primary-light)' }}
                >
                  <RotateCw size={14} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                    Toque para virar
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-border)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
              backfaceVisibility: 'hidden',
              transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
              transition: `transform ${FLIP_DURATION_MS}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
            }}
          >
            <p className="font-display text-xl font-bold mb-1 text-center" style={{ color: 'var(--color-text-muted)' }}>
              {backWord}
            </p>
            <div className="w-12 h-1 rounded-full mb-4" style={{ backgroundColor: 'var(--color-border)' }} />
            <p className="text-3xl font-semibold text-center mb-4" style={{ color: 'var(--color-vocab)' }}>
              {backTranslation}
            </p>
            <AudioPlayerButton text={backWord} language={language} size="md" />
            {isFlipped && (
              <p className="text-[10px] mt-6 font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Deslize ← esqueci · lembrei →
              </p>
            )}
          </div>
        </div>
      </div>
    </ReviewSessionShell>
  );
}
