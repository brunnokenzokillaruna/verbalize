import { findTranslationHighlightRange } from '../lib/dialogueNarration';

const cases: Array<{ line: string; translation: string; expected: string | null }> = [
  // The attached screenshot: "essayer" → "tentar" inside the fixed translation.
  {
    line: 'É verdade, vou tentar assistir a outra ficção amanhã.',
    translation: 'tentar',
    expected: 'tentar',
  },
  // Conjugated in the sentence, infinitive in the tooltip.
  {
    line: 'Eu tento chegar cedo.',
    translation: 'tentar',
    expected: 'tento',
  },
  {
    line: 'Ela assiste ao filme.',
    translation: 'assistir',
    expected: 'assiste',
  },
  // Multi-word expression split across the sentence: fall back to the most
  // specific word rather than dropping the highlight entirely.
  {
    line: 'O terreno parece estar abandonado agora.',
    translation: 'terreno abandonado',
    expected: 'abandonado',
  },
  {
    line: 'Não faz sentido pagar tanto.',
    translation: 'faz sentido',
    expected: 'faz sentido',
  },
  // Articles in the translation must not block the match.
  {
    line: 'Vou pedir a conta.',
    translation: 'a conta',
    expected: 'conta',
  },
  // Gender agreement.
  {
    line: 'A casa está bonita.',
    translation: 'bonito',
    expected: 'bonita',
  },
  // Genuinely absent wording stays unhighlighted instead of guessing.
  {
    line: 'Bom dia, tudo bem?',
    translation: 'guarda-chuva',
    expected: null,
  },
];

let failures = 0;
for (const { line, translation, expected } of cases) {
  const range = findTranslationHighlightRange(line, translation);
  const actual = range ? line.slice(range.start, range.end) : null;
  if (actual !== expected) {
    failures += 1;
    console.error(
      `FAIL\n  line:        ${line}\n  translation: ${translation}\n  expected:    ${expected}\n  actual:      ${actual}`,
    );
  }
}

console.log(failures === 0 ? `OK — ${cases.length} casos passaram` : `${failures} falha(s)`);
process.exit(failures === 0 ? 0 : 1);
