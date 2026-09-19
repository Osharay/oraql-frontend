'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Star,
  Layers,
  Settings,
  LogOut,
  Trophy,
  SlidersHorizontal,
  Flame,
  Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/streaks', label: 'Streaks', icon: Flame },
  { href: '/clusters', label: 'Clusters', icon: Boxes },
  { href: '/picks', label: 'OraQL_ Picks', icon: Star },
  { href: '/builder', label: 'Bet Builder', icon: Layers },
];

/** Shown only to admins — these controls spend API quota. */
const adminNavItems = [
  { href: '/admin', label: 'Engine controls', icon: SlidersHorizontal },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-dark-graphite bg-dark-ink">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-dark-graphite px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-oracle-sm bg-oracle-gold/20">
          <Trophy className="h-5 w-5 text-oracle-gold" />
        </div>
        <span className="font-display text-display-sm tracking-tight text-txt-inverse">
          OraQL_
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {[...navItems, ...(user?.role === 'ADMIN' ? adminNavItems : [])].map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-oracle-sm px-3 py-2.5 text-body font-medium transition-all duration-normal',
                isActive
                  ? 'bg-oracle-gold/15 text-oracle-gold'
                  : 'text-txt-inverse-2 hover:bg-dark-graphite hover:text-txt-inverse',
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-dark-graphite p-3">
        <div className="flex items-center gap-3 rounded-oracle-sm px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-oracle-gold/20 font-display text-caption font-semibold text-oracle-gold">
            {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-body-sm font-medium text-txt-inverse">
              {user?.firstName || user?.email || 'User'}
            </p>
            <p className="truncate text-caption text-txt-inverse-2">
              {user?.role || 'Free'}
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="rounded-md p-1.5 text-txt-inverse-2 transition-colors hover:bg-dark-graphite hover:text-danger"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
