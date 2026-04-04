'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { GrammarBridgeResult, SupportedLanguage } from '@/types';

interface GrammarBridgeCardProps {
  bridge: GrammarBridgeResult;
  language: SupportedLanguage;
}

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'FR',
  en: 'EN',
};

function normalizeGrammarBridge(data: GrammarBridgeResult) {
  // New structured format
  if (data.insight && data.bridge && data.dialogueExample) {
    return {
      insight: data.insight,
      explanation: data.explanation ?? null,
      bridge: data.bridge,
      dialogueExample: data.dialogueExample,
      additionalExamples: data.additionalExamples ?? [],
    };
  }
  // Legacy format: reconstruct from flat fields
  return {
    insight: data.rule ?? '',
    explanation: null,
    bridge: null,
    dialogueExample:
      data.targetExample && data.portugueseComparison
        ? { target: data.targetExample, portuguese: data.portugueseComparison }
        : null,
    additionalExamples: data.additionalExamples ?? [],
  };
}

export function GrammarBridgeCard({ bridge, language }: GrammarBridgeCardProps) {
  const [showMore, setShowMore] = useState(false);
  const normalized = normalizeGrammarBridge(bridge);
  const { insight, explanation, bridge: bridgeRow, dialogueExample, additionalExamples } = normalized;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bridge-bg)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-5 py-3"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <span style={{ fontSize: '18px' }} role="img" aria-label="Ponte gramatical">
          🌉
        </span>
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'var(--color-bridge)' }}
        >
          Ponte Gramatical
        </span>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {/* 1. Insight pill */}
        {insight ? (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              borderLeft: '3px solid var(--color-primary)',
            }}
          >
            <span className="shrink-0 text-lg" role="img" aria-label="Ideia">
              💡
            </span>
            <p
              className="text-sm font-semibold leading-relaxed"
              style={{ color: 'var(--color-primary-dark)' }}
            >
              {insight}
            </p>
          </div>
        ) : null}

        {/* 2. Full explanation */}
        {explanation ? (
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {explanation}
          </p>
        ) : null}

        {/* 3. Bridge table (new format only) */}
        {bridgeRow ? (
          <div
            className="overflow-hidden rounded-xl"
            style={{ border: '1px solid var(--color-border)' }}
          >
            {/* PT-BR row */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span className="shrink-0 text-lg">🇧🇷</span>
              <p
                className="text-base"
                style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}
              >
                {bridgeRow.portuguese}
              </p>
            </div>

            {/* Target language row */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span
                className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-text-inverse)',
                }}
              >
                {LANG_LABEL[language]}
              </span>
              <p
                className="text-base font-medium"
                style={{ color: 'var(--color-primary-dark)', fontStyle: 'italic' }}
              >
                {bridgeRow.target}
              </p>
            </div>

            {/* Difference row */}
            <div className="px-4 py-2.5" style={{ backgroundColor: 'var(--color-bridge-bg)' }}>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {bridgeRow.difference}
              </p>
            </div>
          </div>
        ) : null}

        {/* 4. "No diálogo" example */}
        {dialogueExample ? (
          <div>
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--color-text-muted)' }}
            >
              No diálogo
            </p>
            <div
              className="rounded-xl pl-4 pr-4 py-3"
              style={{
                borderLeft: '3px solid var(--color-bridge)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              <p
                className="text-base font-medium"
                style={{ color: 'var(--color-primary-dark)', fontStyle: 'italic' }}
              >
                &ldquo;{dialogueExample.target}&rdquo;
              </p>
              <p
                className="mt-1 text-sm"
                style={{ color: 'var(--color-bridge)', fontStyle: 'italic' }}
              >
                {dialogueExample.portuguese}
              </p>
            </div>
          </div>
        ) : null}

        {/* 5. Expandable additional examples */}
        {additionalExamples.length > 0 ? (
          <div>
            <button
              type="button"
              onClick={() => setShowMore((prev) => !prev)}
              className="flex w-full items-center justify-between py-1 text-xs font-semibold uppercase tracking-widest transition-opacity active:opacity-70"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <span>Mais exemplos</span>
              <ChevronDown
                size={16}
                style={{
                  transform: showMore ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms ease',
                  color: 'var(--color-text-muted)',
                }}
              />
            </button>

            {showMore && (
              <div className="mt-2 flex flex-col gap-2">
                {additionalExamples.map((ex, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-xl"
                    style={{ border: '1px solid var(--color-border)' }}
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-2.5"
                      style={{ backgroundColor: 'var(--color-primary-light)' }}
                    >
                      <span
                        className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-text-inverse)',
                        }}
                      >
                        {LANG_LABEL[language]}
                      </span>
                      <p
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-primary-dark)', fontStyle: 'italic' }}
                      >
                        {ex.target}
                      </p>
                    </div>
                    <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />
                    <div
                      className="flex items-center gap-3 px-4 py-2.5"
                      style={{ backgroundColor: 'var(--color-surface)' }}
                    >
                      <span className="shrink-0 text-base">🇧🇷</span>
                      <p
                        className="text-sm"
                        style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}
                      >
                        {ex.portuguese}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
