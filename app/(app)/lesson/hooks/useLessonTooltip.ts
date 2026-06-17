import { useState, useCallback, useRef } from 'react';
import { translateWord } from '@/app/actions/translateWord';
import { CLOSED_TOOLTIP, type TooltipState } from '@/app/(app)/lesson/constants';
import { useLessonStore } from '@/store/lessonStore';
import { lookupVocabTranslation, tooltipCacheKey } from '@/lib/wordTooltipUtils';
import type { WordClickPayload } from '@/components/lesson/ClickableWord';
import type { TranslateWordResult } from '@/types';

function toTooltipState(
  word: string,
  result: TranslateWordResult,
): Omit<TooltipState, 'isOpen' | 'isLoading'> {
  return {
    word,
    translation: result.translation,
    explanation: result.explanation,
    example: result.example,
    partOfSpeech: result.partOfSpeech,
    infinitive: result.infinitive,
  };
}

export function useLessonTooltip() {
  const lesson = useLessonStore((s) => s.lesson);
  const hook = useLessonStore((s) => s.hook);
  const wordTooltips = useLessonStore((s) => s.wordTooltips);
  const cacheWordTooltip = useLessonStore((s) => s.cacheWordTooltip);

  const [tooltip, setTooltip] = useState<TooltipState>(CLOSED_TOOLTIP);
  const sessionCacheRef = useRef(new Map<string, TranslateWordResult>());

  const resolveCached = useCallback(
    (word: string, isNewVerb?: boolean): TranslateWordResult | undefined => {
      if (!lesson) return undefined;

      const key = tooltipCacheKey(word, lesson.language, isNewVerb);
      const fromStore = wordTooltips[key];
      if (fromStore) return fromStore;

      const fromSession = sessionCacheRef.current.get(key);
      if (fromSession) return fromSession;

      const fromHook = lookupVocabTranslation(word, hook?.vocabTranslations);
      if (fromHook) return fromHook;

      return undefined;
    },
    [lesson, wordTooltips, hook?.vocabTranslations],
  );

  const handleWordClick = useCallback(
    async ({ word, isNewVerb }: WordClickPayload) => {
      if (!lesson) return;

      const cached = resolveCached(word, isNewVerb);
      if (cached) {
        setTooltip({ isOpen: true, isLoading: false, ...toTooltipState(word, cached) });
        return;
      }

      setTooltip({ isOpen: true, word, isLoading: true });

      const result = await translateWord(
        word,
        hook?.dialogue ?? '',
        lesson.language,
        isNewVerb,
      );

      if (result) {
        const key = tooltipCacheKey(word, lesson.language, isNewVerb);
        sessionCacheRef.current.set(key, result);
        cacheWordTooltip(key, result);
      }

      setTooltip({
        isOpen: true,
        word,
        isLoading: false,
        translation: result?.translation,
        explanation: result?.explanation,
        example: result?.example,
        partOfSpeech: result?.partOfSpeech,
        infinitive: result?.infinitive,
      });
    },
    [lesson, hook?.dialogue, resolveCached, cacheWordTooltip],
  );

  const closeTooltip = useCallback(() => setTooltip(CLOSED_TOOLTIP), []);

  return { tooltip, handleWordClick, closeTooltip };
}
