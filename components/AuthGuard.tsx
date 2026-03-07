'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, initialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!profile) {
      router.replace('/onboarding');
    }
  }, [initialized, user, profile, router]);

  if (!initialized) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <h1
            className="font-display text-3xl font-bold"
            style={{ color: 'var(--color-primary)' }}
          >
            Verbalize
          </h1>
          <Loader2
            size={24}
            className="animate-spin"
            style={{ color: 'var(--color-text-muted)' }}
          />
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  return <>{children}</>;
}
