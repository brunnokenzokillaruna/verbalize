// Prevent static generation — app routes are user-specific
export const dynamic = 'force-dynamic';

import { AuthGuard } from '@/components/AuthGuard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
