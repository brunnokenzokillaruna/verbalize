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
 * Firebase is a browser-only SDK. We guard initialization with a typeof window
 * check so that SSR pre-rendering never calls initializeApp() (which would
 * throw auth/invalid-api-key because NEXT_PUBLIC_ vars aren't injected at
 * build-time for server-side rendering).
 *
 * Auth state is initialized in AuthProvider via useEffect, which only runs
 * client-side, so the `null!` assertions below are safe in practice.
 */
const isBrowser = typeof window !== 'undefined';

let _app: FirebaseApp;
let _auth: Auth;
let _db: Firestore;

if (isBrowser) {
  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  _auth = getAuth(_app);
  _db = getFirestore(_app);
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const app = _app!;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const auth = _auth!;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const db = _db!;
