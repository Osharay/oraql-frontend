'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { markPop, recordVisit } from '@/lib/navigation';

/** Keeps the in-app history (see lib/navigation.ts). Renders nothing. */
export function NavTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    const q = search?.toString();
    recordVisit(pathname + (q ? `?${q}` : ''));
    // The pop flag is read by the page's scroll memory on this same render
    // cycle, then cleared shortly after so a later click is not mistaken
    // for a Back.
    const t = window.setTimeout(() => markPop(false), 1500);
    return () => window.clearTimeout(t);
  }, [pathname, search]);

  return null;
}
