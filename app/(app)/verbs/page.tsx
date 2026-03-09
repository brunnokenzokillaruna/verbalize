'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, BookMarked, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { getUserVocabulary } from '@/services/firestore';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import type { VerbDocument, SupportedLanguage } from '@/types';

// ── Tense display config ──────────────────────────────────────────────────────

const TENSE_LABELS: Record<string, string> = {
  present:     'Presente',
  past:        'Passado',
  future:      'Futuro',
  conditional: 'Condicional',
  imperfect:   'Imperfeito',
  subjunctive: 'Subjuntivo',
};

const TENSE_ORDER = ['present', 'past', 'imperfect', 'future', 'conditional', 'subjunctive'];

// ── Quick-start chips ─────────────────────────────────────────────────────────

const QUICK_VERBS: Record<SupportedLanguage, string[]> = {
  fr: ['être', 'avoir', 'aller', 'faire', 'vouloir'],
  en: ['to be', 'to have', 'to go', 'to do', 'to want'],
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function VerbsPage() {
  const { profile } = useAuthStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verb, setVerb] = useState<VerbDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openTenses, setOpenTenses] = useState<Set<string>>(new Set(['present']));
  const [learnedVerbs, setLearnedVerbs] = useState<string[]>([]);

  const language = (profile?.currentTargetLanguage ?? 'fr') as SupportedLanguage;

  useEffect(() => {
    if (!profile?.uid) return;
    getUserVocabulary(profile.uid, language).then((items) => {
      setLearnedVerbs(items.filter((i) => i.wordType === 'verb').map((i) => i.word));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid, language]);

  async function handleSearch(infinitive: string) {
    const clean = infinitive.trim();
    if (!clean) return;
    setInput(clean);
    setLoading(true);
    setError(null);
    setVerb(null);

    const result = await getVerbConjugation(clean, language);
    setLoading(false);

    if (!result) {
      setError('Não foi possível encontrar o verbo. Verifique a ortografia e tente novamente.');
    } else {
      setVerb(result);
      setOpenTenses(new Set(['present']));
    }
  }

  function toggleTense(tense: string) {
    setOpenTenses((prev) => {
      const next = new Set(prev);
      if (next.has(tense)) next.delete(tense);
      else next.add(tense);
      return next;
    });
  }

  const LANG_LABEL: Record<SupportedLanguage, string> = { fr: '🇫🇷 Francês', en: '🇬🇧 Inglês' };

  return (
    <div
      className="min-h-dvh pb-24"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-5 pt-8 pb-4"
        style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="mx-auto max-w-[640px]">
          <h1
            className="font-display text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Explorar Verbos
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {LANG_LABEL[language]}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[640px] px-5 pt-5 flex flex-col gap-5">

        {/* Search form */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(input); }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === 'fr' ? 'ex: être, avoir, aller…' : 'ex: to be, to have…'}
              className="w-full rounded-xl py-3 pl-10 pr-4 text-base outline-none transition-all"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl px-5 py-3 text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed"
            style={{
              backgroundColor: loading || !input.trim() ? 'var(--color-surface-raised)' : 'var(--color-primary)',
              color: loading || !input.trim() ? 'var(--color-text-muted)' : 'var(--color-text-inverse)',
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Conjugar'}
          </button>
        </form>

        {/* Quick-start chips */}
        {!verb && !loading && (
          <div className="flex flex-col gap-5">
            {/* Learned verbs section */}
            {learnedVerbs.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                  Verbos aprendidos
                </p>
                <div className="flex flex-wrap gap-2">
                  {learnedVerbs.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleSearch(v)}
                      className="rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-95"
                      style={{
                        backgroundColor: 'var(--color-primary-light)',
                        border: '1px solid var(--color-primary)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              Verbos comuns
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_VERBS[language].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleSearch(v)}
                  className="rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-95"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            </div>

            {/* Empty illustration */}
            <div className="mt-6 flex flex-col items-center gap-3 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'var(--color-primary-light)' }}
              >
                <BookMarked size={30} style={{ color: 'var(--color-primary)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Pesquise um verbo para ver a conjugação completa
              </p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Gerando conjugação com IA…
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            className="rounded-2xl p-4 text-center text-sm"
            style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}
          >
            {error}
          </div>
        )}

        {/* Verb result */}
        {verb && !loading && (
          <div className="flex flex-col gap-4 animate-slide-up">
            {/* Verb header */}
            <div
              className="flex items-center justify-between rounded-2xl p-5"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className="font-display text-3xl font-bold"
                    style={{ color: 'var(--color-vocab)' }}
                  >
                    {verb.infinitive}
                  </span>
                  <AudioPlayerButton text={verb.infinitive} language={language} size="sm" />
                </div>
                <p className="mt-1 text-base" style={{ color: 'var(--color-text-secondary)' }}>
                  {verb.translation}
                </p>
              </div>
            </div>

            {/* Conjugation tenses */}
            {TENSE_ORDER.filter((t) => verb.conjugations?.[t as keyof typeof verb.conjugations])
              .map((tense) => {
                const forms = verb.conjugations[tense as keyof typeof verb.conjugations];
                const isOpen = openTenses.has(tense);
                return (
                  <div
                    key={tense}
                    className="overflow-hidden rounded-2xl"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                  >
                    {/* Tense header */}
                    <button
                      type="button"
                      onClick={() => toggleTense(tense)}
                      className="flex w-full items-center justify-between px-5 py-4 transition-opacity hover:opacity-70"
                    >
                      <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {TENSE_LABELS[tense] ?? tense}
                      </span>
                      {isOpen
                        ? <ChevronUp size={18} style={{ color: 'var(--color-text-muted)' }} />
                        : <ChevronDown size={18} style={{ color: 'var(--color-text-muted)' }} />}
                    </button>

                    {/* Conjugation rows */}
                    {isOpen && forms && (
                      <div style={{ borderTop: '1px solid var(--color-border)' }}>
                        {Object.entries(forms).map(([pronoun, form], i) => (
                          <div
                            key={pronoun}
                            className="flex items-center justify-between px-5 py-3"
                            style={{
                              borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
                              backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--color-surface-raised)',
                            }}
                          >
                            <span
                              className="text-sm font-medium w-24"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {pronoun}
                            </span>
                            <span
                              className="flex-1 text-base font-semibold"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {form}
                            </span>
                            <AudioPlayerButton
                              text={`${pronoun} ${form}`}
                              language={language}
                              size="sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Example sentences */}
            {verb.exampleSentences?.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <p
                  className="mb-4 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Exemplos
                </p>
                <div className="flex flex-col gap-4">
                  {verb.exampleSentences.slice(0, 3).map((ex, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-base font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {ex.target}
                        </p>
                        <p
                          className="mt-0.5 text-sm"
                          style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}
                        >
                          {ex.portuguese}
                        </p>
                      </div>
                      <AudioPlayerButton text={ex.target} language={language} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
