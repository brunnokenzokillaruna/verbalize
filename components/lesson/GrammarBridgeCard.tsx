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
      survivalTip: data.survivalTip ?? null,
      culturalNote: data.culturalNote ?? null,
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
    survivalTip: null,
    culturalNote: null,
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

function getConjugationAudioText(pronoun: string, form: string): string {
  // Split by slashes or pipes (in case there are multiple pronouns like il/elle/on)
  const pronounParts = pronoun.split(/[\/|]/);
  
  const cleanParts = pronounParts.map(part => {
    let clean = part.trim();
    // Remove parenthesis like (pl.)
    clean = clean.replace(/\s*\(.+?\)\s*/g, '');
    
    // Lowercase unless it is the English "I"
    if (clean.toUpperCase() === 'I') {
      return 'I';
    }
    return clean.toLowerCase();
  });
  
  // Join parts with a comma (creating a natural brief pause in TTS) and combine with the form
  const cleanPronoun = cleanParts.join(', ');
  return `${cleanPronoun} ${form}`;
}

export function GrammarBridgeCard({ bridge, language }: GrammarBridgeCardProps) {
  const [activeTab, setActiveTab] = useState<'logic' | 'practice' | 'context'>('logic');
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
    survivalTip,
    culturalNote,
  } = normalized;

  return (
    <div
      className="group/card relative rounded-[1.5rem] overflow-hidden transition-all duration-500 shadow-md flex flex-col gap-0 animate-slide-up-spring"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* 🧭 PREMIUM TABS / SEGMENTED CONTROL */}
      <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/40 p-2 gap-1.5 relative z-10">
        <button
          type="button"
          onClick={() => setActiveTab('logic')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-black tracking-wide uppercase transition-all duration-300 ${
            activeTab === 'logic'
              ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm ring-1 ring-[var(--color-border)]/50'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]/20'
          }`}
        >
          <span>💡</span> A Lógica
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('practice')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-black tracking-wide uppercase transition-all duration-300 ${
            activeTab === 'practice'
              ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm ring-1 ring-[var(--color-border)]/50'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]/20'
          }`}
        >
          <span>🎯</span> Na Prática
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('context')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-black tracking-wide uppercase transition-all duration-300 ${
            activeTab === 'context'
              ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm ring-1 ring-[var(--color-border)]/50'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]/20'
          }`}
        >
          <span>💬</span> Contexto Real
        </button>
      </div>

      {/* 📦 CONTENT CONTAINER WITH DYNAMIC ANIMATIONS */}
      <div className="flex flex-col p-5 gap-6 relative min-h-[300px]">
        
        {/* ==================== 💡 TAB: LOGIC ==================== */}
        {activeTab === 'logic' && (
          <div className="flex flex-col gap-6 animate-slide-up-spring">
            {/* Header / Usage vibe */}
            {usageContext && (
              <div className="flex self-start">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--color-primary-light)]/30 text-[var(--color-primary)] border border-[var(--color-primary)]/15">
                  ✦ {usageContext}
                </span>
              </div>
            )}

            {/* A Sacada (Insight) */}
            {insight && (
              <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[var(--color-primary-light)]/20 to-[var(--color-primary-light)]/5 border border-[var(--color-primary)]/10 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.005]">
                <div className="relative flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white text-xl shadow-md shadow-[var(--color-primary)]/10">
                    💡
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)] opacity-85">A Sacada Central</span>
                    <p className="font-display text-base font-bold leading-snug text-[var(--color-text-primary)]">
                      {insight}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Glassmorphic Explanations */}
            {explanation && (
              <div className="flex flex-col gap-4">
                {Array.isArray(explanation) ? (
                  explanation.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="relative p-5 rounded-2xl bg-[var(--color-surface-raised)]/35 border border-[var(--color-border)]/40 backdrop-blur-md transition-all duration-300 hover:bg-[var(--color-surface-raised)]/60"
                    >
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-[var(--color-primary)] rounded-r-full shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.4)]" />
                      <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        {item}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="relative p-5 rounded-2xl bg-[var(--color-surface-raised)]/35 border border-[var(--color-border)]/40 backdrop-blur-md transition-all duration-300 hover:bg-[var(--color-surface-raised)]/60">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-[var(--color-primary)] rounded-r-full shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.4)]" />
                    <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {explanation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Cyberpunk Radar de Erro (Brazilian Trap) */}
            {brazilianTrap && (
              <div
                className="relative overflow-hidden p-5 rounded-2xl flex items-start gap-4 border shadow-[0_0_20px_rgba(245,158,11,0.03)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(245,158,11,0.12)] group"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.03)',
                  borderColor: 'rgba(245, 158, 11, 0.25)',
                }}
              >
                {/* Animated glowing backdrop */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg shadow-sm border border-amber-500/20 relative"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
                >
                  <span className="absolute inset-0 rounded-xl bg-amber-500/10 animate-ping opacity-60 pointer-events-none" />
                  ⚠️
                </div>
                <div className="flex flex-col gap-1 relative z-10">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: '#f59e0b' }}>Radar de Erro</span>
                  <p className="text-xs font-semibold leading-relaxed text-[var(--color-text-secondary)]">{brazilianTrap}</p>
                </div>
              </div>
            )}

            {/* Survival Tip & Cultural Note Cards */}
            {(survivalTip || culturalNote) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {survivalTip && (
                  <div className="p-4 rounded-2xl bg-[var(--color-primary-light)]/10 border border-[var(--color-primary)]/10 flex items-start gap-3 transition-all duration-300 hover:scale-[1.01]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-light)]/30 text-base shadow-inner">
                      🛡️
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--color-primary)]">Dica de Sobrevivência</span>
                      <p className="text-[11px] font-semibold leading-relaxed text-[var(--color-text-primary)]">
                        {survivalTip}
                      </p>
                    </div>
                  </div>
                )}
                {culturalNote && (
                  <div className="p-4 rounded-2xl bg-[var(--color-success-light)]/10 border border-[var(--color-success)]/10 flex items-start gap-3 transition-all duration-300 hover:scale-[1.01]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-success-light)]/30 text-base shadow-inner">
                      🌍
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--color-success)]">Toque Cultural</span>
                      <p className="text-[11px] font-semibold leading-relaxed text-[var(--color-text-primary)]">
                        {culturalNote}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== 🎯 TAB: PRACTICE ==================== */}
        {activeTab === 'practice' && (
          <div className="flex flex-col gap-6 animate-slide-up-spring">
            
            {/* Side-by-Side Split-Screen Bridge */}
            {bridgeRow && (
              <div className="flex flex-col gap-3">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] text-center">Mapeamento da Ponte</h4>
                <div className="flex flex-col md:flex-row items-stretch rounded-2xl overflow-hidden ring-1 ring-[var(--color-border)] shadow-sm bg-[var(--color-surface-raised)]/10">
                  {/* PT-BR Side */}
                  <div className="flex-1 flex flex-col justify-between p-5 bg-[var(--color-surface-raised)]/20 relative border-b md:border-b-0 md:border-r border-[var(--color-border)]/50">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded bg-[var(--color-text-muted)]/15 text-[9px] font-black text-[var(--color-text-secondary)] uppercase tracking-wider">PT-BR</span>
                    </div>
                    <p className="text-sm font-semibold italic text-[var(--color-text-secondary)] leading-relaxed">
                      <HighlightedText text={bridgeRow.portuguese} className="text-[var(--color-primary)] font-black not-italic decoration-[var(--color-primary)]/40 underline underline-offset-4 decoration-2" />
                    </p>
                  </div>

                  {/* Target Side */}
                  <div className="flex-1 flex flex-col justify-between p-5 bg-[var(--color-primary-light)]/10 relative">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="px-2 py-0.5 rounded bg-[var(--color-primary)]/15 text-[9px] font-black text-[var(--color-primary)] uppercase tracking-wider">{LANG_LABEL[language]}</span>
                      <AudioPlayerButton text={bridgeRow.target.replace(/\^\^/g, '')} language={language} size="sm" />
                    </div>
                    <p className="font-display text-lg font-black tracking-tight text-[var(--color-primary-dark)] leading-relaxed">
                      <HighlightedText text={bridgeRow.target} className="bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-lg shadow-sm font-bold" />
                    </p>
                  </div>
                </div>
                
                {/* Difference Section */}
                {bridgeRow.difference && (
                  <div className="p-4 rounded-xl bg-[var(--color-surface-raised)]/35 border border-[var(--color-border)] flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-1.5 shadow-[0_0_8px_var(--color-primary)]" />
                    <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)] font-medium">
                      {bridgeRow.difference}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Grid of Pattern Strips */}
            {patterns && patterns.length > 0 && !verbSpotlight && (
              <div className="flex flex-col gap-3">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Padrões de Uso</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {patterns.map((p, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]/60 flex flex-col gap-1.5 transition-all duration-300 hover:border-[var(--color-primary)]/30 hover:scale-[1.01] hover:bg-[var(--color-surface-raised)]/55">
                      <span className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{p.label}</span>
                      <p className="text-base font-black text-[var(--color-text-primary)]">
                        <HighlightedText text={p.target} className="bg-[var(--color-primary)] text-white px-1.5 py-0.5 rounded" />
                      </p>
                      <p className="text-xs italic text-[var(--color-text-secondary)] opacity-85">
                        <HighlightedText text={p.portuguese} className="text-[var(--color-text-primary)] font-bold not-italic" />
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Core structured items */}
            {items && items.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Expressões Chave</h4>
                <div className="grid grid-cols-1 gap-3">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col overflow-hidden rounded-2xl bg-[var(--color-surface-raised)]/20 border border-[var(--color-border)] transition-all duration-300 hover:border-[var(--color-primary)]/30"
                    >
                      <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="shrink-0 text-[10px] font-black tracking-wider text-[var(--color-primary)] bg-[var(--color-primary-light)]/30 px-1.5 py-0.5 rounded uppercase">
                            {LANG_LABEL[language]}
                          </span>
                          <p className="font-display text-base font-bold tracking-tight text-[var(--color-text-primary)] truncate">
                            {item.target}
                          </p>
                        </div>
                        <AudioPlayerButton text={item.target} language={language} size="sm" />
                      </div>
                      
                      <div className="flex items-center gap-4 px-5 py-3 bg-[var(--color-surface-raised)]/40 border-t border-[var(--color-border)]/50">
                        <span className="shrink-0 text-[10px] font-black tracking-wider text-[var(--color-text-muted)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-1.5 py-0.5 rounded uppercase">
                          PT
                        </span>
                        <p className="text-xs italic text-[var(--color-text-secondary)] truncate">
                          {item.portuguese}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verb Spotlight */}
            {verbSpotlight && verbSpotlight.infinitive && (
              <div
                className="relative overflow-hidden rounded-3xl border border-[var(--color-primary)]/20 shadow-sm animate-slide-up-spring"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-surface) 100%)',
                }}
              >
                {/* Hero header */}
                <div className="flex items-start gap-4 p-5 border-b border-[var(--color-border)]/40">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/15">
                    <Sparkles size={22} strokeWidth={2.5} className="animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--color-primary)] opacity-85">
                      O Verbo em Destaque
                    </span>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h3 className="font-display text-2xl font-black tracking-tight text-[var(--color-primary-dark)]">
                        {verbSpotlight.infinitive}
                      </h3>
                      <span className="text-sm font-semibold italic text-[var(--color-text-secondary)]">
                        = {verbSpotlight.meaning}
                      </span>
                    </div>
                    <AudioPlayerButton text={verbSpotlight.infinitive} language={language} size="sm" />
                  </div>
                </div>

                {/* Personality + frequency */}
                <div className="flex flex-col gap-3 p-5">
                  {verbSpotlight.personality && (
                    <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] font-medium">
                      {verbSpotlight.personality}
                    </p>
                  )}
                  {verbSpotlight.frequencyNote && (
                    <div className="flex items-center gap-2 bg-[var(--color-primary-light)]/20 px-3 py-1.5 rounded-xl border border-[var(--color-primary)]/10 self-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-ping" />
                      <p className="text-xs font-bold text-[var(--color-primary-dark)]">
                        {verbSpotlight.frequencyNote}
                      </p>
                    </div>
                  )}
                </div>

                {/* Idiomatic expressions */}
                {verbSpotlight.idiomaticExpressions && verbSpotlight.idiomaticExpressions.length > 0 && (
                  <div className="flex flex-col gap-3 px-5 pb-5">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                      Expressões Fixas Reais
                    </h4>
                    <div className="flex flex-col gap-2">
                      {verbSpotlight.idiomaticExpressions.map((expr, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 rounded-2xl p-4 bg-[var(--color-surface)] border border-[var(--color-border)]/60 transition-all duration-300 hover:border-[var(--color-primary)]/20 hover:scale-[1.01]"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <p className="text-sm font-bold italic text-[var(--color-text-primary)] truncate">
                              {expr.target}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] italic truncate">
                              {expr.portuguese}
                            </p>
                          </div>
                          <AudioPlayerButton text={expr.target} language={language} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conjugation peek */}
                {verbSpotlight.conjugationPreview && verbSpotlight.conjugationPreview.length > 0 && (
                  <div className="px-5 pb-5 flex flex-col gap-3">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                      Conjugação no Presente
                    </h4>
                    <div className="rounded-2xl overflow-hidden border border-[var(--color-border)]/60 bg-[var(--color-surface)] shadow-sm">
                      {verbSpotlight.conjugationPreview.map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--color-surface-raised)]/20"
                          style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}
                        >
                          <span className="w-24 shrink-0 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                            {c.pronoun}
                          </span>
                          <span className="flex-1 font-display text-sm font-bold text-[var(--color-primary-dark)]">
                            {c.form}
                          </span>
                          <AudioPlayerButton text={getConjugationAudioText(c.pronoun, c.form)} language={language} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== 💬 TAB: CONTEXT ==================== */}
        {activeTab === 'context' && (
          <div className="flex flex-col gap-6 animate-slide-up-spring">
            
            {/* Real dialogue example with blockquote quote border decoration */}
            {dialogueExample && (
              <div className="flex flex-col gap-3">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] text-center">Frase Real do Diálogo</h4>
                <div className="relative rounded-2xl bg-[var(--color-surface-raised)]/20 p-6 border border-[var(--color-border)]/80 shadow-inner overflow-hidden transition-all duration-300">
                  {/* Watermark Quote Icon */}
                  <div className="absolute -right-4 -bottom-8 text-8xl font-serif text-[var(--color-border)]/35 pointer-events-none select-none">
                    ”
                  </div>
                  <div className="flex items-center justify-between gap-5 relative z-10">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-lg font-bold italic tracking-tight text-[var(--color-text-primary)] leading-relaxed">
                        &ldquo;{dialogueExample.target}&rdquo;
                      </p>
                      <p className="text-sm font-medium italic text-[var(--color-text-muted)]">
                        {dialogueExample.portuguese}
                      </p>
                    </div>
                    <AudioPlayerButton text={dialogueExample.target} language={language} size="sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Additional examples formatted as conversation bubbles */}
            {additionalExamples && additionalExamples.length > 0 && (
              <div className="flex flex-col gap-4">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Conversas Extras</h4>
                <div className="flex flex-col gap-5 rounded-3xl bg-[var(--color-surface-raised)]/10 p-5 border border-[var(--color-border)]/45">
                  {additionalExamples.map((ex, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      {/* Target Language Bubble (Left) */}
                      <div className="flex items-end gap-2.5 self-start max-w-[85%]">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold shadow-sm shrink-0">
                          {LANG_LABEL[language]}
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl rounded-bl-none bg-[var(--color-primary-light)]/20 px-4 py-3 border border-[var(--color-primary)]/10 relative shadow-sm">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-relaxed">{ex.target}</p>
                          <AudioPlayerButton text={ex.target} language={language} size="sm" />
                        </div>
                      </div>
                      
                      {/* Translation Bubble (Right) */}
                      <div className="flex items-end gap-2.5 self-end max-w-[85%]">
                        <div className="flex items-center rounded-2xl rounded-br-none bg-[var(--color-surface)] px-4 py-3 border border-[var(--color-border)]/80 shadow-sm">
                          <p className="text-xs text-[var(--color-text-muted)] italic leading-relaxed">{ex.portuguese}</p>
                        </div>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[9px] font-black text-[var(--color-text-muted)] shadow-sm shrink-0">
                          PT
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
