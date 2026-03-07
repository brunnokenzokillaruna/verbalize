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
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserDocument, UserVocabularyDocument, ImageCacheDocument } from '@/types';

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
