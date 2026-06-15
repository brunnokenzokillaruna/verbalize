'use client';

import { useMemo, useState } from 'react';
import { Search, Sparkles, X, ArrowLeft, LayoutGrid, List } from 'lucide-react';
import { VocabCard } from '@/components/vocabulary/VocabCard';
import { VocabListRow } from '@/components/vocabulary/VocabListRow';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';
import type { SrsFilter } from '@/utils/vocabPageHelpers';

const PREVIEW_COUNT = 6;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

type VocabularyLibrarySectionProps = {
  items: UserVocabularyDocument[];
  language: SupportedLanguage;
  searchQuery: string;
  srsFilter: SrsFilter;
  layoutMode: 'grid' | 'list';
  newCount: number;
  learningCount: number;
  masteredCount: number;
  totalCount: number;
  enrichingWords: Set<string>;
  onSearchChange: (query: string) => void;
  onSrsFilterChange: (filter: SrsFilter) => void;
  onLayoutChange: (mode: 'grid' | 'list') => void;
  onEnrich: (word: string) => void;
  onImageLoaded: (word: string, imageUrl: string) => void;
};

function getFirstSeenMs(item: UserVocabularyDocument): number {
  return item.firstSeen?.toMillis?.() ?? 0;
}

export function VocabularyLibrarySection({
  items,
  language,
  searchQuery,
  srsFilter,
  layoutMode,
  newCount,
  learningCount,
  masteredCount,
  totalCount,
  enrichingWords,
  onSearchChange,
  onSrsFilterChange,
  onLayoutChange,
  onEnrich,
  onImageLoaded,
}: VocabularyLibrarySectionProps) {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const sortedByRecent = useMemo(
    () => [...items].sort((a, b) => getFirstSeenMs(b) - getFirstSeenMs(a)),
    [items],
  );

  const previewItems = useMemo(
    () => sortedByRecent.slice(0, PREVIEW_COUNT),
    [sortedByRecent],
  );

  const itemsByLetter = useMemo(() => {
    const map = new Map<string, UserVocabularyDocument[]>();
    for (const item of items) {
      const letter = item.word.charAt(0).toLocaleLowerCase() || '#';
      const bucket = map.get(letter) ?? [];
      bucket.push(item);
      map.set(letter, bucket);
    }
    for (const [letter, list] of map) {
      map.set(
        letter,
        list.sort((a, b) => a.word.localeCompare(b.word, language)),
      );
    }
    return map;
  }, [items, language]);

  const availableLetters = useMemo(
    () => new Set(itemsByLetter.keys()),
    [itemsByLetter],
  );

  const isSearching = searchQuery.trim().length > 0;
  const letterItems = selectedLetter ? (itemsByLetter.get(selectedLetter) ?? []) : [];
  const showResults = isSearching || !!selectedLetter;
  const resultItems = isSearching ? items : letterItems;

  function handleLetterClick(letter: string) {
    onSearchChange('');
    setSelectedLetter((prev) => (prev === letter ? null : letter));
  }

  function handleSearchChange(value: string) {
    onSearchChange(value);
    if (value.trim()) setSelectedLetter(null);
  }

  const srsFilters: { key: SrsFilter; label: string; count: number; active: string }[] = [
    { key: 'all', label: 'Tudo', count: totalCount, active: 'bg-primary text-white border-primary' },
    { key: 'new', label: 'Novas', count: newCount, active: 'bg-vocab text-white border-vocab' },
    { key: 'learning', label: 'Praticando', count: learningCount, active: 'bg-verb text-white border-verb' },
    { key: 'mastered', label: 'Dominadas', count: masteredCount, active: 'bg-success text-white border-success' },
  ];

  return (
    <section className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden animate-slide-up-spring">
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-text-muted shrink-0" />
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Sua biblioteca
          </p>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold"
            style={{
              backgroundColor: 'var(--color-vocab-bg)',
              color: 'var(--color-vocab)',
            }}
          >
            {items.length}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-text-muted">
          Filtre por estágio, busque ou explore por letra inicial.
        </p>
      </div>

      <div className="px-5 pb-5 flex flex-col gap-4 border-t border-border pt-4">
        {/* SRS filters */}
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {srsFilters.map(({ key, label, count, active }) => (
            <button
              key={key}
              type="button"
              onClick={() => onSrsFilterChange(key)}
              className={`duo-level-chip shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                srsFilter === key
                  ? `${active} shadow-sm`
                  : 'bg-surface text-text-secondary border-border hover:bg-surface-raised'
              }`}
            >
              {label}{' '}
              <span className="text-[10px] opacity-75 font-extrabold">{count}</span>
            </button>
          ))}
        </div>

        {/* Recent preview */}
        {previewItems.length > 0 && !showResults && (
          <div
            className="rounded-xl p-3 border border-border"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2.5">
              Adicionadas recentemente
            </p>
            <div className="flex flex-col gap-2">
              {previewItems.map((item) => (
                <VocabListRow
                  key={item.word}
                  item={item}
                  language={language}
                  onEnrich={onEnrich}
                  enriching={enrichingWords.has(item.word)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar palavra ou tradução..."
            aria-label="Buscar no vocabulário"
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border text-text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
            style={{ backgroundColor: 'var(--color-bg)' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search / letter results */}
        {showResults && (
          <div className="flex flex-col gap-3 animate-slide-up">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-text-primary">
                {isSearching ? (
                  <>
                    Resultados
                    <span className="ml-1.5 text-xs font-extrabold text-text-muted">
                      ({resultItems.length})
                    </span>
                  </>
                ) : (
                  <>
                    Letra &ldquo;{selectedLetter?.toUpperCase()}&rdquo;
                    <span className="ml-1.5 text-xs font-extrabold text-text-muted">
                      ({letterItems.length})
                    </span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                {!isSearching && selectedLetter && (
                  <button
                    type="button"
                    onClick={() => setSelectedLetter(null)}
                    className="flex items-center gap-1 text-xs font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-2 py-1"
                  >
                    <ArrowLeft size={13} />
                    Alfabeto
                  </button>
                )}
                {resultItems.length > 0 && (
                  <div
                    className="flex rounded-lg p-0.5 border border-border"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                  >
                    <button
                      type="button"
                      onClick={() => onLayoutChange('grid')}
                      aria-label="Visualização em grid"
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        layoutMode === 'grid'
                          ? 'bg-surface text-text-primary shadow-sm border border-border'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <LayoutGrid size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onLayoutChange('list')}
                      aria-label="Visualização em lista"
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        layoutMode === 'list'
                          ? 'bg-surface text-text-primary shadow-sm border border-border'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <List size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {resultItems.length > 0 ? (
              layoutMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {resultItems.map((item, idx) => (
                    <VocabCard
                      key={item.word}
                      item={item}
                      language={language}
                      animDelay={idx * 30}
                      onImageLoaded={onImageLoaded}
                      onEnrich={onEnrich}
                      enriching={enrichingWords.has(item.word)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {resultItems.map((item) => (
                    <VocabListRow
                      key={item.word}
                      item={item}
                      language={language}
                      onEnrich={onEnrich}
                      enriching={enrichingWords.has(item.word)}
                    />
                  ))}
                </div>
              )
            ) : (
              <p className="text-sm text-text-muted italic py-2 text-center">
                {isSearching
                  ? `Nenhuma palavra correspondente a "${searchQuery.trim()}".`
                  : 'Nenhuma palavra com esta letra.'}
              </p>
            )}
          </div>
        )}

        {/* Alphabet picker */}
        {!showResults && (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
              Explorar por letra
            </p>
            <div
              className="grid grid-cols-7 sm:grid-cols-9 gap-1.5"
              role="group"
              aria-label="Filtrar palavras por letra inicial"
            >
              {ALPHABET.map((letter) => {
                const hasItems = availableLetters.has(letter);
                const isSelected = selectedLetter === letter;
                const count = itemsByLetter.get(letter)?.length ?? 0;

                return (
                  <button
                    key={letter}
                    type="button"
                    disabled={!hasItems}
                    onClick={() => handleLetterClick(letter)}
                    aria-pressed={isSelected}
                    aria-label={
                      hasItems
                        ? `Letra ${letter.toUpperCase()}, ${count} palavra${count !== 1 ? 's' : ''}`
                        : `Letra ${letter.toUpperCase()}, sem palavras`
                    }
                    className={`flex h-9 items-center justify-center rounded-lg text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vocab ${
                      !hasItems
                        ? 'opacity-30 cursor-not-allowed text-text-muted'
                        : isSelected
                          ? 'text-white scale-105 cursor-pointer'
                          : 'text-text-secondary border border-border bg-surface-raised hover:border-vocab/30 hover:bg-vocab-bg hover:text-vocab active:scale-95 cursor-pointer'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: 'var(--color-vocab)',
                            boxShadow: '0 2px 0 #b45309',
                          }
                        : undefined
                    }
                  >
                    {letter.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
