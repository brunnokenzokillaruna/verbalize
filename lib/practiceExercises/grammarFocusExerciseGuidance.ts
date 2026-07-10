import type { SupportedLanguage } from '@/types';

/**
 * Extra prompt rules when the grammar focus needs exercise types that avoid
 * misleading error-correction highlights (pronoun placement, word order, etc.).
 */
export function buildGrammarFocusExerciseGuidance(
  grammarFocus: string,
  language: SupportedLanguage,
): string {
  const focus = grammarFocus.toLowerCase();

  if (language === 'fr') {
    const isCoi =
      focus.includes('coi') ||
      focus.includes('objeto indireto') ||
      /\blui\b/.test(focus) ||
      focus.includes('leur');

    const isCod =
      focus.includes('cod') ||
      focus.includes('objeto direto') ||
      (focus.includes('le ') && focus.includes('pronome')) ||
      focus.includes(' la ') ||
      focus.includes(' les ');

    const isCliticPlacement = isCoi || isCod;

    const isNegation =
      focus.includes('negation') ||
      focus.includes('negativo') ||
      focus.includes('ne ') ||
      focus.includes(' pas');

    const isAdverbPlacement =
      focus.includes('advérbio') ||
      focus.includes('adverb') ||
      focus.includes('posição') ||
      focus.includes('posicao');

    if (isCliticPlacement) {
      return `
⚠️ PRONOMES CLÍTICOS (COI/COD) — TIPOS DE EXERCÍCIO OBRIGATÓRIOS ⚠️
- NUNCA use "error-correction" quando a correção exige MOVER o pronome antes do verbo.
  Exemplo PROIBIDO: "je parle à lui" → "je lui parle" (destacar "à lui" confunde o aluno).
- PREFIRA nesta ordem:
  1. "sentence-builder" — palavras embaralhadas para montar "je lui parle" / "je le vois".
  2. "grammar-trap" ou "bridge-choice" — 3–4 frases completas; só uma com pronome na posição correta.
  3. "context-choice" — lacuna ANTES do verbo: "Le gérant est là, je ___ parle." blankWord: "lui".
- Armadilha brasileira: manter "à/de + pronome" depois do verbo (calque de "falar com ele / ver ele").`;
    }

    if (isNegation) {
      return `
⚠️ NEGAÇÃO (ne … pas) — EVITE error-correction com reordenação ⚠️
- Não use "error-correction" quando o aluno precisa reposicionar "ne" ou "pas" em relação ao verbo.
- Prefira "sentence-builder" ou "context-choice" com lacuna na posição correta de "ne" / "pas".`;
    }

    if (isAdverbPlacement) {
      return `
⚠️ POSIÇÃO DE ADVÉRBIO — EVITE error-correction com reordenação ⚠️
- Não use "error-correction" quando a correção muda a ordem advérbio + verbo.
- Prefira "sentence-builder" para o aluno montar a ordem correta.
- Em "reverse-translation", use portuguese_sentence com advérbio explícito ("rapidamente", não "rápido" ambíguo após substantivo) quando a tradução-alvo usar advérbio (-ment / vite).`;
    }

    const isDuration =
      focus.includes('pendant') ||
      focus.includes('duração') ||
      focus.includes('duracao');

    if (isDuration) {
      return `
⚠️ PENDANT / DURAÇÃO — LOCALIZAÇÃO PT-BR NOS EXERCÍCIOS ⚠️
- Em reverse-translation e word-bank-translation: prefira portuguese_sentence com "durante + período" (ex: "Eu trabalhei durante duas horas"), não só "por duas horas".
- Em listening-comprehension e bridge-choice: opções/explicações em PT-BR devem usar "durante" quando a ideia for duração equivalente a pendant.`;
    }
  }

  return '';
}
