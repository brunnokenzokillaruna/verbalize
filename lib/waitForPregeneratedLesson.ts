import { devLog } from '@/lib/devLog';
import { isAggressivePregenEnabled } from '@/lib/geminiDevGuard';
import { getPregenPollMaxAttempts } from '@/lib/pregenTiming';
import {
  abortPregeneratedLesson,
  getPregeneratedLesson,
  isPregenGeneratingStale,
} from '@/services/firestore';
import type { PregeneratedLessonDocument } from '@/types';

const POLL_INTERVAL_MS = 2000;

function isPregenContentReady(doc: PregeneratedLessonDocument): boolean {
  return Boolean(doc.hook || doc.checkpointSession);
}

async function clearStaleGeneratingLock(uid: string, lessonId: string, reason: string): Promise<void> {
  devLog(`[Timing] ${reason} — abortando lock pregen`);
  await abortPregeneratedLesson(uid, lessonId).catch(console.error);
}

/**
 * Loads a pre-generated lesson, waiting briefly when another process is generating.
 * Orphan/stale `generating` locks are cleared so local generation can proceed.
 * REVIEW lessons may be ready with only `checkpointSession` (no hook).
 */
export async function fetchPregeneratedLessonWithWait(
  uid: string,
  lessonId: string,
): Promise<PregeneratedLessonDocument | null> {
  let doc = await getPregeneratedLesson(uid, lessonId);
  if (!doc) return null;

  if (doc.status === 'failed') return null;
  if (isPregenContentReady(doc) && doc.status === 'ready') return doc;

  if (doc.status !== 'generating') {
    return isPregenContentReady(doc) ? doc : null;
  }

  // Dev has no dashboard pregen — a generating doc without content is always orphaned.
  if (!isAggressivePregenEnabled()) {
    await clearStaleGeneratingLock(uid, lessonId, 'Pregen orphan lock em dev');
    return null;
  }

  if (isPregenGeneratingStale(doc)) {
    await clearStaleGeneratingLock(uid, lessonId, 'Pregen lock expirado');
    return null;
  }

  devLog('[Timing] Lição sendo gerada em background — polling curto...');
  const maxAttempts = getPregenPollMaxAttempts();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    doc = await getPregeneratedLesson(uid, lessonId);

    if (!doc || doc.status === 'failed') return null;
    if (isPregenContentReady(doc)) return doc;
    if (doc.status !== 'generating') return null;

    if (isPregenGeneratingStale(doc)) {
      await clearStaleGeneratingLock(uid, lessonId, `Pregen lock expirou (tentativa ${attempt})`);
      return null;
    }

    devLog(`[Timing] Polling ${attempt}/${maxAttempts}: status = ${doc.status}`);
  }

  await clearStaleGeneratingLock(uid, lessonId, 'Pregen polling esgotado');
  return null;
}
