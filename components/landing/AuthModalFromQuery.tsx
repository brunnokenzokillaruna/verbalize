'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthModal } from '@/components/auth/AuthModalProvider';

export function AuthModalFromQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openModal } = useAuthModal();

  useEffect(() => {
    const auth = searchParams.get('auth');
    if (auth === 'login' || auth === 'signup') {
      openModal(auth);
      router.replace('/', { scroll: false });
    }
  }, [searchParams, openModal, router]);

  return null;
}
