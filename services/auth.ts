import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  deleteUser,
  type User,
} from 'firebase/auth';
import { getAuthInstance } from './firebase';

const googleProvider = new GoogleAuthProvider();

export async function signUpWithEmail(email: string, pwd: string) {
  const auth = await getAuthInstance();
  return createUserWithEmailAndPassword(auth, email, pwd);
}

export async function signInWithEmail(email: string, pwd: string) {
  const auth = await getAuthInstance();
  return signInWithEmailAndPassword(auth, email, pwd);
}

export async function signInWithGoogle() {
  const auth = await getAuthInstance();
  return signInWithPopup(auth, googleProvider);
}

export async function logOut() {
  const auth = await getAuthInstance();
  return signOut(auth);
}

export async function deleteAccount(user: User) {
  return deleteUser(user);
}

export async function onAuthChange(callback: (user: User | null) => void) {
  const auth = await getAuthInstance();
  return onAuthStateChanged(auth, callback);
}
