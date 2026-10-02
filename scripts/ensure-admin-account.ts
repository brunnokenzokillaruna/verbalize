/**
 * Creates the local admin Auth user and Firestore profile if missing.
 * Password is read from .cursor/rules/admin-login.mdc (gitignored).
 * Run: npx tsx scripts/ensure-admin-account.ts
 */
import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { CURRICULUM_VERSION } from '../lib/curriculum/lessonIdMigration';
import { INITIAL_LESSON_PROGRESS } from '../lib/curriculum/lessonProgress';

const EMAIL = 'admin@gmail.com';

function loadEnv(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function readPassword(): string {
  const rulePath = path.resolve('.cursor/rules/admin-login.mdc');
  const text = fs.readFileSync(rulePath, 'utf8');
  const match = text.match(/Senha:\s*(\S+)/);
  if (!match?.[1]) throw new Error('Password line missing from admin rule');
  return match[1];
}

async function main() {
  const env = loadEnv(path.resolve('.env.local'));
  const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY || env.FIREBASE_API_KEY;
  const authDomain = env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN;
  const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID;
  const storageBucket = env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET;
  const messagingSenderId =
    env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID;
  const appId = env.NEXT_PUBLIC_FIREBASE_APP_ID || env.FIREBASE_APP_ID;
  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error('Firebase web config missing from .env.local');
  }

  const app = initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  });
  const auth = getAuth(app);
  const db = getFirestore(app);
  const password = readPassword();

  let created = false;
  try {
    await createUserWithEmailAndPassword(auth, EMAIL, password);
    created = true;
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code !== 'auth/email-already-in-use') throw err;
    await signInWithEmailAndPassword(auth, EMAIL, password);
  }

  const user = auth.currentUser;
  if (!user) throw new Error('Signed in without a current user');

  const ref = doc(db, 'users', user.uid);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: EMAIL,
      name: 'Admin',
      profession: 'Outro',
      interests: ['Viagens'],
      languageGoals: 'Viajar com confiança',
      currentTargetLanguage: 'fr',
      currentStreak: 0,
      totalLessonsCompleted: 0,
      lessonProgress: INITIAL_LESSON_PROGRESS,
      curriculumVersion: CURRICULUM_VERSION,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
  }

  console.log(created ? 'Admin account created and profile saved.' : 'Admin account already existed; sign-in succeeded.');
  console.log(existing.exists() ? 'Profile already present.' : 'Profile created.');
  process.exit(0);
}

main().catch((err) => {
  const code = (err as { code?: string }).code;
  console.error(code || (err as Error).message);
  process.exit(1);
});
