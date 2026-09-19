'use client';

import type { Cluster } from '@/types';
import { cn } from '@/lib/utils';

/**
 * A cluster gathers independently strong streaks from unrelated events,
 * leagues and markets.
 *
 * The combined probability sits at the same visual weight as the component
 * count on purpose. Four selections at 85% each is a 52% four-fold, and a card
 * that shows four confident rows without that number invites exactly the wrong
 * reading.
 */
export function ClusterCard({ cluster }: { cluster: Cluster }) {
  const pct = (v: number) => Math.round(v * 100);

  return (
    <article className="overflow-hidden rounded-oracle-md border border-warm-stone bg-white shadow-soft">
      <header className="flex items-baseline justify-between gap-4 border-b border-warm-sand bg-warm-cream px-5 py-4">
        <div>
          <p className="font-display text-h5 text-txt-primary">
            {cluster.componentCount} independent streaks
          </p>
          <p className="mt-0.5 text-body-sm text-txt-tertiary">
            Different events, different markets
          </p>
        </div>

        <div className="text-right">
          <p className="font-display text-h4 text-txt-primary">
            {pct(cluster.combinedProbability)}%
          </p>
          <p className="text-caption text-txt-tertiary">all four together</p>
        </div>
      </header>

      <ul className="divide-y divide-warm-sand">
        {cluster.components.map((c) => {
          const s = c.snapshot;
          const result = s.result?.result;

          return (
            <li key={c.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm text-txt-secondary">
                  {s.event.homeTeam.name} v {s.event.awayTeam.name}
                  <span className="text-txt-tertiary"> · {s.event.league.name}</span>
                </p>
                <p className="truncate font-display text-body font-semibold text-txt-primary">
                  {s.streakCandidate.marketDefinition.displayName}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-body-sm font-semibold text-txt-primary">
                  {pct(s.hitRate)}%
                </p>
                <p className="text-caption text-txt-tertiary">
                  base {pct(s.baselineRate)}% · n={s.sampleSize}
                </p>
              </div>

              {result && (
                <span
                  className={cn(
                    'shrink-0 rounded-oracle-full px-2 py-0.5 text-caption font-semibold',
                    result === 'WIN'
                      ? 'bg-lift-pos/15 text-lift-strong'
                      : result === 'VOID'
                        ? 'bg-warm-sand text-txt-tertiary'
                        : 'bg-warm-sand text-txt-secondary',
                  )}
                >
                  {result === 'WIN' ? 'Won' : result === 'VOID' ? 'Void' : 'Lost'}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="border-t border-warm-sand px-5 py-3">
        <p className="text-caption text-txt-tertiary">
          Combined figure assumes the selections are independent, so treat it as an
          approximation. Each component is a historical record, not a prediction.
        </p>
      </footer>
    </article>
  );
}
