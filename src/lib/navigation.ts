'use client';

/**
 * Remembering where the reader came from.
 *
 * Links back used to be hard-wired ("Back to Dashboard", "Streaks"), pages
 * kept their tab in component state, and content loads after the page
 * mounts — so going back landed on the dashboard, the first tab, or the top
 * of the list. Three small pieces fix that:
 *
 *  - NavTracker keeps an in-app history of URLs (path + query) for the tab.
 *  - BackLink goes back to the previous in-app page when there is one, and
 *    names it ("Back to Streaks"); a page opened directly falls back to a
 *    sensible parent.
 *  - useScrollMemory saves each page's scroll position and puts it back when
 *    the reader returns with Back, once the page's content has loaded.
 *
 * sessionStorage only, per tab, wrapped so a blocked store just means no memory.
 */

const STACK_KEY = 'oraql:nav-stack';
const POP_KEY = 'oraql:nav-pop';
const scrollKey = (url: string) => `oraql:scroll:${url}`;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked or full: navigation still works, just without memory.
  }
}

export function currentUrl(): string {
  return typeof window === 'undefined' ? '' : window.location.pathname + window.location.search;
}

/** Record a page view. A Back (popstate) steps the stack back instead of growing it. */
export function recordVisit(url: string) {
  const stack = read<string[]>(STACK_KEY, []);
  const wasPop = read<boolean>(POP_KEY, false);
  if (wasPop) {
    const at = stack.lastIndexOf(url);
    write(STACK_KEY, at >= 0 ? stack.slice(0, at + 1) : [...stack, url]);
  } else if (stack[stack.length - 1] !== url) {
    write(STACK_KEY, [...stack, url].slice(-50));
  }
}

/** A query-only change on the same page (switching a tab) replaces, not adds. */
export function replaceCurrent(url: string) {
  const stack = read<string[]>(STACK_KEY, []);
  if (stack.length) stack[stack.length - 1] = url;
  else stack.push(url);
  write(STACK_KEY, stack);
}

export function previousUrl(): string | null {
  const stack = read<string[]>(STACK_KEY, []);
  return stack.length >= 2 ? stack[stack.length - 2] : null;
}

export function markPop(value: boolean) {
  write(POP_KEY, value);
}

export function wasPop(): boolean {
  return read<boolean>(POP_KEY, false);
}

export function saveScroll(url: string, y: number) {
  write(scrollKey(url), y);
}

export function savedScroll(url: string): number | null {
  return read<number | null>(scrollKey(url), null);
}

/** "Back to Streaks", "Back to match" — from where the reader actually was. */
export function backLabel(url: string | null, fallback: string): string {
  if (!url) return fallback;
  const path = url.split('?')[0];
  if (path.startsWith('/streaks')) return 'Back to Streaks';
  if (path.startsWith('/clusters')) return 'Back to Clusters';
  if (path.startsWith('/picks')) return 'Back to Picks';
  if (path.startsWith('/builder')) return 'Back to Bet Builder';
  if (path.startsWith('/events/')) return 'Back to match';
  if (path.startsWith('/teams/')) return 'Back to team';
  if (path.startsWith('/dashboard')) return 'Back to Dashboard';
  if (path.startsWith('/admin')) return 'Back to Engine controls';
  return 'Back';
}
