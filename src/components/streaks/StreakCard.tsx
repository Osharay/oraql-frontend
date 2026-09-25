'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { StreakCandidate } from '@/types';
import { ResultStrip } from './ResultStrip';
import { LiftMeter } from './LiftMeter';
import { cn } from '@/lib/utils';

const STATUS_COPY: Record<string, { label: string; className: string }> = {
  NEW: { label: 'New', className: 'bg-oracle-gold/15 text-oracle-gold-dark' },
  ACTIVE: { label: 'Active', className: 'bg-lift-pos/15 text-lift-strong' },
  STRENGTHENING: { label: 'Strengthening', className: 'bg-lift-pos/20 text-lift-strong' },
  WEAKENING: { label: 'Weakening', className: 'bg-warm-sand text-txt-secondary' },
  // Broken is not an error — it is a past-tense fact, so no danger colour.
  BROKEN: { label: 'Broken', className: 'bg-warm-sand text-txt-tertiary' },
  EXPIRED: { label: 'Expired', className: 'bg-warm-sand text-txt-tertiary' },
  FILTERED: { label: 'Not significant', className: 'bg-warm-sand text-txt-tertiary' },
};

/** Which matches the record covers, in words rather than an enum. */
function venuePhrase(venue?: string): string {
  if (venue === 'HOME') return 'home matches only';
  if (venue === 'AWAY') return 'away matches only';
  return 'home and away';
}

/**
 * An adjusted p-value is the share of discoveries like this one you would
 * expect to be coincidence. Stating that in words beats printing "0.032"
 * next to the word "p" for anyone who is not a statistician.
 */
function coincidenceCopy(adjusted?: number | null): { value: string; note: string } {
  if (adjusted == null) return { value: '—', note: 'Not scored in this run.' };
  const pct = adjusted * 100;
  const value = pct < 0.1 ? 'under 0.1%' : `${pct.toFixed(1)}%`;
  return {
    value,
    note: `Of patterns flagged like this one, about ${value} are expected to be coincidence.`,
  };
}

export function StreakCard({
  candidate,
  suggestive = false,
}: {
  candidate: StreakCandidate;
  suggestive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const status = STATUS_COPY[candidate.status] ?? STATUS_COPY.ACTIVE;
  const venue = candidate.context?.venue;
  const subject = candidate.entity?.shortName || candidate.entity?.name;
  const coincidence = coincidenceCopy(candidate.adjustedPValue);
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  // Below half, it fails more often than it lands. Still a real finding about
  // the team — but a tendency to know, not a selection to back.
  const tendency = candidate.hitRate < 0.5;
  const season = candidate.thisSeason;

  return (
    <article
      className={cn(
        'rounded-oracle-md border bg-white p-5 shadow-soft transition-shadow duration-normal hover:shadow-card',
        suggestive ? 'border-dashed border-warm-stone' : 'border-warm-stone',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* The eyebrow only earns its place when the heading does not
              already name the club — otherwise it reads twice. */}
          {subject && !candidate.marketLabel && (
            <p className="text-caption font-semibold uppercase tracking-wide text-oracle-gold-dark">
              {subject}
            </p>
          )}
          <h3 className="font-display text-h5 text-txt-primary">
            {candidate.marketLabel || candidate.marketDefinition.displayName}
          </h3>
          {candidate.subject?.label && (
            <p className="mt-0.5 text-body-sm text-txt-secondary">
              {candidate.subject.label}
              {candidate.entity?.type === 'TEAM' && (
                <>
                  {' · '}
                  <Link
                    href={`/teams/${candidate.entity.id}`}
                    className="font-medium text-oracle-gold-dark hover:underline"
                  >
                    all markets
                  </Link>
                </>
              )}
            </p>
          )}
          <p className="mt-2 text-body font-semibold text-txt-primary">
            Happens in {pct(candidate.hitRate)} of their matches
          </p>
          <p className="mt-0.5 text-body-sm text-txt-tertiary">
            {venuePhrase(venue)}
            {' · '}
            {candidate.wins} of {candidate.sampleSize} settled matches
            {season && season.played > 0 && (
              <>
                {' · '}
                <span className="text-txt-secondary">
                  this season {season.wins} of {season.played} ({pct(season.wins / season.played)})
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={cn(
              'rounded-oracle-full px-2.5 py-1 text-caption font-semibold',
              status.className,
            )}
          >
            {status.label}
          </span>
          {tendency && (
            <span className="rounded-oracle-full bg-warm-sand px-2.5 py-1 text-caption font-semibold text-txt-secondary">
              Tendency, not a pick
            </span>
          )}
        </div>
      </div>

      {tendency && (
        <p className="mt-3 rounded-oracle-sm bg-warm-cream px-3 py-2 text-body-sm text-txt-secondary">
          Less likely than not: it fails in {pct(1 - candidate.hitRate)} of their matches. What
          stands out is that it happens {(candidate.hitRate / candidate.baselineRate).toFixed(1)}×
          as often as for a typical side.
        </p>
      )}

      <div className="mt-4">
        <LiftMeter hitRate={candidate.hitRate} baselineRate={candidate.baselineRate} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <ResultStrip last10={candidate.last10} />
        {candidate.currentStreak > 0 && (
          <span className="text-body-sm text-txt-secondary">
            {candidate.currentStreak} in a row right now
          </span>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto flex items-center gap-1 text-body-sm text-txt-tertiary transition-colors duration-normal hover:text-txt-primary"
        >
          Why this qualified
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-normal', open && 'rotate-180')}
          />
        </button>
      </div>

      {open && (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-warm-sand pt-4 text-body-sm sm:grid-cols-4">
          <div>
            <dt className="text-txt-tertiary">Matches counted</dt>
            <dd className="font-semibold text-txt-primary">{candidate.sampleSize}</dd>
          </div>
          <div>
            <dt className="text-txt-tertiary">Longest run</dt>
            <dd className="font-semibold text-txt-primary">
              {candidate.longestStreak} in a row
            </dd>
          </div>
          <div>
            <dt className="text-txt-tertiary">Against the usual rate</dt>
            <dd className="font-semibold text-txt-primary">
              {pct(candidate.hitRate)} vs {pct(candidate.baselineRate)}
            </dd>
          </div>
          <div>
            <dt className="text-txt-tertiary">Could be coincidence</dt>
            <dd
              className="font-semibold text-txt-primary"
              title={
                candidate.adjustedPValue != null
                  ? `Adjusted p-value: ${candidate.adjustedPValue}`
                  : undefined
              }
            >
              {coincidence.value}
            </dd>
          </div>

          <p className="col-span-2 text-body-sm text-txt-secondary sm:col-span-4">
            {suggestive
              ? 'This pattern leans the right way but is not distinguishable from its baseline once the number of slices tested is accounted for. Exploratory only.'
              : `${subject ? `${subject} has landed this` : 'This landed'} in ${Math.round(
                  candidate.hitRate * 100,
                )}% of ${candidate.sampleSize} settled matches, against ${Math.round(
                  candidate.baselineRate * 100,
                )}% for the market generally. ${coincidence.note} It is a record of what has happened, not a forecast.`}
          </p>
        </dl>
      )}
    </article>
  );
}
