'use server';

import { callGeminiJSON } from '@/services/gemini';
import type { SupportedLanguage, PhoneticsTipResult } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

const FRENCH_SOUND_RULES = `FRENCH SOUND-TO-PT-BR MAPPING:

1. ⚠️ NASAL VOWELS — THE #1 TRAP. Use PT-BR nasal spellings (the nasal already exists in Portuguese: "bom", "lã", "cem"). NEVER split a nasal vowel into "vowel-Ã".
   • "on" / "om" (bon, mon, long, bonjour) → "om"
       bon = BOM (NOT "BÔ-Ã"), long = LOM (NOT "LÔ-Ã"), bonjour = bom-JUR, mon = MOM
   • "an" / "en" / "am" / "em" (grand, enfant, temps, France) → "ã"
       grand = GRÃ, enfant = ã-FÃ, temps = TÃ, France = FRÃS
   • "in" / "im" / "ain" / "ein" (vin, pain, matin, bien) → "ẽ"
       vin = VẼ, pain = PẼ, matin = ma-TẼ, bien = bi-Ẽ
   • "un" / "um" (un, lundi, brun) → "ãn" (boca relaxada, som preso)
       un = ÃN (NOT "Ã-Ã"), lundi = lãn-DI
   *** FORBIDDEN PATTERNS: "BÔ-Ã", "LÔ-Ã", "Ã-Ã", "GRÃ-D", "VẼ-N". These split one nasal vowel into fake syllables. A Brazilian reading "BOM" out loud already hits the correct French sound. ***

2. FRENCH R [ʁ] → "rrr" (back of throat, never rolled like PT-BR R):
   regarde = rrr-GARD, Paris = pa-RRRI, merci = mer-SI (word-final r is softer)

3. FRENCH U [y] → "ü" — lips say U, tongue says I. NEVER plain "u":
   tu = TÜ, vue = VÜ, salut = sa-LÜ

4. SILENT FINAL CONSONANTS (t, s, d, x, p, z) — do NOT write them:
   petit = pe-TI, grand = GRÃ, deux = DÔ, vous = VU, trop = TRÔ

5. DIGRAPHS:
   • "ch" → "x" (as in "xícara"): chat = XA, chose = XOZ
   • "gn" → "nh": montagne = mon-TA-nhe, Espagne = es-PA-nhe
   • "ou" → "u": vous = VU, jour = JUR
   • "au" / "eau" → "ô": beau = BÔ, chaud = XÔ
   • "oi" → "uá": moi = MUÁ, toi = TUÁ
   • "eu" / "œu" → "ê" (lábios arredondados): deux = DÊ (mais fechado), cœur = KÊR

6. "é" → "ê" (fechado); "è" / "ê" → "é" (aberto); "e" final mudo → não escreve.
   été = ê-TÊ, père = PÉR, fenêtre = fe-NÉTR`;

const ENGLISH_SOUND_RULES = `ENGLISH SOUND-TO-PT-BR MAPPING:

1. TH — doesn't exist in PT-BR. Write the closest PT-BR sound and always add a tip:
   • Voiceless th [θ] (think, three) → "f" ou "t" (com dica "língua entre os dentes, sopra"):
       think = FINK, three = FRI, thanks = FÉNKS
   • Voiced th [ð] (this, that, the) → "d" (com dica "língua entre os dentes, vibra"):
       this = DIS, that = DÉT, the = DA

2. SHORT vs LONG vowels — marque a diferença:
   • Short i [ɪ] (sit, big) → "í" curto: sit = SÍT, big = BÍG
   • Long e [iː] (seat, see) → "ii" alongado: seat = SIIT, see = SII
   • Short a [æ] (cat, bad) → "é" aberto: cat = KÉT, bad = BÉD
   • Short u [ʌ] (cup, love) → "ã" curto: cup = KÃP, love = LÃV

3. SCHWA [ə] (vogal átona relaxada) → "ã" curto ou "ê" neutro:
   about = ã-BAUT, sofa = SÔ-fã, teacher = TI-tchã

4. ENGLISH R → "r" americano encostando a língua no céu da boca (NÃO o R de "carro"):
   • Início de palavra: car = KAAR, red = RÉD
   • Final (inglês americano): better = BÉ-rr, car = KAAR (alongado)

5. FINAL VOICED CONSONANTS — são pronunciadas de verdade (brasileiro tende a soltar vogal extra):
   dog = DÓG (NÃO "dógui"), big = BÍG (NÃO "bígui"), love = LÃV (NÃO "lóve")

6. DIGRAPHS:
   • "sh" → "x": she = XI, fish = FÍX
   • "ch" → "tch": cheese = TCHIIZ, much = MÃTCH
   • "ee" / "ea" → "ii": see = SII, eat = IIT
   • "oo" longo → "u" alongado: food = FUUD, moon = MUUN
   • "oo" curto → "u" curto: book = BÚK, good = GÚD`;

interface GeneratePhoneticsTipParams {
  dialogue: string;
  grammarFocus: string;
  language: SupportedLanguage;
}

/**
 * Generates a Brazilian-friendly phonetics tip for PRON lessons.
 * Uses plain PT-BR syllable approximations instead of IPA.
 * Fires in parallel with the minimal hook.
 */
export async function generatePhoneticsTip(
  params: GeneratePhoneticsTipParams,
): Promise<PhoneticsTipResult | null> {
  const { dialogue, grammarFocus, language } = params;

  try {
    const systemPrompt = `You are a phonetics coach for Brazilian Portuguese speakers learning ${LANG_LABEL[language]}. Respond with ONLY valid JSON, no markdown, no explanation.`;

    const langRules = language === 'fr' ? FRENCH_SOUND_RULES : ENGLISH_SOUND_RULES;

    const prompt = `The lesson's phonetic focus is "${grammarFocus}" in ${LANG_LABEL[language]}.

Dialogue for context (pick 3 real words from here):
"${dialogue}"

Generate a phonetics tip using ONLY plain Brazilian Portuguese — no IPA, no linguistics jargon. Explain sounds via body sensations and familiar comparisons.

BANNED WORDS (never use): gutural, fricativa, sonoridade, fonema, oclusiva, nasal, palatal, velar, alvéolo, laringe.
Instead use: "fundo da garganta", "ponta da língua", "biquinho de beijo", "como se fosse cuspir", "lábios arredondados", "som de Z", etc.

═══ "soundsLike" TRANSCRIPTION RULES — READ CAREFULLY ═══
Goal: a Brazilian who has NEVER heard the word should read your "soundsLike" out loud and sound close to a native speaker.

UNIVERSAL RULES:
• Use only PT-BR letters/digraphs. Separate syllables with hyphens. Stressed syllable in CAPS.
• NEVER use IPA (/ʁ/, /y/, /ɛ̃/, etc.) or English respelling like "oh", "ay", "ee".
• One sound = one PT-BR spelling. Don't invent fake syllables just to fill space.

${langRules}

Output ONLY this JSON:
{
  "title": "Short catchy title in plain PT-BR — any Brazilian understands it (ex: 'O R que vem da garganta', 'O som de U com biquinho', 'A vogal nasal francesa')",
  "explanation": "2-3 sentences in CASUAL PT-BR using analogies. Be fun and encouraging. Ex: 'O R francês nasce lá no fundo da garganta — imagina que você está prestes a cuspir, mas bem levinho. Nada de vibrar a pontinha da língua como a gente faz!'",
  "examples": [
    { "word": "real word from the dialogue above", "soundsLike": "PT-BR respelling following the rules above", "tip": "Dica curta em PT-BR — sem termos técnicos. Se a palavra tem vogal nasal francesa (om/ã/ẽ/ãn), SEMPRE reforce: 'é UM som só, não separe em duas sílabas'." },
    { "word": "second real word from dialogue", "soundsLike": "...", "tip": "..." },
    { "word": "third real word from dialogue", "soundsLike": "...", "tip": "..." }
  ],
  "brazilianTrap": "The most common mistake Brazilians make with this sound — in plain everyday language, no jargon. Be concrete. Ex: 'A gente tende a vibrar a ponta da língua como no nosso R, mas no francês o R fica parado — é a garganta que trabalha.'"
}

Final rules:
- All three example words MUST appear literally in the dialogue above
- NEVER use IPA symbols
- "soundsLike" must be readable by any Brazilian with no linguistics background
- Before outputting, re-read each "soundsLike" and ask: would a Brazilian reading this out loud actually sound close to the native? If you wrote "BÔ-Ã" for "bon", STOP and fix it to "BOM".`;

    return await callGeminiJSON<PhoneticsTipResult>(prompt, systemPrompt, 1500, 0);
  } catch (err) {
    console.error('[generatePhoneticsTip] Error:', err);
    return null;
  }
}
