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
  type DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserDocument, UserVocabularyDocument, ImageCacheDocument, VerbDocument, LessonMistakeDocument, PregeneratedLessonDocument, SupportedLanguage, ProficiencyLevel } from '@/types';
import { calculateNextReview } from '@/lib/srs';
import { getNextLessonId } from '@/lib/curriculum';

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUser(uid: string): Promise<UserDocument | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserDocument) : null;
}

export async function createUser(uid: string, data: Omit<UserDocument, 'uid' | 'createdAt' | 'lastLogin'>) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    uid,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  });
}

export async function updateUser(uid: string, data: Partial<UserDocument>) {
  await updateDoc(doc(db, 'users', uid), data as DocumentData);
}

export async function deleteUserData(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));

  const vocabSnap = await getDocs(query(collection(db, 'user_vocabulary'), where('uid', '==', uid)));
  await Promise.all(vocabSnap.docs.map((d) => deleteDoc(d.ref)));

  const logsSnap = await getDocs(query(collection(db, 'lesson_logs'), where('uid', '==', uid)));
  await Promise.all(logsSnap.docs.map((d) => deleteDoc(d.ref)));
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────

export async function getVocabularyDueForReview(
  uid: string,
  language: 'fr' | 'en',
): Promise<UserVocabularyDocument[]> {
  const now = new Date();
  const q = query(
    collection(db, 'user_vocabulary'),
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
  const ref = await addDoc(collection(db, 'user_vocabulary'), data);
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
): Promise<void> {
  const q = query(
    collection(db, 'user_vocabulary'),
    where('uid', '==', uid),
    where('language', '==', language),
    where('word', '==', word),
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    // First encounter — create at srsLevel 0
    const { newLevel, nextReview } = calculateNextReview(0, true);
    await addDoc(collection(db, 'user_vocabulary'), {
      uid,
      language,
      word,
      translation,
      ...(imageUrl && { imageUrl }),
      ...(wordType && { wordType }),
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
  await addDoc(collection(db, 'lesson_logs'), {
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
  profile: UserDocument,
  completedLessonId: string,
  language: SupportedLanguage,
): Promise<Pick<UserDocument, 'totalLessonsCompleted' | 'currentStreak' | 'lastLessonDate' | 'lessonProgress'>> {
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

  // diffDays === 0 → already counted today; === 1 → consecutive; > 1 → streak broken
  const newStreak =
    diffDays === 0 ? profile.currentStreak :
    diffDays === 1 ? profile.currentStreak + 1 :
    1;

  // Advance lesson progress only when the user completes their current frontier lesson
  const currentProgress = profile.lessonProgress ?? {};
  const frontierLessonId = currentProgress[language]; // undefined = user hasn't started yet
  const isAtFrontier = completedLessonId === frontierLessonId || !frontierLessonId;
  const newLessonProgress: Partial<Record<SupportedLanguage, string>> = { ...currentProgress };
  if (isAtFrontier) {
    const nextId = getNextLessonId(language, completedLessonId);
    // If nextId is null we're at the last lesson — keep frontier pointing to the same lesson
    newLessonProgress[language] = nextId ?? completedLessonId;
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
    collection(db, 'user_vocabulary'),
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
    collection(db, 'user_vocabulary'),
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
    collection(db, 'user_vocabulary'),
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
  const snap = await getDoc(doc(db, 'verbs', id));
  return snap.exists() ? (snap.data() as VerbDocument) : null;
}

/**
 * Saves a generated VerbDocument to the Firestore verbs cache.
 */
export async function saveVerbCache(data: VerbDocument): Promise<void> {
  const id = `${data.infinitive.toLowerCase()}_${data.language}`;
  await setDoc(doc(db, 'verbs', id), data);
}

// ─── Image Cache ──────────────────────────────────────────────────────────────

export async function getCachedImage(word: string): Promise<ImageCacheDocument | null> {
  const snap = await getDoc(doc(db, 'image_cache', word));
  return snap.exists() ? (snap.data() as ImageCacheDocument) : null;
}

export async function saveImageCache(word: string, data: Omit<ImageCacheDocument, 'word' | 'createdAt'>) {
  await setDoc(doc(db, 'image_cache', word), {
    ...data,
    word,
    createdAt: serverTimestamp(),
  });
}

export async function getAllImageCache(): Promise<ImageCacheDocument[]> {
  const snap = await getDocs(collection(db, 'image_cache'));
  return snap.docs.map((d) => d.data() as ImageCacheDocument);
}

export async function updateImageCache(
  word: string,
  imageUrl: string,
  photographer: string,
): Promise<void> {
  await updateDoc(doc(db, 'image_cache', word), { imageUrl, photographer });
}

export async function approveImageCache(word: string): Promise<void> {
  await updateDoc(doc(db, 'image_cache', word), { approved: true });
}

export async function updateImageCacheTranslation(word: string, translation: string): Promise<void> {
  await updateDoc(doc(db, 'image_cache', word), { translation });
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
  await setDoc(doc(db, 'lesson_mistakes', docId), {
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
  const snap = await getDocs(query(collection(db, 'lesson_mistakes'), where('uid', '==', uid)));
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
  await deleteDoc(doc(db, 'lesson_mistakes', docId));
}

export async function getMistakeById(docId: string): Promise<LessonMistakeDocument | null> {
  const snap = await getDoc(doc(db, 'lesson_mistakes', docId));
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
  const snap = await getDocs(query(collection(db, 'lesson_mistakes'), where('uid', '==', uid)));
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

/**
 * Stores a pre-generated hook in the `lesson_pregen` collection so the next
 * lesson can start instantly without waiting for an AI call.
 */
export async function savePregeneratedLesson(
  uid: string,
  lessonId: string,
  hook: PregeneratedLessonDocument['hook'],
): Promise<void> {
  const id = pregeneratedDocId(uid, lessonId);
  await setDoc(doc(db, 'lesson_pregen', id), {
    uid,
    lessonId,
    hook,
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
  const snap = await getDoc(doc(db, 'lesson_pregen', pregeneratedDocId(uid, lessonId)));
  return snap.exists() ? (snap.data() as PregeneratedLessonDocument) : null;
}

/**
 * Deletes the pre-generated lesson entry after it has been consumed.
 */
export async function deletePregeneratedLesson(uid: string, lessonId: string): Promise<void> {
  await deleteDoc(doc(db, 'lesson_pregen', pregeneratedDocId(uid, lessonId)));
}
