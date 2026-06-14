import { useState, useCallback } from 'react';
import { translateWord } from '@/app/actions/translateWord';
import { CLOSED_TOOLTIP, type TooltipState } from '@/app/(app)/lesson/constants';
import { useLessonStore } from '@/store/lessonStore';
import type { WordClickPayload } from '@/components/lesson/ClickableWord';

export function useLessonTooltip() {
  const store = useLessonStore();
  const [tooltip, setTooltip] = useState<TooltipState>(CLOSED_TOOLTIP);

  const handleWordClick = useCallback(
    async ({ word, isNewVerb }: WordClickPayload) => {
      if (!store.lesson) return;
      setTooltip({ isOpen: true, word, isLoading: true });
      const result = await translateWord(
        word,
        store.hook?.dialogue ?? '',
        store.lesson.language,
        isNewVerb,
      );
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
    [store.lesson, store.hook],
  );

  const closeTooltip = useCallback(() => setTooltip(CLOSED_TOOLTIP), []);

  return { tooltip, handleWordClick, closeTooltip };
}
