'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Languages, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getVerbConjugation } from '@/app/actions/getVerbConjugation';
import { getUserVocabulary, updateVocabTranslation } from '@/services/firestore';
import type { VerbDocument, SupportedLanguage, UserVocabularyDocument } from '@/types';
import { LANG_META } from './data';
import { VerbTenseList } from '@/components/verbs/VerbTenseList';
import { VerbResultHero } from '@/components/verbs/VerbResultHero';
import { VerbExamplesSection } from '@/components/verbs/VerbExamplesSection';
import { VerbDrillSession } from '@/components/verbs/VerbDrillSession';
import { VerbChallengeCard } from '@/components/verbs/VerbChallengeCard';
import { LearnedVerbsSection, type LearnedVerb } from '@/components/verbs/LearnedVerbsSection';
import { translateWordsBatch } from '@/app/actions/translateWord';
import { pickBatchTranslation } from '@/lib/vocabTranslation';
import { isMissingTranslation } from '@/utils/vocabHelpers';
import { VerbTabNav, type VerbTab } from '@/components/verbs/VerbTabNav';
import { LanguageFlag } from '@/components/LanguageFlag';
import {
  readVerbFromCache,
  writeVerbToCache,
  readBestSprintScore,
} from '@/utils/verbChallengeStorage';

const SPRINT_POOL_SIZE = 10;
const VERB_TRANSLATION_BATCH = 12;

async function fillMissingVerbTranslations(
  uid: string,
  language: SupportedLanguage,
  missing: UserVocabularyDocument[],
  isActive: () => boolean,
  onTranslated: (id: string, translation: string) => void,
) {
  for (let index = 0; index < missing.length; index += VERB_TRANSLATION_BATCH) {
    if (!isActive()) return;
    const batch = missing.slice(index, index + VERB_TRANSLATION_BATCH);
    const results = await translateWordsBatch(
      batch.map((item) => item.word),
      language,
      undefined,
      'initial',
    );
    for (const item of batch) {
      if (!isActive()) return;
      const translation = pickBatchTranslation(item.word, results, false);
      if (!translation) continue;
      try {
        await updateVocabTranslation(uid, item.word, language, translation, item.id);
      } catch (err) {
        console.error('[verbs] Falha ao salvar tradução de', item.word, err);
        continue;
      }
      onTranslated(item.id, translation);
    }
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VerbsPage() {
  const { profile } = useAuthStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verb, setVerb] = useState<VerbDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openTenses, setOpenTenses] = useState<Set<string>>(new Set(['present']));
  const [learnedVerbs, setLearnedVerbs] = useState<LearnedVerb[]>([]);
  const [verbsLoading, setVerbsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<VerbTab>('practice');
  const [tabInitialized, setTabInitialized] = useState(false);

  // Drill state
  const [drillState, setDrillState] = useState<'idle' | 'loading' | 'running'>('idle');
  const [drillVerbs, setDrillVerbs] = useState<VerbDocument[]>([]);
  const [bestSprintScore, setBestSprintScore] = useState<number | null>(null);

  const verbCacheRef = useRef<Map<string, VerbDocument>>(new Map());

  const language = (profile?.currentTargetLanguage ?? 'fr') as SupportedLanguage;
  const langMeta = LANG_META[language];

  useEffect(() => {
    setTabInitialized(false);
  }, [language]);

  useEffect(() => {
    const uid = profile?.uid;
    if (!uid) {
      setVerbsLoading(false);
      return;
    }
    let active = true;
    setVerbsLoading(true);
    getUserVocabulary(uid, language)
      .then((items) => {
        if (!active) return;
        const verbItems = items.filter((item) => item.wordType === 'verb');
        setLearnedVerbs(
          verbItems.map((item) => ({
            id: item.id,
            word: item.word,
            translation: isMissingTranslation(item) ? undefined : item.translation.trim(),
            firstSeen: item.firstSeen?.toMillis?.() ?? 0,
          })),
        );
        const missing = verbItems.filter(isMissingTranslation);
        if (missing.length > 0) {
          void fillMissingVerbTranslations(uid, language, missing, () => active, (id, translation) => {
            setLearnedVerbs((current) => current.map((verb) => (
              verb.id === id ? { ...verb, translation } : verb
            )));
          });
        }
      })
      .finally(() => {
        if (active) setVerbsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profile?.uid, language]);

  useEffect(() => {
    if (!verbsLoading && !tabInitialized) {
      setActiveTab(learnedVerbs.length > 0 ? 'practice' : 'library');
      setTabInitialized(true);
    }
  }, [verbsLoading, tabInitialized, learnedVerbs.length]);

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
    setActiveTab('library');
  }

  function handleTabChange(tab: VerbTab) {
    setVerb(null);
    setError(null);
    setActiveTab(tab);
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
    <div className="min-h-dvh pb-24 md:pb-10 animate-fade-in" style={{ backgroundColor: 'var(--color-bg)' }}>
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
            Meus Verbos
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-5 pt-5 flex flex-col gap-5">
        {verbsLoading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            <p className="text-sm font-medium text-text-muted">Carregando verbos…</p>
          </div>
        ) : (
          <>
            <VerbTabNav
              activeTab={activeTab}
              totalCount={learnedVerbs.length}
              onTabChange={handleTabChange}
            />

            {!verb && !loading && activeTab === 'practice' && (
              learnedVerbs.length > 0 ? (
                <VerbChallengeCard
                  bestScore={bestSprintScore}
                  loading={drillState === 'loading'}
                  onStart={startDrill}
                />
              ) : (
                <div className="rounded-2xl border border-border bg-surface p-8 flex flex-col items-center text-center gap-4 animate-slide-up-spring">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: 'var(--color-verb-bg)' }}
                  >
                    <Languages size={28} style={{ color: 'var(--color-verb)' }} />
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-text-primary">Nenhum verbo ainda</p>
                    <p className="mt-1 text-sm text-text-muted max-w-xs">
                      Conclua uma lição para praticar aqui, ou busque qualquer verbo na biblioteca.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('library')}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold transition-all active:scale-95 cursor-pointer text-white"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      boxShadow: '0 3px 0 var(--color-primary-dark)',
                    }}
                  >
                    Abrir biblioteca
                  </button>
                </div>
              )
            )}

            {!verb && !loading && activeTab === 'library' && (
              <LearnedVerbsSection
                verbs={learnedVerbs}
                query={input}
                placeholder={langMeta.placeholder}
                conjugating={loading}
                onQueryChange={setInput}
                onConjugate={handleSearch}
              />
            )}
          </>
        )}

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

