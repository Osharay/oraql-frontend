'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { FormRow } from '@/components/streaks/FormRow';
import { EmptyState } from '@/components/streaks/EmptyState';
import type { TeamFormResponse } from '@/types';

type Venue = 'ALL' | 'HOME' | 'AWAY';
type Sort = 'lift' | 'rate' | 'run';

const VENUES: Array<[Venue, string]> = [
  ['ALL', 'All matches'],
  ['HOME', 'At home'],
  ['AWAY', 'Away'],
];

const SORTS: Array<[Sort, string]> = [
  ['lift', 'Most unusual'],
  ['run', 'Longest run'],
  ['rate', 'Highest rate'],
];

const WINDOWS = [5, 10];

/** Grouping the registry's categories into what a punter would call them. */
const GROUPS: Array<[string, string, (c: string) => boolean]> = [
  ['all', 'All markets', () => true],
  ['result', 'Result', (c) => c === 'MATCH_RESULT' || c === 'HANDICAP'],
  ['goals', 'Goals', (c) => c === 'GOALS'],
  ['halves', 'Halves', (c) => c === 'HALFTIME'],
  ['combos', 'Combinations', (c) => c === 'SPECIAL'],
  ['other', 'Corners & cards', (c) => c === 'CORNERS' || c === 'CARDS'],
];

/**
 * A team's form across every market.
 *
 * From the client: "any random team you look at, you should be able to tell
 * their best performing market streaks — even if their best is at 60%".
 */
export default function TeamFormPage() {
  const params = useParams();
  const teamId = params?.id as string;

  const [venue, setVenue] = useState<Venue>('ALL');
  const [sort, setSort] = useState<Sort>('lift');
  const [span, setSpan] = useState(10);
  const [group, setGroup] = useState('all');
  const [data, setData] = useState<TeamFormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get<TeamFormResponse>(
        `/streaks/form/team/${teamId}?venue=${venue}&sort=${sort}&window=${span}`,
      )
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e?.message ?? 'Could not load form'))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [teamId, venue, sort, span]);

  const visible = useMemo(() => {
    const test = GROUPS.find(([k]) => k === group)?.[2] ?? (() => true);
    return (data?.markets ?? []).filter((m) => test(m.category));
  }, [data, group]);

  const name = data?.team.shortName || data?.team.name;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/streaks"
        className="mb-6 inline-flex items-center gap-2 text-body-sm text-txt-secondary transition-colors hover:text-txt-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Streaks
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-display-md text-txt-primary">
          {name ?? 'Team form'}
        </h1>
        <p className="mt-1 text-body text-txt-secondary">
          Every market over the last {span} matches, with the last two seasons and what
          the market usually does beside it.
        </p>
      </header>

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {VENUES.map(([v, label]) => (
            <Pill key={v} active={venue === v} onClick={() => setVenue(v)}>
              {label}
            </Pill>
          ))}
          <span className="mx-1 hidden w-px self-stretch bg-warm-sand sm:block" />
          {WINDOWS.map((w) => (
            <Pill key={w} active={span === w} onClick={() => setSpan(w)}>
              Last {w}
            </Pill>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption text-txt-tertiary">Sort</span>
          {SORTS.map(([s, label]) => (
            <Pill key={s} small active={sort === s} onClick={() => setSort(s)}>
              {label}
            </Pill>
          ))}
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:px-0">
          {GROUPS.map(([k, label]) => (
            <Pill key={k} small active={group === k} onClick={() => setGroup(k)}>
              {label}
            </Pill>
          ))}
        </div>
      </div>

      {data?.caveat && !loading && (
        <p className="mb-4 rounded-oracle-sm border border-warm-stone bg-warm-cream px-4 py-3 text-body-sm text-txt-secondary">
          {data.caveat} A single row is a lead to check, not a verdict.
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-16 text-body text-txt-tertiary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading
        </div>
      )}

      {error && !loading && (
        <EmptyState
          title="Could not load this team's form"
          body={error}
          detail="If history has not been backfilled yet, there is nothing to measure."
        />
      )}

      {!loading && !error && visible.length === 0 && (
        <EmptyState
          title="No settled history for this view"
          body={
            data && data.matchesSeen === 0
              ? 'No finished matches are on record for this team yet.'
              : 'Nothing in this group has enough recent results to show.'
          }
          detail="Half-time markets fill in once history has been backfilled with half-time scores."
        />
      )}

      {!loading && visible.length > 0 && (
        <ul className="divide-y divide-warm-sand overflow-hidden rounded-oracle-md border border-warm-stone bg-white shadow-soft">
          {visible.map((m) => (
            <FormRow key={m.marketId} market={m} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Pill({
  active,
  small,
  onClick,
  children,
}: {
  active: boolean;
  small?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-oracle-full border font-medium transition-all duration-normal',
        small ? 'px-3 py-1 text-caption' : 'px-4 py-2 text-body-sm',
        active
          ? 'border-oracle-gold bg-oracle-gold/10 text-txt-primary'
          : 'border-warm-stone bg-warm-cream text-txt-tertiary hover:text-txt-secondary',
      )}
    >
      {children}
    </button>
  );
}
