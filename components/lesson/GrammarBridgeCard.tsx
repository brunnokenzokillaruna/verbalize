'use client';

import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { AudioPlayerButton } from './AudioPlayerButton';
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
  if (data.insight || data.items || data.bridge || data.brazilianTrap || data.patterns) {
    return {
      insight: data.insight ?? null,
      explanation: data.explanation ?? null,
      bridge: data.bridge ?? null,
      items: data.items ?? null,
      dialogueExample: data.dialogueExample ?? null,
      additionalExamples: data.additionalExamples ?? [],
      brazilianTrap: data.brazilianTrap ?? null,
      usageContext: data.usageContext ?? null,
      patterns: data.patterns ?? null,
      verbSpotlight: data.verbSpotlight ?? null,
    };
  }
  // Legacy format...
  return {
    insight: data.rule ?? '',
    explanation: null,
    bridge: null,
    items: null,
    dialogueExample:
      data.targetExample && data.portugueseComparison
        ? { target: data.targetExample, portuguese: data.portugueseComparison }
        : null,
    additionalExamples: data.additionalExamples ?? [],
    brazilianTrap: null,
    usageContext: null,
    patterns: null,
    verbSpotlight: null,
  };
}

function HighlightedText({ text, className }: { text: string; className: string }) {
  const parts = text.split(/\^\^/g);
  return (
    <>
      {parts.map((part, i) => (
        i % 2 === 1 ? (
          <span key={i} className={className}>
            {part}
          </span>
        ) : (
          part
        )
      ))}
    </>
  );
}

export function GrammarBridgeCard({ bridge, language }: GrammarBridgeCardProps) {
  const [showMore, setShowMore] = useState(false);
  const [showConjugation, setShowConjugation] = useState(false);
  const normalized = normalizeGrammarBridge(bridge);
  const {
    insight,
    explanation,
    bridge: bridgeRow,
    items,
    dialogueExample,
    additionalExamples,
    brazilianTrap,
    usageContext,
    patterns,
    verbSpotlight,
  } = normalized;

  return (
    <div
      className="group/card relative rounded-[1.5rem] overflow-hidden transition-all duration-500 shadow-sm"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex flex-col p-5 gap-7">
        {/* Header: Insight + Usage Context */}
        <div className="flex flex-col gap-4">
          {usageContext && (
            <div className="flex">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--color-primary-light)]/30 text-[var(--color-primary)] border border-[var(--color-primary)]/10">
                {usageContext}
              </span>
            </div>
          )}
          
          {insight ? (
            <div className="relative overflow-hidden rounded-xl p-5 transition-all duration-300 bg-[var(--color-primary-light)]/40 border border-[var(--color-primary)]/10">
              <div className="relative flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-xl shadow-sm">
                  💡
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)] opacity-70">A Sacada</span>
                  <p className="font-display text-lg font-bold leading-snug text-[var(--color-primary-dark)]">
                    {insight}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Explanation */}
        {explanation ? (
          <div className="px-1 flex flex-col gap-4">
            {Array.isArray(explanation) ? (
              explanation.map((item, idx) => (
                <div 
                  key={idx} 
                  className="relative p-4 rounded-2xl bg-[var(--color-surface-raised)]/50 border border-[var(--color-border)]/50 transition-all hover:bg-[var(--color-surface-raised)]"
                >
                  <div className="absolute -left-1 top-4 w-2 h-6 bg-[var(--color-primary)] rounded-full opacity-50 shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.3)]" />
                  <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {item}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] opacity-90">
                {explanation}
              </p>
            )}
          </div>
        ) : null}

        {/* Brazilian Trap (Radar de Erro) */}
        {brazilianTrap && (
          <div
            className="mx-1 p-4 rounded-xl flex items-start gap-3"
            style={{
              backgroundColor: 'var(--color-warning-bg)',
              border: '1px solid var(--color-warning-border)',
            }}
          >
             <div
               className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs"
               style={{ backgroundColor: 'var(--color-warning-border)', color: 'var(--color-warning)' }}
             >⚠️</div>
             <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-warning)' }}>Radar de Erro</span>
                <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>{brazilianTrap}</p>
             </div>
          </div>
        )}

        {/* Pattern Strips */}
        {patterns && patterns.length > 0 && (
          <div className="flex flex-col gap-3">
            <h4 className="px-1 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Padrões de Uso</h4>
            <div className="grid grid-cols-2 gap-2">
              {patterns.map((p, i) => (
                <div key={i} className="p-3 rounded-xl bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)] flex flex-col gap-1">
                  <span className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase">{p.label}</span>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">
                    <HighlightedText text={p.target} className="bg-[var(--color-primary)] text-white px-1 rounded" />
                  </p>
                  <p className="text-[10px] italic text-[var(--color-text-secondary)] opacity-70">
                    <HighlightedText text={p.portuguese} className="text-[var(--color-text-primary)] font-bold not-italic" />
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* The Core: Structured Items or Bridge */}
        {items && items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col overflow-hidden rounded-xl bg-[var(--color-bg)] ring-1 ring-[var(--color-border)] transition-all hover:ring-[var(--color-primary)]/30"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 text-[10px] font-black tracking-tighter text-[var(--color-primary)] opacity-60">
                      {LANG_LABEL[language]}
                    </span>
                    <p className="font-display text-base font-bold tracking-tight text-[var(--color-text-primary)] truncate">
                      {item.target}
                    </p>
                  </div>
                  <AudioPlayerButton text={item.target} language={language} size="sm" />
                </div>
                
                <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--color-surface-raised)]/50 border-t border-[var(--color-border)]/50">
                  <span className="shrink-0 text-[10px] font-black tracking-tighter text-[var(--color-text-muted)] opacity-50">
                    PT
                  </span>
                  <p className="text-xs italic text-[var(--color-text-secondary)] truncate">
                    {item.portuguese}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : bridgeRow ? (
          <div className="flex flex-col rounded-2xl overflow-hidden ring-1 ring-[var(--color-border)] shadow-sm">
            {/* Source */}
            <div className="flex items-center gap-4 p-4 bg-[var(--color-surface-raised)]/30">
               <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest w-12 shrink-0">PT</span>
               <p className="text-sm font-medium italic text-[var(--color-text-secondary)]">
                 <HighlightedText text={bridgeRow.portuguese} className="text-[var(--color-text-primary)] font-bold not-italic decoration-[var(--color-primary)]/30 underline underline-offset-4 decoration-2" />
               </p>
            </div>
            
            {/* Comparison Divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />

            {/* Target */}
            <div className="flex items-center justify-between gap-4 p-5 bg-[var(--color-primary-light)]/20">
               <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest w-12 shrink-0">{LANG_LABEL[language]}</span>
                  <p className="font-display text-xl font-bold tracking-tight text-[var(--color-primary-dark)]">
                    <HighlightedText text={bridgeRow.target} className="bg-[var(--color-primary)] text-white px-1.5 py-0.5 rounded-md shadow-sm" />
                  </p>
               </div>
               <AudioPlayerButton text={bridgeRow.target.replace(/\^\^/g, '')} language={language} size="sm" />
            </div>

            {/* Difference */}
            <div className="p-4 bg-[var(--color-surface)] border-t border-[var(--color-border)]/50">
               <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)] flex items-start gap-2">
                 <span className="text-[var(--color-primary)] font-bold text-lg leading-none">●</span>
                 {bridgeRow.difference}
               </p>
            </div>
          </div>
        ) : null}

        {/* Verb Spotlight (only for VERB lessons) */}
        {verbSpotlight && verbSpotlight.infinitive ? (
          <div
            className="relative overflow-hidden rounded-2xl shadow-sm border border-[var(--color-primary)]/20"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-surface) 100%)',
            }}
          >
            {/* Hero header */}
            <div className="flex items-start gap-4 p-5 border-b border-[var(--color-border)]/40">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-md">
                <Sparkles size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] opacity-70">
                  O Verbo em Destaque
                </span>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h3 className="font-display text-2xl font-black tracking-tight text-[var(--color-primary-dark)]">
                    {verbSpotlight.infinitive}
                  </h3>
                  <span className="text-sm italic text-[var(--color-text-secondary)]">
                    = {verbSpotlight.meaning}
                  </span>
                </div>
                <AudioPlayerButton text={verbSpotlight.infinitive} language={language} size="sm" />
              </div>
            </div>

            {/* Personality + frequency */}
            <div className="flex flex-col gap-3 p-5">
              {verbSpotlight.personality && (
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {verbSpotlight.personality}
                </p>
              )}
              {verbSpotlight.frequencyNote && (
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                  <p className="text-xs font-semibold text-[var(--color-primary-dark)]">
                    {verbSpotlight.frequencyNote}
                  </p>
                </div>
              )}
            </div>

            {/* Idiomatic expressions */}
            {verbSpotlight.idiomaticExpressions && verbSpotlight.idiomaticExpressions.length > 0 && (
              <div className="flex flex-col gap-2 px-5 pb-5">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                  Expressões Fixas
                </h4>
                <div className="flex flex-col gap-2">
                  {verbSpotlight.idiomaticExpressions.map((expr, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-xl p-3 bg-[var(--color-surface)] border border-[var(--color-border)]/60"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-sm font-bold italic text-[var(--color-text-primary)] truncate">
                          {expr.target}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-muted)] italic truncate">
                          {expr.portuguese}
                        </p>
                      </div>
                      <AudioPlayerButton text={expr.target} language={language} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conjugation peek (collapsible) */}
            {verbSpotlight.conjugationPreview && verbSpotlight.conjugationPreview.length > 0 && (
              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={() => setShowConjugation((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)]/60 hover:border-[var(--color-primary)]/40 transition-all"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                    {showConjugation ? 'Ocultar conjugação' : 'Ver conjugação no presente'}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-[var(--color-text-muted)] transition-transform duration-300 ${showConjugation ? 'rotate-180' : ''}`}
                  />
                </button>

                {showConjugation && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-[var(--color-border)]/60 bg-[var(--color-surface)] animate-in fade-in slide-in-from-top-2 duration-300">
                    {verbSpotlight.conjugationPreview.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-2.5"
                        style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}
                      >
                        <span className="w-20 shrink-0 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wide">
                          {c.pronoun}
                        </span>
                        <span className="flex-1 font-display text-sm font-bold text-[var(--color-primary-dark)]">
                          {c.form}
                        </span>
                        <AudioPlayerButton text={c.form} language={language} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Contexto Real */}
        {dialogueExample ? (
          <div className="flex flex-col gap-3 pt-2">
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] text-center">Contexto Real do Diálogo</h4>
            <div className="relative rounded-xl bg-[var(--color-bg)] p-4 shadow-sm ring-1 ring-[var(--color-border)] transition-all duration-500 hover:shadow-md">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                   <p className="text-base font-bold italic tracking-tight text-[var(--color-text-primary)]">
                    &ldquo;{dialogueExample.target}&rdquo;
                  </p>
                  <p className="text-xs font-medium italic text-[var(--color-text-muted)]">
                    {dialogueExample.portuguese}
                  </p>
                </div>
                <AudioPlayerButton text={dialogueExample.target} language={language} size="sm" />
              </div>
            </div>
          </div>
        ) : null}

        {/* Additional Examples */}
        {additionalExamples.length > 0 ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setShowMore((prev) => !prev)}
              className="flex items-center justify-center gap-2 group/btn py-2"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] group-hover/btn:text-[var(--color-primary)] transition-colors">
                {showMore ? 'Ocultar exemplos' : `Ver +${additionalExamples.length} exemplos extras`}
              </span>
              <ChevronDown
                size={14}
                className={`text-[var(--color-text-muted)] transition-transform duration-300 ${showMore ? 'rotate-180' : ''}`}
              />
            </button>

            {showMore && (
              <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                 {additionalExamples.map((ex, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-sm flex items-center justify-between gap-4"
                    >
                      <div className="flex flex-col gap-1.5">
                        <p className="text-sm font-semibold italic text-[var(--color-text-primary)] leading-relaxed">{ex.target}</p>
                        <p className="text-xs text-[var(--color-text-muted)] italic">{ex.portuguese}</p>
                      </div>
                      <AudioPlayerButton text={ex.target} language={language} size="sm" />
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
