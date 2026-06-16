'use client';

import { useEffect } from 'react';
import { onAuthChange } from '@/services/auth';
import { syncUserProfile } from '@/services/firestore';
import { useAuthStore } from '@/store/authStore';
import { shouldShowCurriculumNotice } from '@/components/dashboard/CurriculumSyncNotice';

/**
 * Mounts once in the root layout. Subscribes to Firebase auth state and
 * syncs both the User object and their Firestore profile into Zustand.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setCurriculumSyncNotice, setInitialized } = useAuthStore();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    void onAuthChange(async (user) => {
      setUser(user);

      if (user) {
        const result = await syncUserProfile(user.uid);
        setProfile(result?.profile ?? null);
        setCurriculumSyncNotice(
          result?.notice && shouldShowCurriculumNotice(result.notice) ? result.notice : null,
        );
      } else {
        setProfile(null);
        setCurriculumSyncNotice(null);
      }

      setInitialized(true);
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => unsubscribe?.();
  }, [setUser, setProfile, setCurriculumSyncNotice, setInitialized]);

  return <>{children}</>;
}
