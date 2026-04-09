'use client';

import { useState } from 'react';
import { ChevronDown, Volume2 } from 'lucide-react';
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
          <div className="mx-1 p-4 rounded-xl bg-orange-50/50 border border-orange-200/50 flex items-start gap-3">
             <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs">⚠️</div>
             <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-orange-600">Radar de Erro</span>
                <p className="text-xs font-medium text-orange-900 leading-relaxed">{brazilianTrap}</p>
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
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">{p.target}</p>
                  <p className="text-[10px] italic text-[var(--color-text-secondary)] opacity-70">{p.portuguese}</p>
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
