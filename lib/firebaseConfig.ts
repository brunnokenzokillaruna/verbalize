export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function readEnv(primary: string, fallback: string): string {
  const value = process.env[primary] ?? process.env[fallback];
  if (!value) {
    throw new Error(`Missing Firebase env: ${primary}`);
  }
  return value;
}

/** Reads Firebase config from server env vars (no HTTP round-trip). */
export function getFirebaseConfigFromEnv(): FirebaseConfig {
  return {
    apiKey: readEnv('FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: readEnv('FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: readEnv('FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: readEnv('FIREBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readEnv(
      'FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    ),
    appId: readEnv('FIREBASE_APP_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID'),
  };
}
