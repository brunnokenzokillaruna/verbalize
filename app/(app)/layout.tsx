// Prevent static generation — app routes are user-specific
export const dynamic = 'force-dynamic';

import { FirebaseProviders } from '@/components/FirebaseProviders';
import { AuthGuard } from '@/components/AuthGuard';
import { BottomNav } from '@/components/ui/BottomNav';
import { SidebarNav } from '@/components/ui/SidebarNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProviders>
      <AuthGuard>
        <div className="flex min-h-dvh">
          <SidebarNav />
          <main id="main-content" className="flex-1 min-w-0">
            {children}
          </main>
        </div>
        <BottomNav />
      </AuthGuard>
    </FirebaseProviders>
  );
}
