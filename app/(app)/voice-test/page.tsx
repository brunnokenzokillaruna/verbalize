'use client';

import { useState, useRef, useCallback } from 'react';
import { Volume2, Loader2, Square, ArrowLeft, Play, Users } from 'lucide-react';
import Link from 'next/link';
import { synthesizeSpeechWithVoice } from '@/app/actions/synthesizeSpeech';
import { FRENCH_VOICES, SAMPLE_TEXTS, DIALOGUE_LINES, type VoiceOption } from './data';
import { TYPE_COLORS, VoiceCard, DialogueLineCard } from './components';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type Tab = 'voices' | 'dialogue';
type PlayingState = string | null; // voice id or `dialogue-${index}`



/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function VoiceTestPage() {
  const [tab, setTab] = useState<Tab>('voices');

  // --- Voice explorer state ---
  const [playing, setPlaying] = useState<PlayingState>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<'all' | 'Feminina' | 'Masculina'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedText, setSelectedText] = useState(0);
  const [customText, setCustomText] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());

  // --- Dialogue state ---
  const [femaleVoice, setFemaleVoice] = useState<string>('fr-FR-Neural2-F');
  const [maleVoice, setMaleVoice] = useState<string>('fr-FR-Neural2-G');
  const [dialoguePlaying, setDialoguePlaying] = useState(false);
  const [dialogueLineIdx, setDialogueLineIdx] = useState(-1);
  const dialogueAbortRef = useRef(false);

  /* ---- Audio helpers ---- */

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
    setLoadingId(null);
    dialogueAbortRef.current = true;
    setDialoguePlaying(false);
    setDialogueLineIdx(-1);
  }, []);

  const playBase64 = useCallback((base64: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(`data:audio/mp3;base64,${base64}`);
      audioRef.current = audio;
      audio.onended = () => { audioRef.current = null; resolve(); };
      audio.onerror = () => { audioRef.current = null; reject(); };
      audio.play().catch(reject);
    });
  }, []);

  const fetchAudio = useCallback(async (text: string, voiceName: string) => {
    const cacheKey = `${voiceName}:${text}`;
    let base64 = cacheRef.current.get(cacheKey) ?? null;
    if (!base64) {
      base64 = await synthesizeSpeechWithVoice(text, 'fr-FR', voiceName);
      if (base64) cacheRef.current.set(cacheKey, base64);
    }
    return base64;
  }, []);

  /* ---- Single voice play ---- */

  const playVoice = useCallback(async (voice: VoiceOption) => {
    stop();
    const text = customText.trim() || SAMPLE_TEXTS[selectedText].text;
    setLoadingId(voice.id);
    try {
      const base64 = await fetchAudio(text, voice.name);
      if (!base64) return;
      setPlaying(voice.id);
      setLoadingId(null);
      await playBase64(base64);
    } catch {
      // ignore
    } finally {
      setPlaying(null);
      setLoadingId(null);
    }
  }, [stop, selectedText, customText, fetchAudio, playBase64]);

  /* ---- Dialogue play ---- */

  const playDialogue = useCallback(async () => {
    stop();
    dialogueAbortRef.current = false;
    setDialoguePlaying(true);

    for (let i = 0; i < DIALOGUE_LINES.length; i++) {
      if (dialogueAbortRef.current) break;
      const line = DIALOGUE_LINES[i];
      const voiceName = line.speaker === 'Marie' ? femaleVoice : maleVoice;

      setDialogueLineIdx(i);
      setLoadingId(`dialogue-${i}`);

      try {
        const base64 = await fetchAudio(line.text, voiceName);
        if (dialogueAbortRef.current || !base64) break;
        setLoadingId(null);
        setPlaying(`dialogue-${i}`);
        await playBase64(base64);
        // Small pause between lines
        if (!dialogueAbortRef.current) {
          await new Promise((r) => setTimeout(r, 400));
        }
      } catch {
        break;
      }
    }

    setDialoguePlaying(false);
    setDialogueLineIdx(-1);
    setPlaying(null);
    setLoadingId(null);
  }, [stop, femaleVoice, maleVoice, fetchAudio, playBase64]);

  /* ---- Filtered voices ---- */

  const filteredVoices = FRENCH_VOICES.filter((v) => {
    if (genderFilter !== 'all' && v.gender !== genderFilter) return false;
    if (typeFilter !== 'all' && v.type !== typeFilter) return false;
    return true;
  });

  const voiceTypes = [...new Set(FRENCH_VOICES.map((v) => v.type))];
  const femaleVoices = FRENCH_VOICES.filter((v) => v.gender === 'Feminina');
  const maleVoices = FRENCH_VOICES.filter((v) => v.gender === 'Masculina');

  /* ---- Render ---- */

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Teste de Vozes</h1>
            <p className="text-xs text-slate-500">Compare vozes do Google TTS em frances</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-2">
          <button
            onClick={() => { stop(); setTab('voices'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === 'voices'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Volume2 size={16} />
            Explorar Vozes
          </button>
          <button
            onClick={() => { stop(); setTab('dialogue'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === 'dialogue'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users size={16} />
            Teste de Dialogo
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* ============================================================ */}
        {/*  TAB: VOICE EXPLORER                                        */}
        {/* ============================================================ */}
        {tab === 'voices' && (
          <>
            {/* Sample text selector */}
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Texto de teste</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {SAMPLE_TEXTS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedText(i); setCustomText(''); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedText === i && !customText
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate-800 bg-slate-50 rounded-xl px-4 py-3 italic leading-relaxed">
                &ldquo;{customText.trim() || SAMPLE_TEXTS[selectedText].text}&rdquo;
              </p>
              <input
                type="text"
                placeholder="Ou digite um texto personalizado..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="mt-3 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-slate-400"
              />
            </section>

            {/* Filters */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-500">Genero:</span>
                {(['all', 'Feminina', 'Masculina'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      genderFilter === g
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {g === 'all' ? 'Todos' : g}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-500">Tipo:</span>
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    typeFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Todos
                </button>
                {voiceTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      typeFilter === t
                        ? 'bg-indigo-600 text-white'
                        : `border ${TYPE_COLORS[t]} hover:opacity-80`
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </section>

            {/* Count */}
            <p className="text-xs text-slate-400">{filteredVoices.length} vozes encontradas</p>

            {/* Voice cards */}
            <section className="space-y-2">
              {filteredVoices.map((voice) => {
                const isThisPlaying = playing === voice.id;
                const isThisLoading = loadingId === voice.id;

                return (
                  <VoiceCard
                    key={voice.id}
                    voice={voice}
                    isPlaying={isThisPlaying}
                    isLoading={isThisLoading}
                    onPlay={() => playVoice(voice)}
                    onStop={stop}
                    loadingId={loadingId}
                  />
                );
              })}
            </section>

            {/* Legend */}
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <h2 className="text-sm font-semibold text-slate-700 mb-2">Sobre os tipos de voz</h2>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p><strong className="text-purple-700">Studio</strong> — Qualidade profissional de estudio. Excelente para narracoes.</p>
                <p><strong className="text-teal-700">Chirp-HD</strong> — Geracao recente do Google. Vozes bem naturais.</p>
                <p><strong className="text-orange-700">Chirp3-HD</strong> — A geracao mais recente. 30 vozes unicas com personalidades distintas.</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">No app, as vozes sao escolhidas aleatoriamente a cada licao para variar a experiencia.</p>
            </section>
          </>
        )}

        {/* ============================================================ */}
        {/*  TAB: DIALOGUE TEST                                         */}
        {/* ============================================================ */}
        {tab === 'dialogue' && (
          <>
            {/* Voice selectors */}
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-sm font-semibold text-slate-700">Escolha as vozes do dialogo</h2>

              {/* Female voice selector */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-pink-600 mb-2">
                  <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-[10px]">F</span>
                  Marie (feminina)
                </label>
                <select
                  value={femaleVoice}
                  onChange={(e) => setFemaleVoice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                >
                  {femaleVoices.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.label} ({v.type}){v.current ? ' — atual' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Male voice selector */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-sky-600 mb-2">
                  <span className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center text-[10px]">M</span>
                  Pierre (masculina)
                </label>
                <select
                  value={maleVoice}
                  onChange={(e) => setMaleVoice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
                >
                  {maleVoices.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.label} ({v.type}){v.current ? ' — atual' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Play dialogue button */}
              <button
                onClick={() => dialoguePlaying ? stop() : playDialogue()}
                className={`w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  dialoguePlaying
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
                }`}
              >
                {dialoguePlaying ? (
                  <>
                    <Square size={16} fill="currentColor" />
                    Parar Dialogo
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    Ouvir Dialogo Completo
                  </>
                )}
              </button>
            </section>

            {/* Dialogue lines */}
            <section className="space-y-2">
              {DIALOGUE_LINES.map((line, i) => {
                const isMarie = line.speaker === 'Marie';
                const isActive = dialogueLineIdx === i;
                const isLineLoading = loadingId === `dialogue-${i}`;
                const isLinePlaying = playing === `dialogue-${i}`;

                return (
                  <DialogueLineCard
                    key={i}
                    line={line}
                    isActive={isActive}
                    isLineLoading={isLineLoading}
                    isLinePlaying={isLinePlaying}
                    loadingId={loadingId}
                    onPlay={async () => {
                      stop();
                      const voiceName = isMarie ? femaleVoice : maleVoice;
                      setLoadingId(`dialogue-${i}`);
                      try {
                        const base64 = await fetchAudio(line.text, voiceName);
                        if (!base64) return;
                        setLoadingId(null);
                        setPlaying(`dialogue-${i}`);
                        setDialogueLineIdx(i);
                        await playBase64(base64);
                      } catch {
                        // ignore
                      } finally {
                        setPlaying(null);
                        setLoadingId(null);
                        setDialogueLineIdx(-1);
                      }
                    }}
                  />
                );
              })}
            </section>

            {/* Tips */}
            <section className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
              <p className="text-xs text-indigo-700 leading-relaxed">
                <strong>Dica:</strong> Experimente combinar vozes de tipos diferentes para maior contraste.
                Por exemplo, uma voz Chirp3-HD feminina com uma Studio masculina, ou duas Chirp3-HD diferentes.
                Voce tambem pode clicar no icone de audio de cada linha para ouvir individualmente.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
