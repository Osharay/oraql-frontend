'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ResultStrip } from './ResultStrip';
import type { FixtureFormResponse, TeamFormResponse } from '@/types';

const pct = (v: number) => `${Math.round(v * 100)}%`;
const SHOWN = 6;

/**
 * Both sides of a fixture, each measured at the venue they play it at —
 * "Chelsea at home may be behaving a particular type of way".
 *
 * The strongest few markets for each team, side by side, so the reader sees
 * the opponent's form against the same fixture rather than one team's run in
 * isolation.
 */
export function FixtureForm({ eventId }: { eventId: string }) {
  const [data, setData] = useState<FixtureFormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<FixtureFormResponse>(`/streaks/form/event/${eventId}?window=10`)
      .then((r) => !cancelled && setData(r))
      .catch((e) => !cancelled && setError(e?.message ?? 'Could not load form'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-body-sm text-txt-tertiary">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading form
      </div>
    );
  }

  if (error || !data) {
    return <p className="py-6 text-body-sm text-txt-tertiary">Form is not available for this match yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Side form={data.home} venueLabel="at home" />
      <Side form={data.away} venueLabel="away" />
    </div>
  );
}

function Side({ form, venueLabel }: { form: TeamFormResponse; venueLabel: string }) {
  const name = form.team.shortName || form.team.name;
  const top = form.markets.slice(0, SHOWN);

  return (
    <section className="overflow-hidden rounded-oracle-md border border-warm-stone bg-white">
      <header className="flex items-baseline justify-between gap-3 border-b border-warm-sand bg-warm-cream px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-display text-body font-semibold text-txt-primary">{name}</p>
          <p className="text-caption text-txt-tertiary">
            Last {form.window} {venueLabel} · most unusual first
          </p>
        </div>
        <Link
          href={`/teams/${form.team.id}`}
          className="inline-flex shrink-0 items-center gap-1 text-caption font-semibold text-oracle-gold-dark hover:underline"
        >
          All {form.marketsMeasured}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      {top.length === 0 ? (
        <p className="px-4 py-6 text-body-sm text-txt-tertiary">
          Not enough settled {venueLabel} matches on record yet.
        </p>
      ) : (
        <ul className="divide-y divide-warm-sand">
          {top.map((m) => (
            <li key={m.marketId} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-body-sm font-medium text-txt-primary">{m.marketLabel}</p>
                <span className="shrink-0 font-display text-body-sm font-semibold text-txt-primary">
                  {m.recentWins}/{m.recentPlayed}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <ResultStrip last10={m.recent} />
                <span
                  className={cn(
                    'text-caption',
                    m.lift != null && m.lift > 0.05 ? 'text-lift-strong' : 'text-txt-tertiary',
                  )}
                >
                  usually {m.baselineRate != null ? pct(m.baselineRate) : '—'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
