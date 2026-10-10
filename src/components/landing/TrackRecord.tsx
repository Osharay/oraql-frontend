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
interface Band {
  from: number;
  to: number;
  settled: number;
  won: number;
  rate: number | null;
  expected: number | null;
}
interface PublicRecord {
  from: string;
  to: string;
  totals: { streaks: Rate; clusters: Rate };
  calibration?: { days: number; from: string; bands: Band[]; strong: Band; weak: Band };
  days: Day[];
}

/** OraQL's chance at or above this is a strong pick; below it, a long shot. */
const STRONG = 0.6;
const tally = (picks: Array<{ result: string }>) => {
  const won = picks.filter((p) => p.result === 'WIN').length;
  return { won, settled: picks.length, rate: picks.length ? won / picks.length : null };
};

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
  // Strong picks (60%+) by default; everything on request.
  const [all, setAll] = useState(false);
  const keep = (p: { chance: number }) => all || p.chance >= STRONG;

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
            <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Which picks to show">
              {[
                [false, 'Strong picks (60%+)'],
                [true, 'All picks'],
              ].map(([v, label]) => (
                <button
                  key={String(v)}
                  onClick={() => setAll(v as boolean)}
                  aria-pressed={all === v}
                  className={`rounded-oracle-full border px-4 py-1.5 text-body-sm font-medium ${
                    all === v ? 'border-oracle-gold bg-oracle-gold/10 text-txt-primary' : 'border-warm-stone bg-white text-txt-tertiary'
                  }`}
                >
                  {label as string}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                [
                  [
                    all ? 'Streaks landed' : 'Strong streaks landed',
                    tally(data.days.flatMap((d) => d.matches.flatMap((m) => m.picks.filter(keep)))),
                  ],
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
                        {(() => {
                          const t = tally(d.matches.flatMap((m) => m.picks.filter(keep)));
                          return `Streaks ${t.won}/${t.settled}`;
                        })()}
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

                        {d.matches.some((m) => m.picks.some(keep)) && (
                          <div>
                            <h3 className="mb-2 text-caption font-semibold uppercase tracking-wide text-txt-tertiary">
                              Streaks
                            </h3>
                            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                              {d.matches.filter((g) => g.picks.some(keep)).map((g, i) => (
                                <div key={i}>
                                  <p className="text-body-sm font-semibold text-txt-primary">
                                    {g.match.home} v {g.match.away}
                                    {g.match.score && <span className="font-normal text-txt-tertiary"> · {g.match.score}</span>}
                                    <span className="font-normal text-txt-tertiary"> · {g.match.league}</span>
                                  </p>
                                  <ul className="mt-1 space-y-0.5">
                                    {g.picks.filter(keep).map((p, j) => (
                                      <li key={j} className="flex items-center gap-2 text-body-sm text-txt-secondary">
                                        <Mark result={p.result} />
                                        <span className="flex-1">
                                          {p.label}
                                          {p.chance < STRONG && (
                                            <span className="ml-2 rounded-oracle-full bg-warm-sand px-1.5 py-0.5 text-[11px] font-medium text-txt-tertiary">
                                              Long shot
                                            </span>
                                          )}
                                        </span>
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

        {data?.calibration && data.calibration.strong.settled > 0 && (
          <div className="mt-10">
            <h3 className="font-display text-h4 tracking-tight">How often OraQL&apos;s chances come true</h3>
            <p className="mt-1 text-body-sm text-txt-secondary">
              Every settled streak from the last {data.calibration.days} days, grouped by the chance OraQL gave before
              kickoff. If the chances are honest, each row lands about as often as it says.
            </p>
            <div className="mt-4 overflow-hidden rounded-oracle-md border border-warm-sand bg-white">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-warm-cream/60 text-caption uppercase tracking-wide text-txt-tertiary">
                  <tr>
                    <th className="px-4 py-2 font-semibold">OraQL chance</th>
                    <th className="px-4 py-2 font-semibold">Picks</th>
                    <th className="px-4 py-2 font-semibold">Landed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-sand">
                  {data.calibration.bands
                    .filter((b) => b.settled > 0)
                    .map((b) => (
                      <tr key={b.from} className={b.from >= STRONG ? 'text-txt-primary' : 'text-txt-tertiary'}>
                        <td className="px-4 py-2">
                          {b.from === 0 ? `Below ${pct(b.to)}` : b.to >= 1 ? `${pct(b.from)}+` : `${pct(b.from)}–${pct(b.to)}`}
                        </td>
                        <td className="px-4 py-2">{b.settled}</td>
                        <td className="px-4 py-2 font-semibold">
                          {b.won} · {pct(b.rate)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-body-sm text-txt-secondary">
              Picks rated 60% or more landed{' '}
              <span className="font-semibold text-txt-primary">
                {data.calibration.strong.won} of {data.calibration.strong.settled} ({pct(data.calibration.strong.rate)})
              </span>
              ; picks below 60% landed {pct(data.calibration.weak.rate)}.
            </p>
          </div>
        )}

        <div className="mt-8 rounded-oracle-md border border-oracle-gold/40 bg-oracle-gold/10 p-5 text-body-sm text-txt-primary">
          <p className="font-semibold">How to read OraQL&apos;s chance</p>
          <p className="mt-1 text-txt-secondary">
            It is how often a pick like this comes in, not a promise. A 70% pick still misses about 3 times in 10. Picks
            rated 60% and above have landed far more often than lower ones, so if you follow OraQL, those are the ones to
            focus on — and check the odds pay enough for the risk. Bet only what you can afford to lose. 18+.
          </p>
        </div>

        <p className="mt-4 text-caption text-txt-tertiary">
          Settled calls only; today&apos;s and upcoming picks are for members. Percentages are OraQL_&apos;s chance
          before kickoff. Past results do not promise future ones. 18+.
        </p>
      </div>
    </section>
  );
}
