'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, BookMarked, Sparkles, Languages, AlertCircle, X, Timer, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { getUserVocabulary } from '@/services/firestore';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import type { VerbDocument, SupportedLanguage } from '@/types';
import { LANG_META } from './data';
import { VerbTenseList } from './components';
import { VerbDrillSession } from '@/components/verbs/VerbDrillSession';

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

  // Search filter for learned verbs list
  const [learnedSearch, setLearnedSearch] = useState('');

  // Drill state
  const [drillState, setDrillState] = useState<'idle' | 'loading' | 'running'>('idle');
  const [drillVerbs, setDrillVerbs] = useState<VerbDocument[]>([]);

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

  async function startDrill() {
    if (learnedVerbs.length === 0) return;
    setDrillState('loading');
    
    // Pick up to 5 random verbs to avoid hitting limits if they need generating
    const shuffled = [...learnedVerbs].sort(() => 0.5 - Math.random());
    const subset = shuffled.slice(0, 5);
    
    try {
      const docs = await Promise.all(
        subset.map(v => getVerbConjugation(v, language))
      );
      
      const validDocs = docs.filter((d): d is VerbDocument => d !== null);
      
      if (validDocs.length > 0) {
        setDrillVerbs(validDocs);
        setDrillState('running');
      } else {
        setDrillState('idle');
        setError('Não foi possível carregar os verbos para o desafio.');
      }
    } catch (err) {
      setDrillState('idle');
      setError('Erro ao iniciar o desafio.');
    }
  }

  // Filtered learned verbs list
  const filteredLearned = learnedVerbs.filter(v =>
    v.toLowerCase().includes(learnedSearch.toLowerCase())
  );

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
          className="flex gap-3 animate-slide-up-spring"
        >
          <div className="relative flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={langMeta.placeholder}
              aria-label="Digite um verbo para conjugar"
              className="w-full rounded-2xl py-3.5 pl-11 pr-4 text-base outline-none border transition-all duration-150 text-text-primary bg-surface border-border focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="cta-shimmer shrink-0 relative overflow-hidden rounded-2xl px-6 py-3.5 text-sm font-bold transition-all active:scale-95 active:translate-y-[2px]"
            style={{
              background: loading || !input.trim()
                ? 'var(--color-surface-raised)'
                : 'var(--color-primary)',
              color: loading || !input.trim()
                ? 'var(--color-text-muted)'
                : '#fff',
              boxShadow: loading || !input.trim()
                ? 'none'
                : '0 3px 0 var(--color-primary-dark)',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer'
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

            {/* Time attack CTA */}
            {learnedVerbs.length > 0 && (
              <div 
                className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-slide-up-spring border-2"
                style={{
                  background: 'linear-gradient(to right, var(--color-surface), var(--color-surface-raised))',
                  borderColor: 'var(--color-verb)',
                  boxShadow: '0 4px 0 var(--color-verb-bg), 0 8px 16px rgba(124, 58, 237, 0.05)',
                }}
              >
                <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                  <div 
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white animate-float"
                    style={{
                      backgroundColor: 'var(--color-verb)',
                      boxShadow: '0 3px 0 #6d28d9'
                    }}
                  >
                    <Timer size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-1.5">
                      <span>Desafio de Verbos</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-verb-bg text-verb">
                        {learnedVerbs.length}
                      </span>
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Treine sua velocidade de conjugação e fixação dos tempos gramaticais!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startDrill}
                  disabled={drillState === 'loading'}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold transition-all active:scale-95 text-white active:translate-y-[2px]"
                  style={{
                    backgroundColor: 'var(--color-verb)',
                    boxShadow: '0 3px 0 #6d28d9',
                    cursor: drillState === 'loading' ? 'wait' : 'pointer',
                  }}
                >
                  {drillState === 'loading' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      Começar Desafio
                      <Zap size={14} fill="currentColor" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Learned verbs section */}
            {learnedVerbs.length > 0 && (
              <div className="flex flex-col gap-4 p-5 rounded-2xl border border-border bg-surface shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className="text-text-muted" />
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                      Seus verbos aprendidos ({learnedVerbs.length})
                    </p>
                  </div>

                  {/* Learned Verbs Search Input */}
                  <div className="relative w-full sm:w-60 shrink-0">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                      type="text"
                      value={learnedSearch}
                      onChange={(e) => setLearnedSearch(e.target.value)}
                      placeholder="Filtrar verbos..."
                      className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-border text-text-primary text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-transparent transition-all"
                      style={{ backgroundColor: 'var(--color-bg)' }}
                    />
                    {learnedSearch && (
                      <button
                        onClick={() => setLearnedSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {filteredLearned.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {filteredLearned.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleSearch(v)}
                        className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 active:translate-y-[2px] active:shadow-none cursor-pointer"
                        style={{
                          backgroundColor: 'var(--color-primary-light)',
                          border: '1.5px solid rgba(29, 94, 212, 0.25)',
                          boxShadow: '0 3px 0 rgba(29, 94, 212, 0.15)',
                          color: 'var(--color-primary)',
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic py-2">
                    Nenhum verbo correspondente a &ldquo;{learnedSearch}&rdquo;.
                  </p>
                )}
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
                    className="rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all active:scale-95 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary border cursor-pointer bg-surface border-border text-text-secondary"
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
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* ── Verb result ── */}
        {verb && !loading && (
          <div className="flex flex-col gap-5 animate-slide-up-spring">

            {/* Verb hero card */}
            <div
              className="relative overflow-hidden rounded-3xl p-6 border-2 border-primary-light"
              style={{
                background: 'linear-gradient(to right, #0c1524 0%, #173870 100%)',
                boxShadow: '0 8px 24px rgba(29, 94, 212, 0.1)',
              }}
            >
              {/* Ambient glow */}
              <div className="absolute top-0 right-0 h-32 w-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{langMeta.flag}</span>
                    <span
                      className="text-[10px] font-extrabold uppercase tracking-widest text-white/50"
                    >
                      {langMeta.label} · Infinitivo
                    </span>
                  </div>
                  <h2
                    className="font-display text-4xl sm:text-5xl font-extrabold leading-tight text-white tracking-tight drop-shadow-sm"
                  >
                    {verb.infinitive}
                  </h2>
                  <p
                    className="mt-2 text-base sm:text-lg italic font-medium text-white/70"
                  >
                    {verb.translation}
                  </p>
                </div>
                <div className="shrink-0 rounded-full p-1 bg-white/10 backdrop-blur-sm shadow-sm border border-white/15">
                  <AudioPlayerButton text={verb.infinitive} language={language} size="md" />
                </div>
              </div>
            </div>

            {/* Content: tenses + examples */}
            <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">

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
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-text-muted" />
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                      Exemplos em contexto
                    </p>
                  </div>
                  <div className="flex flex-col gap-3.5">
                    {verb.exampleSentences.slice(0, 3).map((ex, i) => (
                      <div
                        key={i}
                        className="card-lift rounded-2xl p-4.5 animate-slide-up bg-surface border border-border"
                        style={{
                          animationDelay: `${i * 80}ms`,
                          animationFillMode: 'both',
                        }}
                      >
                        <div className="flex items-start gap-4">
                          {/* Number badge */}
                          <span
                            className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full text-xs font-extrabold mt-0.5 text-white"
                            style={{
                              background: 'linear-gradient(135deg, var(--color-primary), #60a5fa)',
                              boxShadow: '0 2px 4px rgba(29, 94, 212, 0.15)'
                            }}
                          >
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold leading-snug text-text-primary">
                              {ex.target}
                            </p>
                            <p className="mt-1.5 text-sm italic leading-snug text-text-secondary">
                              {ex.portuguese}
                            </p>
                          </div>
                          <div className="shrink-0">
                            <AudioPlayerButton text={ex.target} language={language} size="sm" />
                          </div>
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

      {/* ── Drill Session Overlay ── */}
      {drillState === 'running' && (
        <VerbDrillSession
          verbs={drillVerbs}
          onClose={() => setDrillState('idle')}
        />
      )}
    </div>
  );
}

