'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, BookMarked, Languages, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { getUserVocabulary } from '@/services/firestore';
import type { VerbDocument, SupportedLanguage } from '@/types';
import { LANG_META } from './data';
import { VerbTenseList } from '@/components/verbs/VerbTenseList';
import { VerbResultHero } from '@/components/verbs/VerbResultHero';
import { VerbExamplesSection } from '@/components/verbs/VerbExamplesSection';
import { VerbDrillSession } from '@/components/verbs/VerbDrillSession';
import { VerbChallengeCard } from '@/components/verbs/VerbChallengeCard';
import { LearnedVerbsSection } from '@/components/verbs/LearnedVerbsSection';
import { LanguageFlag } from '@/components/LanguageFlag';
import {
  readVerbFromCache,
  writeVerbToCache,
  readBestSprintScore,
} from '@/utils/verbChallengeStorage';

const SPRINT_POOL_SIZE = 10;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VerbsPage() {
  const { profile } = useAuthStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verb, setVerb] = useState<VerbDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openTenses, setOpenTenses] = useState<Set<string>>(new Set(['present']));
  const [learnedVerbs, setLearnedVerbs] = useState<{ word: string; firstSeen: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Drill state
  const [drillState, setDrillState] = useState<'idle' | 'loading' | 'running'>('idle');
  const [drillVerbs, setDrillVerbs] = useState<VerbDocument[]>([]);
  const [bestSprintScore, setBestSprintScore] = useState<number | null>(null);

  const verbCacheRef = useRef<Map<string, VerbDocument>>(new Map());

  const language = (profile?.currentTargetLanguage ?? 'fr') as SupportedLanguage;
  const langMeta = LANG_META[language];

  useEffect(() => {
    if (!profile?.uid) return;
    getUserVocabulary(profile.uid, language).then((items) => {
      setLearnedVerbs(
        items
          .filter((i) => i.wordType === 'verb')
          .map((i) => ({
            word: i.word,
            firstSeen: i.firstSeen?.toMillis?.() ?? 0,
          })),
      );
    });
  }, [profile?.uid, language]);

  useEffect(() => {
    if (!profile?.uid) return;
    setBestSprintScore(readBestSprintScore(profile.uid, language));
  }, [profile?.uid, language]);

  function cacheVerb(doc: VerbDocument) {
    verbCacheRef.current.set(doc.infinitive.toLowerCase(), doc);
    writeVerbToCache(language, doc);
  }

  function getCachedVerb(word: string): VerbDocument | undefined {
    const key = word.toLowerCase();
    return (
      verbCacheRef.current.get(key) ??
      readVerbFromCache(language, word) ??
      undefined
    );
  }

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
      cacheVerb(result);
      setVerb(result);
      setOpenTenses(new Set(['present']));
    }
  }

  function clearVerbResult() {
    setVerb(null);
    setInput('');
    setError(null);
    setOpenTenses(new Set(['present']));
    inputRef.current?.focus();
  }

  function toggleTense(tense: string) {
    setOpenTenses((prev) => {
      const next = new Set(prev);
      if (next.has(tense)) next.delete(tense);
      else next.add(tense);
      return next;
    });
  }

  const startDrill = useCallback(async () => {
    if (learnedVerbs.length === 0 || !profile?.uid) return;
    setDrillState('loading');
    setError(null);

    const poolSize = Math.min(SPRINT_POOL_SIZE, learnedVerbs.length);
    const shuffled = [...learnedVerbs].sort(() => 0.5 - Math.random()).slice(0, poolSize);
    const docs: VerbDocument[] = [];
    const toFetch: string[] = [];

    for (const { word } of shuffled) {
      const cached = getCachedVerb(word);
      if (cached) {
        docs.push(cached);
        verbCacheRef.current.set(word.toLowerCase(), cached);
      } else {
        toFetch.push(word);
      }
    }

    try {
      if (toFetch.length > 0) {
        const fetched = await Promise.all(toFetch.map((w) => getVerbConjugation(w, language)));
        for (const doc of fetched) {
          if (doc) {
            cacheVerb(doc);
            docs.push(doc);
          }
        }
      }

      if (docs.length > 0) {
        setDrillVerbs(docs);
        setDrillState('running');
      } else {
        setDrillState('idle');
        setError('Não foi possível carregar os verbos para o sprint.');
      }
    } catch {
      setDrillState('idle');
      setError('Erro ao iniciar o sprint.');
    }
  }, [learnedVerbs, language, profile?.uid, verbCacheRef]);

  function handleDrillClose() {
    setDrillState('idle');
    if (profile?.uid) {
      setBestSprintScore(readBestSprintScore(profile.uid, language));
    }
  }

  function handleReviewFromDrill(word: string) {
    handleSearch(word);
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
            <LanguageFlag language={language} size="lg" />
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

        {/* ── Search card ── */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 animate-slide-up-spring">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-surface-raised))',
                border: '1px solid var(--color-border)',
              }}
            >
              <BookMarked size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-text-primary">
                Pesquise qualquer verbo
              </p>
              <p className="mt-0.5 text-sm text-text-muted">
                Conjugação completa com exemplos em contexto.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(input); }}
            className="flex gap-3"
          >
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={langMeta.placeholder}
                aria-label="Digite um verbo para conjugar"
                className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none border transition-all duration-150 text-text-primary bg-surface-raised border-border focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="cta-shimmer shrink-0 relative overflow-hidden rounded-xl px-5 py-2.5 text-sm font-bold transition-all active:scale-95 active:translate-y-[2px]"
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
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : 'Conjugar'}
            </button>
          </form>
        </div>

        {/* ── Idle state (no result yet) ── */}
        {!verb && !loading && (
          <div className="flex flex-col gap-6 animate-slide-up-spring delay-75">
            {learnedVerbs.length > 0 && (
              <VerbChallengeCard
                bestScore={bestSprintScore}
                loading={drillState === 'loading'}
                onStart={startDrill}
              />
            )}

            {/* Learned verbs — collapsed preview with optional full library */}
            <LearnedVerbsSection
              verbs={learnedVerbs}
              onSelectVerb={handleSearch}
            />
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
            <VerbResultHero
              infinitive={verb.infinitive}
              translation={verb.translation}
              language={language}
              langLabel={langMeta.label}
              onClear={clearVerbResult}
            />

            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-8">
              <VerbTenseList
                verb={verb}
                openTenses={openTenses}
                toggleTense={toggleTense}
                language={language}
              />

              {verb.exampleSentences && verb.exampleSentences.length > 0 && (
                <VerbExamplesSection
                  examples={verb.exampleSentences}
                  language={language}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Drill Session Overlay ── */}
      {drillState === 'running' && profile?.uid && (
        <VerbDrillSession
          verbs={drillVerbs}
          language={language}
          uid={profile.uid}
          onClose={handleDrillClose}
          onReviewVerb={handleReviewFromDrill}
        />
      )}
    </div>
  );
}

