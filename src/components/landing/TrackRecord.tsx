'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronDown, Loader2, X } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Outcome = 'WIN' | 'LOSS';
interface Rate {
  settled: number;
  won: number;
  rate: number | null;
}
interface Match {
  kickoffAt: string;
  home: string;
  away: string;
  score: string | null;
  league: string;
}
interface Day {
  date: string;
  clusters: Rate;
  clusterList: Array<{
    outcome: Outcome;
    chance: number;
    legs: Array<{ match: Match; label: string; chance: number; result: string | null }>;
  }>;
}
interface PublicRecord {
  from: string;
  to: string;
  totals: { clusters: Rate };
  days: Day[];
}

const pct = (n: number | null | undefined) => (n == null ? '—' : `${Math.round(n * 100)}%`);
const dayName = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

function Mark({ result }: { result: string | null }) {
  if (result === 'WIN') return <Check className="h-4 w-4 shrink-0 text-lift-strong" aria-label="Landed" />;
  if (result === 'LOSS') return <X className="h-4 w-4 shrink-0 text-danger" aria-label="Missed" />;
  return <span className="h-4 w-4 shrink-0 text-center text-caption text-txt-tertiary">–</span>;
}

/**
 * OraQL's clusters from the last 7 days on the landing page, in full: every
 * settled cluster, landed or missed, with each selection and OraQL's chance at
 * the time. Nothing still to be played is shown — today's and upcoming picks
 * are for subscribers.
 */
export default function TrackRecord() {
  const [data, setData] = useState<PublicRecord | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/record/public`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: PublicRecord) => {
        setData(d);
        setOpen(d.days[0]?.date ?? null);
      })
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;
  const total = data?.totals.clusters;

  return (
    <section className="bg-warm-cream py-20" id="record">
      <div className="mx-auto max-w-4xl px-6">
        <p className="text-caption font-semibold uppercase tracking-widest text-oracle-gold-dark">Track record</p>
        <h2 className="mt-2 font-display text-display-md tracking-tight">OraQL&apos;s clusters, the last 7 days</h2>
        <p className="mt-3 max-w-2xl text-body text-txt-secondary">
          Every cluster OraQL_ built before kickoff, settled against the real results — landed or missed. Nothing
          removed, nothing changed after the match.
        </p>

        {!data ? (
          <p className="mt-10 flex items-center gap-2 text-body-sm text-txt-tertiary">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the record
          </p>
        ) : data.days.length === 0 ? (
          <p className="mt-10 text-body-sm text-txt-tertiary">No settled clusters in the last 7 days yet.</p>
        ) : (
          <>
            {total && (
              <div className="mt-8 rounded-oracle-md border border-warm-sand bg-white p-5 sm:max-w-sm">
                <p className="text-body-sm text-txt-secondary">Clusters landed</p>
                <p className="mt-1 font-display text-h3 text-txt-primary">
                  {total.won} of {total.settled} <span className="text-body text-txt-tertiary">· {pct(total.rate)}</span>
                </p>
              </div>
            )}

            <div className="mt-6 divide-y divide-warm-sand overflow-hidden rounded-oracle-md border border-warm-sand bg-white">
              {data.days.map((d) => {
                const isOpen = open === d.date;
                return (
                  <div key={d.date}>
                    <button
                      onClick={() => setOpen(isOpen ? null : d.date)}
                      aria-expanded={isOpen}
                      className="flex w-full flex-wrap items-center gap-x-6 gap-y-1 px-5 py-4 text-left hover:bg-warm-cream/50"
                    >
                      <span className="w-32 font-semibold text-txt-primary">{dayName(d.date)}</span>
                      <span className="text-body-sm text-txt-secondary">
                        {d.clusters.won} of {d.clusters.settled} landed
                      </span>
                      <ChevronDown
                        className={`ml-auto h-4 w-4 text-txt-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="space-y-3 bg-warm-cream/30 px-5 pb-6 pt-2">
                        {d.clusterList.map((c, i) => (
                          <div key={i} className="rounded-oracle-sm border border-warm-sand bg-white p-4">
                            <p className="mb-2 flex items-center gap-2 text-body-sm font-semibold">
                              <Mark result={c.outcome} />
                              {c.outcome === 'WIN' ? 'Landed' : 'Missed'}
                              <span className="font-normal text-txt-tertiary">· OraQL chance {pct(c.chance)}</span>
                            </p>
                            <ul className="space-y-1">
                              {c.legs.map((l, j) => (
                                <li key={j} className="flex items-start gap-2 text-body-sm text-txt-secondary">
                                  <Mark result={l.result} />
                                  <span className="flex-1">
                                    {l.match.home} v {l.match.away}
                                    {l.match.score && <span className="text-txt-tertiary"> ({l.match.score})</span>} —{' '}
                                    <span className="text-txt-primary">{l.label}</span>
                                  </span>
                                  <span className="text-caption text-txt-tertiary">{pct(l.chance)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-8 rounded-oracle-md border border-oracle-gold/40 bg-oracle-gold/10 p-5 text-body-sm text-txt-primary">
          <p className="font-semibold">How to read OraQL&apos;s chance</p>
          <p className="mt-1 text-txt-secondary">
            It is how often a cluster like this comes in, not a promise. A 70% cluster still misses about 3 times in
            10, and every extra selection lowers the chance that all of them land. Check the odds pay enough for the
            risk, and bet only what you can afford to lose. 18+.
          </p>
        </div>

        <p className="mt-4 text-caption text-txt-tertiary">
          Settled clusters only; today&apos;s and upcoming picks are for members. Percentages are OraQL_&apos;s chance
          before kickoff. Past results do not promise future ones. 18+.
        </p>
      </div>
    </section>
  );
}
