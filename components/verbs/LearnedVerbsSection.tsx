'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Search, Sparkles, X } from 'lucide-react';

const PREVIEW_COUNT = 6;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

export type LearnedVerb = {
  id: string;
  word: string;
  translation?: string;
  firstSeen: number;
};

type LearnedVerbsSectionProps = {
  verbs: LearnedVerb[];
  query: string;
  placeholder: string;
  conjugating: boolean;
  onQueryChange: (query: string) => void;
  onConjugate: (word: string) => void;
};

function VerbRow({ verb, onClick }: { verb: LearnedVerb; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-all active:scale-[0.99] cursor-pointer hover:border-verb/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verb"
    >
      <span className="min-w-0">
        <span className="block font-display text-base font-bold text-text-primary truncate">{verb.word}</span>
        <span
          className={`mt-0.5 block truncate text-xs ${
            verb.translation?.trim() ? 'text-text-secondary' : 'italic text-text-muted'
          }`}
        >
          {verb.translation?.trim() || '—'}
        </span>
      </span>
      <span className="shrink-0 text-[11px] font-bold" style={{ color: 'var(--color-verb)' }}>
        Conjugar
      </span>
    </button>
  );
}

export function LearnedVerbsSection({
  verbs,
  query,
  placeholder,
  conjugating,
  onQueryChange,
  onConjugate,
}: LearnedVerbsSectionProps) {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const sortedByRecent = useMemo(
    () => [...verbs].sort((a, b) => b.firstSeen - a.firstSeen),
    [verbs],
  );

  const previewVerbs = useMemo(
    () => sortedByRecent.slice(0, PREVIEW_COUNT),
    [sortedByRecent],
  );

  const verbsByLetter = useMemo(() => {
    const map = new Map<string, LearnedVerb[]>();
    for (const verb of verbs) {
      const letter = verb.word.charAt(0).toLocaleLowerCase() || '#';
      const bucket = map.get(letter) ?? [];
      bucket.push(verb);
      map.set(letter, bucket);
    }
    for (const [letter, list] of map) {
      map.set(letter, list.sort((a, b) => a.word.localeCompare(b.word)));
    }
    return map;
  }, [verbs]);

  const availableLetters = useMemo(() => new Set(verbsByLetter.keys()), [verbsByLetter]);

  const isSearching = query.trim().length > 0;
  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return verbs
      .filter((verb) => {
        const word = verb.word.toLowerCase();
        const translation = verb.translation?.toLowerCase() ?? '';
        return word.includes(normalized) || translation.includes(normalized);
      })
      .sort((a, b) => a.word.localeCompare(b.word));
  }, [verbs, query]);

  const letterVerbs = selectedLetter ? (verbsByLetter.get(selectedLetter) ?? []) : [];
  const showResults = isSearching || !!selectedLetter;
  const resultWords = isSearching ? searchResults : letterVerbs;

  function handleLetterClick(letter: string) {
    onQueryChange('');
    setSelectedLetter((prev) => (prev === letter ? null : letter));
  }

  function handleQueryChange(value: string) {
    onQueryChange(value);
    if (value.trim()) setSelectedLetter(null);
  }

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
              backgroundColor: 'var(--color-verb-bg)',
              color: 'var(--color-verb)',
            }}
          >
            {verbs.length}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-text-muted">
          Busque um verbo para conjugar ou explore os que você já aprendeu.
        </p>
      </div>

      <div className="px-5 pb-5 flex flex-col gap-4 border-t border-border pt-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onConjugate(query);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder={placeholder}
              aria-label="Buscar ou conjugar um verbo"
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border text-text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
              style={{ backgroundColor: 'var(--color-bg)' }}
            />
            {query && (
              <button
                type="button"
                onClick={() => handleQueryChange('')}
                aria-label="Limpar busca"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={conjugating || !query.trim()}
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
            style={{
              backgroundColor: conjugating || !query.trim() ? 'var(--color-surface-raised)' : 'var(--color-primary)',
              color: conjugating || !query.trim() ? 'var(--color-text-muted)' : '#fff',
              boxShadow: conjugating || !query.trim() ? 'none' : '0 3px 0 var(--color-primary-dark)',
              cursor: conjugating || !query.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {conjugating ? <Loader2 size={16} className="animate-spin" /> : 'Conjugar'}
          </button>
        </form>

        {previewVerbs.length > 0 && !showResults && (
          <div
            className="rounded-xl p-3 border border-border"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2.5">
              Adicionadas recentemente
            </p>
            <div className="flex flex-col gap-2">
              {previewVerbs.map((verb) => (
                <VerbRow key={verb.id} verb={verb} onClick={() => onConjugate(verb.word)} />
              ))}
            </div>
          </div>
        )}

        {showResults && (
          <div className="flex flex-col gap-3 animate-slide-up">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-text-primary">
                {isSearching ? (
                  <>
                    Resultados
                    <span className="ml-1.5 text-xs font-extrabold text-text-muted">
                      ({resultWords.length})
                    </span>
                  </>
                ) : (
                  <>
                    Letra &ldquo;{selectedLetter?.toUpperCase()}&rdquo;
                    <span className="ml-1.5 text-xs font-extrabold text-text-muted">
                      ({letterVerbs.length})
                    </span>
                  </>
                )}
              </p>
              {!isSearching && selectedLetter && (
                <button
                  type="button"
                  onClick={() => setSelectedLetter(null)}
                  aria-label="Voltar ao alfabeto"
                  className="duo-level-chip flex shrink-0 items-center gap-1 rounded-full border border-primary/25 bg-primary-light px-3 py-1.5 text-xs font-bold whitespace-nowrap text-primary dark:text-text-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ArrowLeft size={13} strokeWidth={2.25} aria-hidden />
                  Voltar
                </button>
              )}
            </div>

            {resultWords.length > 0 ? (
              <div className="flex flex-col gap-2">
                {resultWords.map((verb) => (
                  <VerbRow key={verb.id} verb={verb} onClick={() => onConjugate(verb.word)} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted italic py-2 text-center">
                {isSearching
                  ? `Nenhum verbo aprendido correspondente a "${query.trim()}". Use Conjugar para buscar.`
                  : 'Nenhum verbo com esta letra.'}
              </p>
            )}
          </div>
        )}

        {!showResults && (
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
      </div>
    </section>
  );
}
