'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, BookMarked, User, Beaker } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Logo } from '@/components/ui/Logo';

const NAV_ITEMS = [
  { href: '/dashboard',           label: 'Início',      Icon: Home       },
  { href: '/vocabulary', label: 'Vocabulário',  Icon: BookOpen   },
  { href: '/verbs',      label: 'Verbos',       Icon: BookMarked },
  { href: '/profile',    label: 'Perfil',       Icon: User       },
  { href: '/test-ui',    label: 'Lab UI',       Icon: Beaker,     adminOnly: true },
] as const;

// Hide on lesson page — focused experience, no nav distractions
const HIDDEN_ON = ['/lesson'];

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = user?.email === 'admin@gmail.com';

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const visibleItems = NAV_ITEMS.filter(item => !('adminOnly' in item) || isAdmin);

  return (
    <aside
      className="hidden md:flex md:flex-col w-56 shrink-0 sticky top-0 h-screen overflow-y-auto"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-7 pb-6 flex items-center gap-3">
        <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-sm border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] select-none">
          <Logo size={32} />
        </div>
        <span
          className="font-display text-2xl font-bold tracking-tight"
          style={{ color: 'var(--color-primary)' }}
        >
          Verbalize
        </span>
      </div>

      {/* Nav items */}
      <nav aria-label="Navegação lateral" className="flex-1 px-3 flex flex-col gap-0.5">
        {visibleItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl transition-all active:scale-95"
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
