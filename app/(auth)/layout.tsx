import { FirebaseProviders } from '@/components/FirebaseProviders';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProviders>
      <main id="main-content">{children}</main>
    </FirebaseProviders>
  );
}
