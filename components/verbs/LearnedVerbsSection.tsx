'use client';

import { useMemo, useState } from 'react';
import { Search, Sparkles, X, ArrowLeft } from 'lucide-react';

const PREVIEW_COUNT = 6;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

type LearnedVerb = {
  word: string;
  firstSeen: number;
};

type LearnedVerbsSectionProps = {
  verbs: LearnedVerb[];
  onSelectVerb: (word: string) => void;
};

function VerbChip({
  word,
  onClick,
  compact = false,
}: {
  word: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg font-semibold transition-all active:scale-95 cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verb ${
        compact ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
      }`}
      style={{
        backgroundColor: 'var(--color-verb-bg)',
        borderColor: 'rgba(124, 58, 237, 0.2)',
        color: 'var(--color-verb)',
      }}
    >
      {word}
    </button>
  );
}

export function LearnedVerbsSection({ verbs, onSelectVerb }: LearnedVerbsSectionProps) {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const sortedByRecent = useMemo(
    () => [...verbs].sort((a, b) => b.firstSeen - a.firstSeen),
    [verbs],
  );

  const previewVerbs = useMemo(
    () => sortedByRecent.slice(0, PREVIEW_COUNT).map((v) => v.word),
    [sortedByRecent],
  );

  const verbsByLetter = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const { word } of verbs) {
      const letter = word.charAt(0).toLocaleLowerCase() || '#';
      const bucket = map.get(letter) ?? [];
      bucket.push(word);
      map.set(letter, bucket);
    }
    for (const [letter, list] of map) {
      map.set(letter, list.sort((a, b) => a.localeCompare(b, 'fr')));
    }
    return map;
  }, [verbs]);

  const availableLetters = useMemo(
    () => new Set(verbsByLetter.keys()),
    [verbsByLetter],
  );

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return verbs
      .map((v) => v.word)
      .filter((w) => w.toLowerCase().includes(query))
      .sort((a, b) => a.localeCompare(b, 'fr'));
  }, [verbs, search]);

  const letterVerbs = selectedLetter ? (verbsByLetter.get(selectedLetter) ?? []) : [];
  const isSearching = search.trim().length > 0;

  function handleLetterClick(letter: string) {
    setSearch('');
    setSelectedLetter((prev) => (prev === letter ? null : letter));
  }

  function clearLetter() {
    setSelectedLetter(null);
  }

  if (verbs.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden animate-slide-up-spring delay-100">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-text-muted shrink-0" />
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Seus verbos aprendidos
          </p>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold"
            style={{
              backgroundColor: 'var(--color-verb-bg)',
              color: 'var(--color-verb)',
            }}
          >
            {verbs.length}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-text-muted">
          Escolha uma letra para ver os verbos ou toque em um recente para conjugar.
        </p>
      </div>

      <div className="px-5 pb-5 flex flex-col gap-5 border-t border-border pt-4">
        {/* Recent preview */}
        {previewVerbs.length > 0 && !isSearching && !selectedLetter && (
          <div
            className="rounded-xl p-3 border border-border"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2.5">
              Recentes
            </p>
            <div className="grid grid-cols-2 gap-2">
              {previewVerbs.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => onSelectVerb(word)}
                  className="w-full rounded-xl py-2.5 px-3 text-sm font-semibold text-center truncate transition-all active:scale-[0.98] cursor-pointer border border-border bg-surface-raised text-text-primary hover:border-verb/35 hover:text-verb hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verb"
                >
                  {word}
                </button>
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
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value.trim()) setSelectedLetter(null);
            }}
            placeholder="Buscar verbo..."
            aria-label="Buscar verbo aprendido"
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-border text-text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
            style={{ backgroundColor: 'var(--color-bg)' }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search results */}
        {isSearching && (
          <div className="flex flex-col gap-2.5">
            {searchResults.length > 0 ? (
              <>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
                  {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {searchResults.map((word) => (
                    <VerbChip
                      key={word}
                      word={word}
                      compact
                      onClick={() => onSelectVerb(word)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-text-muted italic py-1 text-center">
                Nenhum verbo correspondente a &ldquo;{search.trim()}&rdquo;.
              </p>
            )}
          </div>
        )}

        {/* Alphabet picker */}
        {!isSearching && (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
              Explorar por letra
            </p>
            <div
              className="grid grid-cols-7 sm:grid-cols-9 gap-1.5"
              role="group"
              aria-label="Filtrar verbos por letra inicial"
            >
              {ALPHABET.map((letter) => {
                const hasVerbs = availableLetters.has(letter);
                const isSelected = selectedLetter === letter;
                const count = verbsByLetter.get(letter)?.length ?? 0;

                return (
                  <button
                    key={letter}
                    type="button"
                    disabled={!hasVerbs}
                    onClick={() => handleLetterClick(letter)}
                    aria-pressed={isSelected}
                    aria-label={
                      hasVerbs
                        ? `Letra ${letter.toUpperCase()}, ${count} verbo${count !== 1 ? 's' : ''}`
                        : `Letra ${letter.toUpperCase()}, sem verbos`
                    }
                    className={`flex h-9 items-center justify-center rounded-lg text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verb ${
                      !hasVerbs
                        ? 'opacity-30 cursor-not-allowed text-text-muted'
                        : isSelected
                          ? 'text-white scale-105 cursor-pointer'
                          : 'text-text-secondary border border-border bg-surface-raised hover:border-verb/30 hover:bg-verb-bg hover:text-verb active:scale-95 cursor-pointer'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: 'var(--color-verb)',
                            boxShadow: '0 2px 0 #6d28d9',
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

        {/* Verbs for selected letter */}
        {!isSearching && selectedLetter && (
          <div className="flex flex-col gap-3 animate-slide-up">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-text-primary">
                Verbos com &ldquo;{selectedLetter.toUpperCase()}&rdquo;
                <span className="ml-1.5 text-xs font-extrabold text-text-muted">
                  ({letterVerbs.length})
                </span>
              </p>
              <button
                type="button"
                onClick={clearLetter}
                className="flex items-center gap-1 text-xs font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-2 py-1"
              >
                <ArrowLeft size={13} />
                Alfabeto
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {letterVerbs.map((word) => (
                <VerbChip
                  key={word}
                  word={word}
                  compact
                  onClick={() => onSelectVerb(word)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
