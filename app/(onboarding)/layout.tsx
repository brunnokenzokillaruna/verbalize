import { FirebaseProviders } from '@/components/FirebaseProviders';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <FirebaseProviders>{children}</FirebaseProviders>;
}
