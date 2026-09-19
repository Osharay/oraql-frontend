'use client';

import { useState } from 'react';
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

  return (
    <article
      className={cn(
        'rounded-oracle-md border bg-white p-5 shadow-soft transition-shadow duration-normal hover:shadow-card',
        suggestive ? 'border-dashed border-warm-stone' : 'border-warm-stone',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-h5 text-txt-primary">
            {candidate.marketDefinition.displayName}
          </h3>
          <p className="mt-0.5 text-body-sm text-txt-tertiary">
            {venue && venue !== 'ALL' ? `${venue.toLowerCase()} matches` : 'all matches'}
            {' · '}
            {candidate.wins}/{candidate.sampleSize} settled
          </p>
        </div>

        <span
          className={cn(
            'shrink-0 rounded-oracle-full px-2.5 py-1 text-caption font-semibold',
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-4">
        <LiftMeter hitRate={candidate.hitRate} baselineRate={candidate.baselineRate} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <ResultStrip last10={candidate.last10} />
        {candidate.currentStreak > 0 && (
          <span className="text-body-sm text-txt-secondary">
            {candidate.currentStreak} in a row
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
            <dt className="text-txt-tertiary">Sample</dt>
            <dd className="font-semibold text-txt-primary">{candidate.sampleSize}</dd>
          </div>
          <div>
            <dt className="text-txt-tertiary">Longest run</dt>
            <dd className="font-semibold text-txt-primary">{candidate.longestStreak}</dd>
          </div>
          <div>
            <dt className="text-txt-tertiary">Lift</dt>
            <dd className="font-semibold text-txt-primary">
              {candidate.lift >= 0 ? '+' : ''}
              {Math.round(candidate.lift * 100)} pts
            </dd>
          </div>
          <div>
            <dt className="text-txt-tertiary">Adjusted p</dt>
            <dd className="font-semibold text-txt-primary">
              {candidate.adjustedPValue != null
                ? candidate.adjustedPValue < 0.001
                  ? candidate.adjustedPValue.toExponential(1)
                  : candidate.adjustedPValue.toFixed(3)
                : '—'}
            </dd>
          </div>

          <p className="col-span-2 text-body-sm text-txt-secondary sm:col-span-4">
            {suggestive
              ? 'This pattern leans the right way but is not distinguishable from its baseline once the number of slices tested is accounted for. Exploratory only.'
              : `Observed ${Math.round(candidate.hitRate * 100)}% against a baseline of ${Math.round(
                  candidate.baselineRate * 100,
                )}% over ${candidate.sampleSize} settled results, and the gap survived correction for every slice tested in this run.`}
          </p>
        </dl>
      )}
    </article>
  );
}
