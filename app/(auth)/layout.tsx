// Prevent static generation — auth pages depend on client-side Firebase state
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main id="main-content">{children}</main>;
}
