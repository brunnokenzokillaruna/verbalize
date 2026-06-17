import { translateWord } from '@/app/actions/translateWord';
import {
  extractHighlightedWordsFromBridge,
  extractVerbFormsFromText,
  tooltipCacheKey,
} from '@/lib/wordTooltipUtils';
import type { GrammarBridgeResult, HookResult, SupportedLanguage, TranslateWordResult } from '@/types';

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

  const sentence =
    bridge.bridge?.target ??
    bridge.dialogueExample?.target ??
    hook.dialogue;

  for (const { word, isNewVerb } of words) {
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

    await new Promise((r) => setTimeout(r, 150));
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
