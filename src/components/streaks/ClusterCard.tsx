'use client';

import type { Cluster, ClusterComponent } from '@/types';
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

/**
 * Who each row is about.
 *
 * This used to read the candidate's `selection`, which is null for
 * venue-agnostic slices — so every one of those fell through to "Both teams
 * combined", including Draw No Bet and Team To Win, which cover exactly one
 * club. A client caught it: "Only 1 team can be selected for the draw no bet
 * market... Which one is it?"
 *
 * The API now decides from the market definition and sends the answer.
 */
function componentSubject(c: ClusterComponent): string {
  if (c.snapshot.subject?.label) return c.snapshot.subject.label;

  // Older payloads: say nothing rather than assert the wrong thing.
  const sel = c.snapshot.streakCandidate.selection;
  if (sel === 'HOME') return c.snapshot.event.homeTeam.shortName || c.snapshot.event.homeTeam.name;
  if (sel === 'AWAY') return c.snapshot.event.awayTeam.shortName || c.snapshot.event.awayTeam.name;
  return 'Subject not recorded';
}

export function ClusterCard({ cluster }: { cluster: Cluster }) {
  const pct = (v: number) => Math.round(v * 100);
  const n = cluster.componentCount;
  const suggestive = cluster.tier === 'suggestive';

  return (
    <article
      className={cn(
        'overflow-hidden rounded-oracle-md border bg-white shadow-soft',
        suggestive ? 'border-dashed border-warm-stone' : 'border-warm-stone',
      )}
    >
      <header className="flex items-baseline justify-between gap-4 border-b border-warm-sand bg-warm-cream px-5 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-h5 text-txt-primary">
              {n} unrelated streaks
            </p>
            {/* The one thing a reader must not get wrong: whether luck has
                been ruled out for these, or only that the run looks good. */}
            <span
              title={cluster.caveat}
              className={cn(
                'rounded-oracle-full px-2 py-0.5 text-caption font-semibold',
                suggestive
                  ? 'bg-warm-sand text-txt-secondary'
                  : 'bg-lift-pos/20 text-lift-strong',
              )}
            >
              {cluster.label ?? 'Evidence-backed'}
            </span>
          </div>
          <p className="mt-0.5 text-body-sm text-txt-tertiary">
            {suggestive
              ? 'Strong recent form — not shown to be more than luck'
              : 'Different matches, different markets'}
          </p>
        </div>

        <div className="text-right">
          <p className="font-display text-h4 text-txt-primary">
            {pct(cluster.combinedProbability)}%
          </p>
          <p className="text-caption text-txt-tertiary">
            chance all {n} land
          </p>
        </div>
      </header>

      <ul className="divide-y divide-warm-sand">
        {cluster.components.map((c) => {
          const s = c.snapshot;
          const result = s.result?.result;
          const subject = componentSubject(c);

          return (
            <li key={c.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm text-txt-secondary">
                  {s.event.homeTeam.name} v {s.event.awayTeam.name}
                  <span className="text-txt-tertiary"> · {s.event.league.name}</span>
                </p>
                <p className="truncate font-display text-body font-semibold text-txt-primary">
                  {s.marketLabel || s.streakCandidate.marketDefinition.displayName}
                </p>
                {/* The row's subject, stated rather than implied. */}
                <p className="truncate text-caption text-txt-tertiary">{subject}</p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-body-sm font-semibold text-txt-primary">
                  {pct(s.hitRate)}%
                </p>
                <p className="text-caption text-txt-tertiary">
                  usually {pct(s.baselineRate)}% · {s.sampleSize} matches
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
          approximation. Each row is a record of what has happened, not a forecast.
        </p>
      </footer>
    </article>
  );
}
