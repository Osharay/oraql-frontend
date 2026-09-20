'use client';

import { Menu, Trophy } from 'lucide-react';

/**
 * The only way into the navigation below lg. There was no trigger at all
 * before, so the sidebar simply sat over the page.
 */
export function MobileHeader({ onOpen }: { onOpen: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-warm-sand bg-warm-white/90 px-4 backdrop-blur-md lg:hidden">
      <button
        onClick={onOpen}
        aria-label="Open menu"
        className="-ml-1 rounded-md p-2 text-txt-secondary transition-colors hover:bg-warm-cream hover:text-txt-primary"
      >
        <Menu className="h-5 w-5" />
      </button>

      <span className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-oracle-sm bg-dark-ink">
          <Trophy className="h-4 w-4 text-oracle-gold" />
        </span>
        <span className="font-display text-heading tracking-tight text-txt-primary">
          OraQL_
        </span>
      </span>
    </header>
  );
}
