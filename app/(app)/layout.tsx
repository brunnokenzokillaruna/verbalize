// Prevent static generation — app routes are user-specific
export const dynamic = 'force-dynamic';

import { AuthGuard } from '@/components/AuthGuard';
import { BottomNav } from '@/components/ui/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {children}
      <BottomNav />
    </AuthGuard>
  );
}
