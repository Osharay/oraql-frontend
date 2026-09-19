'use client';

import { cn } from '@/lib/utils';

interface ResultStripProps {
  /** Newest first, e.g. "WWLWW". */
  last10?: string | null;
  className?: string;
}

/**
 * The run of recent results.
 *
 * Deliberately not colour alone — roughly one man in twelve has some colour
 * vision deficiency, so a win is a filled block and a loss is a hollow one.
 * The letter is there too for screen readers.
 */
export function ResultStrip({ last10, className }: ResultStripProps) {
  if (!last10) return null;

  // Oldest on the left reads more naturally as a timeline.
  const results = [...last10].reverse();

  return (
    <div className={cn('flex items-center gap-1', className)} aria-label={`Last ${results.length} results, oldest first`}>
      {results.map((r, i) => {
        const won = r === 'W';
        return (
          <span
            key={i}
            title={won ? 'Won' : 'Lost'}
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded-[3px] text-[9px] font-semibold leading-none',
              won
                ? 'bg-lift-pos/20 text-lift-strong'
                : 'border border-warm-stone bg-transparent text-txt-tertiary',
            )}
          >
            {won ? 'W' : 'L'}
          </span>
        );
      })}
    </div>
  );
}
