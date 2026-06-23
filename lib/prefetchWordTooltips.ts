import { translateWord, translateWordsBatch } from '@/app/actions/translateWord';
import { GeminiQuotaExceededError } from '@/lib/geminiRequestQueue';
import {
  extractHighlightedWordsFromBridge,
  extractVerbFormsFromText,
  tooltipCacheKey,
} from '@/lib/wordTooltipUtils';
import type { GrammarBridgeResult, HookResult, SupportedLanguage, TranslateWordResult } from '@/types';

const BATCH_SIZE = 10;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function batchTranslatePlainWords(
  words: string[],
  language: SupportedLanguage,
  cacheWordTooltip: (key: string, result: TranslateWordResult) => void,
  existingKeys: Set<string>,
  inflight: Set<string>,
): Promise<void> {
  const pending = words.filter((word) => {
    const key = tooltipCacheKey(word, language, false);
    return !existingKeys.has(key) && !inflight.has(key);
  });

  if (pending.length === 0) return;

  for (const word of pending) {
    inflight.add(tooltipCacheKey(word, language, false));
  }

  try {
    for (const batch of chunk(pending, BATCH_SIZE)) {
      const results = await translateWordsBatch(batch, language);
      if (!results) continue;

      for (const { word, translation } of results) {
        const key = tooltipCacheKey(word, language, false);
        if (translation) {
          cacheWordTooltip(key, {
            translation,
            explanation: '',
            example: '',
          });
          existingKeys.add(key);
        }
        inflight.delete(key);
      }
    }
  } catch (err) {
    if (err instanceof GeminiQuotaExceededError) {
      console.warn('[prefetchWordTooltips] Batch translation deferred — lite quota exhausted');
    } else {
      console.error('[prefetchWordTooltips] Batch translation error:', err);
    }
  } finally {
    for (const word of pending) {
      inflight.delete(tooltipCacheKey(word, language, false));
    }
  }
}

export async function prefetchWordTooltipsForBridge(
  bridge: GrammarBridgeResult,
  hook: HookResult,
  language: SupportedLanguage,
  discoveredVerbs: string[],
  cacheWordTooltip: (key: string, result: TranslateWordResult) => void,
  existingKeys: Set<string>,
  inflight: Set<string>,
): Promise<void> {
  const words = extractHighlightedWordsFromBridge(
    bridge,
    hook.newVocabulary,
    discoveredVerbs,
  );

  const plainWords: string[] = [];
  const verbWords: Array<{ word: string; isNewVerb: boolean }> = [];

  for (const { word, isNewVerb } of words) {
    const key = tooltipCacheKey(word, language, isNewVerb);
    if (existingKeys.has(key) || inflight.has(key)) continue;
    if (isNewVerb) {
      verbWords.push({ word, isNewVerb });
    } else {
      plainWords.push(word);
    }
  }

  await batchTranslatePlainWords(plainWords, language, cacheWordTooltip, existingKeys, inflight);

  const sentence =
    bridge.bridge?.target ??
    bridge.dialogueExample?.target ??
    hook.dialogue;

  for (const { word, isNewVerb } of verbWords) {
    const key = tooltipCacheKey(word, language, isNewVerb);
    if (existingKeys.has(key) || inflight.has(key)) continue;
    inflight.add(key);

    try {
      const result = await translateWord(word, sentence, language, isNewVerb);
      if (result) cacheWordTooltip(key, result);
    } catch (err) {
      console.error('[prefetchWordTooltipsForBridge]', word, err);
    } finally {
      inflight.delete(key);
    }
  }
}

export async function prefetchVerbFormsInDialogue(
  dialogue: string,
  language: SupportedLanguage,
  discoveredVerbs: string[],
  cacheWordTooltip: (key: string, result: TranslateWordResult) => void,
  existingKeys: Set<string>,
  inflight: Set<string>,
): Promise<void> {
  const forms = extractVerbFormsFromText(dialogue, discoveredVerbs);

  for (const { word } of forms) {
    const key = tooltipCacheKey(word, language, true);
    if (existingKeys.has(key) || inflight.has(key)) continue;
    inflight.add(key);

    try {
      const result = await translateWord(word, dialogue, language, true);
      if (result) cacheWordTooltip(key, result);
    } catch (err) {
      console.error('[prefetchVerbFormsInDialogue]', word, err);
    } finally {
      inflight.delete(key);
    }
  }
}
