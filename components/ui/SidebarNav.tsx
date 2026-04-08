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

// Hide on lesson page — focused experience, no nav distractions
const HIDDEN_ON = ['/lesson'];

export function SidebarNav() {
  const pathname = usePathname();

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <aside
      className="hidden md:flex md:flex-col w-56 shrink-0 sticky top-0 h-screen overflow-y-auto"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <span
          className="font-display text-2xl font-bold"
          style={{ color: 'var(--color-primary)' }}
        >
          Verbalize
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-95"
              style={{
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              <Icon
                size={19}
                style={{
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  strokeWidth: isActive ? 2.5 : 1.8,
                  transition: 'color 150ms',
                }}
              />
              <span
                className="text-sm font-medium"
                style={{ transition: 'color 150ms' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
