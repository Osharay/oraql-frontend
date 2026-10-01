'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { Cluster, ClusterComponent } from '@/types';
import { cn, minimumOddsCopy } from '@/lib/utils';
import { ResultStrip } from './ResultStrip';

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
        {cluster.components.map((c) => (
          <ClusterRow key={c.id} component={c} />
        ))}
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

/** "Sat 3 Oct, 15:00" in the reader's own time zone. */
function kickoffCopy(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

/**
 * One selection in a cluster. Collapsed, it names the match, the market and
 * the record in full — wrapped, never cut off, since on a phone the names were
 * the part being lost. Tapped, it opens into the kickoff, competition, recent
 * form and links to the match and the team.
 */
function ClusterRow({ component: c }: { component: ClusterComponent }) {
  const [open, setOpen] = useState(false);
  const s = c.snapshot;
  const sc = s.streakCandidate;
  const result = s.result?.result;
  const subject = componentSubject(c);
  const pct = (v: number) => Math.round(v * 100);
  const recent = sc.context?.recent;
  const formRate = sc.context?.formRate ?? null;
  const chance = formRate ?? s.hitRate;
  const price = chance >= 0.5 ? minimumOddsCopy(chance) : null;
  const teamId = sc.entityType === 'TEAM' ? sc.entityId : null;
  const where = [s.event.league.name, s.event.league.country].filter(Boolean).join(' · ');

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors duration-normal hover:bg-warm-cream/50"
      >
        <div className="min-w-0 flex-1">
          <p className="break-words text-body-sm text-txt-secondary">
            {s.event.homeTeam.name} v {s.event.awayTeam.name}
            <span className="text-txt-tertiary"> · {s.event.league.name}</span>
          </p>
          <p className="break-words font-display text-body font-semibold text-txt-primary">
            {s.marketLabel || sc.marketDefinition.displayName}
          </p>
          <p className="break-words text-caption text-txt-tertiary">{subject}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-body-sm font-semibold text-txt-primary">{pct(s.hitRate)}%</p>
          <p className="text-caption text-txt-tertiary">usually {pct(s.baselineRate)}%</p>
          {result && (
            <span
              className={cn(
                'mt-1 inline-block rounded-oracle-full px-2 py-0.5 text-caption font-semibold',
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
        </div>

        <ChevronDown
          className={cn(
            'mt-1 h-4 w-4 shrink-0 text-txt-tertiary transition-transform duration-normal',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="space-y-2 bg-warm-cream/40 px-5 pb-4 pt-1 text-body-sm">
          <p className="text-txt-secondary">
            <span className="font-medium text-txt-primary">{kickoffCopy(s.event.kickoffAt)}</span>
            {where && <span className="text-txt-tertiary"> · {where}</span>}
          </p>

          <p className="text-txt-secondary">
            {sc.wins != null ? `${sc.wins} of ${s.sampleSize}` : `${s.sampleSize}`} settled matches (
            {pct(s.hitRate)}%) against {pct(s.baselineRate)}% for the market usually
            {recent && recent.played > 0 && (
              <>
                {' · '}last {recent.played}: {recent.wins} of {recent.played}
              </>
            )}
            {formRate != null && <> · recent form {pct(formRate)}%</>}
          </p>

          {(sc.last10 || s.currentStreak > 1) && (
            <div className="flex flex-wrap items-center gap-3">
              {sc.last10 && <ResultStrip last10={sc.last10} />}
              {s.currentStreak > 1 && (
                <span className="text-caption text-txt-secondary">{s.currentStreak} in a row</span>
              )}
            </div>
          )}

          {price && <p className="font-medium text-oracle-gold-dark">{price}</p>}

          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            {s.event.id && (
              <Link href={`/events/${s.event.id}`} className="font-medium text-oracle-gold-dark hover:underline">
                Every market for this match →
              </Link>
            )}
            {teamId && (
              <Link href={`/teams/${teamId}`} className="font-medium text-oracle-gold-dark hover:underline">
                {subject.split(' only')[0]}: all markets →
              </Link>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
