'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ChevronDown, Loader2, Minus, ShieldCheck, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { replaceCurrent } from '@/lib/navigation';
import { useScrollMemory } from '@/hooks/useScrollMemory';
import { BackLink } from '@/components/ui/BackLink';
import { InternationalBadge } from '@/components/ui/InternationalBadge';
import { EmptyState } from '@/components/streaks/EmptyState';
import type { HitRate, ResultsCluster, ResultsMatch, ResultValue } from '@/types';

type Scope = 'all' | 'club' | 'international';

interface RecordDay {
  date: string; // YYYY-MM-DD, UK day
  streaks: HitRate;
  evidence: HitRate;
  clusters: HitRate;
}
interface DailyRecord {
  days: RecordDay[];
  totals: Omit<RecordDay, 'date'>;
  from: string;
  to: string;
}
interface DayDetail {
  date: string;
  matches: ResultsMatch[];
  clusters: ResultsCluster[];
}

const WINDOWS: Array<[number, string]> = [
  [7, 'Last 7 days'],
  [30, '30 days'],
  [90, '90 days'],
];
const SCOPES: Array<[Scope, string]> = [
  ['all', 'All matches'],
  ['club', 'Club'],
  ['international', 'International'],
];
const COLUMNS: Array<[keyof Omit<RecordDay, 'date'>, string]> = [
  ['evidence', 'Evidence-backed streaks'],
  ['streaks', 'All streaks'],
  ['clusters', 'Clusters'],
];
const TIER_LABEL: Record<string, string> = {
  evidence: 'Evidence-backed',
  emerging: 'Emerging',
  exploratory: 'Exploratory',
};

const pct = (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v * 100)}%`);
const dayLabel = (d: string, long = false) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString(undefined, {
    weekday: long ? 'long' : 'short',
    day: 'numeric',
    month: long ? 'long' : 'short',
    timeZone: 'UTC',
  });

export default function DailyRecordPage() {
  return (
    <Suspense fallback={null}>
      <RecordView />
    </Suspense>
  );
}

/**
 * The streaks and clusters OraQL gave each day, and how they landed — for
 * showing it is consistent day after day. Counted for showing: only calls
 * published before kickoff, kept win or lose, each bet once.
 */
function RecordView() {
  const router = useRouter();
  const params = useSearchParams();
  const days = WINDOWS.find(([d]) => String(d) === params?.get('days'))?.[0] ?? 30;
  const scope = (SCOPES.find(([s]) => s === params?.get('scope'))?.[0] ?? 'all') as Scope;
  const open = params?.get('open') ?? null;

  const [data, setData] = useState<DailyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useScrollMemory(!loading);

  // Choices live in the URL, so Back returns to the same view.
  const set = (next: Partial<{ days: number; scope: Scope; open: string | null }>) => {
    const q = new URLSearchParams({ days: String(next.days ?? days), scope: next.scope ?? scope });
    const o = next.open !== undefined ? next.open : open;
    if (o) q.set('open', o);
    const url = `/results/record?${q.toString()}`;
    router.replace(url, { scroll: false });
    replaceCurrent(url);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<DailyRecord>(`/record/daily?days=${days}&scope=${scope}`)
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e?.message ?? 'Could not load the record'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [days, scope]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <BackLink fallbackHref="/results" fallbackLabel="Back to Results" />
      </div>
      <header className="mb-6">
        <h1 className="font-display text-h2 text-txt-primary">Daily record</h1>
        <p className="mt-1 text-body text-txt-secondary">
          The streaks and clusters OraQL gave each day, and how they landed.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {WINDOWS.map(([d, label]) => (
          <Pill key={d} active={days === d} onClick={() => set({ days: d, open: null })}>
            {label}
          </Pill>
        ))}
        <span className="mx-1 hidden w-px bg-warm-stone sm:block" />
        {SCOPES.map(([s, label]) => (
          <Pill key={s} active={scope === s} onClick={() => set({ scope: s, open: null })}>
            {label}
          </Pill>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-16 text-body text-txt-tertiary">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading
        </div>
      )}
      {error && !loading && <EmptyState title="Could not load the record" body={error} />}

      {!loading && !error && data && data.days.length === 0 && (
        <EmptyState
          title="No settled days in this window yet"
          body="Each day appears here once its matches have finished and settled, usually within half an hour of full time."
        />
      )}

      {!loading && !error && data && data.days.length > 0 && (
        <>
          <Totals data={data} />
          <div className="space-y-3">
            {data.days.map((d) => (
              <DayRow
                key={d.date}
                day={d}
                scope={scope}
                expanded={open === d.date}
                toggle={() => set({ open: open === d.date ? null : d.date })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Totals({ data }: { data: DailyRecord }) {
  return (
    <section className="mb-6 rounded-oracle-md border border-warm-stone bg-white p-5 shadow-soft">
      <p className="mb-4 text-body-sm text-txt-secondary">
        {dayLabel(data.from, true)} to {dayLabel(data.to, true)} · {data.days.length} day
        {data.days.length === 1 ? '' : 's'} with results
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COLUMNS.map(([k, label]) => {
          const r = data.totals[k];
          return (
            <div key={k}>
              <p className="text-caption font-semibold uppercase tracking-wide text-txt-tertiary">{label}</p>
              <p className="mt-1 font-display text-h4 text-txt-primary">
                {r.settled ? `${r.won} of ${r.settled}` : '—'}
                {r.rate != null && <span className="ml-1.5 text-body text-txt-secondary">{pct(r.rate)}</span>}
              </p>
              {r.expected != null && <p className="text-caption text-txt-tertiary">OraQL expected about {pct(r.expected)}</p>}
            </div>
          );
        })}
      </div>
      <p className="mt-4 flex items-start gap-2 border-t border-warm-sand pt-4 text-caption text-txt-tertiary">
        <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-oracle-gold-dark" />
        Only calls published before kickoff count, and every one stays on the record whether it landed or not. Each
        bet is counted once. Voids are left out.
      </p>
    </section>
  );
}

/** A day's figures; opens into every streak and cluster given that day. */
function DayRow({
  day,
  scope,
  expanded,
  toggle,
}: {
  day: RecordDay;
  scope: Scope;
  expanded: boolean;
  toggle: () => void;
}) {
  const [detail, setDetail] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expanded || detail) return;
    let cancelled = false;
    setLoading(true);
    api
      .get<DayDetail>(`/record/day?date=${day.date}&scope=${scope}`)
      .then((res) => !cancelled && setDetail(res))
      .catch((e) => !cancelled && setError(e?.message ?? 'Could not load this day'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [expanded, detail, day.date, scope]);

  return (
    <article className="overflow-hidden rounded-oracle-md border border-warm-stone bg-white shadow-soft">
      <button
        onClick={toggle}
        aria-expanded={expanded}
        className="grid w-full grid-cols-3 items-center gap-3 px-5 py-3 text-left hover:bg-warm-cream sm:grid-cols-[9rem_repeat(3,1fr)_1.5rem]"
      >
        <span className="col-span-2 font-display text-body-sm font-semibold text-txt-primary sm:col-span-1">
          {dayLabel(day.date)}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 justify-self-end text-txt-tertiary transition-transform sm:order-last', expanded && 'rotate-180')}
        />
        {COLUMNS.map(([k, label]) => (
          <span key={k} className="flex flex-col">
            <span className="text-caption text-txt-tertiary">{label}</span>
            <span className="text-body-sm text-txt-primary">
              {day[k].settled ? `${day[k].won}/${day[k].settled}` : '—'}
              {day[k].rate != null && <span className="ml-1 text-txt-tertiary">{pct(day[k].rate)}</span>}
            </span>
          </span>
        ))}
      </button>

      {expanded && (
        <div className="border-t border-warm-sand bg-warm-white px-4 py-4 sm:px-5">
          {loading && (
            <p className="flex items-center gap-2 text-body-sm text-txt-tertiary">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading
            </p>
          )}
          {error && <p className="text-body-sm text-danger">{error}</p>}
          {detail && (
            <div className="space-y-5">
              {detail.clusters.length > 0 && (
                <section>
                  <h3 className="mb-2 text-caption font-semibold uppercase tracking-wide text-txt-tertiary">Clusters</h3>
                  <div className="space-y-3">
                    {detail.clusters.map((c) => (
                      <ClusterItem key={c.id} cluster={c} />
                    ))}
                  </div>
                </section>
              )}
              {detail.matches.length > 0 && (
                <section>
                  <h3 className="mb-2 text-caption font-semibold uppercase tracking-wide text-txt-tertiary">Streaks</h3>
                  <div className="space-y-3">
                    {detail.matches.map((m) => (
                      <MatchItem key={m.match.eventId} match={m} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Mark({ result }: { result: ResultValue | 'PENDING' | null }) {
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
      title={result === 'VOID' ? 'Void' : 'Not settled yet'}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warm-sand text-txt-tertiary"
    >
      <Minus className="h-4 w-4" />
    </span>
  );
}

function MatchItem({ match }: { match: ResultsMatch }) {
  const m = match.match;
  return (
    <div className="overflow-hidden rounded-oracle-md border border-warm-stone bg-white">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-warm-sand bg-warm-cream px-4 py-2.5">
        <Link href={`/events/${m.eventId}`} className="font-display text-body-sm font-semibold text-txt-primary hover:underline">
          {m.home} {m.score ? <span className="text-oracle-gold-dark">{m.score}</span> : 'vs'} {m.away}
        </Link>
        <p className="flex flex-wrap items-center gap-2 text-caption text-txt-tertiary">
          <span>{[m.league, m.country].filter(Boolean).join(' · ')}</span>
          <InternationalBadge show={m.international} />
        </p>
      </div>
      <ul className="divide-y divide-warm-sand">
        {match.items.map((i, n) => (
          <li key={n} className="flex items-center gap-3 px-4 py-2">
            <Mark result={i.result} />
            <div className="min-w-0 flex-1">
              <p className="break-words text-body-sm font-medium text-txt-primary">{i.label}</p>
              {i.tier && <p className="text-caption text-txt-tertiary">{TIER_LABEL[i.tier]}</p>}
            </div>
            <span className="shrink-0 text-caption text-txt-tertiary">{pct(i.probability)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClusterItem({ cluster }: { cluster: ResultsCluster }) {
  const outcome =
    cluster.outcome === 'WIN' ? 'landed' : cluster.outcome === 'LOSS' ? 'did not land' : cluster.outcome === 'VOID' ? 'void' : 'waiting on a result';
  return (
    <div className="overflow-hidden rounded-oracle-md border border-warm-stone bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-warm-sand bg-warm-cream px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Mark result={cluster.outcome} />
          <p className="font-display text-body-sm font-semibold text-txt-primary">
            {cluster.legs.length} selections · {outcome}
          </p>
          <InternationalBadge show={cluster.international} />
        </div>
        <p className="text-caption text-txt-tertiary">expected {pct(cluster.combinedProbability)}</p>
      </div>
      <ul className="divide-y divide-warm-sand">
        {cluster.legs.map((l, n) => (
          <li key={n} className="flex items-start gap-3 px-4 py-2">
            <Mark result={l.result} />
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
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-oracle-full border px-3 py-1 text-caption font-medium transition-all duration-normal',
        active
          ? 'border-oracle-gold bg-oracle-gold/10 text-txt-primary'
          : 'border-warm-stone bg-warm-cream text-txt-tertiary hover:text-txt-secondary',
      )}
    >
      {children}
    </button>
  );
}
