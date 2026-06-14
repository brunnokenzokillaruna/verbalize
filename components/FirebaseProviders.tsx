'use client';

import { AuthProvider } from '@/components/AuthProvider';
import { AuthModalProvider } from '@/components/auth/AuthModalProvider';

export function FirebaseProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthModalProvider>{children}</AuthModalProvider>
    </AuthProvider>
  );
}
