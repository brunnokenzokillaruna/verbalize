import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  runTransaction,
  type DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import { SEPARATE_PASSIVE_SRS, PREGEN_SCHEMA_VERSION } from '@/lib/practiceExercises/constants';
import type { UserDocument, UserVocabularyDocument, ImageCacheDocument, VerbDocument, LessonMistakeDocument, PregeneratedLessonDocument, SupportedLanguage, ProficiencyLevel, LessonLogDocument } from '@/types';
import { calculateNextReview } from '@/lib/srs';
import { getNextLessonId, getLessonsForLanguage } from '@/lib/curriculum';
import {
  buildCurriculumSyncNotice,
  buildUserCurriculumMigrationUpdates,
  CURRICULUM_VERSION,
  getStoredCurriculumVersion,
  isFutureCurriculumVersion,
  migrateContentLessonId,
  shouldClearPregenCacheOnMigration,
} from '@/lib/curriculum/lessonIdMigration';
import { INITIAL_LESSON_PROGRESS, resolveFrontierLessonId, sanitizeLessonProgress } from '@/lib/curriculum/lessonProgress';
import { logCurriculum } from '@/lib/curriculumLogger';
import type { CurriculumSyncNotice, CurriculumSyncReport } from '@/types/curriculumSync';
import { getEffectiveStreak } from '@/lib/stats';
import { stripUndefinedDeep } from '@/utils/stripUndefined';

// ─── Users ────────────────────────────────────────────────────────────────────

export interface SyncUserProfileResult {
  profile: UserDocument;
  notice: CurriculumSyncNotice | null;
  report: CurriculumSyncReport;
}

export async function syncUserProfile(uid: string): Promise<SyncUserProfileResult | null> {
  const snap = await getDoc(doc(await getDb(), 'users', uid));
  if (!snap.exists()) return null;

  const profile = snap.data() as UserDocument;
  const fromVersion = getStoredCurriculumVersion(profile);

  logCurriculum('sync_start', { uid, fromVersion, targetVersion: CURRICULUM_VERSION });

  const report: CurriculumSyncReport = {
    uid,
    fromVersion,
    toVersion: CURRICULUM_VERSION,
    migrated: false,
    progressChanges: [],
    sanitizedChanges: [],
    mistakesUpdated: 0,
    pregenCleared: 0,
  };

  if (isFutureCurriculumVersion(profile)) {
    logCurriculum('invalid_version', {
      uid,
      storedVersion: fromVersion,
      appVersion: CURRICULUM_VERSION,
    });
    return {
      profile,
      notice: null,
      report,
    };
  }

  let workingProgress = profile.lessonProgress;
  let curriculumVersion = profile.curriculumVersion;

  const migrationUpdates = buildUserCurriculumMigrationUpdates(profile);
  if (migrationUpdates) {
    report.migrated = true;
    report.progressChanges = migrationUpdates.curriculumMigrationMeta?.progressChanges ?? [];
    workingProgress = migrationUpdates.lessonProgress;
    curriculumVersion = migrationUpdates.curriculumVersion;

    logCurriculum('migration_applied', {
      uid,
      fromVersion,
      toVersion: CURRICULUM_VERSION,
      progressChanges: report.progressChanges,
    });
  }

  const { lessonProgress: sanitizedProgress, changes: sanitizedChanges } =
    sanitizeLessonProgress(workingProgress);

  if (sanitizedChanges.length > 0) {
    report.sanitizedChanges = sanitizedChanges.map((change) => ({
      language: change.language,
      from: change.from,
      to: change.to,
      reason: change.reason,
    }));
    logCurriculum('progress_sanitized', { uid, changes: sanitizedChanges });
  }

  const progressChanged =
    sanitizedProgress.fr !== profile.lessonProgress?.fr ||
    sanitizedProgress.en !== profile.lessonProgress?.en ||
    !profile.lessonProgress?.fr ||
    !profile.lessonProgress?.en;

  const versionChanged = (curriculumVersion ?? 1) !== fromVersion;
  const shouldPersist = report.migrated || progressChanged || versionChanged;

  let nextProfile = profile;

  if (shouldPersist) {
    const userUpdates: Partial<UserDocument> = {
      lessonProgress: sanitizedProgress,
      curriculumVersion: curriculumVersion ?? CURRICULUM_VERSION,
    };

    if (report.migrated) {
      userUpdates.curriculumMigrationMeta = {
        version: CURRICULUM_VERSION,
        fromVersion,
        progressChanges: report.progressChanges,
        migratedAt: Timestamp.now(),
      };
    }

    await updateUser(uid, userUpdates);
    nextProfile = { ...profile, ...userUpdates };

    if (report.migrated) {
      report.mistakesUpdated = await migrateUserLessonMistakes(uid, fromVersion);

      if (shouldClearPregenCacheOnMigration(profile, report.progressChanges)) {
        report.pregenCleared = await clearUserPregeneratedLessons(uid);
      }

      if (report.mistakesUpdated > 0) {
        logCurriculum('mistakes_migrated', { uid, count: report.mistakesUpdated });
      }
      if (report.pregenCleared > 0) {
        logCurriculum('pregen_cleared', { uid, count: report.pregenCleared });
      }
    }
  }

  const notice = buildCurriculumSyncNotice(report);

  logCurriculum(shouldPersist ? 'sync_complete' : 'sync_noop', {
    uid,
    migrated: report.migrated,
    sanitizedCount: report.sanitizedChanges.length,
    mistakesUpdated: report.mistakesUpdated,
    pregenCleared: report.pregenCleared,
    hasNotice: Boolean(notice),
  });

  return { profile: nextProfile, notice, report };
}

export async function getUser(uid: string): Promise<UserDocument | null> {
  const result = await syncUserProfile(uid);
  return result?.profile ?? null;
}

/** Migrates lesson mistake documents to current lesson ids (client-writable). */
async function migrateUserLessonMistakes(uid: string, fromVersion: number): Promise<number> {
  const mistakes = await getUserMistakes(uid);
  let updated = 0;

  await Promise.all(
    mistakes.map(async (mistake) => {
      const migratedId = migrateContentLessonId(mistake.language, mistake.lessonId, fromVersion);
      if (!migratedId || migratedId === mistake.lessonId || !mistake.id) return;
      await updateDoc(doc(await getDb(), 'lesson_mistakes', mistake.id), { lessonId: migratedId });
      updated += 1;
    }),
  );

  return updated;
}

/** Clears stale pre-generated lesson caches after a curriculum version bump. */
async function clearUserPregeneratedLessons(uid: string): Promise<number> {
  const snap = await getDocs(query(collection(await getDb(), 'lesson_pregen'), where('uid', '==', uid)));
  if (snap.empty) return 0;

  await Promise.all(snap.docs.map((entry) => deleteDoc(entry.ref)));
  return snap.size;
}

export async function createUser(uid: string, data: Omit<UserDocument, 'uid' | 'createdAt' | 'lastLogin'>) {
  await setDoc(doc(await getDb(), 'users', uid), {
    ...data,
    uid,
    lessonProgress: data.lessonProgress ?? INITIAL_LESSON_PROGRESS,
    curriculumVersion: data.curriculumVersion ?? CURRICULUM_VERSION,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  });
}

export async function updateUser(uid: string, data: Partial<UserDocument>) {
  await updateDoc(doc(await getDb(), 'users', uid), data as DocumentData);
}

export async function deleteUserData(uid: string): Promise<void> {
  await deleteDoc(doc(await getDb(), 'users', uid));

  const vocabSnap = await getDocs(query(collection(await getDb(), 'user_vocabulary'), where('uid', '==', uid)));
  await Promise.all(vocabSnap.docs.map((d) => deleteDoc(d.ref)));

  const logsSnap = await getDocs(query(collection(await getDb(), 'lesson_logs'), where('uid', '==', uid)));
  await Promise.all(logsSnap.docs.map((d) => deleteDoc(d.ref)));
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────

export async function getVocabularyDueForReview(
  uid: string,
  language: 'fr' | 'en',
): Promise<UserVocabularyDocument[]> {
  const now = new Date();
  const q = query(
    collection(await getDb(), 'user_vocabulary'),
    where('uid', '==', uid),
    where('language', '==', language),
    where('nextReview', '<=', now),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserVocabularyDocument);
}

export async function addVocabularyItem(
  data: Omit<UserVocabularyDocument, 'id'>,
): Promise<string> {
  const ref = await addDoc(collection(await getDb(), 'user_vocabulary'), data);
  return ref.id;
}

// ─── Vocabulary (upsert with SRS) ─────────────────────────────────────────────

/**
 * Creates a new vocabulary item if the word doesn't exist yet for this user+language.
 * If it already exists, updates the SRS level and nextReview date.
 * `correct` defaults to true (first encounter = learned).
 */
export async function upsertVocabularyItem(
  uid: string,
  word: string,
  translation: string,
  language: SupportedLanguage,
  imageUrl?: string,
  wordType?: 'verb' | 'noun',
  entryType?: UserVocabularyDocument['entryType'],
): Promise<void> {
  if (SEPARATE_PASSIVE_SRS) {
    await recordPassiveEncounter(uid, word, translation, language, imageUrl, wordType, entryType);
    return;
  }

  const q = query(
    collection(await getDb(), 'user_vocabulary'),
    where('uid', '==', uid),
    where('language', '==', language),
    where('word', '==', word),
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    // First encounter — create at srsLevel 0
    const { newLevel, nextReview } = calculateNextReview(0, true);
    await addDoc(collection(await getDb(), 'user_vocabulary'), {
      uid,
      language,
      word,
      translation,
      ...(imageUrl && { imageUrl }),
      ...(wordType && { wordType }),
      ...(entryType && { entryType }),
      srsLevel: newLevel,
      mistakeCount: 0,
      firstSeen: serverTimestamp(),
      lastReview: serverTimestamp(),
      nextReview: Timestamp.fromDate(nextReview),
    });
  } else {
    // Already exists — advance SRS level and refresh imageUrl/translation if provided
    const docRef = snap.docs[0].ref;
    const existing = snap.docs[0].data() as UserVocabularyDocument;
    const { newLevel, nextReview } = calculateNextReview(existing.srsLevel, true);
    await updateDoc(docRef, {
      srsLevel: newLevel,
      lastReview: serverTimestamp(),
      nextReview: Timestamp.fromDate(nextReview),
      // Refresh imageUrl when provided (fixes stale/missing images)
      ...(imageUrl && { imageUrl }),
      // Refresh translation when it was a placeholder
      ...(translation && translation !== word && { translation }),
    });
  }
}

/** Passive exposure — does not advance SRS when SEPARATE_PASSIVE_SRS is enabled. */
export async function recordPassiveEncounter(
  uid: string,
  word: string,
  translation: string,
  language: SupportedLanguage,
  imageUrl?: string,
  wordType?: 'verb' | 'noun',
  entryType?: UserVocabularyDocument['entryType'],
): Promise<void> {
  const q = query(
    collection(await getDb(), 'user_vocabulary'),
    where('uid', '==', uid),
    where('language', '==', language),
    where('word', '==', word),
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    await addDoc(collection(await getDb(), 'user_vocabulary'), {
      uid,
      language,
      word,
      translation,
      ...(imageUrl && { imageUrl }),
      ...(wordType && { wordType }),
      ...(entryType && { entryType }),
      knowledgeMode: 'passive',
      encounterCount: 1,
      productionCount: 0,
      srsLevel: 0,
      mistakeCount: 0,
      firstSeen: serverTimestamp(),
      lastReview: serverTimestamp(),
      nextReview: Timestamp.fromDate(new Date()),
    });
    return;
  }

  const docRef = snap.docs[0].ref;
  const existing = snap.docs[0].data() as UserVocabularyDocument;
  await updateDoc(docRef, {
    encounterCount: (existing.encounterCount ?? 0) + 1,
    ...(imageUrl && { imageUrl }),
    ...(translation && translation !== word && { translation }),
    ...(entryType && !existing.entryType && { entryType }),
  });
}

/** Active production success — advances SRS. */
export async function recordActiveSuccess(
  uid: string,
  word: string,
  language: SupportedLanguage,
): Promise<void> {
  const q = query(
    collection(await getDb(), 'user_vocabulary'),
    where('uid', '==', uid),
    where('language', '==', language),
    where('word', '==', word),
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  const docRef = snap.docs[0].ref;
  const existing = snap.docs[0].data() as UserVocabularyDocument;
  const { newLevel, nextReview } = calculateNextReview(existing.srsLevel, true);
  await updateDoc(docRef, {
    srsLevel: newLevel,
    knowledgeMode: 'active',
    productionCount: (existing.productionCount ?? 0) + 1,
    lastReview: serverTimestamp(),
    nextReview: Timestamp.fromDate(nextReview),
  });
}

export async function incrementProductionStats(
  uid: string,
  kind: 'oral' | 'freeWrite',
  accepted: boolean,
): Promise<void> {
  const userRef = doc(await getDb(), 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const profile = snap.data() as UserDocument;
  const stats = profile.productionStats ?? {
    oralAttempts: 0,
    oralAccepted: 0,
    freeWriteAttempts: 0,
    freeWriteAccepted: 0,
  };

  const next = { ...stats };
  if (kind === 'oral') {
    next.oralAttempts += 1;
    if (accepted) next.oralAccepted += 1;
  } else {
    next.freeWriteAttempts += 1;
    if (accepted) next.freeWriteAccepted += 1;
  }

  await updateDoc(userRef, {
    productionStats: { ...next, lastUpdated: serverTimestamp() },
  });
}

export interface RecentLessonStats {
  lessonsLast7Days: number;
  averageScoreLast7Days: number;
}

export async function getRecentLessonStats(uid: string): Promise<RecentLessonStats> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const q = query(
    collection(await getDb(), 'lesson_logs'),
    where('uid', '==', uid),
  );
  const snap = await getDocs(q);
  const recent = snap.docs
    .map((d) => d.data() as LessonLogDocument)
    .filter((log) => log.completedAt?.toDate?.() >= weekAgo);

  const lessonsLast7Days = recent.length;
  const averageScoreLast7Days =
    lessonsLast7Days > 0
      ? Math.round(recent.reduce((sum, l) => sum + l.score, 0) / lessonsLast7Days)
      : 0;

  return { lessonsLast7Days, averageScoreLast7Days };
}

// ─── Lesson Log ───────────────────────────────────────────────────────────────

/**
 * Records a completed lesson in the `lesson_logs` collection.
 */
export async function logLesson(data: {
  uid: string;
  lessonId: string;
  language: SupportedLanguage;
  score: number;
}): Promise<void> {
  await addDoc(collection(await getDb(), 'lesson_logs'), {
    ...data,
    completedAt: serverTimestamp(),
  });
}

/**
 * Updates the user's lesson stats after completing a lesson:
 * - Increments totalLessonsCompleted
 * - Calculates the new streak based on lastLessonDate
 * - Advances lessonProgress[language] to the next lesson (only when the
 *   completed lesson is the user's current frontier, not a replay)
 * - Persists all changes to Firestore and returns the updated fields.
 */
export async function updateLessonStats(
  uid: string,
  initialProfile: UserDocument,
  completedLessonId: string,
  language: SupportedLanguage,
): Promise<Pick<UserDocument, 'totalLessonsCompleted' | 'currentStreak' | 'lastLessonDate' | 'lessonProgress'>> {
  // Fetch fresh profile to avoid stale progress updates
  const profile = await getUser(uid) || initialProfile;
  const now = new Date();
  // Normalise to midnight local time so we compare calendar days, not exact times
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const lastDate = profile.lastLessonDate?.toDate();
  const lastDayStart = lastDate
    ? new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate())
    : null;

  const diffDays = lastDayStart
    ? Math.round((todayStart.getTime() - lastDayStart.getTime()) / 86_400_000)
    : Infinity;

  // Use the effective streak as the base (handles resets automatically)
  const effectiveBase = getEffectiveStreak(profile);

  // diffDays === 0 → already counted today; === 1 → consecutive; > 1 → streak broken
  const newStreak =
    diffDays === 0 ? effectiveBase :
    diffDays === 1 ? effectiveBase + 1 :
    1;

  // Advance lesson progress only when the user completes their current frontier lesson (or something ahead of it)
  const currentProgress = profile.lessonProgress ?? {};
  const rawFrontierId = currentProgress[language];
  const frontierLessonId = rawFrontierId
    ? resolveFrontierLessonId(language, rawFrontierId)
    : undefined;

  const allLessons = getLessonsForLanguage(language);
  const frontierIdx = frontierLessonId
    ? allLessons.findIndex((l) => l.id === frontierLessonId)
    : 0;
  const completedIdx = allLessons.findIndex((l) => l.id === completedLessonId);

  if (completedIdx === -1) {
    logCurriculum('sync_error', {
      uid,
      context: 'updateLessonStats',
      reason: 'unknown_completed_lesson',
      completedLessonId,
      language,
    });
  }

  // If we can't find the completed lesson, we can't safely advance
  const nextId = getNextLessonId(language, completedLessonId);
  const isAtFrontier = completedIdx !== -1 && (completedIdx >= frontierIdx || !frontierLessonId);
  
  const newLessonProgress: Record<string, string> = { ...currentProgress };

  if (frontierLessonId && rawFrontierId && frontierLessonId !== rawFrontierId) {
    newLessonProgress[language] = frontierLessonId;
  }
  
  if (isAtFrontier && nextId) {
    newLessonProgress[language] = nextId;
    console.log(`[updateLessonStats] Advancing frontier for ${language}: ${completedLessonId} -> ${nextId}`);
  } else if (isAtFrontier && !nextId) {
    console.log(`[updateLessonStats] Reached end for ${language} at ${completedLessonId}`);
  } else {
    console.log(`[updateLessonStats] Finished older lesson ${completedLessonId} (frontier is ${frontierLessonId}). No advancement.`);
  }

  const updates = {
    totalLessonsCompleted: profile.totalLessonsCompleted + 1,
    currentStreak: newStreak,
    lastLessonDate: Timestamp.fromDate(todayStart),
    lessonProgress: newLessonProgress,
  };

  await updateUser(uid, updates);
  return updates;
}

// ─── Vocabulary (full list + translation patch) ───────────────────────────────

/**
 * Returns all vocabulary items for a user+language (not filtered by due date).
 */
export async function getUserVocabulary(
  uid: string,
  language: SupportedLanguage,
): Promise<UserVocabularyDocument[]> {
  const q = query(
    collection(await getDb(), 'user_vocabulary'),
    where('uid', '==', uid),
    where('language', '==', language),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserVocabularyDocument));
}

/**
 * Patches the translation field of an existing vocabulary item.
 * Used to lazily enrich placeholder translations on the vocabulary page.
 */
export async function updateVocabTranslation(
  uid: string,
  word: string,
  language: SupportedLanguage,
  translation: string,
): Promise<void> {
  const q = query(
    collection(await getDb(), 'user_vocabulary'),
    where('uid', '==', uid),
    where('language', '==', language),
    where('word', '==', word),
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, { translation });
  }
}

/**
 * Patches the imageUrl field of an existing vocabulary item.
 * Used to lazily enrich missing images on the vocabulary page.
 */
export async function updateVocabImage(
  uid: string,
  word: string,
  language: SupportedLanguage,
  imageUrl: string,
): Promise<void> {
  const q = query(
    collection(await getDb(), 'user_vocabulary'),
    where('uid', '==', uid),
    where('language', '==', language),
    where('word', '==', word),
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, { imageUrl });
  }
}


/**
 * Updates the SRS level and next review date for a vocabulary item after a review exercise.
 * Correct → level up (max 5). Incorrect → level down (min 0) + increment mistakeCount.
 */
export async function updateVocabSrsAfterReview(
  uid: string,
  word: string,
  language: SupportedLanguage,
  correct: boolean,
): Promise<void> {
  const q = query(
    collection(await getDb(), 'user_vocabulary'),
    where('uid', '==', uid),
    where('language', '==', language),
    where('word', '==', word),
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  const docRef = snap.docs[0].ref;
  const existing = snap.docs[0].data() as UserVocabularyDocument;
  const { newLevel, nextReview } = calculateNextReview(existing.srsLevel, correct);

  await updateDoc(docRef, {
    srsLevel: newLevel,
    lastReview: serverTimestamp(),
    nextReview: Timestamp.fromDate(nextReview),
    ...(correct ? {} : { mistakeCount: (existing.mistakeCount ?? 0) + 1 }),
  });
}

// ─── Verb Cache ───────────────────────────────────────────────────────────────

/**
 * Returns a cached VerbDocument from Firestore, or null if not yet cached.
 * Document ID format: `{infinitive}_{language}` (e.g., "être_fr").
 */
export async function getCachedVerb(
  infinitive: string,
  language: SupportedLanguage,
): Promise<VerbDocument | null> {
  const id = `${infinitive.toLowerCase()}_${language}`;
  const snap = await getDoc(doc(await getDb(), 'verbs', id));
  return snap.exists() ? (snap.data() as VerbDocument) : null;
}

/**
 * Saves a generated VerbDocument to the Firestore verbs cache.
 */
export async function saveVerbCache(data: VerbDocument): Promise<void> {
  const id = `${data.infinitive.toLowerCase()}_${data.language}`;
  await setDoc(doc(await getDb(), 'verbs', id), data);
}

// ─── Image Cache ──────────────────────────────────────────────────────────────

export async function getCachedImage(word: string): Promise<ImageCacheDocument | null> {
  const snap = await getDoc(doc(await getDb(), 'image_cache', word));
  return snap.exists() ? (snap.data() as ImageCacheDocument) : null;
}

export async function saveImageCache(word: string, data: Omit<ImageCacheDocument, 'word' | 'createdAt'>) {
  await setDoc(doc(await getDb(), 'image_cache', word), {
    ...data,
    word,
    createdAt: serverTimestamp(),
  });
}

export async function getAllImageCache(): Promise<ImageCacheDocument[]> {
  const snap = await getDocs(collection(await getDb(), 'image_cache'));
  return snap.docs.map((d) => d.data() as ImageCacheDocument);
}

export async function updateImageCache(
  word: string,
  imageUrl: string,
  photographer: string,
): Promise<void> {
  await updateDoc(doc(await getDb(), 'image_cache', word), { imageUrl, photographer });
}

export async function approveImageCache(word: string): Promise<void> {
  await updateDoc(doc(await getDb(), 'image_cache', word), { approved: true });
}

export async function updateImageCacheTranslation(word: string, translation: string): Promise<void> {
  await updateDoc(doc(await getDb(), 'image_cache', word), { translation });
}

// ─── Lesson Mistakes ──────────────────────────────────────────────────────────

/**
 * Upserts a lesson mistake keyed by uid + language + sanitised grammarFocus.
 * One document per grammar topic per user per language — deduplicates naturally.
 */
export async function saveLessonMistake(
  uid: string,
  language: SupportedLanguage,
  grammarFocus: string,
  mistakeContext: string,
  lessonId: string,
  level: ProficiencyLevel,
): Promise<void> {
  const safeKey = grammarFocus.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
  const docId = `${uid.slice(0, 20)}_${language}_${safeKey}`;
  await setDoc(doc(await getDb(), 'lesson_mistakes', docId), {
    uid,
    language,
    grammarFocus,
    mistakeContext,
    lessonId,
    level,
    createdAt: serverTimestamp(),
  });
}

/**
 * Returns the oldest pending mistake for a user+language (limit 1).
 * Falls back to JS-side filtering to avoid requiring a composite index.
 */
export async function getOldestMistake(
  uid: string,
  language: SupportedLanguage,
): Promise<LessonMistakeDocument | null> {
  const snap = await getDocs(query(collection(await getDb(), 'lesson_mistakes'), where('uid', '==', uid)));
  const all = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as LessonMistakeDocument))
    .filter((m) => m.language === language);
  if (all.length === 0) return null;
  // Sort by createdAt ascending (oldest first)
  all.sort((a, b) => {
    const ta = (a.createdAt as unknown as Timestamp)?.toMillis?.() ?? 0;
    const tb = (b.createdAt as unknown as Timestamp)?.toMillis?.() ?? 0;
    return ta - tb;
  });
  return all[0];
}

export async function deleteLessonMistake(docId: string): Promise<void> {
  await deleteDoc(doc(await getDb(), 'lesson_mistakes', docId));
}

export async function getMistakeById(docId: string): Promise<LessonMistakeDocument | null> {
  const snap = await getDoc(doc(await getDb(), 'lesson_mistakes', docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as LessonMistakeDocument;
}

/**
 * Returns all pending mistakes for a user, optionally filtered by language.
 */
export async function getUserMistakes(
  uid: string,
  language?: SupportedLanguage,
): Promise<LessonMistakeDocument[]> {
  const snap = await getDocs(query(collection(await getDb(), 'lesson_mistakes'), where('uid', '==', uid)));
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LessonMistakeDocument));
  const filtered = language ? all.filter((m) => m.language === language) : all;
  filtered.sort((a, b) => {
    const ta = (a.createdAt as unknown as Timestamp)?.toMillis?.() ?? 0;
    const tb = (b.createdAt as unknown as Timestamp)?.toMillis?.() ?? 0;
    return tb - ta; // newest first for display
  });
  return filtered;
}

// ─── Pre-generated Lesson Cache ───────────────────────────────────────────────

/** Document ID: `{uid}_{lessonId}` */
function pregeneratedDocId(uid: string, lessonId: string) {
  return `${uid}_${lessonId}`;
}

const PREGEN_GENERATING_TIMEOUT_MS = 5 * 60 * 1000;

function pregenCreatedAtMs(createdAt: PregeneratedLessonDocument['createdAt']): number {
  if (!createdAt) return 0;
  if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
  return (createdAt.seconds ?? 0) * 1000;
}

/**
 * Atomically claims pregeneration for a lesson. Returns false when another
 * process is already generating (and not timed out) or the cache is ready.
 */
export async function tryStartPregeneratingLesson(uid: string, lessonId: string): Promise<boolean> {
  const db = await getDb();
  const id = pregeneratedDocId(uid, lessonId);
  const ref = doc(db, 'lesson_pregen', id);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      const data = snap.data() as PregeneratedLessonDocument;
      if (data.status === 'ready') return false;
      if (data.status === 'generating') {
        const age = Date.now() - pregenCreatedAtMs(data.createdAt);
        if (age < PREGEN_GENERATING_TIMEOUT_MS) return false;
      }
    }

    tx.set(ref, {
      uid,
      lessonId,
      status: 'generating',
      createdAt: serverTimestamp(),
    });
    return true;
  });
}

/**
 * Stores a pre-generated lesson payload (hook + optional grammar bridge and
 * exercises) in the `lesson_pregen` collection so the next lesson can start
 * instantly without any AI calls. Optional fields are only persisted when
 * provided — Firestore rejects `undefined` values.
 */
export async function savePregeneratedLesson(
  uid: string,
  lessonId: string,
  payload: Pick<PregeneratedLessonDocument, 'hook' | 'grammarBridge' | 'exercises' | 'missionBriefing' | 'checkpointSession'>,
): Promise<void> {
  const id = pregeneratedDocId(uid, lessonId);
  const data = stripUndefinedDeep({
    uid,
    lessonId,
    status: 'ready' as const,
    schemaVersion: PREGEN_SCHEMA_VERSION,
    hook: payload.hook,
    createdAt: serverTimestamp(),
    ...(payload.grammarBridge ? { grammarBridge: payload.grammarBridge } : {}),
    ...(payload.exercises && payload.exercises.length > 0 ? { exercises: payload.exercises } : {}),
    ...(payload.missionBriefing ? { missionBriefing: payload.missionBriefing } : {}),
    ...(payload.checkpointSession ? { checkpointSession: payload.checkpointSession } : {}),
  });
  await setDoc(doc(await getDb(), 'lesson_pregen', id), data);
}

/**
 * Marks a failed pre-generation attempt so clients treat it as a cache miss.
 * Server actions cannot delete lesson_pregen docs (no Firebase Auth token).
 */
export async function abortPregeneratedLesson(uid: string, lessonId: string): Promise<void> {
  const id = pregeneratedDocId(uid, lessonId);
  await setDoc(doc(await getDb(), 'lesson_pregen', id), {
    uid,
    lessonId,
    status: 'failed',
    createdAt: serverTimestamp(),
  });
}

/**
 * Returns a pre-generated lesson if one exists, or null.
 */
export async function getPregeneratedLesson(
  uid: string,
  lessonId: string,
): Promise<PregeneratedLessonDocument | null> {
  const snap = await getDoc(doc(await getDb(), 'lesson_pregen', pregeneratedDocId(uid, lessonId)));
  return snap.exists() ? (snap.data() as PregeneratedLessonDocument) : null;
}

/**
 * Deletes the pre-generated lesson entry after it has been consumed.
 */
export async function deletePregeneratedLesson(uid: string, lessonId: string): Promise<void> {
  await deleteDoc(doc(await getDb(), 'lesson_pregen', pregeneratedDocId(uid, lessonId)));
}
