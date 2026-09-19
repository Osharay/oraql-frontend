'use client';

import { useState } from 'react';
import { Play, Database, Activity, AlertTriangle, Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/** Leagues the odds job already tracks, as API-Football ids. */
const DEFAULT_LEAGUES = [
  { id: '39', name: 'Premier League' },
  { id: '140', name: 'La Liga' },
  { id: '78', name: 'Bundesliga' },
  { id: '135', name: 'Serie A' },
  { id: '61', name: 'Ligue 1' },
  { id: '2', name: 'Champions League' },
];

const DEFAULT_SEASONS = [2022, 2023, 2024, 2025];

interface LogEntry {
  at: string;
  label: string;
  ok: boolean;
  detail: string;
}

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const [running, setRunning] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [leagues, setLeagues] = useState<string[]>(DEFAULT_LEAGUES.map((l) => l.id));
  const [seasons, setSeasons] = useState<number[]>(DEFAULT_SEASONS);

  const isAdmin = user?.role === 'ADMIN';

  function append(label: string, ok: boolean, detail: unknown) {
    setLog((prev) => [
      {
        at: new Date().toLocaleTimeString(),
        label,
        ok,
        detail: typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2),
      },
      ...prev,
    ]);
  }

  async function run(key: string, label: string, fn: () => Promise<unknown>) {
    setRunning(key);
    try {
      const result = await fn();
      append(label, true, result);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? `${error.status}: ${error.message}`
          : error instanceof Error
            ? error.message
            : 'Unknown error';
      append(label, false, message);
    } finally {
      setRunning(null);
    }
  }

  /** Full sequence, in dependency order. Each step needs the one before it. */
  async function runPipeline() {
    setRunning('pipeline');
    const steps: Array<[string, () => Promise<unknown>]> = [
      ['Derive observations', () => api.post('/streaks/observations/derive')],
      ['Compute baselines', () => api.post('/streaks/baselines/compute')],
      ['Run engine', () => api.post('/streaks/engine/run')],
      ['Capture snapshots', () => api.post('/streaks/snapshots/capture')],
    ];

    for (const [label, fn] of steps) {
      try {
        append(label, true, await fn());
      } catch (error) {
        const message =
          error instanceof ApiError ? `${error.status}: ${error.message}` : String(error);
        append(label, false, message);
        append('Pipeline halted', false, `Stopped after "${label}" failed.`);
        break;
      }
    }
    setRunning(null);
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-oracle-md border border-warm-stone bg-warm-cream p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-txt-tertiary" />
          <h1 className="font-display text-h3 text-txt-primary">Admin only</h1>
          <p className="mt-2 text-body text-txt-secondary">
            These controls spend API quota and rewrite shared data, so they need an admin
            account.
          </p>
        </div>
      </div>
    );
  }

  const busy = running !== null;
  const backfillCost = leagues.length * seasons.length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-display text-h2 text-txt-primary">Engine controls</h1>
        <p className="mt-1 text-body text-txt-secondary">
          Scheduled jobs run overnight. These trigger the same work on demand.
        </p>
      </header>

      {/* ─── Data ingest ─── */}
      <section className="mb-6 rounded-oracle-md border border-warm-stone bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-oracle-gold" />
          <h2 className="font-display text-h4 text-txt-primary">Data</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            onClick={() =>
              run('ingest', 'Fixture ingest', () => api.post('/ingest/run'))
            }
            disabled={busy}
          >
            {running === 'ingest' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Ingest fixtures now
          </Button>
          <span className="text-body-sm text-txt-tertiary">
            Next 7 days, then team stats, then probabilities. ~450 requests.
          </span>
        </div>
      </section>

      {/* ─── Backfill ─── */}
      <section className="mb-6 rounded-oracle-md border border-warm-stone bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-oracle-gold" />
          <h2 className="font-display text-h4 text-txt-primary">History backfill</h2>
        </div>

        <p className="mb-4 text-body-sm text-txt-secondary">
          One request per league-season. Scores only, which settles about twenty of the
          twenty-seven markets. The statistical gate needs roughly four seasons of history
          before it can distinguish anything.
        </p>

        <div className="mb-4">
          <p className="mb-2 text-body-sm font-semibold text-txt-primary">Leagues</p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_LEAGUES.map((l) => {
              const on = leagues.includes(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() =>
                    setLeagues((prev) =>
                      on ? prev.filter((x) => x !== l.id) : [...prev, l.id],
                    )
                  }
                  disabled={busy}
                  className={cn(
                    'rounded-oracle-full border px-3 py-1.5 text-body-sm transition-all duration-normal',
                    on
                      ? 'border-oracle-gold bg-oracle-gold/10 text-txt-primary'
                      : 'border-warm-stone bg-warm-cream text-txt-tertiary hover:text-txt-secondary',
                  )}
                >
                  {l.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-body-sm font-semibold text-txt-primary">Seasons</p>
          <div className="flex flex-wrap gap-2">
            {[2020, 2021, 2022, 2023, 2024, 2025].map((s) => {
              const on = seasons.includes(s);
              return (
                <button
                  key={s}
                  onClick={() =>
                    setSeasons((prev) =>
                      on ? prev.filter((x) => x !== s) : [...prev, s].sort(),
                    )
                  }
                  disabled={busy}
                  className={cn(
                    'rounded-oracle-full border px-3 py-1.5 text-body-sm transition-all duration-normal',
                    on
                      ? 'border-oracle-gold bg-oracle-gold/10 text-txt-primary'
                      : 'border-warm-stone bg-warm-cream text-txt-tertiary hover:text-txt-secondary',
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="gold"
            disabled={busy || backfillCost === 0}
            onClick={() => {
              if (
                !window.confirm(
                  `Backfill ${leagues.length} leagues x ${seasons.length} seasons.\n\nThis uses ${backfillCost} API-Football requests of your 7,500 daily allowance.\n\nContinue?`,
                )
              )
                return;
              run('backfill', 'History backfill', () =>
                api.post('/ingest/backfill', { leagues, seasons }),
              );
            }}
          >
            {running === 'backfill' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Backfill history
          </Button>
          <span className="text-body-sm text-txt-tertiary">
            {backfillCost} request{backfillCost === 1 ? '' : 's'} of 7,500 daily
          </span>
        </div>
      </section>

      {/* ─── Engine ─── */}
      <section className="mb-6 rounded-oracle-md border border-warm-stone bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-oracle-gold" />
          <h2 className="font-display text-h4 text-txt-primary">Streak engine</h2>
        </div>

        <p className="mb-4 text-body-sm text-txt-secondary">
          Steps depend on each other in this order. Run them individually, or the whole
          sequence at once.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() =>
              run('derive', 'Derive observations', () =>
                api.post('/streaks/observations/derive'),
              )
            }
          >
            1. Derive observations
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() =>
              run('baselines', 'Compute baselines', () =>
                api.post('/streaks/baselines/compute'),
              )
            }
          >
            2. Compute baselines
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() =>
              run('engine', 'Run engine', () => api.post('/streaks/engine/run'))
            }
          >
            3. Run engine
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() =>
              run('capture', 'Capture snapshots', () =>
                api.post('/streaks/snapshots/capture'),
              )
            }
          >
            4. Capture snapshots
          </Button>
        </div>

        <Button variant="primary" disabled={busy} onClick={runPipeline}>
          {running === 'pipeline' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run full pipeline
        </Button>
      </section>

      {/* ─── Output ─── */}
      <section className="rounded-oracle-md border border-warm-stone bg-dark-ink p-6">
        <h2 className="mb-4 font-display text-h4 text-txt-inverse">Output</h2>

        {log.length === 0 ? (
          <p className="text-body-sm text-txt-tertiary">
            Nothing run yet. Results appear here, newest first.
          </p>
        ) : (
          <div className="space-y-3">
            {log.map((entry, i) => (
              <div key={i} className="rounded-oracle-sm bg-dark-charcoal p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      'font-display text-body-sm font-semibold',
                      entry.ok ? 'text-prob-high' : 'text-danger',
                    )}
                  >
                    {entry.label}
                  </span>
                  <span className="text-body-sm text-txt-tertiary">{entry.at}</span>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words text-body-sm text-warm-stone">
                  {entry.detail}
                </pre>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
