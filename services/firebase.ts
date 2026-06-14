import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

type FirebaseInstances = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

let initPromise: Promise<FirebaseInstances> | null = null;

function getFirebaseConfigUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/firebase-config';
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  return `${origin}/api/firebase-config`;
}

async function initFirebase(): Promise<FirebaseInstances> {
  if (!initPromise) {
    initPromise = (async () => {
      const response = await fetch(getFirebaseConfigUrl());
      if (!response.ok) {
        throw new Error('Failed to load Firebase configuration');
      }

      const config = (await response.json()) as FirebaseConfig;
      const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];

      return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
      };
    })();
  }

  return initPromise;
}

export async function getAuthInstance(): Promise<Auth> {
  return (await initFirebase()).auth;
}

export async function getDb(): Promise<Firestore> {
  return (await initFirebase()).db;
}
