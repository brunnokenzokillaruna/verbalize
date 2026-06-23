import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFirebaseConfigFromEnv, type FirebaseConfig } from '@/lib/firebaseConfig';

type FirebaseInstances = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

let initPromise: Promise<FirebaseInstances> | null = null;

async function loadFirebaseConfig(): Promise<FirebaseConfig> {
  if (typeof window !== 'undefined') {
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      throw new Error('Failed to load Firebase configuration');
    }
    return response.json() as Promise<FirebaseConfig>;
  }

  // Server-side: read env directly — never HTTP-fetch our own API (blocks under load).
  return getFirebaseConfigFromEnv();
}

async function initFirebase(): Promise<FirebaseInstances> {
  if (!initPromise) {
    initPromise = (async () => {
      const config = await loadFirebaseConfig();
      const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];

      return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
      };
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }

  return initPromise;
}

export async function getAuthInstance(): Promise<Auth> {
  return (await initFirebase()).auth;
}

export async function getDb(): Promise<Firestore> {
  return (await initFirebase()).db;
}
