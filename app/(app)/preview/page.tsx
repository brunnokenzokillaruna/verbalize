'use client';

import { useState } from 'react';
import { ClickableSentence } from '@/components/lesson/ClickableSentence';
import { TranslationTooltip } from '@/components/lesson/TranslationTooltip';
import { LessonProgressHeader } from '@/components/lesson/LessonProgressHeader';
import { CheckButton } from '@/components/lesson/CheckButton';
import { GrammarBridgeCard } from '@/components/lesson/GrammarBridgeCard';
import { VisualVocabCard } from '@/components/lesson/VisualVocabCard';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import type { WordClickPayload } from '@/components/lesson/ClickableWord';
import type { CheckButtonState } from '@/components/lesson/CheckButton';
import type { LessonStage, SupportedLanguage } from '@/types';
import { translateWord } from '@/app/actions/translateWord';

// ─── Sample data ────────────────────────────────────────────────────────────

const HOOK_SENTENCE = "Je voudrais un café, s'il vous plaît.";
const NEW_VOCAB = ['voudrais', 'café', 'plaît'];

const STAGES_ORDER: LessonStage[] = ['hook', 'grammar', 'vocabulary', 'practice', 'review'];

const VOCAB_CARDS: { word: string; translation: string; language: SupportedLanguage; exampleSentence: string }[] = [
  {
    word: 'café',
    translation: 'coffee / café',
    language: 'fr',
    exampleSentence: "Je voudrais un café, s'il vous plaît.",
  },
  {
    word: 'voudrais',
    translation: 'gostaria (condicional)',
    language: 'fr',
    exampleSentence: 'Je voudrais visiter Paris un jour.',
  },
];

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <p
        className="mb-3 text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {title}
      </p>
      {children}
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PreviewPage() {
  // TranslationTooltip state
  const [tooltip, setTooltip] = useState<{
    isOpen: boolean;
    word: string;
    translation?: string;
    explanation?: string;
    example?: string;
    isLoading: boolean;
  }>({ isOpen: false, word: '', isLoading: false });

  // CheckButton state
  const [checkState, setCheckState] = useState<CheckButtonState>('idle');

  // Progress stage
  const [stageIndex, setStageIndex] = useState(1);
  const currentStage = STAGES_ORDER[stageIndex];

  async function handleWordClick({ word }: WordClickPayload) {
    setTooltip({ isOpen: true, word, isLoading: true });
    const result = await translateWord(word, HOOK_SENTENCE, 'fr');
    setTooltip({
      isOpen: true,
      word,
      isLoading: false,
      translation: result?.translation,
      explanation: result?.explanation,
      example: result?.example,
    });
  }

  function handleCheck() {
    setCheckState(Math.random() > 0.4 ? 'correct' : 'incorrect');
  }

  function handleContinue() {
    setCheckState('idle');
    setStageIndex((i) => Math.min(i + 1, STAGES_ORDER.length - 1));
  }

  return (
    <>
      {/* Fixed header */}
      <LessonProgressHeader
        currentStage={currentStage}
        onExit={() => setStageIndex(0)}
      />

      <div
        className="mx-auto max-w-[640px] px-5 pb-40 pt-20"
        style={{ minHeight: '100dvh', backgroundColor: 'var(--color-bg)' }}
      >
        <div className="mb-8">
          <h1
            className="font-display text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Component Preview
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Living showcase · Phase 3 components
          </p>
        </div>

        {/* ── Progress controls ── */}
        <Section title="LessonProgressHeader">
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <p className="mb-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Stage <strong>{stageIndex + 1}</strong> of 5 — click &ldquo;Continuar&rdquo; below to advance
            </p>
            <div className="flex gap-2">
              {STAGES_ORDER.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setStageIndex(i)}
                  className="rounded-lg px-3 py-1 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: stageIndex === i ? 'var(--color-primary)' : 'var(--color-surface-raised)',
                    color: stageIndex === i ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Audio Button ── */}
        <Section title="AudioPlayerButton">
          <div
            className="flex items-center gap-6 rounded-2xl p-5"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <AudioPlayerButton text="bonjour" language="fr" size={size} />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {size}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Clickable Sentence ── */}
        <Section title="ClickableSentence — tap a word">
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <ClickableSentence
              text={HOOK_SENTENCE}
              newVocabulary={NEW_VOCAB}
              onWordClick={handleWordClick}
            />
            <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Amber words = new vocabulary. Tap any word to open the bottom sheet.
            </p>
          </div>
        </Section>

        {/* ── Grammar Bridge ── */}
        <Section title="GrammarBridgeCard">
          <GrammarBridgeCard
            bridge={{
              insight: 'Em francês, usamos "Je voudrais" (condicional de vouloir) para fazer pedidos educados.',
              bridge: {
                portuguese: 'Eu gostaria de um café.',
                target: 'Je voudrais un café.',
                difference: 'Mesma estrutura condicional, mesma função de polidez.',
              },
              dialogueExample: {
                target: "Je voudrais un café, s'il vous plaît.",
                portuguese: 'Eu gostaria de um café, por favor.',
              },
              additionalExamples: [],
            }}
            language="fr"
          />
        </Section>

        {/* ── Visual Vocab Cards ── */}
        <Section title="VisualVocabCard (placeholder — no image)">
          <div className="flex flex-col gap-4">
            {VOCAB_CARDS.map((card) => (
              <VisualVocabCard key={card.word} {...card} />
            ))}
          </div>
        </Section>

        {/* ── CheckButton state picker ── */}
        <Section title="CheckButton (interactive)">
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <p className="mb-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              State:{' '}
              <code
                className="rounded px-1.5 py-0.5 text-xs"
                style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-vocab)' }}
              >
                {checkState}
              </code>
            </p>
            <div className="flex flex-wrap gap-2">
              {(['idle', 'disabled', 'correct', 'incorrect'] as CheckButtonState[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setCheckState(s)}
                  className="rounded-lg px-3 py-1 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: checkState === s ? 'var(--color-primary)' : 'var(--color-surface-raised)',
                    color: checkState === s ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* Fixed CheckButton */}
      <CheckButton
        state={checkState}
        correctAnswer={checkState === 'incorrect' ? "Je voudrais un café." : undefined}
        hint={checkState === 'incorrect' ? 'Use o condicional "voudrais" para pedidos educados.' : undefined}
        onCheck={handleCheck}
        onContinue={handleContinue}
      />

      {/* Translation bottom sheet */}
      <TranslationTooltip
        isOpen={tooltip.isOpen}
        word={tooltip.word}
        translation={tooltip.translation}
        explanation={tooltip.explanation}
        example={tooltip.example}
        language="fr"
        isLoading={tooltip.isLoading}
        onClose={() => setTooltip((t) => ({ ...t, isOpen: false }))}
      />
    </>
  );
}
