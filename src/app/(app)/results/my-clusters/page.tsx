'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Clock, Loader2, Lock, Minus, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { replaceCurrent } from '@/lib/navigation';
import { useScrollMemory } from '@/hooks/useScrollMemory';
import { BackLink } from '@/components/ui/BackLink';
import { InternationalBadge } from '@/components/ui/InternationalBadge';
import { EmptyState } from '@/components/streaks/EmptyState';
import type { CustomCluster, CustomClustersResponse, ResultValue } from '@/types';

type Show = 'all' | 'waiting' | 'settled';
const SHOWS: Array<[Show, string]> = [
  ['all', 'All'],
  ['waiting', 'Waiting on matches'],
  ['settled', 'Settled'],
];

const pct = (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v * 100)}%`);
const when = (d: string) =>
  new Date(d).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function MyClustersPage() {
  return (
    <Suspense fallback={null}>
      <MyClustersView />
    </Suspense>
  );
}

/**
 * The clusters the user saved from the Bet Builder, and how each went —
 * a way to test OraQL's suggestions with their own picks before spending
 * anything. Each was locked when saved, so the record is a fair one.
 */
function MyClustersView() {
  const router = useRouter();
  const params = useSearchParams();
  const show = (SHOWS.find(([s]) => s === params?.get('show'))?.[0] ?? 'all') as Show;

  const [data, setData] = useState<CustomClustersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useScrollMemory(!loading);

  const load = useCallback(async () => {
    try {
      setData(await api.get<CustomClustersResponse>('/custom-clusters'));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your clusters');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const setShow = (s: Show) => {
    const url = `/results/my-clusters?show=${s}`;
    router.replace(url, { scroll: false });
    replaceCurrent(url);
  };

  const list = (data?.clusters ?? []).filter((c) =>
    show === 'all' ? true : show === 'settled' ? c.state === 'SETTLED' : c.state !== 'SETTLED',
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <BackLink fallbackHref="/results" fallbackLabel="Back to Results" />
      </div>
      <header className="mb-6">
        <h1 className="font-display text-h2 text-txt-primary">My clusters</h1>
        <p className="mt-1 text-body text-txt-secondary">
          Clusters you saved from the Bet Builder, and whether they landed — no bet needed.
        </p>
      </header>

      {loading && (
        <div className="flex items-center gap-2 py-16 text-body text-txt-tertiary">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading
        </div>
      )}
      {error && !loading && <EmptyState title="Could not load your clusters" body={error} />}

      {!loading && !error && data && data.clusters.length === 0 && (
        <div className="rounded-oracle-md border-2 border-dashed border-warm-stone px-6 py-14 text-center">
          <h2 className="font-display text-h4 text-txt-primary">No saved clusters yet</h2>
          <p className="mx-auto mt-2 max-w-md text-body-sm text-txt-secondary">
            Add selections from Streaks, Clusters or a match page to the Bet Builder, then choose{' '}
            <span className="font-semibold">Save as cluster</span>. Its result appears here once the matches finish.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/streaks" className="rounded-oracle-full border border-warm-stone bg-white px-4 py-2 text-body-sm font-medium text-txt-primary hover:border-oracle-gold">
              Go to Streaks
            </Link>
            <Link href="/builder" className="rounded-oracle-full border border-oracle-gold bg-oracle-gold/10 px-4 py-2 text-body-sm font-medium text-txt-primary hover:bg-oracle-gold/20">
              Open the Bet Builder
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && data && data.clusters.length > 0 && (
        <>
          <Summary data={data} />
          <div className="mb-4 flex flex-wrap gap-2">
            {SHOWS.map(([s, label]) => (
              <button
                key={s}
                onClick={() => setShow(s)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-oracle-full border px-3 py-1 text-caption font-medium transition-all duration-normal',
                  show === s
                    ? 'border-oracle-gold bg-oracle-gold/10 text-txt-primary'
                    : 'border-warm-stone bg-warm-cream text-txt-tertiary hover:text-txt-secondary',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <p className="py-10 text-center text-body-sm text-txt-tertiary">Nothing here.</p>
          ) : (
            <div className="space-y-4">
              {list.map((c) => (
                <SavedCluster key={c.id} cluster={c} onDeleted={load} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Summary({ data }: { data: CustomClustersResponse }) {
  const c = data.summary.clusters;
  const s = data.summary.selections;
  return (
    <section className="mb-6 rounded-oracle-md border border-warm-stone bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
        <div>
          <p className="font-display text-h3 text-txt-primary">
            {c.settled ? `${c.won} of ${c.settled}` : 'None settled yet'}
            {c.rate != null && <span className="ml-2 text-h5 text-txt-secondary">({pct(c.rate)})</span>}
          </p>
          <p className="text-body-sm text-txt-tertiary">
            clusters landed in full
            {c.expected != null && <> · OraQL gave them about {pct(c.expected)} on average</>}
          </p>
        </div>
        {s.settled > 0 && (
          <p className="text-body-sm text-txt-secondary">
            Individual selections: {s.won} of {s.settled} ({pct(s.rate)})
            {s.expected != null && <span className="text-txt-tertiary"> · expected {pct(s.expected)}</span>}
          </p>
        )}
        {data.summary.waiting > 0 && (
          <p className="text-body-sm text-txt-secondary">
            {data.summary.waiting} waiting on matches
          </p>
        )}
      </div>
      <p className="mt-4 flex items-start gap-2 border-t border-warm-sand pt-4 text-caption text-txt-tertiary">
        <Lock className="mt-px h-4 w-4 shrink-0 text-oracle-gold-dark" />
        Each cluster was locked when you saved it, before its matches started, and stays here whether it landed or
        not. Voids are left out of the rates.
      </p>
    </section>
  );
}

function Mark({ result }: { result: ResultValue | 'PENDING' | null }) {
  if (result === 'WIN')
    return (
      <span title="Landed" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lift-pos/20 text-lift-strong">
        <Check className="h-4 w-4" />
      </span>
    );
  if (result === 'LOSS')
    return (
      <span title="Did not land" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
        <X className="h-4 w-4" />
      </span>
    );
  if (result === 'VOID')
    return (
      <span title="Void" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warm-sand text-txt-tertiary">
        <Minus className="h-4 w-4" />
      </span>
    );
  return (
    <span title="Waiting on the result" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warm-sand text-txt-tertiary">
      <Clock className="h-3.5 w-3.5" />
    </span>
  );
}

function stateText(c: CustomCluster) {
  if (c.state === 'UPCOMING') {
    const first = c.legs.reduce((t, l) => Math.min(t, new Date(l.match.kickoffAt).getTime()), Infinity);
    return `Upcoming · first match ${when(new Date(first).toISOString())}`;
  }
  if (c.state === 'IN_PLAY') return 'In play — waiting on results';
  return c.outcome === 'WIN' ? 'Landed' : c.outcome === 'LOSS' ? 'Did not land' : 'Void';
}

function SavedCluster({ cluster, onDeleted }: { cluster: CustomCluster; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chance =
    cluster.combinedProbability != null
      ? pct(cluster.combinedProbability)
      : `${pct(cluster.combinedRange.low)}–${pct(cluster.combinedRange.high)}`;

  return (
    <article className="overflow-hidden rounded-oracle-md border border-warm-stone bg-white shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-warm-sand bg-warm-cream px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Mark result={cluster.state === 'SETTLED' ? cluster.outcome : null} />
          <div className="min-w-0">
            <p className="break-words font-display text-body font-semibold text-txt-primary">
              {cluster.name || `${cluster.legs.length} selections`}
            </p>
            <p className="text-caption text-txt-tertiary">
              {cluster.name ? `${cluster.legs.length} selections · ` : ''}
              {stateText(cluster)} · saved {when(cluster.createdAt)}
            </p>
          </div>
          <InternationalBadge show={cluster.legs.some((l) => l.match.international)} />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-caption text-txt-tertiary">OraQL chance {chance}</p>
          {cluster.canDelete &&
            (confirming ? (
              <span className="flex items-center gap-2 text-caption">
                <button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await api.delete(`/custom-clusters/${cluster.id}`);
                      onDeleted();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Could not delete');
                      setBusy(false);
                    }
                  }}
                  className="font-semibold text-danger hover:underline"
                >
                  {busy ? 'Deleting…' : 'Delete'}
                </button>
                <button onClick={() => setConfirming(false)} className="text-txt-tertiary hover:text-txt-primary">
                  Keep
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                title="You can delete a cluster until its first match starts"
                aria-label="Delete this cluster"
                className="rounded-md p-1.5 text-txt-tertiary hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ))}
        </div>
        {error && <p className="w-full text-caption text-danger">{error}</p>}
      </header>
      <ul className="divide-y divide-warm-sand">
        {cluster.legs.map((l, n) => (
          <li key={n} className="flex items-start gap-3 px-5 py-2.5">
            <Mark result={l.result} />
            <div className="min-w-0 flex-1">
              <p className="break-words text-body-sm font-medium text-txt-primary">{l.label}</p>
              <p className="break-words text-caption text-txt-tertiary">
                <Link href={`/events/${l.match.eventId}`} className="hover:underline">
                  {l.match.home} {l.match.score ?? 'v'} {l.match.away}
                </Link>{' '}
                · {l.match.league} · {when(l.match.kickoffAt)}
              </p>
              <p className="text-caption text-txt-tertiary">{l.from}</p>
            </div>
            <span className="shrink-0 text-caption text-txt-tertiary">{pct(l.probability)}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
