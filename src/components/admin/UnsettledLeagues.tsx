'use client';

import { useEffect, useState } from 'react';
import { EyeOff, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface CoverageRow {
  leagueId: string;
  league: string;
  country: string | null;
  group: 'MAIN' | 'CORNERS' | 'CARDS';
  finished: number;
  settled: number;
  share: number;
}
interface Coverage {
  minShare: number;
  days: number;
  hidden: CoverageRow[];
  watched: CoverageRow[];
}

const WHAT: Record<CoverageRow['group'], string> = {
  MAIN: 'all markets',
  CORNERS: 'corner markets',
  CARDS: 'card markets',
};
const pct = (v: number) => `${Math.round(v * 100)}%`;

/**
 * Leagues OraQL leaves out because their results cannot be checked: a pick
 * nobody can settle cannot be judged. They come back by themselves once
 * their data has been good for the same span.
 */
export function UnsettledLeagues() {
  const [data, setData] = useState<Coverage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Coverage>('/streaks/league-coverage')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load'));
  }, []);

  return (
    <section className="mb-6 rounded-oracle-md border border-warm-stone bg-white p-6 shadow-soft">
      <div className="mb-2 flex items-center gap-2">
        <EyeOff className="h-5 w-5 text-oracle-gold" />
        <h2 className="font-display text-h4 text-txt-primary">Leagues left out</h2>
      </div>
      {!data && !error && (
        <p className="flex items-center gap-2 text-body-sm text-txt-tertiary">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading
        </p>
      )}
      {error && <p className="text-body-sm text-danger">{error}</p>}
      {data && (
        <>
          <p className="mb-4 text-body-sm text-txt-secondary">
            Leagues whose finished matches settled less than {pct(data.minShare)} of the time over the last{' '}
            {data.days} days. Their streaks are not shown or captured, so nothing reaches users that the record
            cannot judge. They come back by themselves when their data improves.
          </p>
          {data.hidden.length === 0 ? (
            <p className="text-body-sm text-txt-tertiary">None at the moment.</p>
          ) : (
            <ul className="divide-y divide-warm-sand rounded-oracle-sm border border-warm-sand">
              {data.hidden.map((r) => (
                <li key={`${r.leagueId}-${r.group}`} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2">
                  <span className="text-body-sm text-txt-primary">
                    {r.league}
                    {r.country ? <span className="text-txt-tertiary"> · {r.country}</span> : null}
                    <span className="text-txt-tertiary"> · {WHAT[r.group]}</span>
                  </span>
                  <span className="text-caption text-txt-tertiary">
                    {r.settled} of {r.finished} settled ({pct(r.share)})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
