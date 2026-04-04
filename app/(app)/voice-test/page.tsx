'use client';

import { useState, useRef, useCallback } from 'react';
import { Volume2, Loader2, Square, ArrowLeft, Play, Users } from 'lucide-react';
import Link from 'next/link';
import { synthesizeSpeechWithVoice } from '@/app/actions/synthesizeSpeech';

/* ------------------------------------------------------------------ */
/*  Voice catalogue — sourced from Google TTS API for fr-FR           */
/* ------------------------------------------------------------------ */

interface VoiceOption {
  id: string;
  name: string;
  label: string;
  gender: 'Feminina' | 'Masculina';
  type: string;
  current?: boolean;
}

const FRENCH_VOICES: VoiceOption[] = [
  // Studio
  { id: 'fr-FR-Studio-A', name: 'fr-FR-Studio-A', label: 'Studio-A', gender: 'Feminina', type: 'Studio' },
  { id: 'fr-FR-Studio-D', name: 'fr-FR-Studio-D', label: 'Studio-D', gender: 'Masculina', type: 'Studio' },

  // Chirp-HD
  { id: 'fr-FR-Chirp-HD-D', name: 'fr-FR-Chirp-HD-D', label: 'Chirp-HD-D', gender: 'Masculina', type: 'Chirp-HD' },
  { id: 'fr-FR-Chirp-HD-F', name: 'fr-FR-Chirp-HD-F', label: 'Chirp-HD-F', gender: 'Feminina', type: 'Chirp-HD' },
  { id: 'fr-FR-Chirp-HD-O', name: 'fr-FR-Chirp-HD-O', label: 'Chirp-HD-O', gender: 'Feminina', type: 'Chirp-HD' },

  // Chirp3-HD — Female
  { id: 'fr-FR-Chirp3-HD-Achernar', name: 'fr-FR-Chirp3-HD-Achernar', label: 'Achernar', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Aoede', name: 'fr-FR-Chirp3-HD-Aoede', label: 'Aoede', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Autonoe', name: 'fr-FR-Chirp3-HD-Autonoe', label: 'Autonoe', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Callirrhoe', name: 'fr-FR-Chirp3-HD-Callirrhoe', label: 'Callirrhoe', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Despina', name: 'fr-FR-Chirp3-HD-Despina', label: 'Despina', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Erinome', name: 'fr-FR-Chirp3-HD-Erinome', label: 'Erinome', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Gacrux', name: 'fr-FR-Chirp3-HD-Gacrux', label: 'Gacrux', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Kore', name: 'fr-FR-Chirp3-HD-Kore', label: 'Kore', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Laomedeia', name: 'fr-FR-Chirp3-HD-Laomedeia', label: 'Laomedeia', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Leda', name: 'fr-FR-Chirp3-HD-Leda', label: 'Leda', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Pulcherrima', name: 'fr-FR-Chirp3-HD-Pulcherrima', label: 'Pulcherrima', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Sulafat', name: 'fr-FR-Chirp3-HD-Sulafat', label: 'Sulafat', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Vindemiatrix', name: 'fr-FR-Chirp3-HD-Vindemiatrix', label: 'Vindemiatrix', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Zephyr', name: 'fr-FR-Chirp3-HD-Zephyr', label: 'Zephyr', gender: 'Feminina', type: 'Chirp3-HD' },

  // Chirp3-HD — Male
  { id: 'fr-FR-Chirp3-HD-Achird', name: 'fr-FR-Chirp3-HD-Achird', label: 'Achird', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Algenib', name: 'fr-FR-Chirp3-HD-Algenib', label: 'Algenib', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Algieba', name: 'fr-FR-Chirp3-HD-Algieba', label: 'Algieba', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Alnilam', name: 'fr-FR-Chirp3-HD-Alnilam', label: 'Alnilam', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Charon', name: 'fr-FR-Chirp3-HD-Charon', label: 'Charon', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Enceladus', name: 'fr-FR-Chirp3-HD-Enceladus', label: 'Enceladus', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Fenrir', name: 'fr-FR-Chirp3-HD-Fenrir', label: 'Fenrir', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Iapetus', name: 'fr-FR-Chirp3-HD-Iapetus', label: 'Iapetus', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Orus', name: 'fr-FR-Chirp3-HD-Orus', label: 'Orus', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Puck', name: 'fr-FR-Chirp3-HD-Puck', label: 'Puck', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Rasalgethi', name: 'fr-FR-Chirp3-HD-Rasalgethi', label: 'Rasalgethi', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Sadachbia', name: 'fr-FR-Chirp3-HD-Sadachbia', label: 'Sadachbia', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Sadaltager', name: 'fr-FR-Chirp3-HD-Sadaltager', label: 'Sadaltager', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Schedar', name: 'fr-FR-Chirp3-HD-Schedar', label: 'Schedar', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Umbriel', name: 'fr-FR-Chirp3-HD-Umbriel', label: 'Umbriel', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Zubenelgenubi', name: 'fr-FR-Chirp3-HD-Zubenelgenubi', label: 'Zubenelgenubi', gender: 'Masculina', type: 'Chirp3-HD' },
];

/* ------------------------------------------------------------------ */
/*  Sample dialogue                                                   */
/* ------------------------------------------------------------------ */

const SAMPLE_TEXTS = [
  { label: 'Saudacao', text: 'Bonjour ! Comment allez-vous aujourd\'hui ?' },
  { label: 'Pedido', text: 'Je voudrais un croissant et un cafe, s\'il vous plait.' },
  { label: 'Frase longa', text: 'La vie est belle quand on prend le temps de regarder autour de soi et d\'apprecier les petits moments.' },
  { label: 'Pergunta', text: 'Est-ce que vous pourriez me dire ou se trouve la gare, s\'il vous plait ?' },
];

const DIALOGUE_LINES = [
  { speaker: 'Marie', text: 'Bonjour ! Vous avez choisi ?' },
  { speaker: 'Pierre', text: 'Oui, je voudrais un croissant et un cafe, s\'il vous plait.' },
  { speaker: 'Marie', text: 'Un cafe creme ou un cafe noir ?' },
  { speaker: 'Pierre', text: 'Un cafe creme, avec un peu de sucre.' },
  { speaker: 'Marie', text: 'Tres bien ! Et pour le croissant, nature ou au beurre ?' },
  { speaker: 'Pierre', text: 'Au beurre, bien sur ! C\'est toujours meilleur.' },
  { speaker: 'Marie', text: 'Excellent choix ! Ce sera tout ?' },
  { speaker: 'Pierre', text: 'Oui, merci beaucoup. L\'addition, s\'il vous plait.' },
];

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type Tab = 'voices' | 'dialogue';
type PlayingState = string | null; // voice id or `dialogue-${index}`

const TYPE_COLORS: Record<string, string> = {
  Studio: 'bg-purple-50 text-purple-700 border-purple-300',
  'Chirp-HD': 'bg-teal-50 text-teal-700 border-teal-300',
  'Chirp3-HD': 'bg-orange-50 text-orange-700 border-orange-300',
};

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
                  <div
                    key={voice.id}
                    className={`bg-white rounded-2xl p-3.5 shadow-sm border transition-colors ${
                      isThisPlaying
                        ? 'border-indigo-400 ring-2 ring-indigo-100'
                        : voice.current
                          ? 'border-amber-300 bg-amber-50/30'
                          : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => isThisPlaying ? stop() : playVoice(voice)}
                        disabled={!!loadingId}
                        className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                          isThisPlaying
                            ? 'bg-indigo-600 text-white scale-110'
                            : isThisLoading
                              ? 'bg-indigo-100 text-indigo-400'
                              : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600 active:scale-95'
                        }`}
                      >
                        {isThisLoading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : isThisPlaying ? (
                          <Square size={14} fill="currentColor" />
                        ) : (
                          <Volume2 size={18} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900">{voice.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${TYPE_COLORS[voice.type]}`}>
                            {voice.type}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            voice.gender === 'Feminina'
                              ? 'bg-pink-50 text-pink-600 border border-pink-200'
                              : 'bg-sky-50 text-sky-600 border border-sky-200'
                          }`}>
                            {voice.gender}
                          </span>
                          {voice.current && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-300">
                              Atual
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono truncate">{voice.name}</p>
                      </div>
                    </div>
                  </div>
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
                  <div
                    key={i}
                    className={`rounded-2xl p-3.5 border transition-all ${
                      isActive
                        ? isMarie
                          ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-100'
                          : 'bg-sky-50 border-sky-300 ring-2 ring-sky-100'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                        isMarie
                          ? 'bg-pink-100 text-pink-600'
                          : 'bg-sky-100 text-sky-600'
                      }`}>
                        {isMarie ? 'M' : 'P'}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <span className={`text-[11px] font-semibold ${
                          isMarie ? 'text-pink-500' : 'text-sky-500'
                        }`}>
                          {line.speaker}
                        </span>
                        <p className="text-sm text-slate-800 mt-0.5 leading-relaxed">{line.text}</p>
                      </div>

                      {/* Individual play */}
                      <button
                        onClick={async () => {
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
                        disabled={!!loadingId}
                        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isLinePlaying
                            ? 'bg-indigo-600 text-white'
                            : isLineLoading
                              ? 'bg-indigo-100 text-indigo-400'
                              : 'bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 active:scale-90'
                        }`}
                      >
                        {isLineLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isLinePlaying ? (
                          <Square size={12} fill="currentColor" />
                        ) : (
                          <Volume2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
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
