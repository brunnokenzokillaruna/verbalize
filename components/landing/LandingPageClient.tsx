'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SplineRobot = dynamic(() => import('@/components/landing/SplineRobot'), {
  ssr: false,
  loading: () => <div className="w-full h-full" aria-hidden="true" />,
});

export function LandingPageClient() {
  const { user, initialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (initialized && user) {
      router.replace('/dashboard');
    }
  }, [initialized, user, router]);

  if (!initialized) {
    return (
      <div
        className="absolute inset-0 z-30 flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
        aria-busy="true"
        aria-label="Carregando"
      >
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: 'var(--color-primary)' }}
        />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="relative z-10 w-full h-full max-w-6xl flex items-center justify-center pointer-events-auto">
      <div className="w-full h-full flex items-center justify-center">
        <SplineRobot />
      </div>
    </div>
  );
}
