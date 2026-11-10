/**
 * Smoke-test dialogue TTS providers (ElevenLabs → Gemini → Google).
 *
 * Run: npx tsx scripts/smoke-tts.ts
 *
 * Exit codes:
 *   0 — skipped (no keys) OR at least one provider succeeded per language
 *   1 — keys present but a required provider chain failed
 */
import fs from 'fs';
import path from 'path';

function loadEnv(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(path.join(process.cwd(), '.env.local'));
loadEnv(path.join(process.cwd(), '.env'));

const DIALOGUES = {
  fr: [
    ['Sophie: Bonjour ! Ça va ?', 'Marc: Oui, très bien merci.'],
    ['Léa: Où est la gare ?', 'Paul: Tout droit, à gauche.'],
  ],
  en: [
    ['Alice: Hi! How are you today?', 'Bob: Pretty good, thanks for asking.'],
    ['Sam: Where is the library?', 'Alex: Two blocks down on the right.'],
  ],
} as const;

type Lang = keyof typeof DIALOGUES;

function summarizeChunks(chunks: string[]): string {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  return `${chunks.length} chunk(s), ~${Math.round(total / 1024)}KB base64`;
}

async function main() {
  const hasEleven = Boolean(process.env.ELEVENLABS_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasGoogle = Boolean(
    process.env.GOOGLE_TTS_API_KEY ||
      process.env.GOOGLE_CLOUD_API_KEY ||
      process.env.GCP_API_KEY,
  );

  console.log('TTS smoke — keys:', {
    elevenlabs: hasEleven,
    gemini: hasGemini,
    google: hasGoogle,
  });

  if (!hasEleven && !hasGemini && !hasGoogle) {
    console.log('SKIP: no TTS API keys in env — nothing to smoke.');
    process.exit(0);
  }

  const { synthesizeDialogueElevenLabs } = await import(
    '../app/actions/synthesizeElevenLabs'
  );
  const { synthesizeDialogueGemini } = await import(
    '../app/actions/synthesizeGeminiTts'
  );
  const { synthesizeDialogue } = await import('../app/actions/synthesizeSpeech');

  let failures = 0;

  for (const language of Object.keys(DIALOGUES) as Lang[]) {
    for (const [index, lines] of DIALOGUES[language].entries()) {
      const label = `${language}#${index + 1}`;
      const expected = lines.length;
      let ok = false;

      if (hasEleven) {
        try {
          const chunks = await synthesizeDialogueElevenLabs([...lines], language);
          if (chunks.length === expected) {
            console.log(`PASS ${label} elevenlabs — ${summarizeChunks(chunks)}`);
            ok = true;
          } else {
            console.warn(
              `WARN ${label} elevenlabs — got ${chunks.length}/${expected} chunks`,
            );
          }
        } catch (err) {
          console.warn(`WARN ${label} elevenlabs —`, (err as Error).message);
        }
      }

      if (!ok && hasGemini) {
        try {
          const result = await synthesizeDialogueGemini([...lines], language);
          if (result?.chunks?.length) {
            console.log(
              `PASS ${label} gemini — ${summarizeChunks(result.chunks)} mime=${result.mimeType} monolithic=${result.monolithic}`,
            );
            ok = true;
          } else {
            console.warn(`WARN ${label} gemini — no audio`);
          }
        } catch (err) {
          console.warn(`WARN ${label} gemini —`, (err as Error).message);
        }
      }

      if (!ok && hasGoogle) {
        try {
          const chunks = await synthesizeDialogue([...lines], language);
          if (chunks.length === expected) {
            console.log(`PASS ${label} google — ${summarizeChunks(chunks)}`);
            ok = true;
          } else {
            console.warn(
              `WARN ${label} google — got ${chunks.length}/${expected} chunks`,
            );
          }
        } catch (err) {
          console.warn(`WARN ${label} google —`, (err as Error).message);
        }
      }

      if (!ok) {
        console.error(`FAIL ${label} — no provider returned usable audio`);
        failures += 1;
      }
    }
  }

  if (failures > 0) {
    console.error(`TTS smoke finished with ${failures} failure(s).`);
    process.exit(1);
  }

  console.log('TTS smoke OK.');
}

main().catch((err) => {
  console.error('TTS smoke crashed:', err);
  process.exit(1);
});
