'use client';

import { useEffect, useRef } from 'react';
import { currentUrl, savedScroll, saveScroll, wasPop } from '@/lib/navigation';

/**
 * Remember this page's scroll position, and restore it when the reader comes
 * back with Back. `ready` is when the page's content has loaded: restoring
 * before then would scroll an empty page.
 *
 * The saved position is read once, as the page mounts. Until it has been
 * restored nothing is saved: while the content loads the page is short, the
 * browser clamps the scroll to the top, and saving that would overwrite the
 * very position being restored.
 */
export function useScrollMemory(ready: boolean) {
  const target = useRef<number | null | undefined>(undefined);
  const settled = useRef(false);
  if (target.current === undefined && typeof window !== 'undefined') {
    target.current = wasPop() ? savedScroll(currentUrl()) : null;
  }

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (!settled.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => saveScroll(currentUrl(), window.scrollY));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!ready || settled.current) return;
    const y = target.current;
    if (y == null || y <= 0) {
      settled.current = true;
      return;
    }
    // Parts of a page load after its main content (the match board, say), so
    // wait until the page is tall enough to scroll that far — up to 3s.
    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      const tallEnough = document.documentElement.scrollHeight >= y + window.innerHeight - 4;
      if (tallEnough || tries >= 30) {
        window.clearInterval(timer);
        window.scrollTo(0, y);
        settled.current = true;
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [ready]);
}
