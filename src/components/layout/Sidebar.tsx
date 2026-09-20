'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Star,
  Layers,
  LogOut,
  Trophy,
  SlidersHorizontal,
  Flame,
  Boxes,
  X,
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

interface SidebarProps {
  /** Only meaningful below lg, where the sidebar is a drawer. */
  open: boolean;
  onClose: () => void;
}

/**
 * Permanent rail from lg up; a drawer below it.
 *
 * It used to be `fixed w-64` at every width with nothing to dismiss it, so on
 * a phone it covered the page and could not be got rid of — while the main
 * column kept a 16rem left margin, leaving a sliver of usable width and
 * pushing everything else off the side.
 */
export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // Following a link should dismiss the drawer; the destination renders
  // underneath it otherwise.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    // Stop the page behind the drawer from scrolling with it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop — drawer only. */}
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          'fixed inset-0 z-40 bg-dark-ink/60 transition-opacity duration-normal lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-[100dvh] w-64 max-w-[85vw] flex-col',
          'border-r border-dark-graphite bg-dark-ink',
          'transition-transform duration-normal will-change-transform',
          'lg:z-40 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-hidden={!open ? undefined : undefined}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-dark-graphite px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-oracle-sm bg-oracle-gold/20">
            <Trophy className="h-5 w-5 text-oracle-gold" />
          </div>
          <span className="font-display text-display-sm tracking-tight text-txt-inverse">
            OraQL_
          </span>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto rounded-md p-1.5 text-txt-inverse-2 transition-colors hover:bg-dark-graphite hover:text-txt-inverse lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="shrink-0 border-t border-dark-graphite p-3">
          <div className="flex items-center gap-3 rounded-oracle-sm px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-oracle-gold/20 font-display text-caption font-semibold text-oracle-gold">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-medium text-txt-inverse">
                {user?.firstName || user?.email || 'User'}
              </p>
              <p className="truncate text-caption text-txt-inverse-2">
                {user?.role || 'Free'}
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="shrink-0 rounded-md p-1.5 text-txt-inverse-2 transition-colors hover:bg-dark-graphite hover:text-danger"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
