'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, BookMarked, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',           label: 'Início',      Icon: Home       },
  { href: '/vocabulary', label: 'Vocabulário',  Icon: BookOpen   },
  { href: '/verbs',      label: 'Verbos',       Icon: BookMarked },
  { href: '/profile',    label: 'Perfil',       Icon: User       },
] as const;

// Pages where the bottom nav should be hidden
const HIDDEN_ON = ['/lesson', '/review'];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on lesson page (CheckButton occupies the bottom)
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-[600px] md:hidden"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderTop: '2px solid var(--color-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-opacity active:scale-95"
            >
              <Icon
                size={22}
                style={{
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  strokeWidth: isActive ? 2.5 : 1.8,
                  transition: 'color 150ms, stroke-width 150ms',
                }}
              />
              <span
                className="text-[10px] font-medium"
                style={{
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  transition: 'color 150ms',
                }}
              >
                {label}
              </span>
              {isActive && (
                <span
                  className="absolute top-0 h-0.5 w-8 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
