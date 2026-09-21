'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';

interface OddsState {
  enabled: boolean;
  source: 'admin' | 'default';
}

/**
 * On/off for The Odds API.
 *
 * Off by default: nothing uses the prices yet, and every refresh spends
 * credits. Turning it on asks first, because that is the direction that
 * costs money; turning it off does not.
 */
export function OddsSwitch({
  onResult,
}: {
  onResult?: (label: string, ok: boolean, detail: unknown) => void;
}) {
  const [state, setState] = useState<OddsState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOn, setConfirmOn] = useState(false);

  useEffect(() => {
    api
      .get<OddsState>('/ingest/settings/odds-polling')
      .then(setState)
      .catch((e) =>
        setError(e instanceof ApiError ? `${e.status}: ${e.message}` : 'Could not load'),
      );
  }, []);

  async function save(enabled: boolean) {
    setSaving(true);
    setError(null);
    try {
      const next = await api.post<OddsState>('/ingest/settings/odds-polling', { enabled });
      setState(next);
      onResult?.(`Odds polling ${enabled ? 'on' : 'off'}`, true, next);
    } catch (e) {
      const message = e instanceof ApiError ? `${e.status}: ${e.message}` : 'Could not save';
      setError(message);
      onResult?.('Odds polling', false, message);
    } finally {
      setSaving(false);
    }
  }

  const enabled = state?.enabled ?? false;
  const loading = state === null && !error;

  return (
    <div className="flex flex-col gap-3 border-t border-warm-sand pt-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-body-sm font-semibold text-txt-primary">Odds polling</p>
        <p className="mt-0.5 text-body-sm text-txt-tertiary">
          Bookmaker prices from The Odds API, every 30 minutes near kickoff.
          Spends credits while on, and nothing uses the prices yet.
        </p>
        {state && (
          <p className="mt-1 text-caption text-txt-tertiary">
            {state.source === 'admin'
              ? 'Set here by an admin.'
              : 'Not set here yet — following the server default.'}
          </p>
        )}
        {error && <p className="mt-1 text-caption text-danger">{error}</p>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Odds polling"
        disabled={loading || saving || !!(error && !state)}
        onClick={() => (enabled ? save(false) : setConfirmOn(true))}
        className={cn(
          'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-normal',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-oracle-gold focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          enabled ? 'bg-oracle-gold' : 'bg-warm-stone',
        )}
      >
        <span
          className={cn(
            'inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-soft transition-transform duration-normal',
            enabled ? 'translate-x-7' : 'translate-x-1',
          )}
        >
          {(loading || saving) && <Loader2 className="h-3.5 w-3.5 animate-spin text-txt-tertiary" />}
        </span>
        <span className="sr-only">{enabled ? 'On' : 'Off'}</span>
      </button>

      <ConfirmDialog
        open={confirmOn}
        title="Turn odds polling on?"
        description="This starts spending Odds API credits."
        details={[
          'Runs every 30 minutes, only when a tracked match kicks off within 6 hours.',
          'Six competitions, one region.',
          'The prices are not used by picks or streaks yet.',
        ]}
        confirmLabel="Turn on"
        variant="gold"
        onCancel={() => setConfirmOn(false)}
        onConfirm={() => {
          setConfirmOn(false);
          save(true);
        }}
      />
    </div>
  );
}
