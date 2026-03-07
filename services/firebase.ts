import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Initialize Firebase once — works in both browser and Node.js (server actions).
 * NEXT_PUBLIC_* vars are available in both contexts on Vercel.
 *
 * - `app` and `db` (Firestore) are safe server-side (used by server actions).
 * - `auth` is only instantiated in the browser because it relies on
 *   localStorage persistence. Client components use it via AuthProvider;
 *   server actions must never call auth directly.
 */
const _app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const _db: Firestore = getFirestore(_app);

// Auth persistence (localStorage) is browser-only — instantiate lazily
let _auth: Auth;
if (typeof window !== 'undefined') {
  _auth = getAuth(_app);
}

export const app = _app;
export const db = _db;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const auth = _auth!;
