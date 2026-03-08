import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
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
import type { UserDocument, UserVocabularyDocument, ImageCacheDocument, VerbDocument, SupportedLanguage } from '@/types';
import { calculateNextReview } from '@/lib/srs';

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
      srsLevel: newLevel,
      mistakeCount: 0,
      firstSeen: serverTimestamp(),
      lastReview: serverTimestamp(),
      nextReview: Timestamp.fromDate(nextReview),
    });
  } else {
    // Already exists — advance SRS level
    const docRef = snap.docs[0].ref;
    const existing = snap.docs[0].data() as UserVocabularyDocument;
    const { newLevel, nextReview } = calculateNextReview(existing.srsLevel, true);
    await updateDoc(docRef, {
      srsLevel: newLevel,
      lastReview: serverTimestamp(),
      nextReview: Timestamp.fromDate(nextReview),
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
 * - Persists both to Firestore and returns the updated fields.
 */
export async function updateLessonStats(
  uid: string,
  profile: UserDocument,
): Promise<Pick<UserDocument, 'totalLessonsCompleted' | 'currentStreak' | 'lastLessonDate'>> {
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

  const updates = {
    totalLessonsCompleted: profile.totalLessonsCompleted + 1,
    currentStreak: newStreak,
    lastLessonDate: Timestamp.fromDate(todayStart),
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
