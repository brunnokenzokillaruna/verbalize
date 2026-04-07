'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, BookMarked, ChevronDown, ChevronUp, Sparkles, Languages } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { getUserVocabulary } from '@/services/firestore';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import type { VerbDocument, SupportedLanguage } from '@/types';
import { LANG_META } from './data';
import { VerbTenseList } from './components';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VerbsPage() {
  const { profile } = useAuthStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verb, setVerb] = useState<VerbDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openTenses, setOpenTenses] = useState<Set<string>>(new Set(['present']));
  const [learnedVerbs, setLearnedVerbs] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const language = (profile?.currentTargetLanguage ?? 'fr') as SupportedLanguage;
  const langMeta = LANG_META[language];

  useEffect(() => {
    if (!profile?.uid) return;
    getUserVocabulary(profile.uid, language).then((items) => {
      setLearnedVerbs(items.filter((i) => i.wordType === 'verb').map((i) => i.word));
    });
  }, [profile?.uid, language]);

  async function handleSearch(infinitive: string) {
    const clean = infinitive.trim();
    if (!clean) return;
    setInput(clean);
    setLoading(true);
    setError(null);
    setVerb(null);
    inputRef.current?.blur();

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

  return (
    <div className="min-h-dvh pb-24 md:pb-10" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* ── Sticky header ── */}
      <header
        className="sticky top-0 z-10 px-5 pt-6 pb-4"
        style={{
          backgroundColor: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">{langMeta.flag}</span>
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {langMeta.label}
            </span>
          </div>
          <h1
            className="font-display text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Explorar Verbos
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-5 pt-5 flex flex-col gap-6">

        {/* ── Search bar ── */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(input); }}
          className="flex gap-2.5 animate-slide-up-spring"
        >
          <div className="relative flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={langMeta.placeholder}
              className="w-full rounded-2xl py-3.5 pl-11 pr-4 text-base outline-none transition-all duration-150"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-light)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="cta-shimmer relative overflow-hidden rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-150 active:scale-95 disabled:cursor-not-allowed"
            style={{
              background: loading || !input.trim()
                ? 'var(--color-surface-raised)'
                : 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
              color: loading || !input.trim()
                ? 'var(--color-text-muted)'
                : '#fff',
              boxShadow: loading || !input.trim()
                ? 'none'
                : '0 4px 14px rgba(29,94,212,0.3)',
            }}
          >
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : 'Conjugar'}
          </button>
        </form>

        {/* ── Idle state (no result yet) ── */}
        {!verb && !loading && (
          <div className="flex flex-col gap-6 animate-slide-up-spring delay-75">

            {/* Learned verbs */}
            {learnedVerbs.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} style={{ color: 'var(--color-text-muted)' }} />
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Seus verbos
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {learnedVerbs.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleSearch(v)}
                      className="card-lift rounded-xl px-4 py-2 text-sm font-semibold transition-all active:scale-95"
                      style={{
                        backgroundColor: 'var(--color-primary-light)',
                        border: '1.5px solid',
                        borderColor: 'rgba(29,94,212,0.25)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty illustration */}
            <div className="mt-4 flex flex-col items-center gap-4 text-center py-8">
              <div
                className="relative flex h-20 w-20 items-center justify-center rounded-3xl"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-surface-raised))',
                  border: '1.5px solid var(--color-border)',
                }}
              >
                <BookMarked size={32} style={{ color: 'var(--color-primary)' }} />
                <span
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs animate-bounce"
                  style={{ backgroundColor: 'var(--color-vocab-bg)', color: 'var(--color-vocab)' }}
                >
                  ✦
                </span>
              </div>
              <div>
                <p
                  className="font-display text-lg font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Pesquise qualquer verbo
                </p>
                <p className="mt-1 text-sm max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Veja a conjugação completa com exemplos de uso em contexto.
                </p>
              </div>

              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {(language === 'fr'
                  ? ['être', 'avoir', 'aller', 'faire', 'pouvoir']
                  : ['to be', 'to have', 'to go', 'to make', 'to know']
                ).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleSearch(v)}
                    className="rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all active:scale-95 hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-14 text-center animate-fade-in">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl animate-pulse"
              style={{ backgroundColor: 'var(--color-primary-light)' }}
            >
              <Languages size={28} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Gerando conjugação…
              </p>
              <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                A IA está buscando as formas do verbo
              </p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    animationDelay: `${i * 150}ms`,
                    opacity: 0.6,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div
            className="flex items-start gap-3 rounded-2xl p-4 text-sm animate-scale-in"
            style={{
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              border: '1px solid rgba(220,38,38,0.2)',
            }}
          >
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* ── Verb result ── */}
        {verb && !loading && (
          <div className="flex flex-col gap-5 animate-slide-up-spring">

            {/* Verb hero card */}
            <div
              className="relative overflow-hidden rounded-3xl p-6"
              style={{
                background: 'linear-gradient(135deg, #0a1628 0%, #1d5ed4 100%)',
                boxShadow: '0 12px 40px rgba(29,94,212,0.3)',
              }}
            >
              {/* Diagonal pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                  backgroundSize: '16px 16px',
                }}
              />
              {/* Glow */}
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.25) 0%, transparent 70%)' }}
              />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-1"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    {langMeta.flag} {langMeta.label} · Infinitivo
                  </p>
                  <p
                    className="font-display text-4xl font-bold leading-none"
                    style={{ color: '#fff' }}
                  >
                    {verb.infinitive}
                  </p>
                  <p
                    className="mt-2 text-base italic"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    {verb.translation}
                  </p>
                </div>
                <AudioPlayerButton text={verb.infinitive} language={language} size="sm" />
              </div>
            </div>

            {/* Content: tenses + examples */}
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">

              {/* Conjugation tenses */}
              <VerbTenseList
                verb={verb}
                openTenses={openTenses}
                toggleTense={toggleTense}
                language={language}
              />

              {/* Example sentences */}
              {verb.exampleSentences?.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Exemplos em contexto
                  </p>
                  <div className="flex flex-col gap-3">
                    {verb.exampleSentences.slice(0, 3).map((ex, i) => (
                      <div
                        key={i}
                        className="card-lift rounded-2xl p-4 animate-slide-up"
                        style={{
                          animationDelay: `${i * 80}ms`,
                          animationFillMode: 'both',
                          backgroundColor: 'var(--color-surface)',
                          border: '1.5px solid var(--color-border)',
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Number badge */}
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5"
                            style={{
                              background: 'linear-gradient(135deg, var(--color-primary), #60a5fa)',
                              color: '#fff',
                            }}
                          >
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-base font-semibold leading-snug"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {ex.target}
                            </p>
                            <p
                              className="mt-1 text-sm italic leading-snug"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              {ex.portuguese}
                            </p>
                          </div>
                          <AudioPlayerButton text={ex.target} language={language} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
