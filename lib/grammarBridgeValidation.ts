import type { GrammarBridgeResult, SupportedLanguage } from '@/types';

/** Detects meta-explanations that belong in insight/difference, not in example slots. */
const META_EXPLANATION_PATTERNS = [
  /\b(no|em)\s+portugu[eê]s\b/i,
  /\b(no|em)\s+franc[eê]s\b/i,
  /\b(no|em)\s+(ingl[eê]s|english)\b/i,
  /\ba gente omite\b/i,
  /\bvoc[eê]\s+(substitui|insere|usa|coloca)\b/i,
  /\bno franc[eê]s,?\s+voc[eê]\b/i,
  /\bem portugu[eê]s,?\s+a gente\b/i,
  /\b(língua|lingua)[- ]alvo\b/i,
  /\btraduz(ir|e|indo)\b/i,
];

const PT_FUNCTION_WORDS = new Set([
  'a',
  'o',
  'os',
  'as',
  'de',
  'da',
  'do',
  'em',
  'no',
  'na',
  'que',
  'você',
  'voce',
  'gente',
  'omite',
  'insere',
  'substitui',
  'português',
  'portugues',
  'francês',
  'frances',
]);

function stripHighlights(text: string): string {
  return text.replace(/\^\^/g, '').trim();
}

export function looksLikeMetaExplanation(text: string): boolean {
  const normalized = stripHighlights(text);
  if (!normalized) return true;
  return META_EXPLANATION_PATTERNS.some((pattern) => pattern.test(normalized));
}

function portugueseWordRatio(text: string): number {
  const words = stripHighlights(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 0;

  const ptCount = words.filter((w) => PT_FUNCTION_WORDS.has(w)).length;
  return ptCount / words.length;
}

/** Target-language fields must not read like Portuguese meta-explanations. */
export function looksLikePortugueseInTargetField(
  text: string,
  language: SupportedLanguage,
): boolean {
  if (language !== 'fr' && language !== 'en') return false;

  const normalized = stripHighlights(text);
  if (looksLikeMetaExplanation(normalized)) return true;

  // Heuristic: French/English examples rarely use high density of PT function words.
  return portugueseWordRatio(normalized) >= 0.35;
}

export function isValidBridgeExample(
  bridge: NonNullable<GrammarBridgeResult['bridge']>,
  language: SupportedLanguage,
): boolean {
  const portuguese = stripHighlights(bridge.portuguese);
  const target = stripHighlights(bridge.target);

  if (!portuguese || !target) return false;
  if (looksLikeMetaExplanation(portuguese)) return false;
  if (looksLikeMetaExplanation(target)) return false;
  if (looksLikePortugueseInTargetField(target, language)) return false;

  // Both sides should look like short utterances, not comparative essays.
  if (portuguese.split(/\s+/).length > 18 || target.split(/\s+/).length > 18) {
    return false;
  }

  return true;
}

function examplePairFromPatterns(
  patterns: NonNullable<GrammarBridgeResult['patterns']>,
): { portuguese: string; target: string } | null {
  const first = patterns.find((p) => p.portuguese?.trim() && p.target?.trim());
  if (!first) return null;
  return { portuguese: first.portuguese, target: first.target };
}

function examplePairFromDialogue(
  dialogue: NonNullable<GrammarBridgeResult['dialogueExample']>,
): { portuguese: string; target: string } {
  return { portuguese: dialogue.portuguese, target: dialogue.target };
}

/**
 * Keeps bridge when it contains parallel example sentences; otherwise substitutes
 * from patterns or dialogueExample so RegraStepView never shows meta-explanations.
 */
export function sanitizeBridgeExample(
  data: GrammarBridgeResult,
  language: SupportedLanguage,
): GrammarBridgeResult['bridge'] | undefined {
  const bridge = data.bridge;
  if (bridge && isValidBridgeExample(bridge, language)) {
    return bridge;
  }

  const fallback =
    (data.patterns?.length ? examplePairFromPatterns(data.patterns) : null) ??
    (data.dialogueExample ? examplePairFromDialogue(data.dialogueExample) : null);

  if (!fallback) {
    return undefined;
  }

  return {
    portuguese: fallback.portuguese,
    target: fallback.target,
    difference: bridge?.difference?.trim() ?? '',
  };
}
