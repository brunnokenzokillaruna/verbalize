// Prevent static generation — onboarding depends on client-side Firebase state
export const dynamic = 'force-dynamic';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
