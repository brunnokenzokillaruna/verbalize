import { useEffect } from 'react';
import { devLog } from '@/lib/devLog';
import { pregenerateNextLesson } from '@/app/actions/pregenerateNextLesson';
import { getPregeneratedLesson, getUserVocabulary } from '@/services/firestore';
import type { LessonDefinition, UserDocument } from '@/types';
import type { User } from 'firebase/auth';

export function useDashboardPregen(
  user: User | null,
  profile: UserDocument | null,
  activeLesson: LessonDefinition | undefined,
) {
  useEffect(() => {
    if (!user || !profile || !activeLesson) return;

    const lessonId = activeLesson.id;
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
          const createdMs = createdAt.toMillis
            ? createdAt.toMillis()
            : (createdAt.seconds ?? 0) * 1000;
          return Date.now() - createdMs > 5 * 60 * 1000;
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
