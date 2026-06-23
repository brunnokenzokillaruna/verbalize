import { useEffect, useRef } from 'react';
import { useLessonStore } from '@/store/lessonStore';
import { tooltipCacheKey } from '@/lib/wordTooltipUtils';
import {
  prefetchWordTooltipsForBridge,
  prefetchVerbFormsInDialogue,
} from '@/lib/prefetchWordTooltips';
import type { GrammarBridgeResult } from '@/types';

const DEFERRED_PHASES = new Set(['practice', 'complete']);

interface UseWordTooltipPrefetchProps {
  grammarBridgePrefetchRef?: React.MutableRefObject<Promise<GrammarBridgeResult | null> | null>;
}

/**
 * Warms the word-tooltip cache in the background so highlighted words
 * open instantly when clicked during hook and grammar phases.
 * Skips prefetch during practice/complete to avoid Gemini calls mid-exercise.
 */
export function useWordTooltipPrefetch({
  grammarBridgePrefetchRef,
}: UseWordTooltipPrefetchProps = {}) {
  const hook = useLessonStore((s) => s.hook);
  const grammarBridge = useLessonStore((s) => s.grammarBridge);
  const lesson = useLessonStore((s) => s.lesson);
  const phase = useLessonStore((s) => s.phase);
  const discoveredVerbs = useLessonStore((s) => s.discoveredVerbs);
  const cacheWordTooltip = useLessonStore((s) => s.cacheWordTooltip);
  const wordTooltips = useLessonStore((s) => s.wordTooltips);

  const inflightRef = useRef(new Set<string>());
  const bridgePrefetchedRef = useRef(false);
  const earlyBridgePrefetchedRef = useRef(false);

  const prefetchAllowed = !DEFERRED_PHASES.has(phase);

  // Seed cache from hook.vocabTranslations (already generated with the dialogue).
  useEffect(() => {
    if (!hook?.vocabTranslations || !lesson) return;

    for (const [word, result] of Object.entries(hook.vocabTranslations)) {
      if (!result?.translation) continue;
      const key = tooltipCacheKey(word, lesson.language, false);
      if (!wordTooltips[key]) cacheWordTooltip(key, result);
    }
  }, [hook?.vocabTranslations, lesson, cacheWordTooltip, wordTooltips]);

  // Prefetch conjugated verb forms from the hook dialogue.
  useEffect(() => {
    if (!prefetchAllowed) return;
    if (!hook?.dialogue || !lesson || discoveredVerbs.length === 0) return;

    const existingKeys = new Set(Object.keys(useLessonStore.getState().wordTooltips));
    void prefetchVerbFormsInDialogue(
      hook.dialogue,
      lesson.language,
      discoveredVerbs,
      cacheWordTooltip,
      existingKeys,
      inflightRef.current,
    );
  }, [hook?.dialogue, lesson, discoveredVerbs, cacheWordTooltip, prefetchAllowed]);

  // Prefetch as soon as the grammar bridge prefetch promise resolves (during hook phase).
  useEffect(() => {
    if (!prefetchAllowed) return;
    if (!grammarBridgePrefetchRef?.current || !hook || !lesson) return;
    if (earlyBridgePrefetchedRef.current) return;

    const promise = grammarBridgePrefetchRef.current;
    earlyBridgePrefetchedRef.current = true;

    void promise.then(async (bridge) => {
      if (!bridge || DEFERRED_PHASES.has(useLessonStore.getState().phase)) return;
      const existingKeys = new Set(Object.keys(useLessonStore.getState().wordTooltips));
      await prefetchWordTooltipsForBridge(
        bridge,
        hook,
        lesson.language,
        discoveredVerbs,
        cacheWordTooltip,
        existingKeys,
        inflightRef.current,
      );
    });
  }, [grammarBridgePrefetchRef, hook, lesson, discoveredVerbs, cacheWordTooltip, prefetchAllowed]);

  // Fallback when bridge is set on store (e.g. generated on demand without prefetch).
  useEffect(() => {
    if (!prefetchAllowed) return;
    if (!grammarBridge || !hook || !lesson) return;
    if (bridgePrefetchedRef.current) return;
    bridgePrefetchedRef.current = true;

    const existingKeys = new Set(Object.keys(useLessonStore.getState().wordTooltips));
    void prefetchWordTooltipsForBridge(
      grammarBridge,
      hook,
      lesson.language,
      discoveredVerbs,
      cacheWordTooltip,
      existingKeys,
      inflightRef.current,
    );
  }, [grammarBridge, hook, lesson, discoveredVerbs, cacheWordTooltip, prefetchAllowed]);

  useEffect(() => {
    if (!grammarBridge) bridgePrefetchedRef.current = false;
  }, [grammarBridge]);
}
