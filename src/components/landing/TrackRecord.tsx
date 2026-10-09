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
  streaks: Rate;
  clusters: Rate;
  matches: Array<{ match: Match; picks: Array<{ label: string; chance: number; result: Outcome }> }>;
  clusterList: Array<{
    outcome: Outcome;
    chance: number;
    legs: Array<{ match: Match; label: string; chance: number; result: string | null }>;
  }>;
}
interface PublicRecord {
  from: string;
  to: string;
  totals: { streaks: Rate; clusters: Rate };
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
 * The last 7 days on the landing page, in full: every settled streak and
 * cluster, wins and losses, with OraQL's chance at the time. Nothing still to
 * be played is shown — today's and upcoming picks are for subscribers.
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

  return (
    <section className="bg-warm-cream py-20" id="record">
      <div className="mx-auto max-w-4xl px-6">
        <p className="text-caption font-semibold uppercase tracking-widest text-oracle-gold-dark">Track record</p>
        <h2 className="mt-2 font-display text-display-md tracking-tight">The last 7 days, wins and losses</h2>
        <p className="mt-3 max-w-2xl text-body text-txt-secondary">
          Every streak and cluster OraQL_ gave before kickoff, settled against the real result. Nothing removed,
          nothing changed after the match.
        </p>

        {!data ? (
          <p className="mt-10 flex items-center gap-2 text-body-sm text-txt-tertiary">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the record
          </p>
        ) : data.days.length === 0 ? (
          <p className="mt-10 text-body-sm text-txt-tertiary">No settled calls in the last 7 days yet.</p>
        ) : (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['Streaks landed', data.totals.streaks],
                  ['Clusters landed', data.totals.clusters],
                ] as const
              ).map(([label, r]) => (
                <div key={label} className="rounded-oracle-md border border-warm-sand bg-white p-5">
                  <p className="text-body-sm text-txt-secondary">{label}</p>
                  <p className="mt-1 font-display text-h3 text-txt-primary">
                    {r.won} of {r.settled} <span className="text-body text-txt-tertiary">· {pct(r.rate)}</span>
                  </p>
                </div>
              ))}
            </div>

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
                        Streaks {d.streaks.won}/{d.streaks.settled}
                      </span>
                      <span className="text-body-sm text-txt-secondary">
                        Clusters {d.clusters.won}/{d.clusters.settled}
                      </span>
                      <ChevronDown
                        className={`ml-auto h-4 w-4 text-txt-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="space-y-6 bg-warm-cream/30 px-5 pb-6 pt-2">
                        {d.clusterList.length > 0 && (
                          <div>
                            <h3 className="mb-2 text-caption font-semibold uppercase tracking-wide text-txt-tertiary">
                              Clusters
                            </h3>
                            <div className="space-y-3">
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
                                        <span>
                                          {l.match.home} v {l.match.away}
                                          {l.match.score && <span className="text-txt-tertiary"> ({l.match.score})</span>} —{' '}
                                          <span className="text-txt-primary">{l.label}</span>
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {d.matches.length > 0 && (
                          <div>
                            <h3 className="mb-2 text-caption font-semibold uppercase tracking-wide text-txt-tertiary">
                              Streaks
                            </h3>
                            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                              {d.matches.map((g, i) => (
                                <div key={i}>
                                  <p className="text-body-sm font-semibold text-txt-primary">
                                    {g.match.home} v {g.match.away}
                                    {g.match.score && <span className="font-normal text-txt-tertiary"> · {g.match.score}</span>}
                                    <span className="font-normal text-txt-tertiary"> · {g.match.league}</span>
                                  </p>
                                  <ul className="mt-1 space-y-0.5">
                                    {g.picks.map((p, j) => (
                                      <li key={j} className="flex items-center gap-2 text-body-sm text-txt-secondary">
                                        <Mark result={p.result} />
                                        <span className="flex-1">{p.label}</span>
                                        <span className="text-caption text-txt-tertiary">{pct(p.chance)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p className="mt-4 text-caption text-txt-tertiary">
          Settled calls only; today&apos;s and upcoming picks are for members. Percentages are OraQL_&apos;s chance
          before kickoff. Past results do not promise future ones. 18+.
        </p>
      </div>
    </section>
  );
}
