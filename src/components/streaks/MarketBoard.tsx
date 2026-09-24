'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ResultStrip } from './ResultStrip';
import type { BoardResponse, BoardRow } from '@/types';

const pct = (v: number) => `${Math.round(v * 100)}%`;

const SORTS: Array<[string, string]> = [
  ['probability', 'Most likely'],
  ['edge', 'Above the market'],
  ['run', 'Longest run'],
  ['confidence', 'Best evidenced'],
];

const GROUPS: Array<[string, string, (r: BoardRow) => boolean]> = [
  ['all', 'All markets', () => true],
  ['home', 'Home side', (r) => r.side === 'HOME'],
  ['away', 'Away side', (r) => r.side === 'AWAY'],
  ['match', 'Match totals', (r) => r.side === 'MATCH'],
  ['halves', 'Halves', (r) => r.category === 'HALFTIME'],
];

/** What a row is built on, said plainly rather than as a number. */
const CONFIDENCE_STYLE: Record<string, string> = {
  high: 'bg-lift-pos/20 text-lift-strong',
  medium: 'bg-oracle-gold/15 text-oracle-gold-dark',
  low: 'bg-warm-sand text-txt-tertiary',
  none: 'bg-warm-sand text-txt-tertiary',
};

const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'Well evidenced',
  medium: 'Some evidence',
  low: 'Thin evidence',
  none: 'No history yet',
};

/**
 * Every market in the registry, estimated for this fixture.
 *
 * The gated engine answers "is this more than luck", and most days it says no.
 * This answers the question the client actually asks of a fixture: what does
 * each market look like here, and how much is behind it.
 */
export function MarketBoard({ eventId }: { eventId: string }) {
  const [sort, setSort] = useState('probability');
  const [group, setGroup] = useState('all');
  // Ten settled matches or it is not a measurement. Thinner rows are kept
  // out of the ranking and gathered at the foot of the page, shown on
  // request: a 1/1 row at 85% is the market's own average with a fixture's
  // name on it, and ranking it first is how the board misled.
  const [showThin, setShowThin] = useState(false);
  const [data, setData] = useState<BoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<BoardResponse>(`/streaks/board/event/${eventId}?sort=${sort}`)
      .then((r) => !cancelled && setData(r))
      .catch((e) => !cancelled && setError(e?.message ?? 'Could not load the market board'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [eventId, sort]);

  const floor = data?.evidenceFloor ?? 10;

  const { measured, thin } = useMemo(() => {
    const test = GROUPS.find(([k]) => k === group)?.[2] ?? (() => true);
    const inGroup = (data?.rows ?? []).filter(test);
    return {
      measured: inGroup.filter((r) => r.played >= floor),
      thin: inGroup.filter((r) => r.played > 0 && r.played < floor),
    };
  }, [data, group, floor]);

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 py-10 text-body-sm text-txt-tertiary">
        <Loader2 className="h-4 w-4 animate-spin" /> Working out every market for this fixture
      </div>
    );
  }

  if (error || !data) {
    return <p className="py-6 text-body-sm text-txt-tertiary">The market board is not available for this fixture yet.</p>;
  }

  // Nothing clears the floor: every row would be the market's own average
  // with a fixture's name on it. Say that instead of printing a hundred rows.
  if (data.measured === 0) {
    return (
      <div className="rounded-oracle-md border border-warm-stone bg-warm-cream px-5 py-6">
        <p className="font-display text-body font-semibold text-txt-primary">
          No history for either club yet
        </p>
        <p className="mt-1 text-body-sm text-txt-secondary">
          No market has {floor} settled matches behind it for {data.event.home.name} or{' '}
          {data.event.away.name}
          {data.someHistory > 0
            ? `, though ${data.someHistory} have a match or two — too little to measure.`
            : '.'}{' '}
          A competition can be measured once its history has been backfilled; smaller ones often
          have none available at all.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {SORTS.map(([k, label]) => (
          <Pill key={k} active={sort === k} onClick={() => setSort(k)}>
            {label}
          </Pill>
        ))}
      </div>

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:px-0">
        {GROUPS.map(([k, label]) => (
          <Pill key={k} small active={group === k} onClick={() => setGroup(k)}>
            {label}
          </Pill>
        ))}
        {thin.length > 0 && (
          <Pill small active={showThin} onClick={() => setShowThin((v) => !v)}>
            {showThin ? 'Hide thin rows' : `Show ${thin.length} thin rows`}
          </Pill>
        )}
      </div>

      <p className="mb-4 rounded-oracle-sm border border-warm-stone bg-warm-cream px-4 py-3 text-caption text-txt-secondary">
        {data.caveat}
      </p>

      <ul className="divide-y divide-warm-sand overflow-hidden rounded-oracle-md border border-warm-stone bg-white">
        {measured.map((r) => (
          <li key={`${r.marketId}:${r.side}`} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-body-sm font-medium text-txt-primary">
                  {r.marketLabel}
                  {r.gated && (
                    <span
                      title="The strict engine also found this slice significant for this fixture."
                      className="inline-flex items-center gap-1 rounded-oracle-full bg-lift-pos/20 px-2 py-0.5 text-caption font-semibold text-lift-strong"
                    >
                      <ShieldCheck className="h-3 w-3" /> Evidence-backed
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-caption text-txt-tertiary">{r.subject}</p>
              </div>

              <div className="shrink-0 text-right">
                <p className="font-display text-h5 leading-none text-txt-primary">
                  {pct(r.probability)}
                </p>
                <p className="mt-1 text-caption text-txt-tertiary">
                  {r.played > 0 ? `${r.wins}/${r.played}` : 'no record'}
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {r.recent && <ResultStrip last10={r.recent} />}
              <span className="text-caption text-txt-tertiary">
                usually {r.baselineRate != null ? pct(r.baselineRate) : '—'}
              </span>
              {r.edge != null && (
                <span
                  className={cn(
                    'text-caption',
                    r.edge > 0.05 ? 'text-lift-strong' : 'text-txt-tertiary',
                  )}
                >
                  {r.edge >= 0 ? '+' : ''}
                  {Math.round(r.edge * 100)} pts
                </span>
              )}
              {r.currentRun > 1 && (
                <span className="text-caption text-txt-secondary">{r.currentRun} in a row</span>
              )}
              <span
                title={r.confidenceNote}
                className={cn(
                  'ml-auto rounded-oracle-full px-2 py-0.5 text-caption font-semibold',
                  CONFIDENCE_STYLE[r.confidence],
                )}
              >
                {CONFIDENCE_LABEL[r.confidence]}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {measured.length === 0 && (
        <p className="py-6 text-body-sm text-txt-tertiary">
          Nothing in this group has {floor} settled matches behind it yet.
        </p>
      )}

      {/* Below the floor: kept, never ranked, and never above a real row. */}
      {showThin && thin.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-caption text-txt-tertiary">
            Fewer than {floor} settled matches behind these — shown for completeness, not ranked.
          </p>
          <ul className="divide-y divide-warm-sand overflow-hidden rounded-oracle-md border border-dashed border-warm-stone bg-warm-cream/40">
            {thin.map((r) => (
              <li key={`${r.marketId}:${r.side}`} className="flex items-baseline justify-between gap-3 px-4 py-2">
                <span className="min-w-0 text-body-sm text-txt-secondary">{r.marketLabel}</span>
                <span className="shrink-0 text-caption text-txt-tertiary">
                  {r.wins}/{r.played} settled
                </span>
              </li>
            ))}
          </ul>
        </div>
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
