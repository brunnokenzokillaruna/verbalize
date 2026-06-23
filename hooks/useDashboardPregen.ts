import { useEffect, useRef } from 'react';
import { devLog } from '@/lib/devLog';
import { isAggressivePregenEnabled } from '@/lib/geminiDevGuard';
import { pregenerateNextLesson } from '@/app/actions/pregenerateNextLesson';
import { getPregeneratedLesson, getUserVocabulary } from '@/services/firestore';
import type { LessonDefinition, UserDocument } from '@/types';
import type { User } from 'firebase/auth';

const PREGEN_GENERATING_TIMEOUT_MS = 5 * 60 * 1000;

function pregenCreatedAtMs(createdAt: { toMillis?: () => number; seconds?: number } | null | undefined): number {
  if (!createdAt) return 0;
  if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
  return (createdAt.seconds ?? 0) * 1000;
}

export function useDashboardPregen(
  user: User | null,
  profile: UserDocument | null,
  activeLesson: LessonDefinition | undefined,
) {
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !profile || !activeLesson) return;
    if (!isAggressivePregenEnabled()) {
      devLog('[Dashboard Pregen] Skipped — aggressive pregen disabled (dev/preview mode).');
      return;
    }

    const lessonId = activeLesson.id;
    const dedupKey = `${user.uid}_${lessonId}`;
    if (firedRef.current === dedupKey) return;
    firedRef.current = dedupKey;

    const language = profile.currentTargetLanguage;

    (async () => {
      try {
        let cached = null;
        try {
          cached = await getPregeneratedLesson(user.uid, lessonId);
        } catch {
          devLog(`[Dashboard Pregen] Cache status check failed or document not found (treating as MISS).`);
        }

        const isTimedOut = (createdAt: { toMillis?: () => number; seconds?: number } | null | undefined) => {
          if (!createdAt) return true;
          return Date.now() - pregenCreatedAtMs(createdAt) > PREGEN_GENERATING_TIMEOUT_MS;
        };

        if (
          !cached ||
          cached.status === 'failed' ||
          (cached.status === 'generating' && isTimedOut(cached.createdAt))
        ) {
          devLog(`[Dashboard Pregen] 🔮 Active lesson ${lessonId} is a cache MISS. Pregenerating in background...`);
          const userVocabulary = await getUserVocabulary(user.uid, language);
          const knownVocabulary = userVocabulary.map((v) => v.word.toLowerCase());
          const ok = await pregenerateNextLesson(
            user.uid,
            activeLesson,
            profile.interests ?? [],
            knownVocabulary,
          );
          if (ok) {
            devLog(`[Dashboard Pregen] ✅ Active lesson ${lessonId} pregeneration complete.`);
          } else {
            console.warn(`[Dashboard Pregen] ⚠️ Active lesson ${lessonId} pregeneration failed.`);
          }
        } else if (cached.status === 'generating') {
          devLog(`[Dashboard Pregen] ⏳ Active lesson ${lessonId} is already generating in background (HIT).`);
        } else {
          devLog(`[Dashboard Pregen] ✅ Active lesson ${lessonId} is already cached (HIT).`);
        }
      } catch (err) {
        console.error('[Dashboard Pregen] Error pregenerating active lesson:', err);
      }
    })();
  }, [user?.uid, activeLesson?.id, profile?.currentTargetLanguage]);
}
