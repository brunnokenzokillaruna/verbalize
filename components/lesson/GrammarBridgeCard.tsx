'use client';

import { useState, useCallback } from 'react';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { AudioPlayerButton } from './AudioPlayerButton';
import { ClickableSentence } from './ClickableSentence';
import type { WordClickPayload } from './ClickableWord';
import type { GrammarBridgeResult, SupportedLanguage } from '@/types';
import { normalizeGrammarBridgeResult } from '@/lib/schemas/grammarBridge';
import { getConjugationAudioText, normalizeConjugationPreview } from '@/utils/conjugationHelper';

interface GrammarBridgeCardProps {
  bridge: GrammarBridgeResult;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
}

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'FR',
  en: 'EN',
};

type TabId = 'understand' | 'practice';

function stripHighlights(text: string): string {
  return text.replace(/\^\^/g, '');
}

function HighlightedText({ text, className }: { text: string; className: string }) {
  const parts = text.split(/\^\^/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className={className}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

function TargetPhrase({
  text,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
  className = '',
  highlightClassName,
}: {
  text: string;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
  className?: string;
  highlightClassName?: string;
}) {
  const clean = stripHighlights(text);
  const hasHighlights = text.includes('^^');

  if (onWordClick) {
    return (
      <ClickableSentence
        text={clean}
        newVocabulary={newVocabulary}
        newVerbs={newVerbs}
        onWordClick={onWordClick}
        className={className}
      />
    );
  }

  if (hasHighlights && highlightClassName) {
    return (
      <p className={className}>
        <HighlightedText text={text} className={highlightClassName} />
      </p>
    );
  }

  return <p className={className}>{clean}</p>;
}

function FormulaLine({ formula }: { formula: string }) {
  const parts = formula.split(/\s*\+\s*/);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {parts.map((part, i) => {
        const trimmedPart = part.trim();
        const isVar = trimmedPart.startsWith('[') && trimmedPart.endsWith(']');
        const cleanPart = isVar ? trimmedPart.slice(1, -1) : trimmedPart;

        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
                isVar
                  ? 'bg-[var(--color-primary-light)]/20 text-[var(--color-primary-dark)] border border-[var(--color-primary)]/15'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
              }`}
            >
              {cleanPart}
            </span>
            {i < parts.length - 1 && (
              <span className="text-[var(--color-text-muted)] font-black text-xs px-0.5">+</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function parseFormulaBranches(formula: string): Array<{ label?: string; formula: string }> {
  const branches = formula.split(/\s+(?:ou|\|)\s+/i).map((b) => b.trim()).filter(Boolean);
  if (branches.length <= 1) return [{ formula: formula.trim() }];
  return branches.map((b, i) => ({
    label: `Opção ${String.fromCharCode(65 + i)}`,
    formula: b,
  }));
}

function FormulaRenderer({
  structureFormula,
  structureFormulas,
}: {
  structureFormula?: string | null;
  structureFormulas?: Array<{ label: string; formula: string }> | null;
}) {
  const branches =
    structureFormulas && structureFormulas.length > 0
      ? structureFormulas
      : structureFormula
        ? parseFormulaBranches(structureFormula)
        : [];

  if (branches.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 bg-[var(--color-surface-raised)]/25 p-4 rounded-2xl border border-[var(--color-border)]/60">
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        Fórmula da Estrutura
      </span>
      <div className="flex flex-col gap-4 pt-1">
        {branches.map((branch, i) => (
          <div key={i} className="flex flex-col gap-2">
            {branch.label && branches.length > 1 && (
              <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wide">
                {branch.label}
              </span>
            )}
            <FormulaLine formula={branch.formula} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RetentionCheckCard({
  check,
}: {
  check: NonNullable<GrammarBridgeResult['retentionCheck']>;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/20">
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        Teste rápido
      </span>
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{check.question}</p>
      <div className="flex flex-col gap-2">
        {check.options.map((opt, i) => {
          const isCorrect = i === check.correctIndex;
          const showResult = selected !== null;
          const wasPicked = selected === i;

          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              disabled={selected !== null}
              className={[
                'rounded-xl px-4 py-3 text-left text-sm font-medium border transition-colors',
                showResult && isCorrect
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-[var(--color-text-primary)]'
                  : showResult && wasPicked && !isCorrect
                    ? 'border-red-500/30 bg-red-500/5 text-[var(--color-text-secondary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/30',
              ].join(' ')}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <p className="text-xs text-[var(--color-text-muted)]">
          {selected === check.correctIndex
            ? 'Isso mesmo! Você pegou a sacada.'
            : 'Quase! Releia a dica de sobrevivência acima.'}
        </p>
      )}
    </div>
  );
}

export function GrammarBridgeCard({
  bridge,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
}: GrammarBridgeCardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('understand');
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(['understand']));

  const normalized = normalizeGrammarBridgeResult(bridge);
  if (!normalized) return null;

  const {
    insight,
    explanation,
    bridge: bridgeRow,
    structureFormula,
    structureFormulas,
    items,
    dialogueExample,
    additionalExamples,
    brazilianTrap,
    usageContext,
    patterns,
    verbSpotlight,
    survivalTip,
    culturalNote,
    retentionCheck,
  } = normalized;

  const explanationItems: string[] = Array.isArray(explanation)
    ? explanation
    : explanation
      ? [explanation]
      : [];

  const normalizedPreview = verbSpotlight?.conjugationPreview
    ? normalizeConjugationPreview(verbSpotlight.conjugationPreview, language)
    : [];

  const markTabVisited = useCallback((tab: TabId) => {
    setVisitedTabs((prev) => new Set([...prev, tab]));
  }, []);

  const handleTabChange = (tab: TabId) => {
    markTabVisited(activeTab);
    setActiveTab(tab);
    markTabVisited(tab);
  };

  const trapSubtitle =
    typeof brazilianTrap === 'object' && brazilianTrap?.subtitle
      ? brazilianTrap.subtitle
      : 'Evite a tradução direta do português';

  return (
    <div
      className="group/card relative rounded-[1.5rem] overflow-hidden transition-all duration-500 shadow-md flex flex-col gap-0 animate-slide-up-spring"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex bg-[var(--color-surface-raised)]/60 p-1.5 rounded-2xl gap-1 relative z-10 border border-[var(--color-border)]/50 m-4 mb-2">
        {(
          [
            { id: 'understand' as const, icon: '💡', label: 'Entender' },
            { id: 'practice' as const, icon: '🎯', label: 'Ver na prática' },
          ] as const
        ).map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleTabChange(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all duration-300 ${
              activeTab === id
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm border border-[var(--color-border)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
            {visitedTabs.has(id) && activeTab !== id && (
              <Check size={12} className="text-[var(--color-success)] shrink-0" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col p-5 pt-2 gap-6 relative min-h-[300px]">
        {activeTab === 'understand' && (
          <div className="flex flex-col gap-6 animate-slide-up-spring">
            {usageContext && (
              <div className="flex self-start">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--color-primary-light)]/30 text-[var(--color-primary)] border border-[var(--color-primary)]/15">
                  ✦ {usageContext}
                </span>
              </div>
            )}

            {insight && (
              <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[var(--color-primary-light)]/20 to-[var(--color-primary-light)]/5 border border-[var(--color-primary)]/10 shadow-sm">
                <div className="relative flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white text-xl shadow-md shadow-[var(--color-primary)]/10">
                    💡
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-primary)] opacity-85">
                      A Sacada Central
                    </span>
                    <p className="font-display text-base font-bold leading-snug text-[var(--color-text-primary)]">
                      {insight}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {bridgeRow && (
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                  Mapeamento da Ponte
                </h4>
                <div className="flex flex-col md:flex-row items-center rounded-2xl overflow-hidden ring-1 ring-[var(--color-border)] shadow-sm bg-[var(--color-surface-raised)]/10">
                  <div className="flex-1 w-full flex flex-col justify-between p-5 bg-[var(--color-surface-raised)]/20 relative border-b md:border-b-0 md:border-r border-[var(--color-border)]/50">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded bg-[var(--color-text-muted)]/15 text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-wider">
                        PT-BR
                      </span>
                    </div>
                    <p className="text-sm font-semibold italic text-[var(--color-text-secondary)] leading-relaxed">
                      <HighlightedText
                        text={bridgeRow.portuguese}
                        className="text-[var(--color-primary)] font-black not-italic decoration-[var(--color-primary)]/40 underline underline-offset-4 decoration-2"
                      />
                    </p>
                  </div>

                  <div className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] shadow-sm -mx-4 z-10">
                    <ArrowRight size={14} />
                  </div>

                  <div className="flex-1 w-full flex flex-col justify-between p-5 bg-[var(--color-primary-light)]/10 relative">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="px-2 py-0.5 rounded bg-[var(--color-primary)]/15 text-[10px] font-black text-[var(--color-primary)] uppercase tracking-wider">
                        {LANG_LABEL[language]}
                      </span>
                      <AudioPlayerButton text={stripHighlights(bridgeRow.target)} language={language} size="sm" />
                    </div>
                    <TargetPhrase
                      text={bridgeRow.target}
                      language={language}
                      newVocabulary={newVocabulary}
                      newVerbs={newVerbs}
                      onWordClick={onWordClick}
                      className="font-display text-lg font-black tracking-tight text-[var(--color-primary-dark)] leading-relaxed"
                      highlightClassName="bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-lg shadow-sm font-bold"
                    />
                  </div>
                </div>

                {bridgeRow.difference && (
                  <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)] font-medium px-1 flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shrink-0 mt-1.5" />
                    {bridgeRow.difference}
                  </p>
                )}
              </div>
            )}

            {explanationItems.length > 0 && (
              <div className="relative p-5 rounded-2xl bg-[var(--color-surface-raised)]/35 border border-[var(--color-border)]/40 max-w-prose">
                <div className="absolute left-0 top-4 bottom-4 w-1 bg-[var(--color-primary)] rounded-r-full opacity-60" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3 pl-3">
                  Por que funciona assim?
                </h4>
                <ol className="flex flex-col gap-3 pl-3 list-none">
                  {explanationItems.map((item, idx) => (
                    <li key={idx} className="flex gap-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary-light)]/30 text-[10px] font-black text-[var(--color-primary)]">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {brazilianTrap && (
              <div
                className="relative overflow-hidden p-5 rounded-2xl flex flex-col gap-4 border"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.03)',
                  borderColor: 'rgba(245, 158, 11, 0.25)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg border border-amber-500/20"
                    style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
                  >
                    ⚠️
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: '#f59e0b' }}>
                      Radar de Erro
                    </span>
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{trapSubtitle}</span>
                  </div>
                </div>

                {typeof brazilianTrap === 'object' && brazilianTrap.wrong && brazilianTrap.right && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-red-500/10 bg-red-500/5 flex flex-col gap-1">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">
                        ❌ Como a gente pensa
                      </span>
                      <p className="text-sm font-bold text-[var(--color-text-secondary)] italic">
                        &ldquo;{brazilianTrap.wrong}&rdquo;
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 flex flex-col gap-1">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">
                        ✅ Como o nativo fala
                      </span>
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">
                        &ldquo;{brazilianTrap.right}&rdquo;
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs font-semibold leading-relaxed text-[var(--color-text-secondary)]">
                  {typeof brazilianTrap === 'string' ? brazilianTrap : brazilianTrap.explanation}
                </p>
              </div>
            )}

            {survivalTip && (
              <div className="p-4 rounded-2xl bg-[var(--color-primary-light)]/10 border border-[var(--color-primary)]/10 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-light)]/30 text-base">
                  🛡️
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-primary)]">
                    Dica de Sobrevivência
                  </span>
                  <p className="text-sm font-semibold leading-relaxed text-[var(--color-text-primary)]">
                    {survivalTip}
                  </p>
                </div>
              </div>
            )}

            {culturalNote && (
              <div className="p-4 rounded-2xl bg-[var(--color-success-light)]/10 border border-[var(--color-success)]/10 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-success-light)]/30 text-base">
                  🌍
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-success)]">
                    Toque Cultural
                  </span>
                  <p className="text-[11px] font-semibold leading-relaxed text-[var(--color-text-primary)]">
                    {culturalNote}
                  </p>
                </div>
              </div>
            )}

            {retentionCheck && <RetentionCheckCard check={retentionCheck} />}
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="flex flex-col gap-6 animate-slide-up-spring">
            {(structureFormulas?.length || structureFormula) && (
              <FormulaRenderer
                structureFormula={structureFormula}
                structureFormulas={structureFormulas}
              />
            )}

            {patterns && patterns.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                  Padrões de Uso
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {patterns.map((p, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]/60 flex flex-col gap-1.5 transition-colors hover:border-[var(--color-primary)]/30"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                          {p.label}
                        </span>
                        <AudioPlayerButton text={stripHighlights(p.target)} language={language} size="sm" />
                      </div>
                      <TargetPhrase
                        text={p.target}
                        language={language}
                        newVocabulary={newVocabulary}
                        newVerbs={newVerbs}
                        onWordClick={onWordClick}
                        className="text-base font-black text-[var(--color-text-primary)]"
                        highlightClassName="bg-[var(--color-primary)] text-white px-1.5 py-0.5 rounded"
                      />
                      <p className="text-xs italic text-[var(--color-text-secondary)] opacity-85">
                        <HighlightedText
                          text={p.portuguese}
                          className="text-[var(--color-text-primary)] font-bold not-italic"
                        />
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {items && items.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                  Expressões Chave
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col overflow-hidden rounded-2xl bg-[var(--color-surface-raised)]/20 border border-[var(--color-border)] transition-colors hover:border-[var(--color-primary)]/30"
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

            {verbSpotlight && verbSpotlight.infinitive && (
              <div
                className="relative overflow-hidden rounded-3xl border border-[var(--color-primary)]/20 shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-surface) 100%)',
                }}
              >
                <div className="flex items-start gap-4 p-5 border-b border-[var(--color-border)]/40">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/15">
                    <Sparkles size={22} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] opacity-85">
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

                <div className="flex flex-col gap-3 p-5">
                  {verbSpotlight.personality && (
                    <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] font-medium max-w-prose">
                      {verbSpotlight.personality}
                    </p>
                  )}
                  {verbSpotlight.frequencyNote && (
                    <div className="flex items-center gap-2 bg-[var(--color-primary-light)]/20 px-3 py-1.5 rounded-xl border border-[var(--color-primary)]/10 self-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                      <p className="text-xs font-bold text-[var(--color-primary-dark)]">
                        {verbSpotlight.frequencyNote}
                      </p>
                    </div>
                  )}
                </div>

                {verbSpotlight.idiomaticExpressions && verbSpotlight.idiomaticExpressions.length > 0 && (
                  <div className="flex flex-col gap-3 px-5 pb-5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                      Expressões Fixas Reais
                    </h4>
                    <div className="flex flex-col gap-2">
                      {verbSpotlight.idiomaticExpressions.map((expr, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 rounded-2xl p-4 bg-[var(--color-surface)] border border-[var(--color-border)]/60"
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

                {normalizedPreview && normalizedPreview.length > 0 && (
                  <div className="px-5 pb-5 flex flex-col gap-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                      Conjugação no Presente
                    </h4>
                    <div className="rounded-2xl overflow-hidden border border-[var(--color-border)]/60 bg-[var(--color-surface)] shadow-sm">
                      {normalizedPreview.map((c, i) => (
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
                          <AudioPlayerButton
                            text={getConjugationAudioText(c.pronoun, c.form, language)}
                            language={language}
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {dialogueExample && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                    Frase Real do Diálogo
                  </h4>
                  <p className="text-[10px] text-[var(--color-text-muted)] italic">
                    Lembra dessa fala do diálogo?
                  </p>
                </div>
                <div className="relative rounded-2xl bg-[var(--color-surface-raised)]/20 p-6 border border-[var(--color-border)]/80 shadow-inner overflow-hidden">
                  <div className="flex items-center justify-between gap-5 relative z-10">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <TargetPhrase
                        text={`"${dialogueExample.target}"`}
                        language={language}
                        newVocabulary={newVocabulary}
                        newVerbs={newVerbs}
                        onWordClick={onWordClick}
                        className="text-lg font-bold italic tracking-tight text-[var(--color-text-primary)] leading-relaxed"
                      />
                      <p className="text-sm font-medium italic text-[var(--color-text-muted)]">
                        {dialogueExample.portuguese}
                      </p>
                    </div>
                    <AudioPlayerButton text={dialogueExample.target} language={language} size="sm" />
                  </div>
                </div>
              </div>
            )}

            {additionalExamples && additionalExamples.length > 0 && (
              <div className="flex flex-col gap-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                  Conversas Extras
                </h4>
                <div className="flex flex-col gap-5 rounded-3xl bg-[var(--color-surface-raised)]/10 p-5 border border-[var(--color-border)]/45">
                  {additionalExamples.map((ex, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex items-end gap-2.5 self-start max-w-[85%]">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold shadow-sm shrink-0">
                          {LANG_LABEL[language]}
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl rounded-bl-none bg-[var(--color-primary-light)]/20 px-4 py-3 border border-[var(--color-primary)]/10 shadow-sm min-w-0">
                          <TargetPhrase
                            text={ex.target}
                            language={language}
                            newVocabulary={newVocabulary}
                            newVerbs={newVerbs}
                            onWordClick={onWordClick}
                            className="text-sm font-semibold text-[var(--color-text-primary)] leading-relaxed"
                          />
                          <AudioPlayerButton text={ex.target} language={language} size="sm" />
                        </div>
                      </div>

                      <div className="flex items-end gap-2.5 self-end max-w-[85%]">
                        <div className="flex items-center rounded-2xl rounded-br-none bg-[var(--color-surface)] px-4 py-3 border border-[var(--color-border)]/80 shadow-sm">
                          <p className="text-xs text-[var(--color-text-muted)] italic leading-relaxed">
                            {ex.portuguese}
                          </p>
                        </div>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[10px] font-black text-[var(--color-text-muted)] shadow-sm shrink-0">
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
