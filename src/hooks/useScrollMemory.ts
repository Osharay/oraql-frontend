'use client';

import { useEffect, useRef } from 'react';
import { currentUrl, savedScroll, saveScroll, wasPop } from '@/lib/navigation';

/**
 * Remember this page's scroll position, and restore it when the reader comes
 * back with Back. `ready` is when the page's content has loaded: restoring
 * before then would scroll an empty page.
 */
export function useScrollMemory(ready: boolean) {
  const restored = useRef(false);
  const cameBack = useRef<boolean | null>(null);
  if (cameBack.current === null && typeof window !== 'undefined') cameBack.current = wasPop();

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
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
    if (!ready || restored.current) return;
    restored.current = true;
    if (!cameBack.current) return;
    const y = savedScroll(currentUrl());
    if (y == null || y <= 0) return;
    // Parts of a page load after its main content (the match board, say), so
    // wait until the page is tall enough to scroll that far — up to 3s.
    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      const tallEnough = document.documentElement.scrollHeight >= y + window.innerHeight - 4;
      if (tallEnough || tries >= 30) {
        window.clearInterval(timer);
        window.scrollTo(0, y);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [ready]);
}
