'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ChevronRight, Loader2, X, Minus, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { replaceCurrent } from '@/lib/navigation';
import { useScrollMemory } from '@/hooks/useScrollMemory';
import { InternationalBadge } from '@/components/ui/InternationalBadge';
import { EmptyState } from '@/components/streaks/EmptyState';
import type { DailyRecordDay, DailyRecordResponse, HitRate, ResultsCluster, ResultsMatch, ResultsResponse, ResultValue } from '@/types';

type Type = 'picks' | 'streaks' | 'clusters' | 'daily';
type ListType = Exclude<Type, 'daily'>;
type Scope = 'all' | 'club' | 'international';

const TYPES: Array<[Type, string]> = [
  ['picks', 'OraQL Picks'],
  ['streaks', 'Streaks'],
  ['clusters', 'Clusters'],
  ['daily', 'Daily record'],
];
const DAY_WINDOWS: Array<[number, string]> = [
  [7, 'Last 7 days'],
  [30, '30 days'],
  [90, '90 days'],
];
/** The record's columns, and the list each one opens. */
const RECORD_COLUMNS: Array<[keyof Omit<DailyRecordDay, 'date'>, string, ListType]> = [
  ['picks', 'OraQL Picks', 'picks'],
  ['evidence', 'Evidence-backed streaks', 'streaks'],
  ['streaks', 'All streaks', 'streaks'],
  ['clusters', 'Clusters', 'clusters'],
];
const ymd = (s: string | null | undefined) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
const dayLabel = (d: string, long = false) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: long ? 'long' : 'short',
    timeZone: 'UTC',
  });
const WINDOWS: Array<[number, string]> = [
  [24, 'Last 24 hours'],
  [168, '7 days'],
  [720, '30 days'],
];
const SCOPES: Array<[Scope, string]> = [
  ['all', 'All matches'],
  ['club', 'Club'],
  ['international', 'International'],
];
const TIER_LABEL: Record<string, string> = {
  evidence: 'Evidence-backed',
  emerging: 'Emerging',
  exploratory: 'Exploratory',
};
const DRIVER_LABEL: Record<string, string> = {
  RECENT: 'Led by recent form',
  SEASON: 'Led by the season',
};

const pct = (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v * 100)}%`);

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsView />
    </Suspense>
  );
}

/**
 * Finished matches: what OraQL picked and whether it came. The client asked
 * for this to find where the engine goes wrong while it is tested — so the
 * hit rate sits beside the rate OraQL expected, and splits by club and
 * international, and for streaks by tier and by what drove the pick.
 */
function ResultsView() {
  const router = useRouter();
  const params = useSearchParams();
  const type = (TYPES.find(([t]) => t === params?.get('type'))?.[0] ?? 'picks') as Type;
  const hours = WINDOWS.find(([h]) => String(h) === params?.get('hours'))?.[0] ?? 24;
  const days = DAY_WINDOWS.find(([d]) => String(d) === params?.get('days'))?.[0] ?? 30;
  const scope = (SCOPES.find(([s]) => s === params?.get('scope'))?.[0] ?? 'all') as Scope;
  // One UK day, opened from the daily record; it replaces the hours window.
  const date = type === 'daily' ? null : ymd(params?.get('date'));

  const [data, setData] = useState<ResultsResponse | null>(null);
  const [record, setRecord] = useState<DailyRecordResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useScrollMemory(!loading);

  // Every choice lives in the URL, so Back returns to the same view.
  const urlFor = (next: Partial<{ type: Type; hours: number; days: number; scope: Scope; date: string | null }>) => {
    const t = next.type ?? type;
    const q = new URLSearchParams({ type: t, scope: next.scope ?? scope });
    if (t === 'daily') q.set('days', String(next.days ?? days));
    else {
      q.set('hours', String(next.hours ?? hours));
      // Choosing an hours window leaves the day; switching list keeps it.
      const d = next.date !== undefined ? next.date : next.hours !== undefined ? null : date;
      if (d) q.set('date', d);
    }
    return `/results?${q.toString()}`;
  };
  const set = (next: Parameters<typeof urlFor>[0]) => {
    const url = urlFor(next);
    router.replace(url, { scroll: false });
    replaceCurrent(url);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const fail = (e: { message?: string }) => !cancelled && setError(e?.message ?? 'Could not load results');
    const done = () => !cancelled && setLoading(false);
    if (type === 'daily') {
      api
        .get<DailyRecordResponse>(`/results/daily?days=${days}&scope=${scope}`)
        .then((res) => !cancelled && setRecord(res))
        .catch(fail)
        .finally(done);
    } else {
      const when = date ? `date=${date}` : `hours=${hours}`;
      api
        .get<ResultsResponse>(`/results?type=${type}&${when}&scope=${scope}`)
        .then((res) => !cancelled && setData(res))
        .catch(fail)
        .finally(done);
    }
    return () => {
      cancelled = true;
    };
  }, [type, hours, days, scope, date]);

  const empty =
    type !== 'daily' &&
    !!data && ((data.matches && data.matches.length === 0) || (data.clusters && data.clusters.length === 0));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="font-display text-h2 text-txt-primary">Results</h1>
        <p className="mt-1 text-body text-txt-secondary">
          What OraQL picked for matches that have finished, and whether it came.
        </p>
      </header>

      <div className="mb-3 flex flex-wrap gap-2">
        {TYPES.map(([t, label]) => (
          <Pill key={t} active={type === t} onClick={() => set({ type: t })}>
            {label}
          </Pill>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {type === 'daily'
          ? DAY_WINDOWS.map(([d, label]) => (
              <Pill key={d} small active={days === d} onClick={() => set({ days: d })}>
                {label}
              </Pill>
            ))
          : WINDOWS.map(([h, label]) => (
              <Pill key={h} small active={!date && hours === h} onClick={() => set({ hours: h })}>
                {label}
              </Pill>
            ))}
        {date && (
          <Pill small active onClick={() => set({ date: null })}>
            <span className="inline-flex items-center gap-1">
              {dayLabel(date)} <X className="h-3 w-3" />
            </span>
          </Pill>
        )}
        <span className="mx-1 hidden w-px bg-warm-stone sm:block" />
        {SCOPES.map(([s, label]) => (
          <Pill key={s} small active={scope === s} onClick={() => set({ scope: s })}>
            {label}
          </Pill>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-16 text-body text-txt-tertiary">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading
        </div>
      )}

      {error && !loading && <EmptyState title="Could not load results" body={error} />}

      {!loading && !error && type === 'daily' && record && (
        <DailyRecord record={record} open={(t, d) => urlFor({ type: t, date: d })} />
      )}

      {!loading && !error && type !== 'daily' && data && (
        <>
          <Summary data={data} />
          {empty ? (
            <EmptyState
              title="Nothing settled in this window yet"
              body="Results appear once matches finish and are settled, usually within half an hour of full time. Try a longer window."
            />
          ) : data.type === 'clusters' ? (
            <div className="space-y-4">
              {data.clusters!.map((c) => (
                <ClusterResult key={c.id} cluster={c} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {data.matches!.map((m) => (
                <MatchResult key={m.match.eventId} match={m} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * The record day by day, for showing what OraQL called and how it went.
 * Every count is on the same rules as the lists: published before kickoff,
 * kept win or lose, each bet once. A day's figure opens that day's list.
 */
function DailyRecord({
  record,
  open,
}: {
  record: DailyRecordResponse;
  open: (type: ListType, date: string) => string;
}) {
  if (record.days.length === 0)
    return (
      <EmptyState
        title="No settled results in this window yet"
        body="Each day appears here once its matches have finished and settled, usually within half an hour of full time."
      />
    );
  return (
    <>
      <section className="mb-6 rounded-oracle-md border border-warm-stone bg-white p-5 shadow-soft">
        <p className="mb-4 text-body-sm text-txt-secondary">
          {dayLabel(record.from, true)} to {dayLabel(record.to, true)} · {record.days.length} day
          {record.days.length === 1 ? '' : 's'} with results
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {RECORD_COLUMNS.map(([k, label]) => {
            const r = record.totals[k];
            return (
              <div key={k}>
                <p className="text-caption font-semibold uppercase tracking-wide text-txt-tertiary">{label}</p>
                <p className="mt-1 font-display text-h4 text-txt-primary">
                  {r.settled ? `${r.won}/${r.settled}` : '—'}
                  {r.rate != null && <span className="ml-1.5 text-body text-txt-secondary">{pct(r.rate)}</span>}
                </p>
                {r.expected != null && <p className="text-caption text-txt-tertiary">expected {pct(r.expected)}</p>}
              </div>
            );
          })}
        </div>
        <p className="mt-4 flex items-start gap-2 border-t border-warm-sand pt-4 text-caption text-txt-tertiary">
          <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-oracle-gold-dark" />
          Only calls published before kickoff count, and every one stays on the record whether it landed or not.
          Each bet is counted once. Voids are left out.
        </p>
      </section>

      <div className="overflow-hidden rounded-oracle-md border border-warm-stone bg-white shadow-soft">
        <div className="hidden grid-cols-[8rem_repeat(4,1fr)] gap-3 border-b border-warm-sand bg-warm-cream px-5 py-2.5 text-caption font-semibold uppercase tracking-wide text-txt-tertiary sm:grid">
          <span>Day</span>
          {RECORD_COLUMNS.map(([k, label]) => (
            <span key={k}>{label}</span>
          ))}
        </div>
        <ul className="divide-y divide-warm-sand">
          {record.days.map((d) => (
            <li key={d.date} className="grid grid-cols-2 gap-3 px-5 py-3 sm:grid-cols-[8rem_repeat(4,1fr)] sm:items-center">
              <p className="col-span-2 font-display text-body-sm font-semibold text-txt-primary sm:col-span-1">
                {dayLabel(d.date)}
              </p>
              {RECORD_COLUMNS.map(([k, label, list]) => (
                <RecordCell key={k} label={label} rate={d[k]} href={open(list, d.date)} />
              ))}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function RecordCell({ label, rate, href }: { label: string; rate: HitRate; href: string }) {
  const body = (
    <>
      <span className="text-caption text-txt-tertiary sm:hidden">{label}</span>
      <span className="text-body-sm text-txt-primary">
        {rate.settled ? `${rate.won}/${rate.settled}` : '—'}
        {rate.rate != null && <span className="ml-1 text-txt-tertiary">{pct(rate.rate)}</span>}
      </span>
    </>
  );
  if (!rate.settled) return <div className="flex flex-col">{body}</div>;
  return (
    <Link href={href} className="group flex flex-col rounded-oracle-sm hover:text-oracle-gold-dark">
      <span className="flex items-center gap-1">
        <span className="flex flex-col">{body}</span>
        <ChevronRight className="h-3.5 w-3.5 text-txt-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
    </Link>
  );
}

/** The headline rate beside what OraQL expected, then the splits that matter. */
function Summary({ data }: { data: ResultsResponse }) {
  const o = data.summary.overall;
  const splits: Array<[string, Record<string, HitRate> | undefined, Record<string, string>]> = [
    ['By tier', data.summary.byTier, TIER_LABEL],
    ['Club or international', data.summary.byScope, { club: 'Club', international: 'International' }],
    ['What drove the pick', data.summary.byDriver, DRIVER_LABEL],
  ];
  return (
    <section className="mb-6 rounded-oracle-md border border-warm-stone bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <div>
          <p className="font-display text-h3 text-txt-primary">
            {o.settled ? `${o.won} of ${o.settled}` : 'None settled'}
            {o.rate != null && <span className="ml-2 text-h5 text-txt-secondary">({pct(o.rate)})</span>}
          </p>
          <p className="text-body-sm text-txt-tertiary">
            {data.type === 'clusters' ? 'clusters landed in full' : 'landed'}
            {o.expected != null && <> · OraQL expected about {pct(o.expected)}</>}
          </p>
        </div>
        {data.type === 'clusters' && data.summary.legs && data.summary.legs.settled > 0 && (
          <p className="text-body-sm text-txt-secondary">
            Individual selections: {data.summary.legs.won} of {data.summary.legs.settled} ({pct(data.summary.legs.rate)})
          </p>
        )}
      </div>
      {o.rate != null && o.expected != null && o.settled >= 10 && (
        <p className="mt-2 text-body-sm text-txt-secondary">
          {o.rate < o.expected - 0.08
            ? 'Landing noticeably less often than OraQL expected. Check the splits below for where.'
            : o.rate > o.expected + 0.08
              ? 'Landing more often than OraQL expected.'
              : 'Landing about as often as OraQL expected.'}
        </p>
      )}
      {o.settled > 0 && o.settled < 10 && (
        <p className="mt-2 text-caption text-txt-tertiary">Too few settled yet to read much into the rate.</p>
      )}

      {splits.some(([, v]) => v && Object.keys(v).length > 1) && (
        <div className="mt-4 grid gap-4 border-t border-warm-sand pt-4 sm:grid-cols-3">
          {splits.map(([title, values, labels]) =>
            values && Object.keys(values).length > 1 ? (
              <div key={title}>
                <p className="mb-1 text-caption font-semibold uppercase tracking-wide text-txt-tertiary">{title}</p>
                {Object.entries(values).map(([k, v]) => (
                  <p key={k} className="text-body-sm text-txt-secondary">
                    <span className="text-txt-primary">{labels[k] ?? k}:</span> {v.won}/{v.settled} ({pct(v.rate)})
                    {v.expected != null && <span className="text-txt-tertiary"> · expected {pct(v.expected)}</span>}
                  </p>
                ))}
              </div>
            ) : null,
          )}
        </div>
      )}
    </section>
  );
}

function ResultMark({ result }: { result: ResultValue | 'PENDING' | null }) {
  if (result === 'WIN')
    return (
      <span title="Came" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lift-pos/20 text-lift-strong">
        <Check className="h-4 w-4" />
      </span>
    );
  if (result === 'LOSS')
    return (
      <span title="Did not come" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
        <X className="h-4 w-4" />
      </span>
    );
  return (
    <span
      title={result === 'VOID' ? 'Void' : 'Not settled — no statistics for this market yet'}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warm-sand text-txt-tertiary"
    >
      <Minus className="h-4 w-4" />
    </span>
  );
}

function MatchHeader({ m }: { m: ResultsMatch['match'] }) {
  const when = new Date(m.kickoffAt).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <Link href={`/events/${m.eventId}`} className="font-display text-body font-semibold text-txt-primary hover:underline">
        {m.home} {m.score ? <span className="text-oracle-gold-dark">{m.score}</span> : 'vs'} {m.away}
      </Link>
      <p className="flex flex-wrap items-center gap-2 text-caption text-txt-tertiary">
        <span>
          {[m.league, m.country].filter(Boolean).join(' · ')} · {when}
        </span>
        <InternationalBadge show={m.international} />
      </p>
    </div>
  );
}

function MatchResult({ match }: { match: ResultsMatch }) {
  return (
    <article className="overflow-hidden rounded-oracle-md border border-warm-stone bg-white shadow-soft">
      <header className="border-b border-warm-sand bg-warm-cream px-5 py-3">
        <MatchHeader m={match.match} />
      </header>
      <ul className="divide-y divide-warm-sand">
        {match.items.map((i, n) => (
          <li key={n} className="flex items-center gap-3 px-5 py-2.5">
            <ResultMark result={i.result} />
            <div className="min-w-0 flex-1">
              <p className="break-words text-body-sm font-medium text-txt-primary">{i.label}</p>
              {(i.tier || i.driver) && (
                <p className="text-caption text-txt-tertiary">
                  {[i.tier && TIER_LABEL[i.tier], i.driver && DRIVER_LABEL[i.driver]].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <span className="shrink-0 text-caption text-txt-tertiary">{pct(i.probability)}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function ClusterResult({ cluster }: { cluster: ResultsCluster }) {
  const landed = cluster.outcome === 'WIN';
  return (
    <article
      className={cn(
        'overflow-hidden rounded-oracle-md border bg-white shadow-soft',
        cluster.tier === 'SUGGESTIVE' || cluster.tier.toLowerCase().includes('suggest') ? 'border-dashed border-warm-stone' : 'border-warm-stone',
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-warm-sand bg-warm-cream px-5 py-3">
        <div className="flex items-center gap-2">
          <ResultMark result={cluster.outcome} />
          <p className="font-display text-body font-semibold text-txt-primary">
            {cluster.legs.length} selections ·{' '}
            {landed ? 'landed' : cluster.outcome === 'LOSS' ? 'did not land' : cluster.outcome === 'VOID' ? 'void' : 'waiting on a result'}
          </p>
          <InternationalBadge show={cluster.international} />
        </div>
        <p className="text-caption text-txt-tertiary">expected {pct(cluster.combinedProbability)}</p>
      </header>
      <ul className="divide-y divide-warm-sand">
        {cluster.legs.map((l, n) => (
          <li key={n} className="flex items-start gap-3 px-5 py-2.5">
            <ResultMark result={l.result} />
            <div className="min-w-0 flex-1">
              <p className="break-words text-body-sm font-medium text-txt-primary">{l.label}</p>
              <p className="break-words text-caption text-txt-tertiary">
                {l.match.home} {l.match.score ?? 'vs'} {l.match.away} · {l.match.league}
              </p>
            </div>
            <span className="shrink-0 text-caption text-txt-tertiary">{pct(l.probability)}</span>
          </li>
        ))}
      </ul>
    </article>
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
