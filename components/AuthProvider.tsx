'use client';

import { useEffect } from 'react';
import { onAuthChange } from '@/services/auth';
import { getUser } from '@/services/firestore';
import { useAuthStore } from '@/store/authStore';

/**
 * Mounts once in the root layout. Subscribes to Firebase auth state and
 * syncs both the User object and their Firestore profile into Zustand.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setInitialized } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);

      if (user) {
        const profile = await getUser(user.uid);
        setProfile(profile);
      } else {
        setProfile(null);
      }

      setInitialized(true);
    });

    return unsubscribe;
  }, [setUser, setProfile, setInitialized]);

  return <>{children}</>;
}
